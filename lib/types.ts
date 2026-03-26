export interface Event {
  id?: string;
  host_id?: string;
  slug: string;
  title: string;
  description?: string;
  date_time?: string;
  location_address?: string;
  location_lat?: number;
  location_lng?: number;
  theme?: string;
  poster_template?: string;
  font_style?: string;
  animation_effect?: string;
  max_capacity?: number;
  is_guest_list_public?: boolean;
  is_comments_enabled?: boolean;
  rsvp_deadline?: string;
  image_url?: string;
  image_path?: string;
  created_at?: string;
  updated_at?: string;
}

export interface RSVP {
  id?: string;
  event_id: string;
  user_id: string;
  status: 'going' | 'maybe' | 'cant_go';
  plus_ones?: number;
  created_at?: string;
  updated_at?: string;
}

export interface User {
  id?: string;
  phone_number?: string;
  email?: string;
  name: string;
  profile_photo_url?: string;
  created_at?: string;
  updated_at?: string;
}

export const THEMES = [
  { id: 'sunset', name: 'Sunset', gradient: 'from-orange-400 via-pink-500 to-purple-600' },
  { id: 'galaxy', name: 'Galaxy', gradient: 'from-indigo-900 via-purple-900 to-pink-900' },
  { id: 'ocean', name: 'Ocean', gradient: 'from-blue-400 via-teal-500 to-cyan-600' },
  { id: 'forest', name: 'Forest', gradient: 'from-green-700 via-emerald-600 to-teal-500' },
  { id: 'fire', name: 'Fire', gradient: 'from-red-600 via-orange-500 to-yellow-500' },
  { id: 'ankara', name: 'Ankara', gradient: 'from-yellow-600 via-red-600 to-green-700' },
  { id: 'royal', name: 'Royal', gradient: 'from-purple-900 via-indigo-800 to-blue-900' },
  { id: 'gold', name: 'Gold Rush', gradient: 'from-yellow-700 via-amber-600 to-orange-700' },
] as const;

export const ANIMATIONS = [
  { id: 'none', name: 'None' },
  { id: 'confetti', name: 'Confetti' },
  { id: 'sparkles', name: 'Sparkles' },
  { id: 'fade', name: 'Fade In' },
] as const;
