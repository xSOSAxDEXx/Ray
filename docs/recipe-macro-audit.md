# Recipe nutrition audit

Generated 2026-10-31 by `tools/nutrition_audit.py` and `tools/apply_audit.py`.

Every recipe's calories and macros were recalculated from its ingredient list using per-100 g values rounded from USDA FoodData Central (SR Legacy / Foundation Foods).

**Important:** FoodData Central could not be reached from the build environment, so the ingredient values were entered from reference figures and are **estimates to verify** (see the table in `tools/nutrition_audit.py`). Raw weights are used for meat, fish and grains as listed; cooking losses of fat (for example on ribeye or skin-on chicken) mean real servings may be slightly lower in fat and calories than shown.


52 recipes checked; 12 were off by more than 10% (calories, or protein/carbs/fat by 10% and at least 3 g) and have been corrected in the app:


| Recipe | Was (kcal / P / C / F) | Now | Change in kcal |
|---|---|---|---|
| Turkey & Black Bean Chili | 385 / 32 / 36 / 12 | 340 / 31 / 29 / 13 | -45 |
| Mediterranean Tuna & White Bean Salad | 425 / 39 / 40 / 11 | 364 / 33 / 34 / 12 | -61 |
| Chocolate PB Recovery Smoothie | 380 / 31 / 37 / 13 | 371 / 34 / 39 / 13 | -9 |
| Shrimp Fajita Sheet Pan | 310 / 31 / 34 / 7 | 321 / 35 / 33 / 7 | +11 |
| Cottage Cheese Berry Parfait | 300 / 31 / 14 / 13 | 318 / 27 / 17 / 16 | +18 |
| Black Bean & Egg Breakfast Tacos | 555 / 31 / 44 / 29 | 518 / 30 / 38 / 28 | -37 |
| Lemon-Dill Tuna Stuffed Avocados | 415 / 35 / 16 / 25 | 385 / 29 / 16 / 25 | -30 |
| Dark Chocolate Avocado Mousse | 196 / 3 / 11 / 17 | 176 / 3 / 11 / 16 | -20 |
| Butter-Basted Ribeye | 597 / 41 / 0 / 48 | 722 / 42 / 0 / 61 | +125 |
| Crispy-Skin Salmon in Brown Butter | 367 / 31 / 0 / 27 | 430 / 35 / 0 / 31 | +63 |
| Beef & Liver Burgers | 268 / 28 / 1 / 16 | 336 / 25 / 1 / 25 | +68 |
| Crispy Salt-Roasted Chicken Thighs | 458 / 46 / 0 / 30 | 518 / 36 / 0 / 39 | +60 |

All other recipes were within 10%. Micronutrients per serving (fiber, sodium, potassium, iron, B12) shown in the app come from the same calculation.


## What to verify

- Branded items vary: protein powder, broth, canned beans (sodium), smoked salmon and olives (sodium), coconut aminos.
- Optional or to-taste ingredients (sweetener, garnish, pepper) are not counted.
- Values are per serving as written; changing the servings scales them.

## November 2026: 16 new recipes

These were written for HEALTH-RAY and calculated with the same tool, so their numbers match the ingredient list exactly. Three ingredients were added to the tool's table (pears, boneless pork chops, 90% lean ground beef), also as reference values to verify.

| Recipe | kcal / P / C / F per serving |
|---|---|
| Black Bean & Sweet Potato Tacos | 385 / 10 / 67 / 11 |
| Turmeric Tofu Scramble | 442 / 37 / 16 / 30 |
| Crispy Chickpea & Quinoa Power Bowls | 456 / 18 / 64 / 16 |
| Red Lentil Coconut Dal | 553 / 24 / 82 / 17 |
| Crispy Roasted Chickpeas | 213 / 9 / 28 / 8 |
| Apple Slices with Almond Butter & Hemp | 297 / 9 / 30 / 19 |
| Classic Hummus & Veggie Plate | 240 / 7 / 23 / 15 |
| Chocolate Banana Nice Cream | 165 / 4 / 30 / 6 |
| Cinnamon Walnut Baked Pears | 209 / 4 / 30 / 10 |
| Butter-Seared Pork Chops | 452 / 35 / 0 / 34 |
| Bone Broth Egg Drop Soup | 336 / 33 / 3 / 21 |
| Korean-Style Beef Rice Bowls | 435 / 27 / 44 / 16 |
| Thai Basil Chicken | 454 / 42 / 40 / 13 |
| Banana Oat Breakfast Cookies | 270 / 9 / 29 / 15 |
| Sheet-Pan Chicken Shawarma Plates | 457 / 41 / 31 / 18 |
| Glazed Salmon & Avocado Rice Bowls | 722 / 44 / 54 / 38 |
