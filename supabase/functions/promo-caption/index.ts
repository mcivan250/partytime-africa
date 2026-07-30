// promo-caption: writes a scroll-stopping share caption for a promoter's
// referral link (WhatsApp / IG / TikTok / Status).
//
// Uses a hosted LLM when a key is set — free Google Gemini (GEMINI_API_KEY)
// first, then Claude (ANTHROPIC_API_KEY) — otherwise punchy templates.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });

// ---- AI provider: free Gemini first, then Claude, then null (→ templates) ----
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
            temperature: 1.0,
            thinkingConfig: { thinkingBudget: 0 },
            ...(wantJson ? { responseMimeType: 'application/json' } : {}),
          },
        }),
      },
    );
    const data = await res.json();
    if (!res.ok) {
      console.error('promo-caption: Gemini API error', res.status, JSON.stringify(data).slice(0, 500));
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
      console.error('promo-caption: Claude API error', res.status, JSON.stringify(data).slice(0, 500));
      throw new Error(`claude ${res.status}`);
    }
    return claudeText(data);
  }
  return null;
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

  try {
    const sys = `You write short, high-energy social captions for Kampala nightlife promoters. Given an event, write ONE caption (max 45 words) that makes people want to buy a ticket. Sound like a real, plugged-in Ugandan Gen-Z promoter — natural slang is welcome, but no cringe and no hard sell. End with the link on its own line, then 3-5 relevant hashtags on the final line. Keep the exact link unchanged. Reply with STRICT JSON only, no markdown fences: {"caption": string}. Tasteful emojis only.`;
    const user = `Event: ${title}${venue ? ` at ${venue}` : ''}\nLink: ${link}`;
    const text = await generate(sys, user, 400, true);
    if (text) {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]) as { caption?: string };
        if (parsed.caption) return json({ caption: String(parsed.caption).slice(0, 600), ai: true });
      }
      console.error('promo-caption: no caption in AI reply', text.slice(0, 200));
    }
  } catch (e) {
    console.error('promo-caption: AI call failed', e instanceof Error ? e.message : String(e));
    // fall through
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
