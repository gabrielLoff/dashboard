const THEME_KEY = 'dashboard-theme';

let theme = $state<'light' | 'dark'>('light');

function getStored(): 'light' | 'dark' {
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  }
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

export const themeStore = {
  get current() {
    return theme;
  },

  init() {
    theme = getStored();
    this.apply();
  },

  toggle() {
    theme = theme === 'light' ? 'dark' : 'light';
    localStorage.setItem(THEME_KEY, theme);
    this.apply();
  },

  apply() {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
  },
};
