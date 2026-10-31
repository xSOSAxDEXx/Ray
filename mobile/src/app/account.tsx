// Sign up / sign in with email and password (Supabase Auth). Optional: the app works fully offline without it.
import { useEffect, useState } from 'react';
import { ScrollView, Text, TextInput } from 'react-native';
import { pushAll } from '../lib/sync';
import { useStore } from '../lib/store';
import { supabase } from '../lib/supabase';
import { Button, C, Card, H2, Muted, s } from '../lib/ui';

export default function Account() {
  const { data } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(({ data: d }) => setUser(d.user?.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user.email ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);
  if (!supabase) {
    return (
      <ScrollView style={s.screen} contentContainerStyle={s.scroll}><Card><H2>Sync isn't set up</H2>
        <Muted>Everything is saved on this phone. To add accounts and sync, create a Supabase project, run the SQL in supabase/migrations, and put its URL and anon key in mobile/.env.local (see mobile/README.md).</Muted></Card></ScrollView>
    );
  }
  const go = async (mode: 'in' | 'up') => {
    setMsg('');
    const r = mode === 'in' ? await supabase!.auth.signInWithPassword({ email, password }) : await supabase!.auth.signUp({ email, password });
    if (r.error) setMsg(r.error.message);
    else { setMsg(mode === 'up' ? 'Check your email to confirm your account.' : 'Signed in. Syncing…'); pushAll(data); }
  };
  return (
    <ScrollView style={s.screen} contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
      <Card>
        {user ? (
          <><H2>Signed in as {user}</H2><Muted>Your log syncs to your private account. Only you can see your rows.</Muted>
            <Button kind="plain" title="Sign out" onPress={() => supabase!.auth.signOut()} /></>
        ) : (
          <><H2>Sign in or create an account</H2>
            <TextInput style={s.input} placeholder="Email" autoCapitalize="none" keyboardType="email-address" autoComplete="email" value={email} onChangeText={setEmail} accessibilityLabel="Email" />
            <TextInput style={s.input} placeholder="Password (8+ characters)" secureTextEntry autoComplete="password" value={password} onChangeText={setPassword} accessibilityLabel="Password" />
            <Button title="Sign in" onPress={() => go('in')} /><Button kind="plain" title="Create account" onPress={() => go('up')} /></>
        )}
        {msg ? <Text style={{ color: C.ink }}>{msg}</Text> : null}
      </Card>
    </ScrollView>
  );
}
