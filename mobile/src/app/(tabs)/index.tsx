// Today: calories and macros against targets, water, and the weekly workout goal.
import { Link } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { dayKey } from '../../core/dates';
import { dayMeals, totals } from '../../core/macros';
import { loggingStreak, weeklyStreak, weekSummaries } from '../../core/streaks';
import { useStore } from '../../lib/store';
import { Bar, Button, C, Card, H1, H2, Muted, s } from '../../lib/ui';

const OZ = 29.5735;

export default function Today() {
  const { data, addWater } = useStore();
  const t = dayKey(), T = data.targets, tot = totals(dayMeals(data.meals, t)), water = data.water[t] || 0, us = data.units === 'us';
  const weeks = weekSummaries(data.workouts, T, t), wk = weeks[weeks.length - 1];
  const showWater = (ml: number) => (us ? `${Math.round(ml / OZ)} oz` : `${Math.round(ml)} ml`);
  return (
    <ScrollView style={s.screen} contentContainerStyle={s.scroll}>
      <H1>Today</H1>
      <Card>
        <H2>Fuel</H2>
        <Text style={s.big}>{Math.max(0, Math.round(T.kcal - tot.kcal)).toLocaleString()}<Text style={s.muted}> kcal left of {T.kcal.toLocaleString()}</Text></Text>
        {([['Protein', tot.p, T.p, C.protein], ['Carbs', tot.c, T.c, C.carbs], ['Fat', tot.f, T.f, C.fat]] as const).map(([n, v, max, col]) => (
          <View key={n} style={{ gap: 4 }}>
            <View style={[s.row, { justifyContent: 'space-between' }]}><Text style={{ color: C.ink, fontWeight: '600' }}>{n}</Text><Muted>{Math.round(v)} / {max} g</Muted></View>
            <Bar value={v} max={max} color={col} />
          </View>
        ))}
        <Muted>Logging streak: {loggingStreak(data.meals, t)} day(s)</Muted>
      </Card>
      <Card>
        <H2>Water</H2>
        <Text style={s.big}>{showWater(water)}<Text style={s.muted}> / {showWater(T.waterMl)}</Text></Text>
        <Bar value={water} max={T.waterMl} color={C.water} />
        <View style={s.row}>{(us ? [8, 16, 24].map((oz) => oz * OZ) : [250, 500, 750]).map((ml) => <Button key={ml} kind="plain" title={`+${showWater(ml)}`} onPress={() => addWater(ml)} label={`Add ${showWater(ml)} of water`} />)}</View>
      </Card>
      <Card>
        <H2>This week</H2>
        <Muted>{wk.workouts} of {T.workoutsWeek} workouts · {wk.minutes} of {T.minutesWeek} active minutes</Muted>
        <Bar value={wk.workouts} max={T.workoutsWeek} color={C.berry} />
        <Muted>Weekly goal streak: {weeklyStreak(weeks)} week(s)</Muted>
      </Card>
      <View style={s.row}>
        <Link href="/import" asChild><Button kind="plain" title="Import web backup" onPress={() => {}} /></Link>
        <Link href="/account" asChild><Button kind="plain" title="Account & sync" onPress={() => {}} /></Link>
      </View>
    </ScrollView>
  );
}
