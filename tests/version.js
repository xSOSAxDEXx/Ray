// Version checks. Run: node tests/version.js [base-ref]
// 1. The app version in index.html (APP_VERSION, shown in bug reports) must match the offline cache in sw.js (CACHE).
// 2. With a base ref (CI passes the PR's base branch): if any file the site ships changed, CACHE must have changed too,
//    otherwise phones that installed the app keep serving the old copy.
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const root = path.join(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const cacheOf = (txt) => (txt.match(/const CACHE = '([^']+)'/) || [])[1];
const fail = (msg) => { console.log(`FAIL ${msg}`); process.exitCode = 1; };

const cache = cacheOf(read('sw.js')), app = (read('index.html').match(/APP_VERSION = '([^']+)'/) || [])[1];
if (!cache || !app) fail(`couldn't find CACHE in sw.js (${cache}) or APP_VERSION in index.html (${app})`);
else if (cache !== `healthray-${app}`) fail(`sw.js CACHE is '${cache}' but index.html APP_VERSION is '${app}'. Set both to the same number (CACHE = 'healthray-vN', APP_VERSION = 'vN').`);
else console.log(`ok   app version ${app} matches the offline cache ${cache}`);

const base = process.argv[2];
if (base) {
  const git = (...a) => execFileSync('git', a, { cwd: root, encoding: 'utf8' });
  const shipped = ['index.html', 'manifest.webmanifest', 'sw.js', 'icons/'];
  const changed = git('diff', '--name-only', `${base}...HEAD`, '--', ...shipped).split('\n').filter(Boolean);
  let baseCache = null;
  try { baseCache = cacheOf(git('show', `${base}:sw.js`)); } catch (e) { /* sw.js didn't exist on the base */ }
  if (!changed.length) console.log(`ok   no shipped files changed since ${base}`);
  else if (cache === baseCache) fail(`${changed.join(', ')} changed since ${base}, but CACHE is still '${cache}'. Bump it (and APP_VERSION) by one.`);
  else console.log(`ok   shipped files changed and the cache moved from ${baseCache} to ${cache}`);
}
if (!process.exitCode) console.log('Version checks passed.');
