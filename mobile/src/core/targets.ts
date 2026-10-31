// Daily targets, ported from calcTargets()/waterFor() in the web app so both give identical numbers.
import type { Profile } from './types';

export const KCAL_PER_KG = 7700;

/** Mifflin-St Jeor resting energy (kcal/day). */
export function bmr(p: Profile): number {
  return 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age + (p.sex === 'male' ? 5 : -161);
}

/** Weight used for protein: actual weight, capped at a BMI of 27.5 so higher body fat doesn't inflate the target. */
export function refKg(p: Profile): number {
  return Math.min(p.weightKg, 27.5 * (p.heightCm / 100) ** 2);
}

/** About 33 ml/kg, never below 2.2 L (women) / 3.0 L (men), plus extra for activity; rounded to 100 ml, max 4.5 L. */
export function waterFor(p: Profile): number {
  const base = Math.max(p.sex === 'male' ? 3000 : 2200, 33 * p.weightKg);
  const extra = p.activity >= 1.725 ? 750 : p.activity >= 1.55 ? 350 : p.activity >= 1.375 ? 200 : 0;
  return Math.min(4500, Math.round((base + extra) / 100) * 100);
}

export interface CalcTargets {
  bmr: number;
  tdee: number;
  kcal: number;
  p: number;
  c: number;
  f: number;
  waterSuggest: number;
}

/** Calories, protein, carbs, fat and water from a profile (see "How these are set" in the web app). */
export function calcTargets(p: Profile): CalcTargets {
  const b = bmr(p);
  const tdee = b * p.activity;
  const adj = p.goal === 'lose' ? -Math.min(500, tdee * 0.2) : p.goal === 'gain' ? Math.min(300, tdee * 0.1) : 0;
  const kcal = Math.max(p.sex === 'male' ? 1500 : 1200, Math.round((tdee + adj) / 10) * 10);
  const protein = Math.round(refKg(p) * ({ lose: 2.0, gain: 1.8, maintain: 1.6 }[p.goal] ?? 1.6));
  const fat = Math.round((kcal * 0.3) / 9);
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
  return { bmr: Math.round(b), tdee: Math.round(tdee), kcal, p: protein, c: carbs, f: fat, waterSuggest: waterFor(p) };
}
