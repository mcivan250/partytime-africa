export interface Venue {
  id: string;
  owner_id: string;
  name: string;
  description?: string;
  address?: string;
  phone_number?: string;
  email?: string;
  logo_url?: string;
  cover_photo_url?: string;
  venue_type: 'bar' | 'restaurant' | 'lounge' | 'club' | 'rooftop' | 'cafe';
  capacity?: number;
  amenities?: string[];
  operating_hours?: Record<string, { open: string; close: string }>;
  is_active: boolean;
}

export interface Table {
  id: string;
  venue_id: string;
  table_number: string;
  table_name?: string;
  capacity: number;
  min_capacity?: number;
  section?: string;
  price_per_person_cents?: number;
  minimum_spend_cents?: number;
  deposit_required_cents?: number;
  features?: string[];
  photos?: string[];
  is_bookable: boolean;
}

export interface TableBooking {
  id: string;
  table_id: string;
  venue_id: string;
  user_id: string;
  booking_date: string;
  time_slot_start: string;
  time_slot_end: string;
  party_size: number;
  total_price_cents: number;
  deposit_paid_cents: number;
  minimum_spend_cents?: number;
  status: 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no_show';
  payment_status: 'pending' | 'deposit_paid' | 'fully_paid' | 'refunded';
  guest_name: string;
  guest_phone: string;
  guest_email?: string;
  special_requests?: string;
  occasion?: string;
  confirmation_code: string;
  checked_in_at?: string;
}

export interface BrunchEvent {
  id: string;
  venue_id: string;
  title: string;
  description?: string;
  poster_url?: string;
  theme?: string;
  day_of_week: number; // 0=Sunday, 6=Saturday
  start_time: string;
  end_time: string;
  price_per_person_cents: number;
  includes?: string[];
  max_party_size: number;
  advance_booking_days: number;
  cancellation_hours: number;
  is_active: boolean;
}

export interface BrunchBooking {
  id: string;
  brunch_event_id: string;
  venue_id: string;
  user_id: string;
  booking_date: string;
  party_size: number;
  price_per_person_cents: number;
  total_price_cents: number;
  amount_paid_cents: number;
  status: 'pending' | 'confirmed' | 'attended' | 'cancelled' | 'no_show';
  guest_name: string;
  guest_phone: string;
  guest_email?: string;
  confirmation_code: string;
  checked_in_at?: string;
}

export const VENUE_TYPES = [
  { id: 'bar', name: 'Bar', icon: '🍺' },
  { id: 'restaurant', name: 'Restaurant', icon: '🍽️' },
  { id: 'lounge', name: 'Lounge', icon: '🛋️' },
  { id: 'club', name: 'Night Club', icon: '💃' },
  { id: 'rooftop', name: 'Rooftop', icon: '🌆' },
  { id: 'cafe', name: 'Cafe', icon: '☕' },
] as const;

export const TABLE_SECTIONS = [
  'VIP',
  'General',
  'Rooftop',
  'Indoor',
  'Outdoor',
  'Window Side',
  'Near Stage',
  'Booth',
] as const;

export const BRUNCH_THEMES = [
  { id: 'afrobeat', name: 'Afrobeat Brunch', emoji: '🎵' },
  { id: 'jazz', name: 'Jazz Brunch', emoji: '🎷' },
  { id: 'caribbean', name: 'Caribbean Vibes', emoji: '🌴' },
  { id: 'rooftop_vibes', name: 'Rooftop Vibes', emoji: '🌇' },
  { id: 'bottomless', name: 'Bottomless Brunch', emoji: '🍾' },
  { id: 'gospel', name: 'Gospel Brunch', emoji: '🙏' },
] as const;

export const OCCASIONS = [
  'Birthday',
  'Anniversary',
  'Date Night',
  'Business Meeting',
  'Family Gathering',
  'Friends Hangout',
  'Celebration',
  'Just Because',
] as const;

export const TIME_SLOTS = [
  { id: '10:00', label: '10:00 AM' },
  { id: '11:00', label: '11:00 AM' },
  { id: '12:00', label: '12:00 PM' },
  { id: '13:00', label: '1:00 PM' },
  { id: '14:00', label: '2:00 PM' },
  { id: '15:00', label: '3:00 PM' },
  { id: '16:00', label: '4:00 PM' },
  { id: '17:00', label: '5:00 PM' },
  { id: '18:00', label: '6:00 PM' },
  { id: '19:00', label: '7:00 PM' },
  { id: '20:00', label: '8:00 PM' },
  { id: '21:00', label: '9:00 PM' },
  { id: '22:00', label: '10:00 PM' },
] as const;

export function getDayName(dayIndex: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayIndex] || 'Unknown';
}
