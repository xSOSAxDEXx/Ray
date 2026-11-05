// Starting-weight and next-step advice, checked against a table of people and past sets. Run: node tests/progression.js
// The functions are taken straight from index.html and run with a small stand-in for the app's state.
const fs = require('fs');
const src = fs.readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8');
const grab = (start, end) => { const a = src.indexOf(start); if (a < 0) throw new Error(`not found: ${start}`); return src.slice(a, src.indexOf(end, a) + end.length); };
const code = [
  grab('const round = ', '};'),
  grab('const EX_LIB = [', 'const exCacheLib'), ' = new Map();', grab('const libFor = ', '};'),
  grab('function repTarget(', '\n}'),
  grab('const START_RATIO = {', '\n};'), grab('const START_LOWER = [', '];'), grab('const SIZES = {', '} };'),
  grab('function loadKind(', '\n}'), grab('function startWeight(', '\n}'),
  grab('function lastRpe(', '\n}'), grab('function nextWeightUp(', '\n}'), grab('function nextStep(', '\n}'),
  grab('const hasWeight = ', ';\n'), grab('const isBarbell = ', ';\n'),
].join('\n');
const make = new Function('S', 'workoutEx', `const KG_LB = 2.20462;
  const us = () => S.units === 'us', wUnit = () => (us() ? 'lb' : 'kg'), showW = (kg, d = 1) => round(us() ? kg * KG_LB : kg, d);
  ${code}
  return { startWeight, nextStep };`);

const S = { units: 'us', profile: {}, workouts: [] };
const { startWeight, nextStep } = make(S, (w) => w.ex);
const LB = 1 / 2.20462;
const dbPlan = { id: 'dumbbell-home-strength', needs: ['dumbbells'] }, kbPlan = { id: 'kb-swing-getup', needs: ['kettlebell'] }, barPlan = { id: 'barbell-5x5', needs: ['barbell'] };
const sets = (n, r, lb) => Array.from({ length: n }, () => ({ r, kg: lb * LB }));
let fails = 0;
const check = (label, got, ok) => { if (!ok) { fails += 1; console.log(`FAIL ${label}\n     got: ${got}`); } else console.log(`ok   ${label}`); };

// Next step (US units, nothing rated very hard).
const cases = [
  ['dumbbell 10→12 lb (20%): asks for 2 extra reps first', dbPlan, ['Dumbbell curl', 3, '8–12', 60], sets(3, 12, 10), /build to 14 reps/],
  ['dumbbell 10 lb with the extra reps done: goes up to 12 lb', dbPlan, ['Dumbbell curl', 3, '8–12', 60], sets(3, 14, 10), /try 12 lb in each hand/],
  ['dumbbell 25→27.5 lb (10%): goes straight up', dbPlan, ['Dumbbell curl', 3, '8–12', 60], sets(3, 12, 25), /try 27.5 lb in each hand/],
  ['kettlebell 35→40 lb with the extra reps done: goes up', kbPlan, ['Kettlebell swing', 3, '10–15', 60], sets(3, 17, 35), /try 40 lb/],
  ['empty 45 lb bar on 5×5: goes up 5 lb', barPlan, ['Barbell back squat', 5, '5', 180], sets(5, 5, 45), /try 50 lb/],
  ['missed reps: stays at the weight', dbPlan, ['Dumbbell curl', 3, '8–12', 60], [...sets(2, 12, 20), { r: 9, kg: 20 * LB }], /Stay at this weight/],
];
for (const [label, p, e, last, re] of cases) { const t = nextStep(p, e, last); check(label, t, re.test(t)); }

S.workouts = [{ date: '2026-11-01', ex: [{ n: 'Dumbbell curl', reps: [12, 12, 12], rpe: 9 }] }];
{ const t = nextStep(dbPlan, ['Dumbbell curl', 3, '8–12', 60], sets(3, 12, 25)); check('last set rated 9: holds the weight', t, /rated it very hard/.test(t)); }
S.workouts = [];

// Starting weights stay cautious and land on real equipment.
const people = [
  ['new woman, 60 kg', { sex: 'female', age: 30, heightCm: 165, weightKg: 60, exp: 'new' }],
  ['new man, 80 kg', { sex: 'male', age: 30, heightCm: 180, weightKg: 80, exp: 'new' }],
  ['62-year-old woman', { sex: 'female', age: 62, heightCm: 160, weightKg: 65, exp: 'new' }],
  ['260 lb beginner (capped at BMI 27)', { sex: 'male', age: 35, heightCm: 178, weightKg: 118, exp: 'new' }],
];
const DB_US = [3, 5, 8, 10, 12, 15, 17.5, 20, 22.5, 25, 27.5, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80];
for (const [who, pr] of people) {
  S.profile = pr;
  const curl = startWeight(dbPlan, ['Dumbbell curl', 3, '8–12', 60]), squat = startWeight(barPlan, ['Barbell back squat', 5, '5', 180]);
  check(`${who}: curl ${curl && curl.v} lb each is a real dumbbell, 20 lb or less`, curl && curl.text, curl && DB_US.includes(curl.v) && curl.v <= 20);
  check(`${who}: squat ${squat && squat.v} lb, from the empty bar to 115 lb`, squat && squat.text, squat && squat.v >= 45 && squat.v <= 115 && squat.v % 5 === 0);
}
S.profile = { sex: 'male', age: 35, heightCm: 178, weightKg: 118, exp: 'new' };
const heavy = startWeight(barPlan, ['Barbell back squat', 5, '5', 180]).v;
S.profile = { ...S.profile, weightKg: 85.5 };
check('extra body weight above BMI 27 adds nothing', heavy, heavy === startWeight(barPlan, ['Barbell back squat', 5, '5', 180]).v);

if (fails) { console.log(`${fails} check(s) failed.`); process.exit(1); }
console.log('All progression checks passed.');
