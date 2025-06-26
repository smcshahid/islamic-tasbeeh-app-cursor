import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { TasbeehProvider } from '../src/contexts/TasbeehContext';
import ErrorBoundary from '../src/components/ErrorBoundary';

// Prevent the splash screen from auto-hiding before asset loading is complete
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    // Hide splash screen after a short delay to ensure app is ready
    const timer = setTimeout(() => {
      SplashScreen.hideAsync();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <ErrorBoundary>
      <TasbeehProvider>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="auth" />
        </Stack>
      </TasbeehProvider>
    </ErrorBoundary>
  );
} 