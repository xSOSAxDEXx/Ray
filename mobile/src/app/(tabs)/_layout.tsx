import { Tabs } from 'expo-router/js-tabs';
import { C } from '../../lib/ui';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: C.accent, headerStyle: { backgroundColor: C.surface }, headerTintColor: C.ink, tabBarLabelStyle: { fontSize: 13, fontWeight: '700' } }}>
      <Tabs.Screen name="index" options={{ title: 'Today' }} />
      <Tabs.Screen name="log" options={{ title: 'Log' }} />
      <Tabs.Screen name="targets" options={{ title: 'Targets' }} />
    </Tabs>
  );
}
