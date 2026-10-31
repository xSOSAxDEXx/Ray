import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StoreProvider } from '../lib/store';
import { C } from '../lib/ui';

export default function RootLayout() {
  return (
    <StoreProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerStyle: { backgroundColor: C.surface }, headerTintColor: C.ink, contentStyle: { backgroundColor: C.bg } }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="import" options={{ title: 'Import a web backup', presentation: 'modal' }} />
        <Stack.Screen name="account" options={{ title: 'Account', presentation: 'modal' }} />
      </Stack>
    </StoreProvider>
  );
}
