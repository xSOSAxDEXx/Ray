// Shared look, matching the web app's color tokens.
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

export const C = { bg: '#eef3ef', surface: '#ffffff', ink: '#142019', muted: '#56675c', line: '#d2ddd5', accent: '#1d6a45', accentSoft: '#d5eadd', berry: '#9a2b59', protein: '#2c66a8', carbs: '#8a5d08', fat: '#9a2b59', water: '#1f7f9c' };

export const Card = ({ children, style }: { children: ReactNode; style?: ViewStyle }) => <View style={[s.card, style]}>{children}</View>;
export const H1 = ({ children }: { children: ReactNode }) => <Text style={s.h1} accessibilityRole="header">{children}</Text>;
export const H2 = ({ children }: { children: ReactNode }) => <Text style={s.h2} accessibilityRole="header">{children}</Text>;
export const Muted = ({ children }: { children: ReactNode }) => <Text style={s.muted}>{children}</Text>;
export function Button({ title, onPress, kind = 'primary', label }: { title: string; onPress: () => void; kind?: 'primary' | 'plain'; label?: string }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label ?? title} onPress={onPress} style={({ pressed }) => [s.btn, kind === 'primary' ? s.btnPrimary : s.btnPlain, pressed && { opacity: 0.7 }]}>
      <Text style={[s.btnText, kind === 'primary' && { color: '#fff' }]}>{title}</Text>
    </Pressable>
  );
}
export function Bar({ value, max, color = C.accent }: { value: number; max: number; color?: string }) {
  const pc = Math.max(0, Math.min(100, (value / (max || 1)) * 100));
  return <View style={s.bar} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(pc) }}><View style={[s.barFill, { width: `${pc}%`, backgroundColor: color }]} /></View>;
}

export const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: 16, gap: 14 },
  card: { backgroundColor: C.surface, borderColor: C.line, borderWidth: 1, borderRadius: 14, padding: 16, gap: 10 },
  h1: { fontSize: 28, fontWeight: '800', color: C.ink },
  h2: { fontSize: 18, fontWeight: '700', color: C.ink },
  muted: { color: C.muted, fontSize: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  btn: { minHeight: 44, paddingHorizontal: 16, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  btnPrimary: { backgroundColor: C.accent },
  btnPlain: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line },
  btnText: { fontWeight: '700', color: C.ink },
  input: { minHeight: 44, borderWidth: 1, borderColor: C.line, borderRadius: 10, paddingHorizontal: 12, backgroundColor: C.surface, color: C.ink, fontSize: 16 },
  bar: { height: 8, borderRadius: 8, backgroundColor: C.accentSoft, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 8 },
  big: { fontSize: 34, fontWeight: '600', color: C.ink, fontVariant: ['tabular-nums'] },
});
