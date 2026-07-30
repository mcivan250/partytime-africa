// promo-caption: writes a scroll-stopping share caption for a promoter's
// referral link (WhatsApp / IG / TikTok / Status). Claude when ANTHROPIC_API_KEY
// is set; punchy templates otherwise.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });

// Default to the most capable model; override with the ANTHROPIC_MODEL secret
// to trade quality for speed/cost.
const MODEL = Deno.env.get('ANTHROPIC_MODEL') ?? 'claude-opus-5';

function claudeText(data: unknown): string {
  const blocks = (data as { content?: { type?: string; text?: string }[] })?.content;
  if (!Array.isArray(blocks)) return '';
  const t = blocks.find((b) => b?.type === 'text' && typeof b?.text === 'string');
  return t?.text ?? '';
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
  const title = typeof body.title === 'string' ? body.title.trim().slice(0, 120) : '';
  const venue = typeof body.venue === 'string' ? body.venue.trim().slice(0, 120) : '';
  const link = typeof body.link === 'string' ? body.link.trim().slice(0, 300) : '';
  if (!title || !link) return json({ error: 'Missing event details.' }, 400);

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');

  if (apiKey) {
    try {
      const sys = `You write short, high-energy social captions for Kampala nightlife promoters. Given an event, write ONE caption (max 45 words) that makes people want to buy a ticket. Sound like a real, plugged-in Ugandan Gen-Z promoter — natural slang is welcome, but no cringe and no hard sell. End with the link on its own line, then 3-5 relevant hashtags on the final line. Keep the exact link unchanged. Reply with STRICT JSON only, no markdown fences: {"caption": string}. Tasteful emojis only.`;
      const user = `Event: ${title}${venue ? ` at ${venue}` : ''}\nLink: ${link}`;
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 400,
          system: sys,
          messages: [{ role: 'user', content: user }],
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error('promo-caption: Claude API error', res.status, JSON.stringify(data).slice(0, 500));
      } else {
        const text = claudeText(data);
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
          const parsed = JSON.parse(match[0]) as { caption?: string };
          if (parsed.caption) return json({ caption: String(parsed.caption).slice(0, 600), ai: true });
        }
        console.error('promo-caption: no caption in Claude reply', text.slice(0, 200));
      }
    } catch (e) {
      console.error('promo-caption: Claude call failed', e instanceof Error ? e.message : String(e));
      // fall through
    }
  }

  const at = venue ? ` at ${venue}` : '';
  const templates = [
    `🔥 ${title}${at} is the one this week. Don't be the one hearing about it Monday. Grab your ticket 👇\n${link}\n#Kampala #PartyTime #Nightlife`,
    `Who's pulling up to ${title}?? 😎 Got you the link — lock it in before it sells out:\n${link}\n#Kampala #${title.replace(/[^a-zA-Z0-9]/g, '')} #PartyTime`,
    `${title}${at} 🎟️ link\'s live. Round up the crew, this is going to be MAD 🔊\n${link}\n#Kampala #Nightlife #PartyTime`,
  ];
  const caption = templates[Math.floor(Math.random() * templates.length)];
  return json({ caption, ai: false });
});
