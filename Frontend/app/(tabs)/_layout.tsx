import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSelector } from 'react-redux';
import notificationService from '../../services/notificationService';

import HapticTab from '../../components/ui/haptic-tab';
import { IconSymbol } from '../../components/ui/icon-symbol';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { user } = useSelector((state: any) => state.auth);

  useEffect(() => {
    if (user) {
      notificationService.registerForPushNotificationsAsync();
    }
  }, [user]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: '#E31C25',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarBackground: () => (
          Platform.OS === 'ios' ? (
            <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
          ) : null
        ),
        tabBarStyle: {
          backgroundColor: Platform.OS === 'ios' ? 'transparent' : '#FFFFFF',
          borderTopWidth: 0,
          elevation: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          height: 65 + insets.bottom,
          paddingBottom: insets.bottom + 8,
          paddingTop: 12,
          position: 'absolute',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginBottom: 0,
          letterSpacing: 0.3,
        },
        tabBarIconStyle: {
          marginBottom: 4,
        }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <IconSymbol
              name="house.fill"
              size={28}
              color={focused ? '#E31C25' : '#8E8E93'}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="looking"
        options={{
          title: 'Looking',
          tabBarIcon: ({ focused }) => (
            <IconSymbol
              name="magnifyingglass.circle"
              size={28}
              color={focused ? '#E31C25' : '#8E8E93'}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="live"
        options={{
          title: 'Live',
          tabBarIcon: ({ focused }) => (
            <IconSymbol
              name="dot.radiowaves.left.and.right"
              size={28}
              color={focused ? '#E31C25' : '#8E8E93'}
            />
          ),
        }}
      />



      <Tabs.Screen
        name="tournament"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="community"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="players"
        options={{
          title: 'Players',
          tabBarIcon: ({ focused }) => (
            <IconSymbol
              name="person.2.fill" // SF Symbol or equivalent mapped in IconSymbol
              size={28}
              color={focused ? '#E31C25' : '#8E8E93'}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="store"
        options={{
          title: 'Store',
          tabBarIcon: ({ focused }) => (
            <IconSymbol
              name="cart.fill"
              size={28}
              color={focused ? '#E31C25' : '#8E8E93'}
            />
          ),
        }}
      />
    </Tabs>
  );
}
