// Local-date helpers. Dates are stored as YYYY-MM-DD in the user's local time zone, like the web app.

export const pad = (n: number) => String(n).padStart(2, '0');
export const dayKey = (d: Date = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseKey = (k: string) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
export const addDays = (k: string, n: number) => { const d = parseKey(k); d.setDate(d.getDate() + n); return dayKey(d); };
/** Monday of the week containing k. */
export const mondayOf = (k: string) => addDays(k, -((parseKey(k).getDay() + 6) % 7));
export const daysBetween = (a: string, b: string) => Math.round((parseKey(b).getTime() - parseKey(a).getTime()) / 864e5);
