import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Layout } from 'lucide-react-native';
import Animated, { 
  useAnimatedStyle, 
  withSpring, 
  withTiming 
} from 'react-native-reanimated';
import { Home, Compass, User, Settings, PieChart, Plus, Heart } from 'lucide-react-native';
import { BlurView } from 'expo-blur';

import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export function TabMenu({ state, descriptors, navigation }: BottomTabBarProps) {
  const primaryColor = '#10b981';
  const inactiveColor = '#94a3b8';

  return (
    <View style={styles.container}>
      <BlurView intensity={30} tint="dark" style={styles.blurContainer}>
        <View style={styles.content}>
          {state.routes.map((route, index) => {
            const options = descriptors[route.key]?.options || {};
            const isFocused = state.index === index;

            const onPress = () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            const onLongPress = () => {
              navigation.emit({
                type: 'tabLongPress',
                target: route.key,
              });
            };

            let Icon = Home;
            let label = 'Home';

            if (route.name === 'index') {
              Icon = Home;
              label = 'Ana Ekran';
            } else if (route.name === 'add-device') {
              Icon = Plus;
              label = 'Cihaz Ekle';
            } else if (route.name === 'health') {
              Icon = Heart;
              label = 'Sera Sağlığı';
            }

            const animatedIconStyle = useAnimatedStyle(() => {
              return {
                transform: [
                  { 
                    scale: withSpring(isFocused ? 1.2 : 1, {
                      damping: 10,
                      stiffness: 100
                    }) 
                  },
                  {
                    translateY: withSpring(isFocused ? -5 : 0)
                  }
                ],
              };
            });

            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                testID={options.tabBarTestID}
                onPress={onPress}
                onLongPress={onLongPress}
                style={styles.tabItem}
              >
                <Animated.View style={[styles.iconContainer, animatedIconStyle]}>
                  <Icon 
                    size={24} 
                    color={isFocused ? primaryColor : inactiveColor} 
                    strokeWidth={isFocused ? 2.5 : 2}
                  />
                  {isFocused && <View style={styles.dot} />}
                </Animated.View>
                <Text style={[
                  styles.label, 
                  { color: isFocused ? 'white' : inactiveColor, fontWeight: isFocused ? '700' : '500' }
                ]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    width: width * 0.9,
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: 'rgba(21, 23, 24, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  blurContainer: {
    flex: 1,
    paddingVertical: 12,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#10b981',
    position: 'absolute',
    bottom: -8,
  },
  label: {
    fontSize: 10,
    marginTop: 2,
  },
});
