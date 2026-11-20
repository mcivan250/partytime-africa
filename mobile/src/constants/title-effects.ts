// Partiful-style title treatments — the host picks how the event name *moves*.
// A static gradient gives an event colour; a title effect gives it a pulse.
// Each effect is rendered by <EventTitle> (native) / event-title.web.tsx (web).
// Kept deliberately small and brand-safe (no purple), each with its own energy.
export type TitleFx = 'none' | 'glow' | 'chrome' | 'fire' | 'electric' | 'sparkle';

export type TitleEffect = {
  key: TitleFx;
  name: string;
  // A representative colour for the picker preview label.
  tint: string;
};

export const TITLE_EFFECTS: TitleEffect[] = [
  { key: 'none', name: 'Clean', tint: '#F2F7F1' },
  { key: 'glow', name: 'Glow', tint: '#3DDC97' },
  { key: 'chrome', name: 'Chrome', tint: '#DCE6DF' },
  { key: 'fire', name: 'Fire', tint: '#FF8A3D' },
  { key: 'electric', name: 'Electric', tint: '#FF3D6E' },
  { key: 'sparkle', name: 'Sparkle', tint: '#FFE08A' },
];

export function normalizeFx(key?: string | null): TitleFx {
  const found = TITLE_EFFECTS.find((e) => e.key === key);
  return found ? found.key : 'none';
}
