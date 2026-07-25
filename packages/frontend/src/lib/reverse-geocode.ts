interface BigDataCloudResponse {
  city?: string;
  locality?: string;
  countryName?: string;
  principalSubdivision?: string;
}

const BIG_DATA_CLOUD_URL = 'https://api.bigdatacloud.net/data/reverse-geocode-client';

export async function resolveCityName(lat: number, lon: number): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lon),
      localityLanguage: 'en',
    });

    const res = await fetch(`${BIG_DATA_CLOUD_URL}?${params}`);

    if (!res.ok) {
      return null;
    }

    const json = (await res.json()) as BigDataCloudResponse;

    return json.city || json.locality || json.principalSubdivision || null;
  } catch {
    return null;
  }
}

export async function resolveCityFromIP(): Promise<string | null> {
  try {
    const res = await fetch(BIG_DATA_CLOUD_URL);

    if (!res.ok) {
      return null;
    }

    const json = (await res.json()) as BigDataCloudResponse;

    return json.city || json.locality || json.principalSubdivision || null;
  } catch {
    return null;
  }
}
