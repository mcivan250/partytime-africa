// plan-my-night: Party Time's AI nightlife & dining concierge. Reads upcoming
// public events AND the curated venue guide (bars, restaurants, lounges, clubs)
// and recommends the best matches for a natural-language request — "chill
// rooftop this weekend under 50k" or "fine dining for a dinner date". When the
// caller shares their location, results are distance-aware ("1.2 km away").
//
// Uses a hosted LLM when a key is set — free Google Gemini (GEMINI_API_KEY)
// first, then Claude (ANTHROPIC_API_KEY) — otherwise a keyword/price/distance
// heuristic so it always works.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });

// ---- AI provider: free Gemini first, then Claude, then null (→ heuristic) ----
function geminiText(data: unknown): string {
  const parts = (data as { candidates?: { content?: { parts?: { text?: string }[] } }[] })
    ?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return '';
  return parts.map((p) => p?.text ?? '').join('');
}
function claudeText(data: unknown): string {
  const blocks = (data as { content?: { type?: string; text?: string }[] })?.content;
  if (!Array.isArray(blocks)) return '';
  const t = blocks.find((b) => b?.type === 'text' && typeof b?.text === 'string');
  return t?.text ?? '';
}
// Returns generated text, or null if no provider is configured. Throws on a
// provider HTTP error so callers fall back to the heuristic.
async function generate(system: string, user: string, maxTokens: number, wantJson: boolean): Promise<string | null> {
  const gemini = Deno.env.get('GEMINI_API_KEY');
  if (gemini) {
    const model = Deno.env.get('GEMINI_MODEL') ?? 'gemini-2.5-flash';
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: { 'x-goog-api-key': gemini, 'content-type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: system }] },
          contents: [{ role: 'user', parts: [{ text: user }] }],
          generationConfig: {
            maxOutputTokens: maxTokens,
            temperature: 0.9,
            // Disable "thinking" — on 2.5 flash it otherwise eats the output
            // budget and can return an empty response for small maxOutputTokens.
            thinkingConfig: { thinkingBudget: 0 },
            ...(wantJson ? { responseMimeType: 'application/json' } : {}),
          },
        }),
      },
    );
    const data = await res.json();
    if (!res.ok) {
      console.error('plan-my-night: Gemini API error', res.status, JSON.stringify(data).slice(0, 500));
      throw new Error(`gemini ${res.status}`);
    }
    return geminiText(data);
  }
  const anthropic = Deno.env.get('ANTHROPIC_API_KEY');
  if (anthropic) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': anthropic, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({
        model: Deno.env.get('ANTHROPIC_MODEL') ?? 'claude-opus-5',
        max_tokens: maxTokens,
        system,
        messages: [{ role: 'user', content: user }],
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error('plan-my-night: Claude API error', res.status, JSON.stringify(data).slice(0, 500));
      throw new Error(`claude ${res.status}`);
    }
    return claudeText(data);
  }
  return null;
}

const ZERO_DECIMAL = new Set(['UGX', 'KES', 'TZS', 'RWF', 'XOF', 'XAF', 'BIF', 'DJF', 'JPY']);
function money(minor: number, ccy: string) {
  const major = ZERO_DECIMAL.has(ccy.toUpperCase()) ? minor : minor / 100;
  return `${ccy} ${major.toLocaleString()}`;
}

// Great-circle distance in km between two lat/lng points.
function distanceKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}
function distanceLabel(km: number | null): string | null {
  if (km == null) return null;
  if (km < 1) return `${Math.round(km * 1000)} m away`;
  if (km < 10) return `${km.toFixed(1)} km away`;
  return `${Math.round(km)} km away`;
}

type LatLng = { lat: number; lng: number };

type Ev = {
  type: 'event';
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
  distance_km: number | null;
};

type Ve = {
  type: 'venue';
  id: string;
  title: string; // = name, so the client can render picks uniformly
  name: string;
  kind: string;
  city: string | null;
  address: string | null;
  description: string | null;
  cover_url: string | null;
  price_range: string | null;
  cuisines: string[];
  distance_km: number | null;
};

type Pick = Ev | Ve;

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
  const lat = Number(body.lat);
  const lng = Number(body.lng);
  const here: LatLng | null =
    Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180
      ? { lat, lng }
      : null;
  if (!query) return json({ error: 'Ask me what you feel like doing.' }, 400);

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const nowIso = new Date().toISOString();
  const [{ data: eventRows }, { data: venueRows }] = await Promise.all([
    admin
      .from('events')
      .select('slug, title, starts_at, venue_name, address, lat, lng, timezone, cover_url, theme, is_ticketed, description, ticket_tiers(price_minor, currency)')
      .eq('status', 'published')
      .eq('visibility', 'public')
      .gte('starts_at', nowIso)
      .order('starts_at', { ascending: true })
      .limit(40),
    admin
      .from('venues')
      .select('id, name, kind, city, address, lat, lng, description, cover_url, price_range, cuisines')
      .limit(40),
  ]);

  const events: Ev[] = (eventRows ?? []).map((r) => {
    const tiers = (r.ticket_tiers as { price_minor: number; currency: string }[] | null) ?? [];
    const min = tiers.length ? tiers.reduce((a, b) => (b.price_minor < a.price_minor ? b : a)) : null;
    const evLat = r.lat as number | null;
    const evLng = r.lng as number | null;
    return {
      type: 'event',
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
      distance_km: here && evLat != null && evLng != null ? distanceKm(here, { lat: evLat, lng: evLng }) : null,
    };
  });

  const venues: Ve[] = (venueRows ?? []).map((r) => {
    const vLat = r.lat as number | null;
    const vLng = r.lng as number | null;
    return {
      type: 'venue',
      id: r.id,
      title: r.name,
      name: r.name,
      kind: r.kind,
      city: r.city,
      address: r.address,
      description: r.description,
      cover_url: r.cover_url,
      price_range: r.price_range,
      cuisines: (r.cuisines as string[] | null) ?? [],
      distance_km: here && vLat != null && vLng != null ? distanceKm(here, { lat: vLat, lng: vLng }) : null,
    };
  });

  if (events.length === 0 && venues.length === 0) {
    return json({ intro: `Nothing's on the map in ${city} yet — check back soon.`, picks: [] });
  }

  // Unified ref lookup: "e:<slug>" for events, "v:<id>" for venues.
  const byRef = new Map<string, Pick>();
  for (const e of events) byRef.set(`e:${e.slug}`, e);
  for (const v of venues) byRef.set(`v:${v.id}`, v);

  const decorate = (picks: { ref: string; reason: string }[]) =>
    picks
      .map((p) => {
        const item = byRef.get(p.ref);
        if (!item) return null;
        return { ...item, reason: p.reason };
      })
      .filter(Boolean)
      .slice(0, 5);

  // --- LLM path (Gemini/Claude) ---
  try {
    const eventLines = events
      .map((e) => {
        const when = e.starts_at
          ? new Date(e.starts_at).toLocaleString('en-US', {
              weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
              timeZone: e.timezone,
            })
          : 'TBA';
        const price = e.from_minor != null ? `from ${money(e.from_minor, e.currency)}` : 'free entry';
        const dist = distanceLabel(e.distance_km);
        return `ref:"e:${e.slug}" | EVENT | ${e.title} | ${when} | ${e.venue_name ?? 'venue TBA'} | ${price} | vibe:${e.theme}${dist ? ` | ${dist}` : ''} | ${(e.description ?? '').slice(0, 110)}`;
      })
      .join('\n');
    const venueLines = venues
      .map((v) => {
        const dist = distanceLabel(v.distance_km);
        const cuisine = v.cuisines.length ? ` | ${v.cuisines.join(', ')}` : '';
        return `ref:"v:${v.id}" | PLACE | ${v.name} | ${v.kind} | ${v.price_range ?? ''}${cuisine}${dist ? ` | ${dist}` : ''} | ${(v.description ?? '').slice(0, 110)}`;
      })
      .join('\n');

    const sys = `You are Party Time's concierge for ${city} — you know the city's nightlife AND dining scene and talk like a plugged-in local friend, never a brochure. You recommend two kinds of things:
- EVENTS: one-off happenings on a specific date (parties, shows, ladies' nights).
- PLACES: bars, restaurants, lounges and clubs from our curated guide, open regularly (great for "dinner with my wife", "fine dining", "a nice bar", "date night").

Pick the best matches for the user's request from the lists below ONLY. Never invent anything, and never change a price, time or name. Choose the right TYPE for the intent: a dinner/date/food/drinks request should lean on PLACES (match cuisine, price tier — $ cheap to $$$$ fine dining — and vibe); a "what's happening / tonight / this weekend / party" request should lean on EVENTS. Mix both only when it genuinely helps. Honour budget cues strictly. When "away" distances are shown and the user wants something nearby, prefer closer options.

Reply with STRICT JSON only, no prose, no markdown fences: {"intro": string (one warm, specific sentence that speaks to what they asked for), "picks": [{"ref": string (must copy a ref value above EXACTLY, including the e:/v: prefix), "reason": string (max 12 words — the concrete reason it fits: the cuisine, vibe, price, or timing)}]}. Up to 5 picks, best first. If nothing genuinely fits, return an empty picks array with a friendly, honest intro.`;

    const userContent = `EVENTS:\n${eventLines || '(none on the calendar right now)'}\n\nPLACES:\n${venueLines || '(no places listed yet)'}\n\nUser: ${query}`;

    const text = await generate(sys, userContent, 900, true);
    if (text) {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]) as { intro?: string; picks?: { ref: string; reason: string }[] };
        return json({
          intro: parsed.intro ?? "Here's what I'd do:",
          picks: decorate(parsed.picks ?? []),
          ai: true,
        });
      }
      console.error('plan-my-night: no JSON in AI reply', text.slice(0, 200));
    }
  } catch (e) {
    console.error('plan-my-night: AI call failed', e instanceof Error ? e.message : String(e));
    // fall through to heuristic
  }

  // --- Heuristic fallback (no key or AI error) ---
  const q = query.toLowerCase();
  const capMatch = q.match(/(\d+)\s*k/);
  const cap = capMatch ? parseInt(capMatch[1], 10) * 1000 : null;
  const freeWanted = /free|cheap|broke/.test(q);
  const diningWanted = /dinner|lunch|eat|food|restaurant|dining|dine|cuisine|date|wife|husband|romantic|brunch/.test(q);
  const drinksWanted = /drink|bar|cocktail|lounge|wine|beer|rooftop/.test(q);
  const tokens = q.split(/[^a-z0-9]+/).filter((t) => t.length > 3);

  const scored: { item: Pick; score: number }[] = [];

  for (const e of events) {
    let score = 0;
    const hay = `${e.title} ${e.venue_name ?? ''} ${e.address ?? ''} ${e.description ?? ''} ${e.theme}`.toLowerCase();
    for (const t of tokens) if (hay.includes(t)) score += 2;
    if (freeWanted && !e.is_ticketed) score += 3;
    if (cap != null && e.from_minor != null && e.from_minor <= cap) score += 2;
    if (cap != null && e.from_minor != null && e.from_minor > cap) score -= 3;
    if (diningWanted) score -= 2; // a dinner request is usually about a place, not an event
    if (e.distance_km != null && e.distance_km < 5) score += 1;
    scored.push({ item: e, score });
  }

  for (const v of venues) {
    let score = 0;
    const hay = `${v.name} ${v.kind} ${v.address ?? ''} ${v.description ?? ''} ${v.cuisines.join(' ')}`.toLowerCase();
    for (const t of tokens) if (hay.includes(t)) score += 2;
    if (diningWanted && v.kind === 'restaurant') score += 4;
    if (drinksWanted && (v.kind === 'bar' || v.kind === 'lounge' || v.kind === 'club')) score += 4;
    if (/fine|fancy|upscale|classy|nice/.test(q) && v.price_range === '$$$') score += 2;
    if (v.distance_km != null && v.distance_km < 5) score += 1;
    scored.push({ item: v, score });
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const da = a.item.distance_km ?? Infinity;
    const db = b.item.distance_km ?? Infinity;
    return da - db;
  });

  const top = scored.slice(0, 5).map(({ item }) => {
    const dist = distanceLabel(item.distance_km);
    if (item.type === 'venue') {
      const cuisine = item.cuisines[0];
      const reason = dist ?? (cuisine ? `${cuisine} · ${item.price_range ?? ''}`.trim() : `${item.kind} in ${item.city ?? city}`);
      return { ...item, reason };
    }
    const reason =
      dist ??
      (cap != null && item.from_minor != null && item.from_minor <= cap
        ? `Within budget · from ${money(item.from_minor, item.currency)}`
        : !item.is_ticketed
          ? 'Free entry · easy night out'
          : 'Coming up soon in your city');
    return { ...item, reason };
  });

  return json({
    intro: diningWanted
      ? `Great picks for a meal out in ${city}:`
      : `Here's what's good in ${city} right now:`,
    picks: top,
    ai: false,
  });
});
