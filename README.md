# Rep & Ration

A diet and exercise website with recipes, workout plans and a daily tracker. It is one static file (`index.html`) and needs no server, build step or account.

## What's in it

| Section | What it does |
|---|---|
| **Today** | Calorie ring, protein/carb/fat progress, a water glass that fills as you drink (+12, +24, +36 oz or a custom amount) with a celebration when you hit your goal, this week's workouts, weight trend, next workout |
| **Recipes** | 37 recipes with per-serving macros (including sugar), a servings scaler, step-by-step method and tips. Filter by meal or tag (high protein, sugar free, whole foods, minimally processed, vegetarian, vegan, low carb, meal prep), or search by ingredient. Each recipe has a drawn illustration you can replace with your own photo, and you can **add your own recipes** (ingredients, method, macros, tags) that work everywhere the built-in ones do |
| **Meal plan** | A weekly planner: pick a recipe for breakfast, lunch, dinner and a snack each day, see daily calories and macros against your target, auto-fill empty slots, send the whole week to the shopping list (with servings to cook) and log today's plan in one tap |
| **Shopping list** | Add recipes with the servings you need. Ingredients are merged and totaled across recipes, rounded up to whole items, grouped by store section, and can be ticked off or copied as text. You can also add your own items |
| **Workouts** | 16 plans from beginner to advanced, 12 of them needing little or no equipment (bodyweight, one dumbbell, a resistance band, a pull-up bar, or three 30-minute kettlebell-only HIIT plans). Plans are sorted easiest to hardest (or the reverse) and can be filtered by difficulty and muscle group. Tell it what equipment you have (dumbbells, kettlebell, bench, bands, pull-up bar, barbell, cables, leg machines) and it only shows plans you can do. Includes a live session mode with set check-offs and a rest timer. **Create your own plans** with any number of days and exercises. **Workout reminders**: pick training days, a time and an alert, then add them to your phone or computer calendar as a recurring event; Today flags your training days |
| **Log** | Add food or recipe servings, weight and water for any day. Shows a 30-day weight chart, 7-day calorie chart and workout history |
| **Progress** | Body measurements (waist, hips, chest, arm, thigh, neck) with trend cards, an estimated body fat % (US Navy tape method), and progress photos with a side-by-side before/after view |
| **Targets** | Calorie and macro calculator (Mifflin-St Jeor), goal setting, US/metric units, backup and restore, clear data |

## Run it locally

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
```

Then visit http://localhost:8000.

## Deploy

Upload `index.html` to any static host, such as GitHub Pages, Netlify, Vercel or Cloudflare Pages.

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
