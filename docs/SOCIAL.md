# Friends and sharing

## What works today (no setup)

The **Friends** page shares workouts, milestones and recipes as links. The item travels inside the link after `#cheer=`, so nothing is uploaded and no account is needed.
- When a friend opens a link, they can add the sender as a friend and send a cheer back, which is another link.
- Everything received is saved only in that person's browser.
- Workout plans already share the same way through `#import-plan=`.

**Limits:** there is no shared feed. People see only what is sent to them, and a link can be forwarded to anyone.

## Turning on accounts later

The database side is ready but switched off:
- `mobile/supabase/migrations/20261031010000_social.sql` holds the tables and the row-level security that protects them:
  - `social_profiles`: display name and friend code.
  - `friendships`: requested, then accepted.
  - `shares`: workouts, recipes and milestones.
  - `cheers`: messages to friends.
- `mobile/src/lib/social.ts` has typed helpers to save a profile, add a friend by code, accept a request, list friends, post a share, read the feed, send a cheer and read cheers.

**Who can see what:**
- Names and friend codes are visible to signed-in users, so they can add each other by code.
- A friendship is visible only to the two people in it.
- A share is visible to its author and the author's accepted friends.
- A cheer can be sent only to an accepted friend, and only the sender and the recipient can see it.
- Accepting a request can change only its status, never who it's between.

**Steps:**
1. Create a free project at supabase.com.
2. Run both SQL files in `mobile/supabase/migrations` in the SQL editor.
3. Send the project URL and the public anon key. The web app then needs a sign-in screen and a feed that use the same tables; that's the next piece of work.

Moderation (reporting or blocking someone) isn't built yet. Add it before opening accounts to people who don't already know each other.
