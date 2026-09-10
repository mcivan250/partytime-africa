import AsyncStorage from '@react-native-async-storage/async-storage';

// Experiential-marketing attribution. When someone scans a physical activation
// (pop-up, billboard, installation) they arrive with ?c=<code> in the URL. We
// remember that code for a window so every action they take afterwards —
// app_open, sign_up, rsvp, checkout_start — is attributed to the moment that
// brought them in. That answers the real question: what did people DO because
// of the experience, not just did they show up.
const KEY = 'pt_campaign';
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // a scan drives actions for ~30 days

let mem: string | null = null;

// Call once at startup. Captures a fresh ?c= from the URL (web), otherwise
// restores a still-valid stored code. Sets an in-memory value synchronously
// where possible so the very first tracked event is already attributed.
export async function initCampaign(): Promise<void> {
  try {
    if (typeof window !== 'undefined' && window.location && window.location.search) {
      const code = new URLSearchParams(window.location.search).get('c');
      if (code) {
        mem = code;
        AsyncStorage.setItem(KEY, JSON.stringify({ code, ts: Date.now() })).catch(() => {});
        return;
      }
    }
  } catch {
    // no window / parsing issue — fall through to stored value
  }
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as { code?: string; ts?: number };
    if (parsed.code && parsed.ts && Date.now() - parsed.ts < MAX_AGE_MS) {
      mem = parsed.code;
    }
  } catch {
    // ignore — attribution is best-effort, never blocks the app
  }
}

export function getCampaign(): string | null {
  return mem;
}
