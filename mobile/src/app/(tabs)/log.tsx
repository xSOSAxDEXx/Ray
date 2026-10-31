// Log: add food with calories and macros, delete entries, and record today's weight.
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { dayKey } from '../../core/dates';
import { dayMeals, totals } from '../../core/macros';
import { useStore } from '../../lib/store';
import { Button, C, Card, H1, H2, Muted, s } from '../../lib/ui';

const MEALS = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
const KG_LB = 2.20462;
const num = (v: string) => Math.max(0, Math.round(parseFloat(v) || 0));

export default function Log() {
  const { data, addMeal, removeMeal, setWeight } = useStore();
  const t = dayKey(), meals = dayMeals(data.meals, t), tot = totals(meals), us = data.units === 'us';
  const [f, setF] = useState({ name: '', kcal: '', p: '', c: '', fat: '', meal: 'Lunch' });
  const [w, setW] = useState('');
  const add = () => {
    if (!f.kcal) { Alert.alert('Add the calories', 'Calories are required; protein, carbs and fat are optional.'); return; }
    addMeal({ name: f.name.trim() || 'Food', meal: f.meal, kcal: num(f.kcal), p: num(f.p), c: num(f.c), f: num(f.fat) });
    setF({ ...f, name: '', kcal: '', p: '', c: '', fat: '' });
  };
  return (
    <ScrollView style={s.screen} contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
      <H1>Log</H1>
      <Card>
        <H2>Food today · {Math.round(tot.kcal)} / {data.targets.kcal} kcal</H2>
        {meals.length ? meals.map((m) => (
          <View key={m.id} style={[s.row, { justifyContent: 'space-between', borderBottomWidth: 1, borderColor: C.line, paddingVertical: 6 }]}>
            <View style={{ flex: 1 }}><Text style={{ fontWeight: '700', color: C.ink }}>{m.name}</Text><Muted>{m.meal} · P {m.p} · C {m.c} · F {m.f}</Muted></View>
            <Text style={{ color: C.ink, fontVariant: ['tabular-nums'] }}>{m.kcal}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={`Delete ${m.name}`} onPress={() => removeMeal(m.id)} style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: C.muted, fontSize: 18 }}>✕</Text></Pressable>
          </View>
        )) : <Muted>Nothing logged yet today.</Muted>}
      </Card>
      <Card>
        <H2>Add food</H2>
        <View style={s.row}>{MEALS.map((m) => <Button key={m} kind={m === f.meal ? 'primary' : 'plain'} title={m} onPress={() => setF({ ...f, meal: m })} />)}</View>
        <TextInput style={s.input} placeholder="Food name" value={f.name} onChangeText={(name) => setF({ ...f, name })} accessibilityLabel="Food name" />
        <View style={s.row}>
          {([['kcal', 'Calories'], ['p', 'Protein g'], ['c', 'Carbs g'], ['fat', 'Fat g']] as const).map(([k, l]) => (
            <TextInput key={k} style={[s.input, { flex: 1, minWidth: 70 }]} placeholder={l} keyboardType="numeric" value={f[k]} onChangeText={(v) => setF({ ...f, [k]: v })} accessibilityLabel={l} />
          ))}
        </View>
        <Button title="Add food" onPress={add} />
      </Card>
      <Card>
        <H2>Weight</H2>
        <View style={s.row}>
          <TextInput style={[s.input, { flex: 1 }]} placeholder={us ? 'lb' : 'kg'} keyboardType="decimal-pad" value={w} onChangeText={setW} accessibilityLabel={`Weight in ${us ? 'pounds' : 'kilograms'}`} />
          <Button title="Save" onPress={() => { const v = parseFloat(w); if (v > 0) { setWeight(us ? v / KG_LB : v); setW(''); } }} />
        </View>
      </Card>
    </ScrollView>
  );
}
