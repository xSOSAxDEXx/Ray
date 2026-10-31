// Reading web-app backups (both the profile-aware format and the older single-object file), with the same versioned
// migrations as the web app. Data is upgraded, never reset.
import type { AppData } from './types';

export const SCHEMA = 2;
const MIGRATIONS: Record<number, (d: Record<string, unknown>) => void> = {
  1: (d) => { d.lastBackup = d.lastBackup ?? null; },
};

const isObj = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v);

export function upgrade(d: unknown): Record<string, unknown> | null {
  if (!isObj(d)) return null;
  let v = Number.isInteger(d.v) && (d.v as number) >= 1 ? (d.v as number) : 1;
  while (v < SCHEMA) { MIGRATIONS[v]?.(d); v += 1; }
  if (!((d.v as number) >= SCHEMA)) d.v = SCHEMA;
  return d;
}

const looksValid = (d: Record<string, unknown> | null): d is AppData =>
  !!d && Array.isArray(d.meals) && Array.isArray(d.weights) && isObj(d.profile) && isObj(d.targets);

export interface BackupProfile {
  name: string;
  data: AppData;
  from?: string;
  to?: string;
  meals: number;
  workouts: number;
  weighIns: number;
}

/** Parse a backup file's text. Returns null if it isn't a Rep & Ration backup. */
export function readBackup(text: string): { exportedAt?: string; profiles: BackupProfile[] } | null {
  let raw: unknown;
  try { raw = JSON.parse(text); } catch { return null; }
  const list: { name: string; data: Record<string, unknown> | null }[] =
    isObj(raw) && raw.app === 'rep-and-ration' && Array.isArray(raw.profiles)
      ? raw.profiles.map((x: unknown) => (isObj(x) ? { name: String(x.name ?? ''), data: upgrade(x.data) } : { name: '', data: null }))
      : [{ name: '', data: upgrade(raw) }];
  const ok = list.filter((x): x is { name: string; data: AppData } => looksValid(x.data));
  if (!ok.length) return null;
  return {
    exportedAt: isObj(raw) && typeof raw.exportedAt === 'string' ? raw.exportedAt : undefined,
    profiles: ok.map(({ name, data }) => {
      const workouts = Array.isArray(data.workouts) ? data.workouts : [];
      const dates = [...data.meals, ...data.weights, ...workouts].map((e) => e?.date).filter((k): k is string => typeof k === 'string').sort();
      return { name, data: { ...data, workouts, water: isObj(data.water) ? data.water : {} } as AppData, from: dates[0], to: dates[dates.length - 1], meals: data.meals.length, workouts: workouts.length, weighIns: data.weights.length };
    }),
  };
}
