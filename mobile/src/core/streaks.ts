// Streaks, matching the web app: weekly-goal streak on Analytics and the daily logging streak.
import { addDays, mondayOf } from './dates';
import type { Meal, Targets, Workout } from './types';

export interface WeekSummary { monday: string; workouts: number; minutes: number; hit: boolean }

/** The last `weeks` weeks (oldest first, current week last) against the weekly goal. */
export function weekSummaries(workouts: Workout[], t: Pick<Targets, 'workoutsWeek' | 'minutesWeek'>, today: string, weeks = 12): WeekSummary[] {
  const thisMon = mondayOf(today);
  return Array.from({ length: weeks }, (_, i) => {
    const m = addDays(thisMon, (i - (weeks - 1)) * 7), e = addDays(m, 6);
    const l = workouts.filter((w) => w.date >= m && w.date <= e);
    const minutes = l.reduce((a, w) => a + (w.minutes || 0), 0);
    return { monday: m, workouts: l.length, minutes, hit: l.length >= t.workoutsWeek && minutes >= t.minutesWeek };
  });
}

/** Consecutive weeks hitting the goal, counting back from the most recent. The current week counts only once it's hit,
 *  and an unfinished current week doesn't break the streak. */
export function weeklyStreak(weeks: WeekSummary[]): number {
  let streak = 0;
  for (let i = weeks.length - 1; i >= 0; i -= 1) {
    if (weeks[i].hit) streak += 1;
    else if (i < weeks.length - 1) break;
  }
  return streak;
}

/** Consecutive days (ending today, or yesterday if nothing is logged yet today) with any food logged. */
export function loggingStreak(meals: Meal[], today: string): number {
  const days = new Set(meals.map((m) => m.date));
  let k = days.has(today) ? today : addDays(today, -1), n = 0;
  while (days.has(k)) { n += 1; k = addDays(k, -1); }
  return n;
}
