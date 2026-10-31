// App state: one person's data, saved on the device first (works offline) and synced to Supabase when signed in.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { upgrade } from '../core/backup';
import { dayKey } from '../core/dates';
import { scaleMeal } from '../core/macros';
import { calcTargets, waterFor } from '../core/targets';
import type { AppData, Meal, Profile } from '../core/types';
import { pushAll } from './sync';

const KEY = 'rep-ration-v1';
const defaultProfile: Profile = { sex: 'female', age: 35, heightCm: 168, weightKg: 70, activity: 1.375, goal: 'maintain' };
export function emptyData(): AppData {
  const t = calcTargets(defaultProfile);
  return { v: 2, units: 'us', profile: defaultProfile, targets: { kcal: t.kcal, p: t.p, c: t.c, f: t.f, waterMl: waterFor(defaultProfile), workoutsWeek: 3, minutesWeek: 150 }, meals: [], weights: [], workouts: [], water: {} };
}
const uid = () => Math.random().toString(36).slice(2, 10);

interface Store {
  data: AppData;
  ready: boolean;
  update: (fn: (d: AppData) => AppData) => void;
  replaceAll: (d: AppData) => void;
  addMeal: (m: Omit<Meal, 'id' | 'date'> & { date?: string }) => void;
  removeMeal: (id: string) => void;
  addWater: (ml: number, date?: string) => void;
  setWeight: (kg: number, date?: string) => void;
}
const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(emptyData);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    AsyncStorage.getItem(KEY).then((raw) => {
      if (raw) {
        let d: Record<string, unknown> | null = null;
        try { d = upgrade(JSON.parse(raw)); } catch { d = null; }
        if (d) setData({ ...emptyData(), ...(d as AppData) });
        else AsyncStorage.setItem(`${KEY}:unreadable`, raw).catch(() => {}); // keep a copy aside, never lose it
      }
      setReady(true);
    });
  }, []);
  const persist = useCallback((d: AppData) => { AsyncStorage.setItem(KEY, JSON.stringify(d)).catch(() => {}); pushAll(d).catch(() => {}); }, []);
  const update = useCallback((fn: (d: AppData) => AppData) => setData((cur) => { const next = fn(cur); persist(next); return next; }), [persist]);
  const value = useMemo<Store>(() => ({
    data, ready, update,
    replaceAll: (d) => update(() => ({ ...emptyData(), ...d })),
    addMeal: (m) => update((d) => ({ ...d, meals: [...d.meals, scaleMeal({ qty: 1, base: { kcal: m.kcal, p: m.p, c: m.c, f: m.f }, ...m, id: uid(), date: m.date ?? dayKey() })] })),
    removeMeal: (id) => update((d) => ({ ...d, meals: d.meals.filter((x) => x.id !== id) })),
    addWater: (ml, date = dayKey()) => update((d) => ({ ...d, water: { ...d.water, [date]: Math.max(0, (d.water[date] || 0) + ml) } })),
    setWeight: (kg, date = dayKey()) => update((d) => ({ ...d, weights: [...d.weights.filter((w) => w.date !== date), { date, kg }].sort((a, b) => a.date.localeCompare(b.date)) })),
  }), [data, ready, update]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore must be used inside StoreProvider');
  return s;
}
