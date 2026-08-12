export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

export function getBreakpoint(): Breakpoint {
  if (typeof window === 'undefined') return 'desktop';
  if (window.matchMedia('(max-width: 639px)').matches) return 'mobile';
  if (window.matchMedia('(min-width: 640px) and (max-width: 1023px)').matches) return 'tablet';
  return 'desktop';
}
