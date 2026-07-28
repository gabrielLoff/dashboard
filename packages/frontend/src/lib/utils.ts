import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const formatted = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  const diff = target.getTime() - today.getTime();
  const days = Math.round(diff / 86400000);

  if (days === 0) return `Today — ${formatted}`;
  if (days === 1) return `Tomorrow — ${formatted}`;
  return formatted;
}
