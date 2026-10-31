// Data shapes shared with the web app (index.html). Field names match the web backup file so imports need no mapping.

export type Sex = 'male' | 'female';
export type Goal = 'lose' | 'maintain' | 'gain';
export type Units = 'us' | 'metric';

export interface Profile {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  /** Activity multiplier: 1.2 sedentary … 1.9 athlete. */
  activity: number;
  goal: Goal;
}

export interface Targets {
  kcal: number;
  p: number;
  c: number;
  f: number;
  waterMl: number;
  workoutsWeek: number;
  minutesWeek: number;
}

export interface Macros {
  kcal: number;
  p: number;
  c: number;
  f: number;
}

export interface Meal extends Macros {
  id: string;
  /** Local date, YYYY-MM-DD. */
  date: string;
  meal: string;
  name: string;
  qty?: number;
  base?: Macros;
  portion?: string;
  /** [fiber g, sodium mg, potassium mg, iron mg, B12 µg] per base portion. */
  mic?: number[];
}

export interface WeighIn {
  date: string;
  kg: number;
}

export interface Workout {
  id: string;
  date: string;
  planId: string;
  dayIdx: number;
  minutes: number;
  sets: number;
  total: number;
  kcal?: number;
}

/** One person's saved data, as stored by the web app under localStorage 'rep-ration-v1'. */
export interface AppData {
  v: number;
  units: Units;
  profile: Profile;
  targets: Targets;
  meals: Meal[];
  weights: WeighIn[];
  workouts: Workout[];
  /** Millilitres of water per date. */
  water: Record<string, number>;
  [key: string]: unknown;
}
