# Rep & Ration mobile: structure and data model

This is the Phase 5 proposal from the roadmap. It was approved automatically while the owner was away (see the pull request), so treat it as the starting point and change anything that doesn't fit.

## Stack

- **Framework:** Expo SDK 58 with Expo Router (file-based routes in `src/app`), React Native 0.88, TypeScript (strict).
- **Builds:** development builds with EAS (`npx eas-cli build --profile development`), not Expo Go, so native modules such as HealthKit can be added later.
- **Backend:** Supabase for email/password auth and Postgres with row-level security. The app stays fully usable offline: data is saved on the phone first (AsyncStorage) and uploaded when signed in.
- **Tests:** Jest via `jest-expo`, focused on the shared calculations.

## Folders

```
mobile/
  src/
    app/                 screens (Expo Router)
      _layout.tsx        root stack + data provider
      (tabs)/            Today, Log, Targets
      import.tsx         import a web backup file
      account.tsx        sign up / sign in / sign out
    core/                pure TypeScript, no React: shared with (and ported from) the web app
      targets.ts         Mifflin-St Jeor, protein, water (calcTargets, waterFor)
      macros.ts          totals, portion scaling, micronutrient totals
      streaks.ts         weekly-goal and logging streaks
      adaptive.ts        adaptive calorie target
      backup.ts          web backup reader + versioned migrations
      __tests__/         unit tests for all calorie, macro and streak math
    lib/                 app services: store (local + sync), Supabase client, UI kit
  supabase/migrations/   SQL schema with RLS
```

Screens never compute nutrition themselves. They call `src/core`, which mirrors the web app's functions with the same names, so a fix in one place can be copied to the other.

## Data model

The phone keeps the same JSON shape as the web app's saved data (`AppData` in `src/core/types.ts`), so web backups import with no conversion. In Supabase the same data is split into tables, each keyed by `user_id`:

| Table | Key | Holds |
|---|---|---|
| `profiles` | user_id | units, profile (sex, age, height, weight, activity, goal), targets |
| `meals` | user_id + id | date, meal, name, kcal, protein, carbs, fat, quantity, micronutrients |
| `weigh_ins` | user_id + date | kg |
| `water` | user_id + date | ml |
| `workouts` | user_id + id | date, plan, day, minutes, sets, plus the full workout snapshot as JSON |

Every table has row-level security policies so a user can only select, insert, update or delete rows where `user_id = auth.uid()`.

**Sync:** last write wins, uploading changes about 1.5 s after the last edit. That's fine for one person on one phone. Before a second device is supported, add `updated_at` per row and a download-and-merge step.

## Done in this phase

- Scaffold, routes, the Today, Log and Targets screens, and the web backup import.
- Supabase auth screen and client, with the SQL schema and RLS.
- 21 unit tests for targets, macros, streaks, the adaptive target and backup migrations.
- A planning doc for health-platform integration (`../docs/HEALTH.md`).

## Not done yet

- Recipes, workouts, Breathe/Mind and the shopping list (port from the web app next).
- Pulling data down from Supabase to a fresh phone (upload only for now).
- Editing age, height and weight on the phone (comes over with a backup).
- App icons, store listings and privacy labels.
