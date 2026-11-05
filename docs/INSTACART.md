# Send the shopping list to Instacart

HEALTH-RAY can send the whole shopping list to Instacart in one tap. Instacart opens with every item on one page, the user picks a nearby store, and adds everything to their cart.

It's **off** until you set it up. Without it, the Shopping list still offers **Copy list & open** for Instacart, Walmart, Amazon Fresh, Kroger and Target.

## Why it needs a small server piece

Instacart gives you a secret API key. Anything inside `index.html` can be read by every visitor, so the key can't live there. Instead, a tiny Supabase Edge Function (`mobile/supabase/functions/instacart-list/index.ts`) holds the key:

1. The website sends the list (item names and amounts only, nothing personal) to your function.
2. The function adds the key and asks Instacart for a shopping-list link.
3. The website opens that link in a new tab.

Supabase's free plan includes Edge Functions. You already use Supabase for the mobile app's accounts, so you can use the same project.

## Setup (about 20 minutes)

### 1. Get an Instacart API key

1. Go to the [Instacart Developer Platform](https://docs.instacart.com/developer_platform_api/) and sign up.
2. Create a **development** API key. Development keys work right away against Instacart's test server, which is fine for trying it out.
3. When you're ready for real users, apply for a **production** key from the same dashboard. Instacart reviews your app first.

### 2. Install the Supabase command-line tool

On a Mac with Homebrew:

```bash
brew install supabase/tap/supabase
```

On Windows, or for other options, see [Supabase CLI install](https://supabase.com/docs/guides/local-development/cli/getting-started).

### 3. Deploy the function

Open a terminal in the repo's `mobile` folder (it contains the `supabase` folder), then run these one at a time:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase secrets set INSTACART_API_KEY=paste-your-key-here
supabase secrets set ALLOWED_ORIGINS=https://xsosaxdex.github.io
supabase functions deploy instacart-list --no-verify-jwt
```

- `YOUR_PROJECT_REF` is the short code in your Supabase dashboard URL (`supabase.com/dashboard/project/<this part>`).
- `ALLOWED_ORIGINS` is required: it means only your website can use the function, and without it the function turns every request away. Add more sites separated by commas, for example `https://xsosaxdex.github.io,http://localhost:8000` while testing locally.
- `--no-verify-jwt` lets visitors use it without a HEALTH-RAY account. The allowed-sites check and the 150-item limit keep it from being misused.

When you get a production key, run these two lines and deploy again:

```bash
supabase secrets set INSTACART_API_KEY=your-production-key INSTACART_ENV=production
supabase functions deploy instacart-list --no-verify-jwt
```

### 4. Turn it on in the website

1. Open `index.html` and search for `const INSTACART_FN = '';`
2. Put your function's address between the quotes:

```js
const INSTACART_FN = 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/instacart-list';
```

3. Commit and push. On the Shopping list, open **Order online**, choose **Instacart**, and you'll see **Send list to Instacart**.

## If something goes wrong

The website shows "Couldn't reach Instacart. Try Copy list instead." and closes the empty tab. To see why, open your Supabase dashboard, go to **Edge Functions → instacart-list → Logs**. Common causes:

| Message in the logs or browser | Fix |
|---|---|
| `INSTACART_API_KEY is not set` | Run the `supabase secrets set INSTACART_API_KEY=…` line again, then deploy. |
| `ALLOWED_ORIGINS is not set` | Run the `supabase secrets set ALLOWED_ORIGINS=…` line, then deploy. |
| `This site is not allowed` | Add your site's address to `ALLOWED_ORIGINS` exactly as it appears in the browser bar (no trailing slash). |
| `Instacart answered 401` | The key is wrong, or it's a production key without `INSTACART_ENV=production` (or the other way round). |

## What's sent

Only the unticked items that aren't in your pantry, for example `24 oz boneless skinless chicken breast`. No account, health data or personal details are sent.
