// Host-pickable event "vibes" — a gradient + accent applied to the event
// hero (cover fallback + date accent) so every event has personality.
// Stored on events.theme. Purple/violet is intentionally excluded (banned by
// the design system).
export type EventTheme = {
  key: string;
  name: string;
  gradient: readonly [string, string, string];
  accent: string;
};

export const EVENT_THEMES: EventTheme[] = [
  { key: 'forest', name: 'Forest', gradient: ['#5BEA8E', '#1DC96B', '#0B8F52'], accent: '#3DDC97' },
  { key: 'sunset', name: 'Sunset', gradient: ['#FFB16B', '#F7643B', '#C9356B'], accent: '#FFB84D' },
  { key: 'gold', name: 'Gold', gradient: ['#F7E08A', '#E9C46A', '#B8860B'], accent: '#E9C46A' },
  { key: 'ocean', name: 'Ocean', gradient: ['#5BE8EA', '#1D9BC9', '#0B5C8F'], accent: '#5BE8EA' },
  { key: 'fire', name: 'Fire', gradient: ['#FFC24D', '#F7533B', '#B81D2E'], accent: '#FF6B3D' },
  { key: 'mono', name: 'Mono', gradient: ['#3A4A3E', '#222C25', '#141A16'], accent: '#EFF6EE' },
];

export function getEventTheme(key?: string | null): EventTheme {
  return EVENT_THEMES.find((t) => t.key === key) ?? EVENT_THEMES[0];
}
