import { Tabs } from 'expo-router';
import React from 'react';

import { TabMenu } from '@/components/TabMenu';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      tabBar={(props) => <TabMenu {...props} />}
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Ana Ekran',
        }}
      />
      <Tabs.Screen
        name="health"
        options={{
          title: 'Sera Sağlığı',
        }}
      />
      <Tabs.Screen
        name="add-device"
        options={{
          title: 'Cihaz Ekle',
        }}
      />
    </Tabs>
  );
}

