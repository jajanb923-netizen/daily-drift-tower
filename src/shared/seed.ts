// Shared daily-seed logic: identical on client and server.
// The same calendar date always produces the same wind + palette,
// so every player in the world gets the same tower on the same day.
export function hashString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** UTC date key, e.g. "2026-11-17". */
export function todayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

export interface DailyConfig {
  date: string;
  seed: number;
  /** base wind strength 0..1 (stronger wind = harder day) */
  windBase: number;
  /** palette index 0..4 */
  palette: number;
  /** block slide speed multiplier */
  speed: number;
}

export function dailyConfig(dateKey: string): DailyConfig {
  const seed = hashString('daily-drift:' + dateKey);
  const rnd = mulberry32(seed);
  return {
    date: dateKey,
    seed,
    windBase: 0.25 + rnd() * 0.6,
    palette: Math.floor(rnd() * 5),
    speed: 0.9 + rnd() * 0.35,
  };
}

export const PALETTES: { sky: string; tower: string[]; accent: string }[] = [
  { sky: '#0f2027', tower: ['#ff9a5a', '#ff6b6b', '#feca57', '#48dbfb', '#1dd1a1'], accent: '#feca57' },
  { sky: '#1a1a2e', tower: ['#e94560', '#ff7b54', '#ffb26b', '#ffd32a', '#0fbcf9'], accent: '#e94560' },
  { sky: '#0b3d2e', tower: ['#a3e635', '#4ade80', '#2dd4bf', '#facc15', '#fb923c'], accent: '#a3e635' },
  { sky: '#2d1b4e', tower: ['#c084fc', '#f472b6', '#fda4af', '#fcd34d', '#67e8f9'], accent: '#c084fc' },
  { sky: '#3b1d0d', tower: ['#f97316', '#fbbf24', '#f87171', '#fde68a', '#fb7185'], accent: '#f97316' },
];
