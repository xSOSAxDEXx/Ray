# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

HEALTH-RAY is a diet, fitness and breathing web app. The website is **one static file, `index.html`** (HTML, CSS and one script), with `sw.js` (offline cache) and `manifest.webmanifest`. There is no build step, no package manager and no server. GitHub Pages serves `main`. `mobile/` is a separate Expo + TypeScript app that shares the data format (see `mobile/AGENTS.md` and `mobile/README.md`).

The app was originally called "Rep & Ration". **Never rename these:**
- the storage keys `rep-ration-v1`, `rep-ration-profiles` and `rep-ration-photos`;
- the backup marker `app: 'rep-and-ration'`.

Users' saved data and old backup files depend on them. Visible text says HEALTH-RAY, and the mobile ID is `com.healthray.app`.

## Commands

```bash
python3 -m http.server 8765        # serve the site; smoke.js expects this port (override with URL=...)
node tests/smoke.js                # Playwright: every page in VIEWS, 4 saved-data states, 375 and 1280 px
node tests/library.js              # every plan exercise matches an exercise-library entry
node tests/progression.js          # starting weights and next-step advice for sample people and past sets
python3 tools/nutrition_audit.py   # recompute recipe macros from ingredients; flags anything more than 10% off
python3 tools/apply_audit.py       # rewrites docs/recipe-macro-audit.md, fixes off recipes, refreshes RECIPE_MICRO
```

- Playwright and Chromium are already installed. There's no lint step.
- There's no single-test filter. To smoke-test a new page, add its hash to `VIEWS` in `tests/smoke.js`.
- Mobile (needs npm packages): `cd mobile && npm test`, `npm run typecheck`. Use `npx expo install` to add packages, never `npm install <pkg>`.

When you change any shipped file, bump `CACHE` in `sw.js` (e.g. `healthray-v23` → `v24`).

## Architecture of `index.html`

The script is one IIFE, split into sections marked `/* ---------- Name ---------- */`. Search for these markers to find your way around.

- **Content first:**
  - `RECIPES`, `PLANS`, `EX_LIB` (exercise library) and `EX_DEMO` (pose keyframes for the cartoon demos) are plain data arrays at the top.
  - The breath and mind content sits further down.
  - `libFor(name)` maps a plan's exercise name to its library entry using regexes (`EX_MATCH`).
- **State (`S`):**
  - One object, loaded from `localStorage` and written with `save()`.
  - `SCHEMA` and `MIGRATIONS` in `upgrade()` handle versioned upgrades. `migrate()` repairs missing or damaged fields from `DEFAULTS()`, so add new state there.
  - Profiles: profile `p1` uses `rep-ration-v1`, and other profiles use `rep-ration-v1:<id>`.
  - Photos live in IndexedDB.
  - The smoke test loads old-format and damaged data, so new fields must tolerate being missing.
- **Routing:**
  - Routing is by hash. `renderView()` is a long `if` chain mapping a hash (`today`, `recipe-<id>`, `plan-<id>`, `ex-<id>`, `breath-<id>`…) to a `view*()` function that returns an HTML string, which is put into `#app`.
  - `render()` wraps it in an error screen.
  - While `S.setup === false`, every route shows the setup screen.
  - `trackBack()`, `backTop()` and `backBtn()` provide the "← Back to…" buttons. Links in the header, footer or `#bnav` tab bar count as menu navigation and reset them.
- **Actions:**
  - Clicks are handled by one delegated listener using `data-act="name"` (plus `data-i`, `data-v`, …).
  - Handlers usually change `S`, then call `save()` and `render(true)` (the `true` keeps the scroll position).
  - Form fields are handled by a delegated `change` listener.
- **Rendering conventions:**
  - Wrap any user or content text with `esc()`.
  - Colors come from CSS tokens on `:root`, with dark-mode overrides.
  - Units: values are stored in kg/ml, and `showW()`, `wUnit()` and `us()` convert them for display.
- **Derived recipe info:**
  - Allergens, the "check the label" list (`allergenChecks`), the food-safety box (`safetyOf`), cost, equipment and gluten- or soy-free status are worked out from ingredient text by regex. They aren't stored, so users' own recipes get them too.
  - Each recipe has per-appliance methods (`COOK`, `methodFor`).
- **Workouts:**
  - Live sessions are `S.session`.
  - `startWeight()` suggests cautious first weights from the profile (`profile.exp` is strength-training experience). `nextStep()` gives progression advice: about 10% at a time, 2 extra reps earn a bigger dumbbell or kettlebell jump, and the weight holds after a set rated 9 or 10.
  - `loadKind()` decides whether an exercise is loaded as a barbell, each dumbbell, one weight, a kettlebell or a machine.
- **Exercise demos:**
  - These are SVG drawings made at runtime from `EX_DEMO` keyframes: forward kinematics, two-joint IK for planted hands and feet, and Catmull-Rom timing.
  - They animate with `requestAnimationFrame`, started by `demoStart()` at the end of `renderView`.
- **Optional services (off by default):**
  - "Send list to Instacart" calls the Supabase Edge Function `mobile/supabase/functions/instacart-list` (setup in `docs/INSTACART.md`). It's off until `INSTACART_FN` is set, and the function refuses every request unless `ALLOWED_ORIGINS` is set.
  - Social sharing is link-based (`docs/SOCIAL.md`).

`tests/library.js` and `tests/progression.js` don't run the page. They cut source out of `index.html` by text markers (`const PLANS = [`, `const EX_LIB = [` … `const exCacheLib`, `function nextStep(`, etc.) and `eval` it. If you rename or reorder those declarations, update the tests.

## Content rules

The recipe standards are in the README's "Editing content" section and are enforced by hand:
- no seed oils;
- full-fat dairy;
- arrowroot, not cornstarch;
- coconut aminos, not soy;
- unflavored whey only.

Other rules:
- **Tags:** "Sugar free", "Whole foods" and "Minimally processed" have defined meanings. "High protein" needs at least 10 g per serving. Vegetarian recipes must not use collagen or bone broth.
- **Nutrition:** values come from `tools/nutrition_audit.py`'s ingredient table. These are reference estimates, not USDA downloads. When you add a recipe, make sure the audit stays within 10%, and add any new ingredient to the table `T`.
- **Food safety:** every method that cooks meat, fish or eggs must state the FoodSafety.gov temperature (poultry 165°F, ground meat 160°F, whole cuts and fish 145°F).
- **Plans:** every exercise must match a library entry, or `tests/library.js` fails. New plans also need an entry in `PLAN_MET`.
- **Help pages:** when you add a feature, update the Guide (`viewGuide`), the Links & facts page (`#sources`) and the README.
