// draft-event: Party Time's AI Host Studio. Turns a one-line idea into a
// ready-to-publish event draft (title, hype description, vibe theme, and
// suggested ticket tiers). Uses Claude when ANTHROPIC_API_KEY is set; otherwise
// a keyword/price heuristic so hosts still get a helpful draft.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });

// Default to the most capable model for the best copy; override with the
// ANTHROPIC_MODEL secret to trade quality for speed/cost.
const MODEL = Deno.env.get('ANTHROPIC_MODEL') ?? 'claude-opus-5';

function claudeText(data: unknown): string {
  const blocks = (data as { content?: { type?: string; text?: string }[] })?.content;
  if (!Array.isArray(blocks)) return '';
  const t = blocks.find((b) => b?.type === 'text' && typeof b?.text === 'string');
  return t?.text ?? '';
}

const THEMES = ['forest', 'sunset', 'gold', 'ocean', 'fire', 'mono'];

type Draft = {
  title: string;
  description: string;
  theme: string;
  is_ticketed: boolean;
  tiers: { name: string; price_minor: number }[];
};

function titleCase(s: string) {
  return s.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1));
}

function heuristicDraft(prompt: string): Draft {
  const p = prompt.toLowerCase();
  let theme = 'forest';
  if (/rooftop|brunch|lunch|day|pool|garden/.test(p)) theme = 'gold';
  if (/boat|cruise|lake|pool|beach/.test(p)) theme = 'ocean';
  if (/amapiano|afro|sunset|piano/.test(p)) theme = 'sunset';
  if (/hip.?hop|old school|rap|throwback/.test(p)) theme = 'mono';
  if (/rave|festival|bass|techno|nyege|fire/.test(p)) theme = 'fire';

  const free = /free|ladies night|no cover|open bar/.test(p);
  const priceMatch = p.match(/(\d+)\s*k/);
  const base = priceMatch ? parseInt(priceMatch[1], 10) * 1000 : 30000;

  const title = titleCase(prompt.split(/[,.]/)[0].trim().split(/\s+/).slice(0, 6).join(' ')) || 'My Event';
  const description = `${title} is coming to Kampala. ${prompt.trim().replace(/^./, (c) => c.toUpperCase())}. Pull up with your crew — doors open, drinks flowing, good energy all night.`;

  const tiers = free
    ? []
    : [
        { name: 'Advance', price_minor: base },
        { name: 'At the door', price_minor: Math.round(base * 1.5) },
      ];

  return { title, description, theme, is_ticketed: !free, tiers };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid request body.' }, 400);
  }
  const prompt = typeof body.prompt === 'string' ? body.prompt.trim().slice(0, 400) : '';
  if (!prompt) return json({ error: 'Describe your event in a sentence.' }, 400);

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');

  if (apiKey) {
    try {
      const sys = `You are Party Time's event studio for Kampala nightlife. From the host's rough idea, craft a compelling, ready-to-publish event. Write for a young Ugandan crowd — vivid, confident, culturally on-point, never cheesy or corporate. Reply with STRICT JSON only, no prose, no markdown fences: {"title": string (punchy, max 5 words, no emojis), "description": string (2-3 hype sentences that sell the vibe and give a reason to come; minimal emojis), "theme": one of ${JSON.stringify(THEMES)} (pick the closest mood), "is_ticketed": boolean, "tiers": [{"name": string, "price_minor": integer}] up to 3}. Prices are in UGX shillings as whole integers (e.g. 30000 = UGX 30,000); pick realistic Kampala nightlife prices if the host didn't specify. If it reads as free entry / ladies night, set is_ticketed false and tiers []. Order tiers cheapest first (e.g. Advance, then At the door, then VIP).`;

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
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error('draft-event: Claude API error', res.status, JSON.stringify(data).slice(0, 500));
      } else {
        const text = claudeText(data);
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
          const parsed = JSON.parse(match[0]) as Partial<Draft>;
          const theme = THEMES.includes(String(parsed.theme)) ? String(parsed.theme) : 'forest';
          const tiers = Array.isArray(parsed.tiers)
            ? parsed.tiers
                .filter((t) => t && typeof t.name === 'string' && Number.isFinite(Number(t.price_minor)))
                .slice(0, 3)
                .map((t) => ({ name: String(t.name).slice(0, 40), price_minor: Math.max(0, Math.round(Number(t.price_minor))) }))
            : [];
          return json({
            draft: {
              title: String(parsed.title ?? '').slice(0, 80),
              description: String(parsed.description ?? '').slice(0, 800),
              theme,
              is_ticketed: parsed.is_ticketed ?? tiers.length > 0,
              tiers,
            },
            ai: true,
          });
        }
        console.error('draft-event: no JSON in Claude reply', text.slice(0, 200));
      }
    } catch (e) {
      console.error('draft-event: Claude call failed', e instanceof Error ? e.message : String(e));
      // fall through
    }
  }

  return json({ draft: heuristicDraft(prompt), ai: false });
});
