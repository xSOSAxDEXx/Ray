# Rep & Ration mobile (Expo)

The first screens of the native app: **Today**, **Log** and **Targets**, plus importing a backup from the website and optional accounts with Supabase. See `PLAN.md` for the structure and data model.

## Run it

```bash
cd mobile
npm install
npm test            # unit tests for the calorie, macro and streak math
npm run typecheck
npx expo start      # then open in a development build or a simulator
```

This project uses **development builds**, not Expo Go:

```bash
npx eas-cli build --profile development --platform ios     # or android
```

## Accounts and sync (optional)

1. Create a project at supabase.com.
2. Run `supabase/migrations/20261031000000_init.sql` in its SQL editor (or `supabase db push`). It creates the tables and the row-level security policies.
3. Create `mobile/.env.local`:

   ```
   EXPO_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

Without these the app works fully offline and the Account screen explains how to connect.

## Move your history from the website

On the website open **Settings → Your data → Download backup**, put the file on your phone, then tap **Import web backup** on Today.
