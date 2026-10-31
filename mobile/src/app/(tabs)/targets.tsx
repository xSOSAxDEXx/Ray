// Targets: profile → calories, macros and water (same math as the web app), plus the adaptive estimate.
import { ScrollView, Text, View } from 'react-native';
import { adaptiveKcal, adaptiveTdee } from '../../core/adaptive';
import { dayKey } from '../../core/dates';
import { calcTargets, waterFor } from '../../core/targets';
import type { Goal, Profile } from '../../core/types';
import { useStore } from '../../lib/store';
import { Button, C, Card, H1, H2, Muted, s } from '../../lib/ui';

export default function Targets() {
  const { data, update } = useStore();
  const p = data.profile, calc = calcTargets(p), a = adaptiveTdee(p, data.meals, data.weights, dayKey());
  const setProfile = (patch: Partial<Profile>) => update((d) => {
    const profile = { ...d.profile, ...patch }, t = calcTargets(profile);
    return { ...d, profile, targets: { ...d.targets, kcal: t.kcal, p: t.p, c: t.c, f: t.f, waterMl: waterFor(profile) } };
  });
  return (
    <ScrollView style={s.screen} contentContainerStyle={s.scroll}>
      <H1>Targets</H1>
      <Card>
        <H2>Goal</H2>
        <View style={s.row}>{([['lose', 'Lose fat'], ['maintain', 'Maintain'], ['gain', 'Build muscle']] as [Goal, string][]).map(([g, l]) => <Button key={g} kind={p.goal === g ? 'primary' : 'plain'} title={l} onPress={() => setProfile({ goal: g })} />)}</View>
        <Muted>Edit age, height, weight and activity in the web app for now; they come across with a backup import.</Muted>
      </Card>
      <Card>
        <H2>Daily targets</H2>
        <Text style={s.big}>{data.targets.kcal.toLocaleString()}<Text style={s.muted}> kcal</Text></Text>
        <View style={s.row}>
          <Text style={{ color: C.protein, fontWeight: '700' }}>Protein {data.targets.p} g</Text>
          <Text style={{ color: C.carbs, fontWeight: '700' }}>Carbs {data.targets.c} g</Text>
          <Text style={{ color: C.fat, fontWeight: '700' }}>Fat {data.targets.f} g</Text>
        </View>
        <Muted>Resting burn {calc.bmr} kcal · with activity {calc.tdee} kcal (Mifflin-St Jeor).</Muted>
      </Card>
      <Card>
        <H2>Adaptive target</H2>
        {a.ok ? (
          <>
            <Muted>From your last 4 weeks you burn about {a.tdee.toLocaleString()} kcal a day (formula: {a.formula.toLocaleString()}).</Muted>
            <Button title={`Use ${adaptiveKcal(p, a.tdee).toLocaleString()} kcal`} onPress={() => update((d) => { const kcal = adaptiveKcal(p, a.tdee), f = Math.round((kcal * 0.3) / 9); return { ...d, targets: { ...d.targets, kcal, f, c: Math.max(0, Math.round((kcal - d.targets.p * 4 - f * 9) / 4)) } }; })} />
          </>
        ) : <Muted>Log food on {Math.max(0, 10 - a.logged)} more day(s) and weigh in {Math.max(0, 6 - a.weighIns)} more time(s) to unlock this.</Muted>}
      </Card>
    </ScrollView>
  );
}
