// Food totals and portion scaling, matching totals()/scaleMeal() in the web app.
import type { Macros, Meal } from './types';

export function totals(list: Partial<Macros>[]): Macros {
  return list.reduce<Macros>(
    (a, m) => ({ kcal: a.kcal + (Number(m.kcal) || 0), p: a.p + (Number(m.p) || 0), c: a.c + (Number(m.c) || 0), f: a.f + (Number(m.f) || 0) }),
    { kcal: 0, p: 0, c: 0, f: 0 },
  );
}

export const dayMeals = (meals: Meal[], date: string) => meals.filter((m) => m.date === date);

/** Recompute a logged item's macros from its per-portion base and quantity. */
export function scaleMeal<T extends Meal>(m: T): T {
  if (!m.base) return m;
  const q = m.qty ?? 1;
  return { ...m, kcal: Math.round(m.base.kcal * q), p: Math.round(m.base.p * q), c: Math.round(m.base.c * q), f: Math.round(m.base.f * q) };
}

/** Calories from macros (4/4/9). Useful to sanity-check label data. */
export const kcalFromMacros = (m: Pick<Macros, 'p' | 'c' | 'f'>) => m.p * 4 + m.c * 4 + m.f * 9;

/** FDA Daily Values used for the micronutrient row: fiber g, sodium mg, potassium mg, iron mg, B12 µg. */
export const MICRO_DV = [28, 2300, 4700, 18, 2.4] as const;

export function microTotals(list: Meal[]): { totals: number[]; withData: number } {
  const tot = [0, 0, 0, 0, 0];
  const withData = list.filter((m) => Array.isArray(m.mic));
  withData.forEach((m) => m.mic!.forEach((v, i) => { tot[i] += (Number(v) || 0) * (m.qty ?? 1); }));
  return { totals: tot, withData: withData.length };
}
