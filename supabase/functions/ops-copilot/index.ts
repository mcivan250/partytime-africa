// ops-copilot: admin-only. Returns a live metrics snapshot and, when asked a
// question, answers it in plain English. Admin gating is enforced by
// admin_snapshot().
//
// Uses a hosted LLM when a key is set — free Google Gemini (GEMINI_API_KEY)
// first, then Claude (ANTHROPIC_API_KEY) — otherwise a formatted summary.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });

// ---- AI provider: free Gemini first, then Claude, then null (→ summary) ----
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
            temperature: 0.4,
            thinkingConfig: { thinkingBudget: 0 },
            ...(wantJson ? { responseMimeType: 'application/json' } : {}),
          },
        }),
      },
    );
    const data = await res.json();
    if (!res.ok) {
      console.error('ops-copilot: Gemini API error', res.status, JSON.stringify(data).slice(0, 500));
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
      console.error('ops-copilot: Claude API error', res.status, JSON.stringify(data).slice(0, 500));
      throw new Error(`claude ${res.status}`);
    }
    return claudeText(data);
  }
  return null;
}

function ugx(minor: number) {
  return `UGX ${Number(minor || 0).toLocaleString()}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    // empty body is fine (snapshot only)
  }
  const question = typeof body.question === 'string' ? body.question.trim().slice(0, 300) : '';

  const userClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } },
  );

  const { data: snap } = await userClient.rpc('admin_snapshot');
  const m = snap as Record<string, unknown> | null;
  if (!m || (m as { error?: string }).error) {
    return json({ error: 'Admins only.' }, 403);
  }

  if (question) {
    try {
      const sys = `You are Party Time's operations analyst — a sharp, no-nonsense growth advisor for a Kampala nightlife ticketing app. Answer the admin's question using ONLY this JSON metrics snapshot. Be concise and specific, cite the exact numbers, and finish with one short, concrete, actionable insight or next step when it helps. Money is in UGX (fields ending in _minor are whole shillings — format them as "UGX 1,234,567"). Never invent data; if the snapshot doesn't contain the answer, say so plainly.`;
      const answer = await generate(sys, `Snapshot:\n${JSON.stringify(m)}\n\nQuestion: ${question}`, 600, false);
      if (answer) return json({ answer, metrics: m, ai: true });
      console.error('ops-copilot: empty AI reply');
    } catch (e) {
      console.error('ops-copilot: AI call failed', e instanceof Error ? e.message : String(e));
      // fall through to summary
    }
  }

  const summary =
    `Here's where things stand:\n` +
    `• ${m.events_published} published events\n` +
    `• ${m.tickets_sold} tickets issued across ${m.paid_orders} paid orders\n` +
    `• ${ugx(Number(m.revenue_minor))} in revenue\n` +
    `• ${m.new_users_7d} new sign-ups this week\n` +
    `• ${m.going_rsvps} “going” RSVPs · ${m.feed_posts} feed posts\n` +
    `• ${ugx(Number(m.promoter_earnings_minor))} earned by promoters`;

  return json({ answer: summary, metrics: m, ai: false });
});
