export interface GeolocationCoords {
  lat: number;
  lon: number;
}

export type GeolocationErrorCode = 1 | 2 | 3;

export type GeolocationResult =
  | { ok: true; coords: GeolocationCoords }
  | { ok: false; error: string; code?: GeolocationErrorCode };

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
        const code = error.code as GeolocationErrorCode;

        if (code === 1) {
          resolve({ ok: false, error: 'Geolocation denied: user denied permission', code: 1 });
        } else if (code === 2) {
          resolve({ ok: false, error: 'Geolocation unavailable: position could not be determined', code: 2 });
        } else if (code === 3) {
          resolve({ ok: false, error: 'Geolocation timeout: request timed out', code: 3 });
        } else {
          resolve({ ok: false, error: `Geolocation error: ${error.message}` });
        }
      },
      { timeout: 10_000, maximumAge: 600_000 },
    );
  });
}
