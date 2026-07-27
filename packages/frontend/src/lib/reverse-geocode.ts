interface BigDataCloudResponse {
  city?: string;
  locality?: string;
  countryName?: string;
  principalSubdivision?: string;
}

const BIG_DATA_CLOUD_URL = 'https://api.bigdatacloud.net/data/reverse-geocode-client';

export interface CityLocation {
  city: string;
  country: string;
}

export async function resolveCityName(lat: number, lon: number): Promise<CityLocation | null> {
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

    const city = json.city ?? json.locality ?? json.principalSubdivision ?? null;
    if (!city) return null;

    return { city, country: json.countryName ?? '' };
  } catch {
    return null;
  }
}

export async function resolveCityFromIP(): Promise<CityLocation | null> {
  try {
    const res = await fetch(BIG_DATA_CLOUD_URL);

    if (!res.ok) {
      return null;
    }

    const json = (await res.json()) as BigDataCloudResponse;

    const city = json.city ?? json.locality ?? json.principalSubdivision ?? null;
    if (!city) return null;

    return { city, country: json.countryName ?? '' };
  } catch {
    return null;
  }
}
