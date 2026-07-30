// plan-my-night: Party Time's AI nightlife concierge. Reads upcoming public
// events and recommends the best matches for a natural-language request
// ("chill rooftop this weekend under 50k"). Uses Claude when ANTHROPIC_API_KEY
// is set; otherwise falls back to a keyword/price heuristic so it still works.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });

// Default to the most capable model for the best recommendations; override with
// the ANTHROPIC_MODEL secret (e.g. claude-sonnet-5) to trade quality for
// speed/cost.
const MODEL = Deno.env.get('ANTHROPIC_MODEL') ?? 'claude-opus-5';

// Pull the first text block out of a Messages API response. Resilient to
// responses that lead with other block types.
function claudeText(data: unknown): string {
  const blocks = (data as { content?: { type?: string; text?: string }[] })?.content;
  if (!Array.isArray(blocks)) return '';
  const t = blocks.find((b) => b?.type === 'text' && typeof b?.text === 'string');
  return t?.text ?? '';
}

const ZERO_DECIMAL = new Set(['UGX', 'KES', 'TZS', 'RWF', 'XOF', 'XAF', 'BIF', 'DJF', 'JPY']);
function money(minor: number, ccy: string) {
  const major = ZERO_DECIMAL.has(ccy.toUpperCase()) ? minor : minor / 100;
  return `${ccy} ${major.toLocaleString()}`;
}

type Ev = {
  slug: string;
  title: string;
  starts_at: string | null;
  venue_name: string | null;
  address: string | null;
  timezone: string;
  cover_url: string | null;
  theme: string;
  is_ticketed: boolean;
  description: string | null;
  from_minor: number | null;
  currency: string;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid request body.' }, 400);
  }
  const query = typeof body.query === 'string' ? body.query.trim().slice(0, 300) : '';
  const city = typeof body.city === 'string' && body.city.trim() ? body.city.trim() : 'Kampala';
  if (!query) return json({ error: 'Ask me what you feel like doing.' }, 400);

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const nowIso = new Date().toISOString();
  const { data: rows } = await admin
    .from('events')
    .select('slug, title, starts_at, venue_name, address, timezone, cover_url, theme, is_ticketed, description, ticket_tiers(price_minor, currency)')
    .eq('status', 'published')
    .eq('visibility', 'public')
    .gte('starts_at', nowIso)
    .order('starts_at', { ascending: true })
    .limit(40);

  const events: Ev[] = (rows ?? []).map((r) => {
    const tiers = (r.ticket_tiers as { price_minor: number; currency: string }[] | null) ?? [];
    const min = tiers.length ? tiers.reduce((a, b) => (b.price_minor < a.price_minor ? b : a)) : null;
    return {
      slug: r.slug,
      title: r.title,
      starts_at: r.starts_at,
      venue_name: r.venue_name,
      address: r.address,
      timezone: r.timezone,
      cover_url: r.cover_url,
      theme: r.theme,
      is_ticketed: r.is_ticketed,
      description: r.description,
      from_minor: min ? min.price_minor : null,
      currency: min ? min.currency : 'UGX',
    };
  });

  if (events.length === 0) {
    return json({ intro: `Nothing's on the calendar in ${city} yet — check back soon.`, picks: [] });
  }

  const bySlug = new Map(events.map((e) => [e.slug, e]));
  const decorate = (picks: { slug: string; reason: string }[]) =>
    picks
      .map((p) => {
        const e = bySlug.get(p.slug);
        if (!e) return null;
        return { ...e, reason: p.reason };
      })
      .filter(Boolean)
      .slice(0, 4);

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');

  // --- Claude path ---
  if (apiKey) {
    try {
      const catalog = events
        .map((e, i) => {
          const when = e.starts_at
            ? new Date(e.starts_at).toLocaleString('en-US', {
                weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                timeZone: e.timezone,
              })
            : 'TBA';
          const price = e.from_minor != null ? `from ${money(e.from_minor, e.currency)}` : 'free entry';
          return `${i + 1}. slug:"${e.slug}" | ${e.title} | ${when} | ${e.venue_name ?? 'venue TBA'} | ${price} | vibe:${e.theme} | ${(e.description ?? '').slice(0, 120)}`;
        })
        .join('\n');

      const sys = `You are Party Time's nightlife concierge for ${city} — you know the city's scene and talk like a plugged-in local friend, never a brochure. Recommend the best events for the user's request from the list ONLY. Never invent events, venues, prices, or times. Match on vibe, budget, timing and location; prefer the best fit first, then soonest. Read budget cues ("under 50k", "cheap", "free") and honour them strictly. Reply with STRICT JSON only, no prose, no markdown fences: {"intro": string (one warm, specific sentence — reference the vibe they asked for), "picks": [{"slug": string (must match a slug above exactly), "reason": string (max 12 words, concrete reason it fits — the vibe, price, or timing)}]}. Up to 4 picks, best first. If nothing genuinely fits, return an empty picks array with a friendly, honest intro.`;

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 700,
          system: sys,
          messages: [{ role: 'user', content: `Events:\n${catalog}\n\nUser: ${query}` }],
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error('plan-my-night: Claude API error', res.status, JSON.stringify(data).slice(0, 500));
      } else {
        const text = claudeText(data);
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
          const parsed = JSON.parse(match[0]) as { intro?: string; picks?: { slug: string; reason: string }[] };
          return json({
            intro: parsed.intro ?? "Here's what I'd do:",
            picks: decorate(parsed.picks ?? []),
            ai: true,
          });
        }
        console.error('plan-my-night: no JSON in Claude reply', text.slice(0, 200));
      }
    } catch (e) {
      console.error('plan-my-night: Claude call failed', e instanceof Error ? e.message : String(e));
      // fall through to heuristic
    }
  }

  // --- Heuristic fallback (no key or Claude error) ---
  const q = query.toLowerCase();
  const capMatch = q.match(/(\d+)\s*k/);
  const cap = capMatch ? parseInt(capMatch[1], 10) * 1000 : null;
  const freeWanted = /free|cheap|broke/.test(q);
  const tokens = q.split(/[^a-z0-9]+/).filter((t) => t.length > 3);

  const scored = events
    .map((e) => {
      let score = 0;
      const hay = `${e.title} ${e.venue_name ?? ''} ${e.address ?? ''} ${e.description ?? ''} ${e.theme}`.toLowerCase();
      for (const t of tokens) if (hay.includes(t)) score += 2;
      if (freeWanted && !e.is_ticketed) score += 3;
      if (cap != null && e.from_minor != null && e.from_minor <= cap) score += 2;
      if (cap != null && e.from_minor != null && e.from_minor > cap) score -= 3;
      return { e, score };
    })
    .sort((a, b) => b.score - a.score || (a.e.starts_at ?? '').localeCompare(b.e.starts_at ?? ''));

  const top = scored.slice(0, 4).map(({ e }) => ({
    ...e,
    reason:
      cap != null && e.from_minor != null && e.from_minor <= cap
        ? `Within budget · from ${money(e.from_minor, e.currency)}`
        : !e.is_ticketed
          ? 'Free entry · easy night out'
          : 'Coming up soon in your city',
  }));

  return json({
    intro: `Here's what's good in ${city} right now:`,
    picks: top,
    ai: false,
  });
});
