// Adaptive calorie target, ported from adaptiveTdee() in the web app.
import { addDays, parseKey } from './dates';
import { calcTargets, KCAL_PER_KG } from './targets';
import type { Meal, Profile, WeighIn } from './types';

export type Adaptive =
  | { ok: false; logged: number; weighIns: number; formula: number }
  | { ok: true; tdee: number; measured: number; formula: number; intake: number; kgWeek: number; conf: number; logged: number; weighIns: number };

/** Uses the last 28 days: needs ≥10 days with ≥800 kcal logged and ≥6 weigh-ins. Weight trend is a least-squares line. */
export function adaptiveTdee(profile: Profile, meals: Meal[], weights: WeighIn[], today: string): Adaptive {
  const start = addDays(today, -27), daily: Record<string, number> = {};
  meals.forEach((m) => { if (m.date >= start && m.date <= today) daily[m.date] = (daily[m.date] || 0) + (Number(m.kcal) || 0); });
  const logged = Object.values(daily).filter((k) => k >= 800);
  const ws = weights.filter((w) => w.date >= start && w.date <= today && w.kg > 0);
  const formula = calcTargets(profile).tdee;
  if (logged.length < 10 || ws.length < 6) return { ok: false, logged: logged.length, weighIns: ws.length, formula };
  const xs = ws.map((w) => (parseKey(w.date).getTime() - parseKey(start).getTime()) / 864e5), ys = ws.map((w) => w.kg), n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n, my = ys.reduce((a, b) => a + b, 0) / n;
  const sxx = xs.reduce((a, x) => a + (x - mx) ** 2, 0);
  const slope = sxx ? xs.reduce((a, x, i) => a + (x - mx) * (ys[i] - my), 0) / sxx : 0; // kg per day
  const intake = logged.reduce((a, b) => a + b, 0) / logged.length;
  const measured = intake - slope * KCAL_PER_KG;
  const conf = Math.min(1, (logged.length / 21) * Math.min(1, ws.length / 12));
  const est = Math.min(formula * 1.5, Math.max(formula * 0.6, conf * measured + (1 - conf) * formula));
  return { ok: true, tdee: Math.round(est / 10) * 10, measured: Math.round(measured), formula, intake: Math.round(intake), kgWeek: Math.round(slope * 7 * 100) / 100, conf, logged: logged.length, weighIns: ws.length };
}

/** The daily target the adaptive estimate suggests for the profile's goal (same caps as calcTargets). */
export function adaptiveKcal(profile: Profile, tdee: number): number {
  const adj = profile.goal === 'lose' ? -Math.min(500, tdee * 0.2) : profile.goal === 'gain' ? Math.min(300, tdee * 0.1) : 0;
  return Math.max(profile.sex === 'male' ? 1500 : 1200, Math.round((tdee + adj) / 10) * 10);
}
