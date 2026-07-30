// Best-effort "where is the user right now" for the concierge and nearby
// ranking. Never throws and never blocks the UI on a permission dialog we
// can't satisfy: if the user declines, permission is unavailable, or it times
// out, we resolve to null and the app falls back to city-wide results.
import * as Location from 'expo-location';
import { Platform } from 'react-native';

export type Coords = { lat: number; lng: number };

// Round to ~100m so we never ship a needlessly precise coordinate to the
// backend or the model — city-block accuracy is all the ranking needs.
function coarse(lat: number, lng: number): Coords {
  return { lat: Math.round(lat * 1000) / 1000, lng: Math.round(lng * 1000) / 1000 };
}

async function webLocation(): Promise<Coords | null> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) return null;
  return new Promise((resolve) => {
    let settled = false;
    const done = (c: Coords | null) => {
      if (!settled) {
        settled = true;
        resolve(c);
      }
    };
    navigator.geolocation.getCurrentPosition(
      (pos) => done(coarse(pos.coords.latitude, pos.coords.longitude)),
      () => done(null),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
    );
    // Hard stop in case the browser never calls either callback.
    setTimeout(() => done(null), 9000);
  });
}

async function nativeLocation(): Promise<Coords | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;
    const pos = await Location.getLastKnownPositionAsync();
    const use = pos ?? (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }));
    if (!use) return null;
    return coarse(use.coords.latitude, use.coords.longitude);
  } catch {
    return null;
  }
}

/**
 * Returns the user's approximate coordinates, or null if unavailable/declined.
 * Safe to call anywhere — resolves fast and never rejects.
 */
export async function getUserLocation(): Promise<Coords | null> {
  try {
    return Platform.OS === 'web' ? await webLocation() : await nativeLocation();
  } catch {
    return null;
  }
}
