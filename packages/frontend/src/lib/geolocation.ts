export interface GeolocationCoords {
  lat: number;
  lon: number;
}

export type GeolocationResult =
  | { ok: true; coords: GeolocationCoords }
  | { ok: false; error: string };

export function getCurrentPosition(): Promise<GeolocationResult> {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) {
      resolve({ ok: false, error: 'Geolocation not supported' });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          ok: true,
          coords: {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          },
        });
      },
      (error) => {
        resolve({ ok: false, error: `Geolocation denied: ${error.message}` });
      },
      { timeout: 5000, maximumAge: 600_000 },
    );
  });
}
