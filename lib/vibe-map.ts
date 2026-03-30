/**
 * Vibe Map Library
 * Calculates real-time venue vibes based on event activity
 */

export interface Venue {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  vibe_score: number;
  vibe_level: 'hot' | 'moderate' | 'chill';
  active_events: number;
  total_rsvps: number;
  icon: string;
}

export interface VibeData {
  venues: Venue[];
  timestamp: string;
  total_active_events: number;
}

/**
 * Calculate vibe score based on multiple factors
 * Formula: (RSVPs × 0.5) + (Event Intensity × 0.3) + (Time Factor × 0.2)
 */
export function calculateVibeScore(
  rsvpCount: number,
  eventIntensity: number = 50,
  hoursUntilEvent: number = 0
): number {
  // RSVP factor (0-50 points)
  const rsvpFactor = Math.min((rsvpCount / 100) * 50, 50);
  
  // Event intensity factor (0-30 points)
  const intensityFactor = (eventIntensity / 100) * 30;
  
  // Time factor (0-20 points) - events happening soon get higher scores
  let timeFactor = 0;
  if (hoursUntilEvent <= 0) {
    timeFactor = 20; // Event is happening now
  } else if (hoursUntilEvent <= 2) {
    timeFactor = 18; // Event is very soon
  } else if (hoursUntilEvent <= 6) {
    timeFactor = 12; // Event is today
  } else if (hoursUntilEvent <= 24) {
    timeFactor = 8; // Event is tomorrow
  } else {
    timeFactor = 2; // Event is far away
  }
  
  return rsvpFactor + intensityFactor + timeFactor;
}

/**
 * Determine vibe level based on score
 */
export function getVibeLevel(score: number): 'hot' | 'moderate' | 'chill' {
  if (score > 70) return 'hot';
  if (score > 40) return 'moderate';
  return 'chill';
}

/**
 * Get vibe color for display
 */
export function getVibeColor(level: 'hot' | 'moderate' | 'chill'): string {
  switch (level) {
    case 'hot':
      return '#FF4444'; // Red
    case 'moderate':
      return '#FFD700'; // Gold
    case 'chill':
      return '#4488FF'; // Blue
  }
}

/**
 * Get vibe emoji for display
 */
export function getVibeEmoji(level: 'hot' | 'moderate' | 'chill'): string {
  switch (level) {
    case 'hot':
      return '🔥';
    case 'moderate':
      return '🟡';
    case 'chill':
      return '🔵';
  }
}

/**
 * Mock data generator for demo venues
 */
export function generateDemoVenues(): Venue[] {
  const venues: Venue[] = [
    {
      id: 'v1',
      name: 'Urban Hub',
      latitude: 0.3476,
      longitude: 32.5825,
      address: 'Kampala, Uganda',
      vibe_score: 85,
      vibe_level: 'hot',
      active_events: 3,
      total_rsvps: 245,
      icon: '🏢'
    },
    {
      id: 'v2',
      name: 'The Rooftop Bar',
      latitude: 0.3465,
      longitude: 32.5835,
      address: 'Downtown Kampala',
      vibe_score: 72,
      vibe_level: 'moderate',
      active_events: 2,
      total_rsvps: 180,
      icon: '🍸'
    },
    {
      id: 'v3',
      name: 'Design Hub',
      latitude: 0.3485,
      longitude: 32.5815,
      address: 'Kampala, Uganda',
      vibe_score: 65,
      vibe_level: 'moderate',
      active_events: 2,
      total_rsvps: 120,
      icon: '🎨'
    },
    {
      id: 'v4',
      name: 'Social Hub',
      latitude: 0.3455,
      longitude: 32.5845,
      address: 'Kampala, Uganda',
      vibe_score: 48,
      vibe_level: 'moderate',
      active_events: 1,
      total_rsvps: 85,
      icon: '👥'
    },
    {
      id: 'v5',
      name: 'Diani Beach',
      latitude: 0.3445,
      longitude: 32.5855,
      address: 'Mombasa, Kenya',
      vibe_score: 92,
      vibe_level: 'hot',
      active_events: 1,
      total_rsvps: 320,
      icon: '🏖️'
    },
    {
      id: 'v6',
      name: 'Sunset Lounge',
      latitude: 0.3495,
      longitude: 32.5805,
      address: 'Kampala, Uganda',
      vibe_score: 35,
      vibe_level: 'chill',
      active_events: 1,
      total_rsvps: 45,
      icon: '🌅'
    }
  ];
  
  return venues;
}

/**
 * Generate vibe map data
 */
export function generateVibeMapData(): VibeData {
  const venues = generateDemoVenues();
  
  return {
    venues,
    timestamp: new Date().toISOString(),
    total_active_events: venues.reduce((sum, v) => sum + v.active_events, 0)
  };
}

/**
 * Get venues sorted by vibe score (hottest first)
 */
export function getHottestVenues(venues: Venue[]): Venue[] {
  return [...venues].sort((a, b) => b.vibe_score - a.vibe_score);
}

/**
 * Get venues within a certain vibe level
 */
export function getVenuesByVibeLevel(
  venues: Venue[],
  level: 'hot' | 'moderate' | 'chill'
): Venue[] {
  return venues.filter(v => v.vibe_level === level);
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Get nearby venues within radius (in km)
 */
export function getNearbyVenues(
  venues: Venue[],
  userLat: number,
  userLon: number,
  radiusKm: number = 5
): Venue[] {
  return venues.filter(venue => {
    const distance = calculateDistance(userLat, userLon, venue.latitude, venue.longitude);
    return distance <= radiusKm;
  });
}
