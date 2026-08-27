import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, TextInput } from 'react-native';

// Font scaling modifications using defaultProps were removed as they are not supported in React 19 and crash React Native Web's LogBox.
import { Stack, Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import SplashScreen from '../app/splash';

import 'react-native-reanimated';

import { store } from '../store';
import { DrawerProvider, useDrawer } from '../context/DrawerContext';
import { ThemeProvider as AppThemeProvider, useTheme } from '../context/ThemeContext';
import DrawerMenu from '../components/common/DrawerMenu';

import { SessionProvider, useSession } from './ctx';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAppDispatch } from '../store/hooks';
import { fetchProfile } from '../features/auth/authSlice';

/* ---------------- Drawer + Navigation Wrapper ---------------- */

function AppShell() {
  const { drawerOpen, setDrawerOpen } = useDrawer() as any;
  const { session, isLoading } = useSession();
  const segments = useSegments();
  const router = useRouter();
  const { actualTheme } = useTheme();
  // const colorScheme = useColorScheme(); // Using context instead
  const dispatch = useAppDispatch();

  const [showSplash, setShowSplash] = useState(true); // splash visibility

  useEffect(() => {
    // Keep splash for at least 1.2s
    const timer = setTimeout(() => setShowSplash(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  // Fetch profile if session exists
  useEffect(() => {
    if (session && !isLoading) {
      dispatch(fetchProfile());
    }
  }, [session, isLoading, dispatch]);

  useEffect(() => {
    if (!isLoading) {
      const inAuthGroup = segments[0] === '(auth)';
      if (!session && !inAuthGroup) {
        router.replace('/(auth)/login');
      } else if (session && inAuthGroup) {
        router.replace('/(tabs)');
      }
    }
  }, [session, segments, isLoading]);

  if (isLoading || showSplash) {
    return <SplashScreen />;
  }

  return (
    <ThemeProvider value={actualTheme === 'dark' ? DarkTheme : DefaultTheme}>
      <View style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }} />

        {drawerOpen && (
          <DrawerMenu
            visible={drawerOpen}
            onClose={() => setDrawerOpen(false)}
          />
        )}

        <StatusBar style="auto" />
      </View>
    </ThemeProvider>
  );
}
/* ---------------- Root Layout ---------------- */

export default function RootLayout() {
  return (
    <Provider store={store}>
      <SessionProvider>
        <DrawerProvider>
          <AppThemeProvider>
            <AppShell />
          </AppThemeProvider>
        </DrawerProvider>
      </SessionProvider>
    </Provider>
  );
}
