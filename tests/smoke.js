// Smoke test: every page must render with fresh, old-format and damaged saved data.
// Run: python3 -m http.server 8765 (from the repo root), then: node tests/smoke.js
const { chromium } = require('playwright');
const URL = process.env.URL || 'http://localhost:8765/';
const KEY = 'rep-ration-v1';
const VIEWS = ['today', 'recipes', 'recipe-lemon-herb-salmon', 'mealplan', 'shopping', 'workouts', 'plan-foundations', 'session',
  'log', 'progress', 'analytics', 'goals', 'settings', 'recipe-new', 'plan-new', 'breathe', 'breath-box', 'breath-power', 'mind', 'mind-iron-holds', 'recipe-beef-liver-burgers', 'recipe-avocado-chocolate-mousse', 'plan-rower-intervals', 'plan-zone2-base'];
const STATES = {
  'fresh visitor': null,
  'saved before weekly goals and per-set reps': { v: 1, example: false, units: 'us',
    profile: { sex: 'male', age: 40, heightCm: 180, weightKg: 90, activity: 1.55, goal: 'gain' },
    targets: { bmr: 1800, tdee: 2700, kcal: 3000, p: 180, c: 300, f: 90, waterMl: 3000 },
    meals: [], weights: [], water: {}, measures: [], activePlan: 'foundations',
    workouts: [{ id: 'a1', date: '2026-01-05', planId: 'foundations', dayIdx: 0, minutes: 40, sets: 12, total: 15, loads: { 0: '30' } }],
    session: { planId: 'foundations', dayIdx: 1, started: Date.now(), checks: { '0-0': true }, loads: {} },
    shopping: { recipes: [{ id: 'chicken-burrito-bowls', servings: 2 }], checked: {}, extras: [] } },
  'damaged fields': { v: 1, units: 'metric', meals: 'oops', workouts: [null, { date: 5 }], shopping: [], favs: null, settings: 'dark',
    stores: { list: 'bad' }, session: { planId: 'missing', dayIdx: 0, checks: {} } }
};
(async () => {
  const browser = await chromium.launch();
  let failures = 0;
  for (const [name, state] of Object.entries(STATES)) {
    for (const width of [375, 1280]) {
      const ctx = await browser.newContext({ viewport: { width, height: 800 }, serviceWorkers: 'block' });
      const page = await ctx.newPage();
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.goto(URL + 'manifest.webmanifest');
      if (state) await page.evaluate(([k, s]) => localStorage.setItem(k, JSON.stringify(s)), [KEY, state]);
      for (const view of VIEWS) {
        await page.goto(URL + '#' + view);
        await page.waitForTimeout(100);
        const r = await page.evaluate(() => ({ text: document.querySelector('#app').innerText, sw: document.documentElement.scrollWidth }));
        const problem = r.text.trim().length < 40 ? 'empty' : /Something went wrong/.test(r.text) ? 'error panel' : r.sw > width ? `scrolls sideways (${r.sw}px)` : null;
        if (problem) { failures += 1; console.log(`FAIL ${name} @${width}px #${view}: ${problem}`); }
      }
      if (errors.length) { failures += 1; console.log(`FAIL ${name} @${width}px: ${errors[0]}`); }
      await ctx.close();
    }
    console.log(`checked: ${name}`);
  }
  await browser.close();
  console.log(failures ? `${failures} problem(s)` : 'All pages render in every state.');
  process.exit(failures ? 1 : 0);
})();
