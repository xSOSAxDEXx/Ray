-- Rep & Ration: friends, shared activity and cheers (planned "accounts" version of the web app's link sharing).
-- Not used until a Supabase project is connected. Every table has row-level security:
--   * a user's display name and friend code are visible to signed-in users (needed to add someone by code);
--   * friendships are visible only to the two people in them;
--   * shares are visible to their author and the author's accepted friends;
--   * cheers are visible only to the sender and the recipient, and can only be sent to an accepted friend.

create table if not exists public.social_profiles (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 40),
  friend_code  text not null unique default upper(substr(md5(gen_random_uuid()::text), 1, 8)),
  created_at   timestamptz not null default now()
);

create table if not exists public.friendships (
  user_id    uuid not null references auth.users (id) on delete cascade,  -- who asked
  friend_id  uuid not null references auth.users (id) on delete cascade,  -- who was asked
  status     text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  primary key (user_id, friend_id),
  check (user_id <> friend_id)
);

create table if not exists public.shares (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  kind       text not null check (kind in ('workout', 'recipe', 'milestone')),
  title      text not null check (char_length(title) <= 100),
  detail     text check (char_length(detail) <= 200),
  recipe_id  text,
  created_at timestamptz not null default now()
);
create index if not exists shares_user_created on public.shares (user_id, created_at desc);

create table if not exists public.cheers (
  id         uuid primary key default gen_random_uuid(),
  from_id    uuid not null references auth.users (id) on delete cascade,
  to_id      uuid not null references auth.users (id) on delete cascade,
  share_id   uuid references public.shares (id) on delete set null,
  message    text not null check (char_length(message) between 1 and 200),
  created_at timestamptz not null default now()
);
create index if not exists cheers_to_created on public.cheers (to_id, created_at desc);

-- True when a and b have an accepted friendship in either direction. SECURITY DEFINER so policies can call it
-- without exposing the friendships table; search_path is pinned to avoid hijacking.
create or replace function public.are_friends(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.friendships f
    where f.status = 'accepted' and ((f.user_id = a and f.friend_id = b) or (f.user_id = b and f.friend_id = a))
  );
$$;
revoke all on function public.are_friends(uuid, uuid) from public;
grant execute on function public.are_friends(uuid, uuid) to authenticated;

alter table public.social_profiles enable row level security;
alter table public.friendships enable row level security;
alter table public.shares enable row level security;
alter table public.cheers enable row level security;

drop policy if exists "profiles: read" on public.social_profiles;
drop policy if exists "profiles: own insert" on public.social_profiles;
drop policy if exists "profiles: own update" on public.social_profiles;
drop policy if exists "profiles: own delete" on public.social_profiles;
create policy "profiles: read" on public.social_profiles for select to authenticated using (true);
create policy "profiles: own insert" on public.social_profiles for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "profiles: own update" on public.social_profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "profiles: own delete" on public.social_profiles for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "friendships: read own" on public.friendships;
drop policy if exists "friendships: request" on public.friendships;
drop policy if exists "friendships: accept" on public.friendships;
drop policy if exists "friendships: remove" on public.friendships;
create policy "friendships: read own" on public.friendships for select to authenticated
  using ((select auth.uid()) in (user_id, friend_id));
create policy "friendships: request" on public.friendships for insert to authenticated
  with check ((select auth.uid()) = user_id and status = 'pending');
create policy "friendships: accept" on public.friendships for update to authenticated
  using ((select auth.uid()) = friend_id) with check ((select auth.uid()) = friend_id and status = 'accepted');
create policy "friendships: remove" on public.friendships for delete to authenticated
  using ((select auth.uid()) in (user_id, friend_id));

drop policy if exists "shares: read own and friends" on public.shares;
drop policy if exists "shares: own insert" on public.shares;
drop policy if exists "shares: own delete" on public.shares;
create policy "shares: read own and friends" on public.shares for select to authenticated
  using ((select auth.uid()) = user_id or public.are_friends((select auth.uid()), user_id));
create policy "shares: own insert" on public.shares for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "shares: own delete" on public.shares for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "cheers: read own" on public.cheers;
drop policy if exists "cheers: send to friends" on public.cheers;
drop policy if exists "cheers: delete sent or received" on public.cheers;
create policy "cheers: read own" on public.cheers for select to authenticated
  using ((select auth.uid()) in (from_id, to_id));
create policy "cheers: send to friends" on public.cheers for insert to authenticated
  with check ((select auth.uid()) = from_id and public.are_friends(from_id, to_id));
create policy "cheers: delete sent or received" on public.cheers for delete to authenticated
  using ((select auth.uid()) in (from_id, to_id));

-- Column limits: accepting a request may only change its status (not who it's between), and a profile may only
-- change its display name (the friend code stays as generated).
revoke update on public.friendships from authenticated;
grant update (status) on public.friendships to authenticated;
revoke update on public.social_profiles from authenticated;
grant update (display_name) on public.social_profiles to authenticated;
