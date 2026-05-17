import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(auth)/login',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const token = await AsyncStorage.getItem('userToken');
      if (!active) return;
      const inAuth = segments[0] === '(auth)';
      if (!token && !inAuth) {
        router.replace('/(auth)/login');
      } else if (token && inAuth) {
        router.replace('/(tabs)');
      }
      setAuthReady(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  if (!authReady) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0f1115', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#10b981" size="large" />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)/login" options={{ animation: 'fade' }} />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}
