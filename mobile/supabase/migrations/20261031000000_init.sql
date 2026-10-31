-- Rep & Ration: initial schema. Every table is owned per user and protected by row-level security (RLS),
-- so a signed-in user can only read and write their own rows. Run with `supabase db push` or paste into the SQL editor.

create table if not exists public.profiles (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  units      text not null default 'us' check (units in ('us', 'metric')),
  profile    jsonb not null,            -- { sex, age, heightCm, weightKg, activity, goal }
  targets    jsonb not null,            -- { kcal, p, c, f, waterMl, workoutsWeek, minutesWeek }
  updated_at timestamptz not null default now()
);

create table if not exists public.meals (
  id      text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  date    date not null,
  meal    text not null,
  name    text not null,
  kcal    integer not null check (kcal >= 0),
  p       numeric not null default 0 check (p >= 0),
  c       numeric not null default 0 check (c >= 0),
  f       numeric not null default 0 check (f >= 0),
  qty     numeric not null default 1 check (qty > 0),
  mic     jsonb,                        -- [fiber g, sodium mg, potassium mg, iron mg, B12 µg] per portion
  primary key (user_id, id)
);
create index if not exists meals_user_date on public.meals (user_id, date);

create table if not exists public.weigh_ins (
  user_id uuid not null references auth.users (id) on delete cascade,
  date    date not null,
  kg      numeric not null check (kg > 0 and kg < 500),
  primary key (user_id, date)
);

create table if not exists public.water (
  user_id uuid not null references auth.users (id) on delete cascade,
  date    date not null,
  ml      integer not null check (ml >= 0),
  primary key (user_id, date)
);

create table if not exists public.workouts (
  id      text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  date    date not null,
  plan_id text not null,
  day_idx integer not null,
  minutes integer not null check (minutes >= 0),
  sets    integer not null default 0,
  total   integer not null default 0,
  detail  jsonb,                        -- full workout snapshot (exercises, sets, weights) as saved by the app
  primary key (user_id, id)
);
create index if not exists workouts_user_date on public.workouts (user_id, date);

-- Row-level security: owner-only access on every table.
do $$
declare t text;
begin
  foreach t in array array['profiles', 'meals', 'weigh_ins', 'water', 'workouts'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "own rows: select" on public.%I', t);
    execute format('drop policy if exists "own rows: insert" on public.%I', t);
    execute format('drop policy if exists "own rows: update" on public.%I', t);
    execute format('drop policy if exists "own rows: delete" on public.%I', t);
    execute format('create policy "own rows: select" on public.%I for select to authenticated using ((select auth.uid()) = user_id)', t);
    execute format('create policy "own rows: insert" on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)', t);
    execute format('create policy "own rows: update" on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t);
    execute format('create policy "own rows: delete" on public.%I for delete to authenticated using ((select auth.uid()) = user_id)', t);
  end loop;
end $$;
