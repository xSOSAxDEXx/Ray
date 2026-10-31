#!/usr/bin/env python3
"""Writes docs/recipe-macro-audit.md, corrects recipes that are off by more than 10%, and refreshes RECIPE_MICRO in index.html."""
import json, re, subprocess, sys, datetime
rows = json.loads(subprocess.check_output([sys.executable, 'tools/nutrition_audit.py', '--json']))
s = open('index.html').read()
flagged = []
for r in rows:
    sh, c = r['shown'], r['calc']
    kd = abs(c[0] - sh['kcal']) / sh['kcal']
    md = [abs(c[i] - sh[k]) for i, k in ((1, 'p'), (2, 'c'), (3, 'f'))]
    big = kd > 0.10 or any(d >= 3 and d / max(sh[k], 1) > 0.10 for d, k in zip(md, ('p', 'c', 'f')))
    if big:
        flagged.append(r)
        new = {'kcal': round(c[0]), 'p': round(c[1]), 'c': round(c[2]), 'f': round(c[3]), 'fiber': round(c[4])}
        i = s.index(f"{{ id: '{r['id']}'")
        j = s.index('per: {', i); k = s.index('}', j)
        old = s[j:k + 1]
        sugar = re.search(r'sugar: (\d+)', old)
        s = s[:j] + 'per: { kcal: %d, p: %d, c: %d, f: %d, fiber: %d%s }' % (new['kcal'], new['p'], new['c'], new['f'], new['fiber'], f", sugar: {sugar.group(1)}" if sugar else '') + s[k + 1:]
        r['new'] = new
micro = {r['id']: [round(r['calc'][4], 1), round(r['calc'][5]), round(r['calc'][6]), round(r['calc'][7], 1), round(r['calc'][8], 1)] for r in rows}
line = 'let RECIPE_MICRO = ' + json.dumps(micro, separators=(',', ':')).replace('"', "'").replace("':", "': ").replace(",'", ", '") + '; // per serving, from tools/nutrition_audit.py'
s = re.sub(r"let RECIPE_MICRO = .*", line.replace('\\', '\\\\'), s, count=1)
open('index.html', 'w').write(s)
md = [f"# Recipe nutrition audit\n\nGenerated {datetime.date.today()} by `tools/nutrition_audit.py` and `tools/apply_audit.py`.\n",
      "Every recipe's calories and macros were recalculated from its ingredient list using per-100 g values rounded from USDA FoodData Central (SR Legacy / Foundation Foods).",
      "\n**Important:** FoodData Central could not be reached from the build environment, so the ingredient values were entered from reference figures and are **estimates to verify** (see the table in `tools/nutrition_audit.py`). Raw weights are used for meat, fish and grains as listed; cooking losses of fat (for example on ribeye or skin-on chicken) mean real servings may be slightly lower in fat and calories than shown.\n",
      f"\n{len(rows)} recipes checked; {len(flagged)} were off by more than 10% (calories, or protein/carbs/fat by 10% and at least 3 g) and have been corrected in the app:\n",
      "\n| Recipe | Was (kcal / P / C / F) | Now | Change in kcal |\n|---|---|---|---|"]
for r in flagged:
    sh, n = r['shown'], r['new']
    md.append(f"| {r['title']} | {sh['kcal']} / {sh['p']} / {sh['c']} / {sh['f']} | {n['kcal']} / {n['p']} / {n['c']} / {n['f']} | {n['kcal'] - sh['kcal']:+d} |")
md.append("\nAll other recipes were within 10%. Micronutrients per serving (fiber, sodium, potassium, iron, B12) shown in the app come from the same calculation.\n")
md.append("\n## What to verify\n\n- Branded items vary: protein powder, broth, canned beans (sodium), smoked salmon and olives (sodium), coconut aminos.\n- Optional or to-taste ingredients (sweetener, garnish, pepper) are not counted.\n- Values are per serving as written; changing the servings scales them.\n")
open('docs/recipe-macro-audit.md', 'w').write('\n'.join(md))
print(len(rows), 'recipes;', len(flagged), 'corrected:', ', '.join(r['id'] for r in flagged))
