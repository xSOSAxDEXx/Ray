# Rep & Ration

A diet and exercise website with recipes, workout plans and a daily tracker. It is one static file (`index.html`) and needs no server, build step or account.

## What's in it

| Section | What it does |
|---|---|
| **Today** | Calorie ring, protein/carb/fat progress, water, this week's workouts, weight trend, next workout |
| **Recipes** | 17 recipes with per-serving macros, a servings scaler, step-by-step method and tips. Filter by meal or tag (vegetarian, vegan, low carb, high protein, meal prep), or search by ingredient |
| **Shopping list** | Add recipes with the servings you need. Ingredients are merged and totaled across recipes, rounded up to whole items, grouped by store section, and can be ticked off or copied as text. You can also add your own items |
| **Workouts** | 6 plans: Foundations Full Body (beginner), Upper/Lower Strength (intermediate), Push/Pull/Legs (advanced), Home Bodyweight Circuit, Walk to 5K, and Mobility & Core Reset. Includes a live session mode with set check-offs and a rest timer |
| **Log** | Add food or recipe servings, weight and water for any day. Shows a 30-day weight chart, 7-day calorie chart and workout history |
| **Targets** | Calorie and macro calculator (Mifflin-St Jeor), goal setting, US/metric units, clear data |

## Run it locally

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
```

Then visit http://localhost:8000.

## Deploy

Upload `index.html` to any static host, such as GitHub Pages, Netlify, Vercel or Cloudflare Pages.

## Data

Each visitor's entries are saved in their own browser (`localStorage` key `rep-ration-v1`). Nothing is sent to a server, so data does not sync between devices. On the first visit the site shows clearly labelled example data, which can be cleared with one click.

## Editing content

Recipes and workout plans are plain arrays at the top of the `<script>` in `index.html` (`RECIPES` and `PLANS`). To add one, copy an existing entry and change it. Macros are per serving.

## Ideas for later

- Accounts and cloud sync (e.g. Supabase or Firebase)
- More recipes and plans
- Progress photos and body measurements
