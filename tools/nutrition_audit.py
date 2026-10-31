#!/usr/bin/env python3
"""Recompute every recipe's nutrition from its ingredients and compare it with the numbers shown in the app.

Run from the repo root:  python3 tools/nutrition_audit.py [--json]

Ingredient values are per 100 g, rounded from USDA FoodData Central (SR Legacy / Foundation Foods). They were entered
from reference values, NOT downloaded (FoodData Central wasn't reachable from the build environment), so treat them as
estimates and spot-check against fdc.nal.usda.gov before relying on them. Meats and grains are raw/dry unless the
recipe says cooked, matching how the recipes list them.

Columns of N: kcal, protein g, carbs g, fat g, fiber g, sodium mg, potassium mg, iron mg, vitamin B12 µg.
"""
import json, re, sys

OZ = 28.35
# (pattern, grams per unit, per-100 g values). Units: cup, tbsp, tsp, oz, each, can, scoop, clove. First match wins.
OIL = [884, 0, 0, 100, 0, 0, 0, 0, 0]
FREE = [0] * 9  # spices, salt-free herbs in small amounts, sweeteners with no calories
T = [
    (r'monk fruit|^ice$|cacao nibs', {}, FREE),
    (r'^flaky sea salt|^flaky salt$|^coarse salt', {'tsp': 3.5, 'each': 0.5}, [0, 0, 0, 0, 0, 38758, 8, 0, 0]),
    (r'^salt$', {'tsp': 6, 'each': 0.4}, [0, 0, 0, 0, 0, 38758, 8, 0, 0]),
    (r'salt and (black )?pepper to taste|flaky salt and black pepper|pinch of (salt|cinnamon|nutmeg)', {'each': 1.5}, [0, 0, 0, 0, 0, 38758, 8, 0, 0]),
    (r'pinch of salt and cinnamon', {'each': 1}, [0, 0, 0, 0, 0, 38758, 8, 0, 0]),
    (r'smoked paprika and chopped chives|sliced green onion and sesame', {'each': 3}, [300, 12, 40, 20, 20, 30, 1000, 10, 0]),
    (r'sweet potato', {'each': 285}, [86, 1.6, 20.1, 0.1, 3, 55, 337, 0.6, 0]),
    (r'bone broth or water', {'cup': 240}, [19, 4.2, 0.4, 0, 0, 200, 80, 0.2, 0]),
    (r'rolled oats', {'cup': 81}, [379, 13.2, 67.7, 6.5, 10.1, 6, 362, 4.3, 0]),
    (r'greek yogurt', {'cup': 227, 'tbsp': 14}, [97, 9, 4, 5, 0, 35, 141, 0, 0.75]),
    (r'almond milk', {'cup': 240}, [15, 0.6, 0.6, 1.1, 0.2, 60, 67, 0.3, 0]),
    (r'whole milk', {'cup': 244}, [61, 3.2, 4.8, 3.3, 0, 43, 132, 0, 0.45]),
    (r'chia', {'tbsp': 12, 'cup': 170}, [486, 16.5, 42.1, 30.7, 34.4, 16, 407, 7.7, 0]),
    (r'whey|collagen', {'scoop': 30}, [370, 85, 3, 1.5, 0, 160, 500, 1, 2]),
    (r'vanilla', {'tsp': 4.2}, [288, 0, 12.7, 0, 0, 9, 148, 0, 0]),
    (r'mixed berries', {'cup': 140}, [50, 0.8, 12, 0.3, 3, 1, 120, 0.4, 0]),
    (r'^raspberries$', {'cup': 123}, [52, 1.2, 11.9, 0.7, 6.5, 1, 151, 0.7, 0]),
    (r'smoked salmon', {'oz': OZ}, [117, 18.3, 0, 4.3, 0, 672, 175, 0.85, 3.3]),
    (r'wild salmon', {'each': 142}, [142, 21.7, 0, 5.5, 0, 50, 380, 0.5, 4]),
    (r'salmon', {'each': 142, 'oz': OZ}, [208, 20.4, 0, 13.4, 0, 59, 363, 0.34, 3.2]),
    (r'^eggs?$', {'each': 50, 'large': 50}, [143, 12.6, 0.7, 9.5, 0, 142, 138, 1.75, 0.89]),
    (r'baby spinach|^spinach', {'cup': 30, 'oz': OZ}, [23, 2.9, 3.6, 0.4, 2.2, 79, 558, 2.7, 0]),
    (r'feta', {'cup': 150}, [264, 14.2, 3.9, 21.3, 0, 917, 62, 0.65, 1.69]),
    (r'green bell pepper', {'each': 119}, [20, 0.9, 4.6, 0.2, 1.7, 3, 175, 0.3, 0]),
    (r'red bell pepper', {'each': 119, 'cup': 149}, [31, 1, 6, 0.3, 2.1, 4, 211, 0.4, 0]),
    (r'bell peppers?', {'each': 119, 'cup': 149}, [26, 1, 6, 0.2, 2, 3, 190, 0.4, 0]),
    (r'green onions?', {'cup': 100, 'each': 15}, [32, 1.8, 7.3, 0.2, 2.6, 16, 276, 1.5, 0]),
    (r'black pepper and red pepper|black pepper|pepper flakes|^paprika|smoked paprika|dried (dill|oregano|sage|thyme|rosemary)|nutmeg|turmeric|cinnamon|mustard powder|garlic powder|ground cumin', {'tsp': 2.3}, [300, 12, 55, 10, 25, 30, 1500, 20, 0]),
    (r'chili powder', {'tsp': 2.7, 'tbsp': 8}, [282, 13.5, 49.7, 14.3, 34.8, 2867, 1916, 17.3, 0]),
    (r'curry powder', {'tbsp': 6.3}, [325, 14, 55.8, 14, 53, 52, 1170, 19, 0]),
    (r'toasted sesame oil|avocado oil|olive oil|melted butter', {'tsp': 4.5, 'tbsp': 13.5}, OIL),
    (r'tallow|ghee', {'tsp': 4.3, 'tbsp': 12.8}, [900, 0, 0, 100, 0, 0, 0, 0, 0]),
    (r'peanut butter', {'tbsp': 16, 'cup': 258}, [588, 25, 20, 50, 6, 200, 649, 1.9, 0]),
    (r'almond butter', {'tbsp': 16, 'cup': 250}, [614, 21, 18.8, 55.5, 10.3, 7, 748, 3.5, 0]),
    (r'^butter$', {'tsp': 4.7, 'tbsp': 14.2}, [717, 0.9, 0.1, 81, 0, 643, 24, 0, 0.17]),
    (r'boneless skinless chicken breast', {'oz': OZ}, [120, 22.5, 0, 2.6, 0, 45, 334, 0.37, 0.21]),
    (r'bone-in skin-on chicken thighs', {'each': 115}, [221, 15.6, 0, 16.6, 0, 84, 198, 0.7, 0.4]),
    (r'chicken thighs', {'oz': OZ}, [121, 19.7, 0, 4.1, 0, 95, 242, 0.9, 0.6]),
    (r'turkey breast', {'oz': OZ}, [114, 23.7, 0, 1.5, 0, 60, 300, 0.7, 0.6]),
    (r'ground turkey', {'oz': OZ}, [150, 18.7, 0, 8.3, 0, 69, 213, 1.17, 1.06]),
    (r'80/20 ground beef', {'oz': OZ}, [254, 17.2, 0, 20, 0, 66, 270, 1.94, 2.14]),
    (r'beef liver', {'oz': OZ}, [135, 20.4, 3.9, 3.6, 0, 69, 313, 4.9, 59.3]),
    (r'flank steak', {'oz': OZ}, [165, 21, 0, 8.2, 0, 56, 330, 1.6, 2.2]),
    (r'sirloin', {'oz': OZ}, [160, 21.3, 0, 7.7, 0, 55, 340, 1.6, 1.5]),
    (r'ribeye', {'oz': OZ}, [248, 18.6, 0, 19.2, 0, 54, 300, 1.8, 2.2]),
    (r'pork tenderloin', {'oz': OZ}, [120, 21, 0, 3.5, 0, 52, 399, 1, 0.5]),
    (r'cod fillets', {'each': 170}, [82, 17.8, 0, 0.7, 0, 54, 413, 0.38, 0.91]),
    (r'shrimp', {'oz': OZ}, [85, 20.1, 0, 0.5, 0, 119, 264, 0.2, 1.1]),
    (r'tuna in water', {'can': 113}, [86, 19.4, 0, 1, 0, 247, 179, 1.6, 2.5]),
    (r'cooked brown rice', {'cup': 195}, [112, 2.3, 23.5, 0.8, 1.6, 5, 79, 0.5, 0]),
    (r'cooked (jasmine|basmati) rice', {'cup': 158}, [128, 2.7, 28, 0.3, 0.4, 1, 35, 0.2, 0]),
    (r'cooked quinoa', {'cup': 185}, [120, 4.4, 21.3, 1.9, 2.8, 7, 172, 1.5, 0]),
    (r'black beans', {'can': 250, 'cup': 172}, [91, 6, 16.6, 0.3, 6.9, 200, 300, 1.9, 0]),
    (r'cannellini', {'can': 250}, [114, 7.3, 21, 0.3, 4.8, 200, 454, 3, 0]),
    (r'chickpeas', {'can': 240}, [138, 7.05, 22.5, 2.8, 7.6, 212, 109, 1, 0]),
    (r'lentils', {'cup': 192}, [352, 24.6, 63.4, 1.1, 10.7, 6, 677, 6.5, 0]),
    (r'corn kernels', {'cup': 145}, [81, 2.6, 19, 1.2, 2.4, 1, 233, 0.5, 0]),
    (r'pico|salsa', {'cup': 200}, [20, 0.8, 4.4, 0.2, 1.2, 300, 220, 0.3, 0]),
    (r'avocados?', {'each': 150}, [160, 2, 8.5, 14.7, 6.7, 7, 485, 0.55, 0]),
    (r'^lime', {'each': 44}, [25, 0.4, 8.4, 0.1, 0.4, 2, 117, 0.1, 0]),
    (r'^lemon(?! juice)', {'each': 50}, [22, 0.4, 6.9, 0.2, 0.3, 1, 103, 0.1, 0]),
    (r'lemon juice|red wine vinegar|rice vinegar', {'tbsp': 15, 'tsp': 5}, [22, 0.4, 6.9, 0.2, 0.3, 1, 103, 0.1, 0]),
    (r'cilantro', {'cup': 16, 'tbsp': 1}, [23, 2.1, 3.7, 0.5, 2.8, 46, 521, 1.8, 0]),
    (r'parsley|basil|dill|chives|mint|rosemary|thyme', {'cup': 40, 'tbsp': 3}, [30, 3, 5, 0.7, 3, 40, 450, 4, 0]),
    (r'baby potatoes|yukon', {'oz': OZ}, [77, 2, 17.5, 0.1, 2.2, 6, 425, 0.8, 0]),
    (r'green beans', {'oz': OZ}, [31, 1.8, 7, 0.2, 2.7, 6, 211, 1, 0]),
    (r'^garlic', {'clove': 3}, [149, 6.4, 33, 0.5, 2.1, 17, 401, 1.7, 0]),
    (r'small yellow onion', {'each': 70}, [40, 1.1, 9.3, 0.1, 1.7, 4, 146, 0.2, 0]),
    (r'yellow onion', {'each': 110}, [40, 1.1, 9.3, 0.1, 1.7, 4, 146, 0.2, 0]),
    (r'red onion', {'each': 110, 'tbsp': 10}, [40, 1.1, 9.3, 0.1, 1.7, 4, 146, 0.2, 0]),
    (r'shallot', {'each': 40}, [72, 2.5, 16.8, 0.1, 3.2, 12, 334, 1.2, 0]),
    (r'crushed tomatoes', {'can': 794}, [32, 1.6, 7.3, 0.3, 1.9, 132, 293, 1.3, 0]),
    (r'diced tomatoes', {'can': 411}, [18, 0.8, 4, 0.1, 1.9, 130, 190, 0.6, 0]),
    (r'cherry tomatoes', {'cup': 149}, [18, 0.9, 3.9, 0.2, 1.2, 5, 237, 0.3, 0]),
    (r'^tomato', {'each': 123}, [18, 0.9, 3.9, 0.2, 1.2, 5, 237, 0.3, 0]),
    (r'bone broth', {'cup': 240}, [19, 4.2, 0.4, 0, 0, 200, 80, 0.2, 0]),
    (r'vegetable stock', {'cup': 240}, [5, 0.2, 1, 0, 0, 60, 30, 0, 0]),
    (r'tofu', {'oz': OZ}, [144, 17.3, 2.8, 8.7, 2.3, 14, 237, 2.7, 0]),
    (r'arrowroot', {'tbsp': 8}, [357, 0.3, 88, 0.1, 3.4, 2, 11, 0.3, 0]),
    (r'broccolini', {'oz': OZ}, [35, 3, 6, 0.3, 2.5, 30, 300, 0.8, 0]),
    (r'broccoli', {'cup': 71}, [34, 2.8, 6.6, 0.4, 2.6, 33, 316, 0.7, 0]),
    (r'snap peas', {'cup': 63}, [42, 2.8, 7.6, 0.2, 2.6, 4, 200, 2.1, 0]),
    (r'coconut aminos', {'tbsp': 15, 'cup': 240}, [100, 0, 20, 0, 0, 1800, 0, 0, 0]),
    (r'coconut sugar', {'tsp': 4, 'cup': 180}, [375, 0, 100, 0, 0, 30, 300, 0, 0]),
    (r'coconut milk', {'cup': 226}, [197, 2, 2.8, 21.3, 0, 13, 220, 3.3, 0]),
    (r'ginger', {'tsp': 2, 'tbsp': 6}, [80, 1.8, 17.8, 0.8, 2, 13, 415, 0.6, 0]),
    (r'^cucumber|english cucumber', {'each': 300, 'cup': 104}, [15, 0.65, 3.6, 0.1, 0.5, 2, 147, 0.3, 0]),
    (r'dijon', {'tsp': 5}, [100, 6, 6, 6, 3, 2400, 150, 1.5, 0]),
    (r'medium banana|ripe banana', {'each': 118}, [89, 1.1, 22.8, 0.3, 2.6, 1, 358, 0.26, 0]),
    (r'cocoa', {'tbsp': 5.4, 'cup': 86}, [228, 19.6, 57.9, 13.7, 37, 21, 1524, 13.9, 0]),
    (r'cottage cheese', {'cup': 220}, [98, 11.1, 3.4, 4.3, 0, 364, 104, 0.07, 0.43]),
    (r'baking powder', {'tsp': 4.6}, [53, 0, 28, 0, 0.2, 10600, 20, 11, 0]),
    (r'baking soda', {'tsp': 4.6}, [0, 0, 0, 0, 0, 27360, 0, 0, 0]),
    (r'carrots?', {'each': 61}, [41, 0.9, 9.6, 0.2, 2.8, 69, 320, 0.3, 0]),
    (r'celery', {'each': 40}, [14, 0.7, 3, 0.2, 1.6, 80, 260, 0.2, 0]),
    (r'^kale', {'cup': 21}, [35, 2.9, 4.4, 1.5, 4.1, 53, 348, 1.6, 0]),
    (r'butter lettuce', {'each': 160}, [13, 1.4, 2.2, 0.2, 1.1, 5, 238, 1.2, 0]),
    (r'romaine|mixed greens', {'cup': 47}, [17, 1.2, 3.3, 0.3, 2.1, 8, 247, 1, 0]),
    (r'cheddar', {'cup': 113}, [409, 23.3, 2.4, 34, 0, 653, 76, 0.16, 1.1]),
    (r'parmesan', {'cup': 100, 'tbsp': 5}, [420, 28.4, 13.9, 27.8, 0, 1804, 180, 0.9, 1.2]),
    (r'corn tortillas', {'each': 26}, [200, 5.2, 42, 2.8, 5.8, 42, 186, 1.2, 0]),
    (r'flaxseed', {'tbsp': 7}, [534, 18.3, 28.9, 42.2, 27.3, 30, 813, 5.7, 0]),
    (r'dark chocolate', {'oz': OZ}, [600, 11, 23, 49, 14, 20, 715, 11.9, 0]),
    (r'walnuts|pecans', {'tbsp': 7.5, 'cup': 117}, [654, 15.2, 13.7, 65.2, 6.7, 2, 441, 2.9, 0]),
    (r'pumpkin or hemp seeds', {'tsp': 3.3}, [559, 30, 10.7, 49, 6, 7, 809, 8.8, 0]),
    (r'hemp seeds', {'tbsp': 10}, [553, 31.6, 8.7, 48.8, 4, 5, 1200, 8, 0]),
    (r'sesame seeds', {'tsp': 3}, [573, 17.7, 23.5, 49.7, 11.8, 11, 468, 14.6, 0]),
    (r'medium zucchini', {'each': 196}, [17, 1.2, 3.1, 0.3, 1, 8, 261, 0.4, 0]),
    (r'brussels', {'oz': OZ}, [43, 3.4, 9, 0.3, 3.8, 25, 389, 1.4, 0]),
    (r'sliced almonds', {'tbsp': 6}, [579, 21.2, 21.6, 49.9, 12.5, 1, 733, 3.7, 0]),
    (r'cauliflower', {'each': 575}, [25, 1.9, 5, 0.3, 2, 30, 299, 0.4, 0]),
    (r'tahini', {'tbsp': 15}, [595, 17, 21.2, 53.8, 9.3, 115, 414, 8.95, 0]),
    (r'pine nuts', {'tbsp': 8.6}, [673, 13.7, 13.1, 68.4, 3.7, 2, 597, 5.5, 0]),
    (r'edamame', {'cup': 155}, [121, 11.9, 8.9, 5.2, 5.2, 6, 436, 2.3, 0]),
    (r'radishes', {'cup': 116}, [16, 0.7, 3.4, 0.1, 1.6, 39, 233, 0.3, 0]),
    (r'crisp apples', {'each': 182}, [52, 0.3, 13.8, 0.2, 2.4, 1, 107, 0.1, 0]),
    (r'pistachios', {'cup': 123}, [560, 20.2, 27.2, 45.3, 10.6, 1, 1025, 3.9, 0]),
    (r'olives', {'cup': 135}, [145, 1, 3.8, 15.3, 3.3, 1556, 42, 0.5, 0]),
    (r'quinoa', {'cup': 170}, [368, 14.1, 64.2, 6.1, 7, 5, 563, 4.6, 0]),
]
COMPILED = [(re.compile(p), u, v) for p, u, v in T]
NAMES = ['kcal', 'p', 'c', 'f', 'fiber', 'na', 'k', 'fe', 'b12']


def grams(q, unit, name):
    for rx, units, vals in COMPILED:
        if rx.search(name):
            u = unit or 'each'
            if u == 'oz' and 'oz' not in units:
                g = OZ
            elif u in units:
                g = units[u]
            elif u == 'large' and 'each' in units:
                g = units['each']
            else:
                return None, vals, f'no {u} size'
            return (q if q is not None else 1) * g, vals, None
    return None, None, 'unknown ingredient'


def load_recipes(path='index.html'):
    import subprocess
    js = r"""const s=require('fs').readFileSync(process.argv[1],'utf8');const a=s.indexOf('const RECIPES = [');const b=s.indexOf('\n];',a);
      const R=eval(s.slice(a+'const RECIPES = '.length,b+2));console.log(JSON.stringify(R.map(r=>({id:r.id,title:r.title,servings:r.servings,per:r.per,ing:r.ingredients}))));"""
    return json.loads(subprocess.check_output(['node', '-e', js, path]))


def audit():
    out = []
    for r in load_recipes():
        tot, missing = [0.0] * 9, []
        for q, unit, name in r['ing']:
            base = name.split(',')[0].strip().lower()
            if q is None and not re.search(r'salt|pinch|to taste', base):
                continue  # optional garnish, "to taste" herbs etc.
            g, vals, err = grams(q, unit, base)
            if err:
                missing.append(f'{name} ({err})'); continue
            for i in range(9):
                tot[i] += vals[i] * g / 100
        per = [x / r['servings'] for x in tot]
        out.append({'id': r['id'], 'title': r['title'], 'shown': r['per'], 'calc': [round(x, 1) for x in per], 'missing': missing})
    return out


if __name__ == '__main__':
    rows = audit()
    if '--json' in sys.argv:
        print(json.dumps(rows)); sys.exit()
    for x in rows:
        sh, c = x['shown'], x['calc']
        d = (c[0] - sh['kcal']) / sh['kcal'] * 100
        flag = ' <-- off >10%' if abs(d) > 10 else ''
        print(f"{x['id']:34s} shown {sh['kcal']:4d} kcal P{sh['p']:3d} C{sh['c']:3d} F{sh['f']:3d} | calc {c[0]:6.0f} P{c[1]:5.1f} C{c[2]:5.1f} F{c[3]:5.1f} ({d:+.0f}%){flag}")
        for m in x['missing']:
            print('     missing:', m)
