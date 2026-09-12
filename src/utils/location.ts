import * as Location from 'expo-location';

import type { Coordinates } from '@/api/services/attendance';

/**
 * Current GPS position for attendance check-in/out — the app's counterpart to
 * the portal's navigator.geolocation wrapper (lib/geo.ts). Errors come back as
 * readable messages because they're shown straight to the user.
 */
export async function getCurrentCoordinates(): Promise<Coordinates> {
  const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
  if (status !== Location.PermissionStatus.GRANTED) {
    throw new Error(
      canAskAgain
        ? 'Location permission is needed to mark attendance. Please allow access and try again.'
        : 'Location permission is blocked. Enable it for SQR School in your phone settings, then try again.',
    );
  }

  const services = await Location.hasServicesEnabledAsync();
  if (!services) throw new Error('Location services are turned off. Turn on GPS and try again.');

  try {
    const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    return { latitude: position.coords.latitude, longitude: position.coords.longitude };
  } catch {
    // A high-accuracy fix can time out indoors; the last known position is
    // close enough for a geofence check and keeps check-in from dead-ending.
    const last = await Location.getLastKnownPositionAsync();
    if (last) return { latitude: last.coords.latitude, longitude: last.coords.longitude };
    throw new Error('Could not determine your current location. Move to an open area and try again.');
  }
}
