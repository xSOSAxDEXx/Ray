import { adaptiveKcal, adaptiveTdee } from '../adaptive';
import { readBackup, SCHEMA, upgrade } from '../backup';
import { addDays, mondayOf } from '../dates';
import { kcalFromMacros, microTotals, scaleMeal, totals } from '../macros';
import { loggingStreak, weeklyStreak, weekSummaries } from '../streaks';
import { bmr, calcTargets, refKg, waterFor } from '../targets';
import type { Meal, Profile, Workout } from '../types';

const woman: Profile = { sex: 'female', age: 34, heightCm: 167.6, weightKg: 74.4, activity: 1.55, goal: 'lose' };
const man: Profile = { sex: 'male', age: 40, heightCm: 180, weightKg: 90, activity: 1.55, goal: 'gain' };

describe('targets', () => {
  test('Mifflin-St Jeor BMR', () => {
    // 10×74.4 + 6.25×167.6 − 5×34 − 161 = 1460.5
    expect(bmr(woman)).toBeCloseTo(1460.5, 1);
    // 10×90 + 6.25×180 − 5×40 + 5 = 1830
    expect(bmr(man)).toBe(1830);
  });
  test('fat loss uses at most a 500 kcal or 20% deficit', () => {
    const t = calcTargets(woman);
    expect(t.tdee).toBe(Math.round(1460.5 * 1.55));
    expect(t.kcal).toBe(Math.round((1460.5 * 1.55 - 452.755) / 10) * 10); // 20% of 2263.8 is 452.8 < 500
    expect(t.kcal).toBe(1810);
  });
  test('muscle gain adds at most 300 kcal or 10%', () => {
    const t = calcTargets(man);
    expect(t.kcal).toBe(Math.round((1830 * 1.55 + 283.65) / 10) * 10);
  });
  test('calorie floors', () => {
    const tiny: Profile = { sex: 'female', age: 80, heightCm: 145, weightKg: 40, activity: 1.2, goal: 'lose' };
    expect(calcTargets(tiny).kcal).toBe(1200);
  });
  test('protein per kg of a capped reference weight', () => {
    expect(calcTargets(woman).p).toBe(Math.round(74.4 * 2.0));
    const heavy: Profile = { ...man, weightKg: 140, goal: 'maintain' };
    expect(refKg(heavy)).toBeCloseTo(27.5 * 1.8 ** 2, 5);
    expect(calcTargets(heavy).p).toBe(Math.round(27.5 * 3.24 * 1.6));
  });
  test('macros add back up to the calorie target (within rounding)', () => {
    for (const p of [woman, man]) {
      const t = calcTargets(p);
      expect(Math.abs(kcalFromMacros(t) - t.kcal)).toBeLessThanOrEqual(8);
      expect(t.f * 9 / t.kcal).toBeCloseTo(0.3, 1);
    }
  });
  test('water: 33 ml/kg with sex floors and activity extra', () => {
    expect(waterFor(woman)).toBe(Math.round((33 * 74.4 + 350) / 100) * 100); // 2800
    expect(waterFor({ ...woman, weightKg: 50, activity: 1.2 })).toBe(2200);
    expect(waterFor({ ...man, weightKg: 200, activity: 1.9 })).toBe(4500);
  });
});

describe('macros', () => {
  const meals: Meal[] = [
    { id: 'a', date: '2026-10-01', meal: 'Lunch', name: 'x', kcal: 500, p: 30, c: 40, f: 20 },
    { id: 'b', date: '2026-10-01', meal: 'Dinner', name: 'y', kcal: 250, p: 20, c: 10, f: 15, qty: 2, base: { kcal: 125, p: 10, c: 5, f: 7.5 }, mic: [1, 100, 200, 1, 0.5] },
  ];
  test('totals', () => { expect(totals(meals)).toEqual({ kcal: 750, p: 50, c: 50, f: 35 }); });
  test('scaling a portion', () => { expect(scaleMeal({ ...meals[1], qty: 1.5 })).toMatchObject({ kcal: 188, p: 15, c: 8, f: 11 }); });
  test('micronutrients scale with quantity and report coverage', () => {
    const r = microTotals(meals);
    expect(r.withData).toBe(1);
    expect(r.totals).toEqual([2, 200, 400, 2, 1]);
  });
});

describe('streaks', () => {
  const today = '2026-10-31'; // a Saturday
  const w = (date: string, minutes = 40): Workout => ({ id: date + minutes, date, planId: 'p', dayIdx: 0, minutes, sets: 10, total: 10 });
  test('Monday of the week', () => { expect(mondayOf(today)).toBe('2026-10-26'); });
  test('weekly goal streak ignores an unfinished current week', () => {
    const goal = { workoutsWeek: 2, minutesWeek: 60 };
    const list = [-16, -15, -9, -8].map((d) => w(addDays(today, d)));
    const weeks = weekSummaries(list, goal, today, 4);
    expect(weeks.map((x) => x.hit)).toEqual([false, true, true, false]);
    expect(weeklyStreak(weeks)).toBe(2);
  });
  test('a missed full week breaks the streak', () => {
    const goal = { workoutsWeek: 1, minutesWeek: 30 };
    const weeks = weekSummaries([w(addDays(today, -21)), w(today)], goal, today, 4);
    expect(weeklyStreak(weeks)).toBe(1);
  });
  test('daily logging streak', () => {
    const m = (date: string): Meal => ({ id: date, date, meal: 'Lunch', name: 'x', kcal: 1, p: 0, c: 0, f: 0 });
    expect(loggingStreak([m(today), m(addDays(today, -1)), m(addDays(today, -3))], today)).toBe(2);
    expect(loggingStreak([m(addDays(today, -1)), m(addDays(today, -2))], today)).toBe(2);
    expect(loggingStreak([], today)).toBe(0);
  });
});

describe('adaptive target', () => {
  const today = '2026-10-31';
  test('needs enough data', () => {
    expect(adaptiveTdee(woman, [], [], today).ok).toBe(false);
  });
  test('maintenance intake with steady weight returns about the intake', () => {
    const meals = Array.from({ length: 28 }, (_, i): Meal => ({ id: String(i), date: addDays(today, -i), meal: 'Day total', name: 'x', kcal: 2300, p: 0, c: 0, f: 0 }));
    const weights = Array.from({ length: 14 }, (_, i) => ({ date: addDays(today, -i * 2), kg: 74.4 }));
    const a = adaptiveTdee(woman, meals, weights, today);
    expect(a.ok).toBe(true);
    if (a.ok) { expect(a.measured).toBe(2300); expect(a.kgWeek).toBe(0); }
  });
  test('losing 0.5 kg a week on 2000 kcal means a burn of about 2550', () => {
    const meals = Array.from({ length: 28 }, (_, i): Meal => ({ id: String(i), date: addDays(today, -i), meal: 'Day total', name: 'x', kcal: 2000, p: 0, c: 0, f: 0 }));
    const weights = Array.from({ length: 14 }, (_, i) => ({ date: addDays(today, -i * 2), kg: 80 + (i * 2 * 0.5) / 7 }));
    const a = adaptiveTdee(woman, meals, weights, today);
    expect(a.ok && Math.abs(a.measured - 2550)).toBeLessThan(5);
    expect(adaptiveKcal(woman, 2550)).toBe(Math.round((2550 - 500) / 10) * 10);
  });
});

describe('backups and migrations', () => {
  const v1 = { v: 1, units: 'us', profile: woman, targets: { kcal: 1800, p: 140, c: 180, f: 60, waterMl: 2400 }, meals: [{ id: 'm', date: '2026-09-01', meal: 'Lunch', name: 'x', kcal: 1, p: 0, c: 0, f: 0 }], weights: [], workouts: [] };
  test('old versions are upgraded, never reset', () => {
    for (const v of [undefined, 0, 1]) {
      const d = upgrade({ ...v1, v })!;
      expect(d.v).toBe(SCHEMA);
      expect((d.meals as unknown[]).length).toBe(1);
    }
    expect(upgrade({ ...v1, v: 9 })!.v).toBe(9); // newer saves are left as they are
    expect(upgrade('nope')).toBeNull();
  });
  test('reads the old single-object backup', () => {
    const r = readBackup(JSON.stringify(v1));
    expect(r?.profiles).toHaveLength(1);
    expect(r?.profiles[0]).toMatchObject({ meals: 1, workouts: 0, from: '2026-09-01' });
  });
  test('reads the multi-profile backup and skips broken entries', () => {
    const file = { app: 'rep-and-ration', exportedAt: '2026-10-31T00:00:00Z', profiles: [{ name: 'Sam', data: v1 }, { name: 'Bad', data: { v: 2 } }] };
    const r = readBackup(JSON.stringify(file));
    expect(r?.profiles.map((p) => p.name)).toEqual(['Sam']);
    expect(r?.exportedAt).toBe('2026-10-31T00:00:00Z');
  });
  test('rejects other files', () => {
    expect(readBackup('not json')).toBeNull();
    expect(readBackup('{"hello":1}')).toBeNull();
  });
});
