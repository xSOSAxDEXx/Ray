// Every exercise in every plan must link to an entry in the exercise library. Run: node tests/library.js
const fs = require('fs');
const s = fs.readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8');
const grab = (start, end) => { const a = s.indexOf(start); return s.slice(a, s.indexOf(end, a)); };
const PLANS = eval(grab('const PLANS = [', '\n];').slice('const PLANS = '.length) + '\n]');
const lib = grab('const EX_LIB = [', 'const exCacheLib');
const { EX_LIB, EX_MATCH } = new Function(`${lib}; return { EX_LIB, EX_MATCH };`)();
const missing = new Set(), ids = new Set();
PLANS.forEach((p) => p.days.forEach((d) => d.ex.forEach((e) => { const x = EX_MATCH.find((y) => y.re.test(e[0])); if (!x) missing.add(`${p.id}: ${e[0]}`); else ids.add(x.id); })));
EX_LIB.forEach((x) => { if (!x.cues.length || !x.easier || !x.harder || !x.muscles || !x.eq) missing.add(`incomplete entry ${x.id}`); });
console.log(`${PLANS.length} plans, ${EX_LIB.length} library entries, ${ids.size} used by plans`);
if (missing.size) { console.log('Problems:\n  ' + [...missing].join('\n  ')); process.exit(1); }
console.log('Every plan exercise links to the library.');
