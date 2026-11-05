// Supabase Edge Function: turns a HEALTH-RAY shopping list into an Instacart shopping list page.
//
// The website sends the list here; this function adds your secret Instacart API key and asks Instacart for a
// link, then sends the link back. The key never reaches the browser. Setup steps: docs/INSTACART.md.
//
// Secrets (set with `supabase secrets set NAME=value`):
//   INSTACART_API_KEY  required. Your key from the Instacart Developer Platform.
//   INSTACART_ENV      optional. "production" once Instacart approves you; anything else uses their test server.
//   ALLOWED_ORIGINS    required. Comma-separated sites allowed to call this, e.g. https://xsosaxdex.github.io
//                      Without it the function refuses every request, so nobody else can spend your Instacart quota.
//                      (This stops other websites. It can't stop someone faking the Origin header from a script, which
//                      is why the item limits below exist too.)
//
// Instacart API: POST /idp/v1/products/products_link (docs.instacart.com/developer_platform_api).

const API = Deno.env.get('INSTACART_ENV') === 'production' ? 'https://connect.instacart.com' : 'https://connect.dev.instacart.tools';
const KEY = Deno.env.get('INSTACART_API_KEY') ?? '';
const ALLOWED = (Deno.env.get('ALLOWED_ORIGINS') ?? '').split(',').map((s) => s.trim()).filter(Boolean);
// Units Instacart understands for matching products. Anything else is sent as text only.
const UNITS = new Set(['cup', 'tablespoon', 'teaspoon', 'ounce', 'pound', 'can', 'each']);
const MAX_ITEMS = 150;

type Measure = { quantity: number; unit: string };
type LineItem = { name: string; display_text?: string; line_item_measurements?: Measure[] };

const text = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '');

function cors(origin: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': ALLOWED.includes(origin) ? origin : ALLOWED[0] ?? 'null',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type',
    Vary: 'Origin',
  };
}

function reply(body: unknown, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(body), { status, headers: { ...headers, 'Content-Type': 'application/json' } });
}

function lineItem(raw: unknown): LineItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const name = text(r.name, 120);
  if (!name) return null;
  const item: LineItem = { name };
  const display = text(r.display_text, 160);
  if (display) item.display_text = display;
  const measures = Array.isArray(r.line_item_measurements) ? r.line_item_measurements.slice(0, 4) : [];
  const ok = measures
    .map((m) => (m && typeof m === 'object' ? (m as Record<string, unknown>) : {}))
    .filter((m) => typeof m.quantity === 'number' && Number.isFinite(m.quantity) && m.quantity > 0 && m.quantity < 10000 && UNITS.has(String(m.unit)))
    .map((m) => ({ quantity: Math.round((m.quantity as number) * 100) / 100, unit: String(m.unit) }));
  if (ok.length) item.line_item_measurements = ok;
  return item;
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin') ?? '';
  const headers = cors(origin);
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (req.method !== 'POST') return reply({ error: 'Use POST.' }, 405, headers);
  if (!ALLOWED.length) return reply({ error: 'ALLOWED_ORIGINS is not set.' }, 500, headers);
  if (!ALLOWED.includes(origin)) return reply({ error: 'This site is not allowed to use the list service.' }, 403, headers);
  if (!KEY) return reply({ error: 'INSTACART_API_KEY is not set.' }, 500, headers);

  let raw: unknown;
  try { raw = await req.json(); } catch { return reply({ error: 'Send the list as JSON.' }, 400, headers); }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return reply({ error: 'Send the list as a JSON object.' }, 400, headers);
  const body = raw as Record<string, unknown>;
  const items = Array.isArray(body.items) ? body.items.slice(0, MAX_ITEMS) : [];
  const line_items = items.map(lineItem).filter((x): x is LineItem => !!x);
  if (!line_items.length) return reply({ error: 'The list is empty.' }, 400, headers);

  // Instacart shows a "back to" button to this page. Only accept a link to an allowed site.
  const back = text(body.linkback, 300);
  const backOk = /^https:\/\//.test(back) && ALLOWED.some((o) => back.startsWith(o + '/'));

  const payload = {
    title: text(body.title, 100) || 'HEALTH-RAY shopping list',
    link_type: 'shopping_list',
    line_items,
    landing_page_configuration: { enable_pantry_items: false, ...(backOk ? { partner_linkback_url: back } : {}) },
  };

  let res: Response;
  try {
    res = await fetch(`${API}/idp/v1/products/products_link`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${KEY}`, Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    return reply({ error: "Couldn't reach Instacart." }, 502, headers);
  }
  if (!res.ok) return reply({ error: `Instacart answered ${res.status}.` }, 502, headers);
  const data = await res.json().catch(() => ({}));
  const url = typeof data.products_link_url === 'string' ? data.products_link_url : '';
  if (!/^https?:\/\//.test(url)) return reply({ error: 'Instacart sent no link.' }, 502, headers);
  return reply({ url }, 200, headers);
});
