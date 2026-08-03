export type GradientColors = { light: [string, string]; dark: [string, string] };

export const GRADIENT_FLAT: Record<string, GradientColors> = {
  'morning-clear': { light: ['#fef3c7', '#fde68a'], dark: ['#451a03', '#78350f'] },
  'morning-cloudy': { light: ['#e5e7eb', '#d1d5db'], dark: ['#1f2937', '#374151'] },
  'morning-precip': { light: ['#dbeafe', '#bfdbfe'], dark: ['#1e3a5f', '#1e40af'] },
  'afternoon-clear': { light: ['#fef9c3', '#fde047'], dark: ['#713f12', '#854d0e'] },
  'afternoon-cloudy': { light: ['#f3f4f6', '#e5e7eb'], dark: ['#111827', '#1f2937'] },
  'afternoon-precip': { light: ['#e0e7ff', '#c7d2fe'], dark: ['#1e1b4b', '#312e81'] },
  'evening-clear': { light: ['#fed7aa', '#fb923c'], dark: ['#7c2d12', '#9a3412'] },
  'evening-cloudy': { light: ['#ddd6fe', '#c4b5fd'], dark: ['#2e1065', '#4c1d95'] },
  'evening-precip': { light: ['#fecdd3', '#fda4af'], dark: ['#881337', '#9f1239'] },
  'night-clear': { light: ['#1e293b', '#0f172a'], dark: ['#020617', '#0f172a'] },
  'night-cloudy': { light: ['#374151', '#1f2937'], dark: ['#111827', '#030712'] },
  'night-precip': { light: ['#312e81', '#1e1b4b'], dark: ['#0c0a1d', '#070520'] },
};

export const WEATHER_BUCKETS: Record<string, string> = {
  sun: 'clear',
  'cloud-sun': 'clear',
  cloud: 'cloudy',
  fog: 'cloudy',
  drizzle: 'cloudy',
  rain: 'precip',
  'cloud-rain': 'precip',
  snow: 'precip',
  bolt: 'precip',
};

export function getTimePeriod(): string {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 22) return 'evening';
  return 'night';
}

export function getWeatherBucket(icon: string): string {
  return WEATHER_BUCKETS[icon] ?? 'cloudy';
}

export function applyGradient(weatherIcon: string, theme: 'light' | 'dark'): void {
  const period = getTimePeriod();
  const bucket = getWeatherBucket(weatherIcon);
  const isDark = theme === 'dark';
  const key = `${period}-${bucket}`;
  const palette: GradientColors = GRADIENT_FLAT[key] ?? GRADIENT_FLAT['morning-cloudy']!;
  const colors = isDark ? palette.dark : palette.light;

  document.documentElement.style.setProperty('--bg-from', colors[0]);
  document.documentElement.style.setProperty('--bg-to', colors[1]);
}
