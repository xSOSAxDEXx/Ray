// Import a backup file downloaded from the web app (Settings → Your data → Download backup).
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { readBackup, type BackupProfile } from '../core/backup';
import { useStore } from '../lib/store';
import { Button, C, Card, H2, Muted, s } from '../lib/ui';

export default function Import() {
  const { replaceAll } = useStore();
  const [found, setFound] = useState<BackupProfile[] | null>(null);
  const [msg, setMsg] = useState('');
  const pick = async () => {
    const res = await DocumentPicker.getDocumentAsync({ type: 'application/json', copyToCacheDirectory: true });
    if (res.canceled || !res.assets[0]) return;
    try {
      const parsed = readBackup(await new File(res.assets[0].uri).text());
      if (!parsed) { setMsg("That file isn't a Rep & Ration backup."); setFound(null); return; }
      setFound(parsed.profiles); setMsg('');
    } catch { setMsg("Couldn't read that file."); }
  };
  return (
    <ScrollView style={s.screen} contentContainerStyle={s.scroll}>
      <Card>
        <H2>Bring your history over</H2>
        <Muted>On the website, open Settings and tap Download backup. Then choose that file here. You'll see what's in it before anything changes.</Muted>
        <Button title="Choose backup file" onPress={pick} />
        {msg ? <Text style={{ color: C.berry }}>{msg}</Text> : null}
      </Card>
      {found?.map((p, i) => (
        <Card key={i}>
          <H2>{p.name || `Profile ${i + 1}`}</H2>
          <Muted>{p.from ? `${p.from} to ${p.to}` : 'No dated entries'} · {p.meals} meals · {p.workouts} workouts · {p.weighIns} weigh-ins</Muted>
          <View style={s.row}><Button title="Use this profile on this phone" onPress={() => { replaceAll(p.data); router.back(); }} /></View>
          <Muted>This replaces what's on this phone. If you're signed in, it also syncs to your account.</Muted>
        </Card>
      ))}
    </ScrollView>
  );
}
