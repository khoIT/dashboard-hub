const COLOR_NAMES: Record<string, string> = {
  red: '#ef4444',
  blue: '#3b82f6',
  green: '#22c55e',
  yellow: '#eab308',
  purple: '#a855f7',
  orange: '#f97316',
  pink: '#ec4899',
  cyan: '#22d3ee',
  indigo: '#6366f1',
  teal: '#14b8a6',
  amber: '#f59e0b',
  lime: '#84cc16',
  emerald: '#10b981',
  sky: '#0ea5e9',
  violet: '#8b5cf6',
  rose: '#f43f5e',
  slate: '#64748b',
  white: '#ffffff',
  gray: '#9ca3af',
  grey: '#9ca3af',
};

export function resolveColor(nameOrHex: string): string {
  return COLOR_NAMES[nameOrHex.toLowerCase().trim()] || nameOrHex;
}

export function getColorNames(): string[] {
  return Object.keys(COLOR_NAMES);
}
