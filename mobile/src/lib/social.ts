// Friends, shared activity and cheers over Supabase (see supabase/migrations/*_social.sql and docs/SOCIAL.md).
// Switched off until a Supabase project is connected: every function returns { error } when `supabase` is null.
// Row-level security does the access control; these helpers only shape the queries.
import { supabase } from './supabase';

export type ShareKind = 'workout' | 'recipe' | 'milestone';
export interface SocialProfile { user_id: string; display_name: string; friend_code: string }
export interface Friend { id: string; name: string; status: 'pending' | 'accepted'; incoming: boolean }
export interface Share { id: string; user_id: string; kind: ShareKind; title: string; detail: string | null; recipe_id: string | null; created_at: string }
export interface Cheer { id: string; from_id: string; to_id: string; share_id: string | null; message: string; created_at: string }
type Result<T> = { data: T; error: null } | { data: null; error: string };

const off = { data: null, error: 'Accounts are not set up yet.' } as const;
const fail = (e: { message: string } | null | undefined, fallback = 'Something went wrong.') => ({ data: null, error: e?.message ?? fallback } as const);

async function me(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function saveProfile(displayName: string): Promise<Result<SocialProfile>> {
  if (!supabase) return off;
  const uid = await me(); if (!uid) return fail(null, 'Sign in first.');
  const name = displayName.trim().slice(0, 40); if (!name) return fail(null, 'Add a name.');
  const existing = await supabase.from('social_profiles').select('*').eq('user_id', uid).maybeSingle();
  const q = existing.data
    ? supabase.from('social_profiles').update({ display_name: name }).eq('user_id', uid).select().single()
    : supabase.from('social_profiles').insert({ user_id: uid, display_name: name }).select().single();
  const { data, error } = await q;
  return error ? fail(error) : { data: data as SocialProfile, error: null };
}

export async function addFriendByCode(code: string): Promise<Result<true>> {
  if (!supabase) return off;
  const uid = await me(); if (!uid) return fail(null, 'Sign in first.');
  const { data: them, error } = await supabase.from('social_profiles').select('user_id').eq('friend_code', code.trim().toUpperCase()).maybeSingle();
  if (error) return fail(error);
  if (!them) return fail(null, 'No one has that friend code.');
  if (them.user_id === uid) return fail(null, "That's your own code.");
  const r = await supabase.from('friendships').insert({ user_id: uid, friend_id: them.user_id });
  return r.error ? fail(r.error) : { data: true, error: null };
}

export async function acceptFriend(fromUserId: string): Promise<Result<true>> {
  if (!supabase) return off;
  const uid = await me(); if (!uid) return fail(null, 'Sign in first.');
  const r = await supabase.from('friendships').update({ status: 'accepted' }).eq('user_id', fromUserId).eq('friend_id', uid);
  return r.error ? fail(r.error) : { data: true, error: null };
}

export async function listFriends(): Promise<Result<Friend[]>> {
  if (!supabase) return off;
  const uid = await me(); if (!uid) return fail(null, 'Sign in first.');
  const { data, error } = await supabase.from('friendships').select('user_id, friend_id, status');
  if (error) return fail(error);
  const rows = (data ?? []) as { user_id: string; friend_id: string; status: 'pending' | 'accepted' }[];
  const ids = rows.map((r) => (r.user_id === uid ? r.friend_id : r.user_id));
  const names = ids.length ? await supabase.from('social_profiles').select('user_id, display_name').in('user_id', ids) : { data: [], error: null };
  if (names.error) return fail(names.error);
  const nameOf = new Map((names.data ?? []).map((n: { user_id: string; display_name: string }) => [n.user_id, n.display_name]));
  return { data: rows.map((r) => { const id = r.user_id === uid ? r.friend_id : r.user_id; return { id, name: nameOf.get(id) ?? 'Friend', status: r.status, incoming: r.friend_id === uid }; }), error: null };
}

export async function postShare(kind: ShareKind, title: string, detail = '', recipeId: string | null = null): Promise<Result<Share>> {
  if (!supabase) return off;
  const uid = await me(); if (!uid) return fail(null, 'Sign in first.');
  const { data, error } = await supabase.from('shares').insert({ user_id: uid, kind, title: title.slice(0, 100), detail: detail.slice(0, 200) || null, recipe_id: recipeId }).select().single();
  return error ? fail(error) : { data: data as Share, error: null };
}

/** Your own and your friends' shares, newest first. RLS hides everyone else's. */
export async function feed(limit = 50): Promise<Result<Share[]>> {
  if (!supabase) return off;
  const { data, error } = await supabase.from('shares').select('*').order('created_at', { ascending: false }).limit(limit);
  return error ? fail(error) : { data: (data ?? []) as Share[], error: null };
}

export async function sendCheer(toUserId: string, message: string, shareId: string | null = null): Promise<Result<true>> {
  if (!supabase) return off;
  const uid = await me(); if (!uid) return fail(null, 'Sign in first.');
  const msg = message.trim().slice(0, 200); if (!msg) return fail(null, 'Write a message.');
  const r = await supabase.from('cheers').insert({ from_id: uid, to_id: toUserId, message: msg, share_id: shareId });
  return r.error ? fail(r.error, 'You can only cheer accepted friends.') : { data: true, error: null };
}

export async function myCheers(limit = 50): Promise<Result<Cheer[]>> {
  if (!supabase) return off;
  const uid = await me(); if (!uid) return fail(null, 'Sign in first.');
  const { data, error } = await supabase.from('cheers').select('*').eq('to_id', uid).order('created_at', { ascending: false }).limit(limit);
  return error ? fail(error) : { data: (data ?? []) as Cheer[], error: null };
}
