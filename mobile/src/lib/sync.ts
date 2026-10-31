// Sync to Supabase. Each table row belongs to auth.uid() and row-level security (supabase/migrations) stops anyone
// reading or writing another user's rows. Local data stays the source of truth; this is a simple last-write-wins upload.
import type { AppData } from '../core/types';
import { supabase } from './supabase';

let timer: ReturnType<typeof setTimeout> | null = null;

/** Debounced upload of the whole dataset for the signed-in user. Does nothing when signed out or not configured. */
export function pushAll(d: AppData): Promise<void> {
  if (!supabase) return Promise.resolve();
  if (timer) clearTimeout(timer);
  return new Promise((resolve) => {
    timer = setTimeout(async () => {
      try {
        const { data: auth } = await supabase!.auth.getUser();
        const user = auth.user;
        if (!user) return resolve();
        await supabase!.from('profiles').upsert({ user_id: user.id, units: d.units, profile: d.profile, targets: d.targets, updated_at: new Date().toISOString() });
        if (d.meals.length) await supabase!.from('meals').upsert(d.meals.map((m) => ({ id: m.id, user_id: user.id, date: m.date, meal: m.meal, name: m.name, kcal: m.kcal, p: m.p, c: m.c, f: m.f, qty: m.qty ?? 1, mic: m.mic ?? null })));
        if (d.weights.length) await supabase!.from('weigh_ins').upsert(d.weights.map((w) => ({ user_id: user.id, date: w.date, kg: w.kg })), { onConflict: 'user_id,date' });
        const water = Object.entries(d.water).map(([date, ml]) => ({ user_id: user.id, date, ml }));
        if (water.length) await supabase!.from('water').upsert(water, { onConflict: 'user_id,date' });
        if (d.workouts.length) await supabase!.from('workouts').upsert(d.workouts.map((w) => ({ id: w.id, user_id: user.id, date: w.date, plan_id: w.planId, day_idx: w.dayIdx, minutes: w.minutes, sets: w.sets, total: w.total, detail: w })));
      } catch { /* offline: the next change retries */ }
      resolve();
    }, 1500);
  });
}
