# Rep & Ration

A diet and exercise website with recipes, workout plans and a daily tracker. It is one static file (`index.html`) and needs no server, build step or account.

## What's in it

| Section | What it does |
|---|---|
| **Today** | Calorie ring, protein/carb/fat progress, a water glass that fills as you drink (+12, +24, +36 oz or a custom amount) with a celebration when you hit your goal, this week's workouts, weight trend, next workout |
| **Recipes** | 37 recipes, grouped into Snacks, Breakfast, Lunch and Dinner with quick-jump links, with per-serving macros (including sugar), a servings scaler, step-by-step method and tips. Filter by meal or tag (high protein, sugar free, whole foods, minimally processed, vegetarian, vegan, low carb, meal prep), or search by ingredient. Each recipe has a drawn illustration you can replace with your own photo, and you can **add your own recipes** (ingredients, method, macros, tags) that work everywhere the built-in ones do. Tap ♡ to save **favorites** and filter by them. Choose **Stovetop, Oven, Air fryer or Microwave** and every cooked recipe switches to written steps and times for that appliance; recipes an appliance doesn't suit say why and can be hidden |
| **Meal plan** | A weekly planner: pick a recipe for breakfast, lunch, dinner and a snack each day, see daily calories and macros against your target, auto-fill empty slots, send the whole week to the shopping list (with servings to cook) and log today's plan in one tap |
| **Shopping list** | Add recipes with the servings you need. Ingredients are merged and totaled across recipes, rounded up to whole items, grouped by store section, and can be ticked off or copied as text. You can also add your own items |
| **Workouts** | 16 plans from beginner to advanced, 12 of them needing little or no equipment (bodyweight, one dumbbell, a resistance band, a pull-up bar, or three 30-minute kettlebell-only HIIT plans). Plans are sorted easiest to hardest (or the reverse) and can be filtered by difficulty and muscle group. Tell it what equipment you have (dumbbells, kettlebell, bench, bands, pull-up bar, barbell, cables, leg machines) and it only shows plans you can do. Includes a live session mode with set check-offs, a rest timer, and a box under each set to record the reps (or seconds) you actually did. **Create your own plans** with any number of days and exercises. **Workout reminders**: pick training days, a time and an alert, then add them to your phone or computer calendar as a recurring event; Today flags your training days. Favorite plans with ♡ and filter by them. Every plan shows an **estimated calories and fat burned** per session, personalised from your weight, height, sex and age (MET × Mifflin-St Jeor resting rate; fat shown as body-fat equivalent at 7.7 kcal/g). Live sessions, logged workouts and the weekly total on Today show it too |
| **Log** | Add food or recipe servings, weight and water for any day. Shows a 30-day weight chart, 7-day calorie chart and workout history |
| **Progress** | Body measurements (waist, hips, chest, arm, thigh, neck) with trend cards, an estimated body fat % (US Navy tape method), and progress photos with a side-by-side before/after view |
| **Analytics** | Built from your workout log: workouts, active time, calories burned, total weight lifted and new personal bests for the last 4 weeks, 12 weeks or all time, compared with the period before. Weekly bars against your goal with a streak count. Per-exercise strength charts (weight used and estimated 1-rep max, or reps for bodyweight moves) and a personal records table. Cardio trends (session length and time spent working). Weight trend plus estimated lean vs fat mass from your measurements, to show muscle gain |
| **Profile & goals** | Calorie and macro calculator (Mifflin-St Jeor), goal setting, a **weekly training goal** (workouts and active minutes per week, shown on Today and in Analytics), a default serving size (2 people unless changed) used by recipes, the shopping list and the meal planner, US/metric units, backup and restore, clear data |

## Use it on your phone

Open https://xsosaxdex.github.io/Ray/ on your phone, then add it to your home screen. It gets its own icon, opens full-screen without the browser bar, and works offline once it has been opened.

- **iPhone (Safari):** tap Share, then **Add to Home Screen**.
- **Android (Chrome):** tap **⋮**, then **Install app** (or **Add to Home screen**).

Your entries stay on that phone. To move them from another device, use a backup (see Data below).

## Run it locally

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
```

Then visit http://localhost:8000.

## Deploy

Upload `index.html`, `manifest.webmanifest`, `sw.js` and the `icons/` folder to any static host, such as GitHub Pages, Netlify, Vercel or Cloudflare Pages.

## Data

Each visitor's entries are saved in their own browser (`localStorage` key `rep-ration-v1`). Progress photos and recipe photos are shrunk to at most 1200px and stored in IndexedDB (`rep-ration-photos`), because they're too large for localStorage. Nothing is sent to a server, so data does not sync between devices. To move a log to another browser, use **Targets → Download backup**, then **Restore from backup** on the other device. Backups contain everything except photos. On the first visit the site shows clearly labelled example data, which can be cleared with one click.

## Editing content

Recipes and workout plans are plain arrays at the top of the `<script>` in `index.html` (`RECIPES` and `PLANS`). To add one, copy an existing entry and change it. Macros are per serving. A recipe can take an optional `photo` URL, which replaces its illustration (users can also add their own recipes and plans from the site).

The diet tags follow simple rules, explained on the Recipes page when a filter is selected:

- **Sugar free**: no sugar, honey, syrups, sweeteners or fruit; 8 g or less of naturally occurring sugar per serving.
- **Whole foods**: only unprocessed, single-ingredient foods. Give these recipes the Minimally processed tag as well.
- **Minimally processed**: whole foods plus a few clean staples (canned beans, tuna and tomatoes, broth, light coconut milk, corn tortillas, Dijon, unsweetened protein powder).

## Ideas for later

- Accounts and cloud sync (e.g. Supabase or Firebase)
- More recipes and plans
