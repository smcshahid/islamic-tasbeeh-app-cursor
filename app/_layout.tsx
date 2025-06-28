import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { TasbeehProvider } from '../src/contexts/TasbeehContext';
import { PrayerTimesProvider } from '../src/contexts/PrayerTimesContext';
import ErrorBoundary from '../src/components/ErrorBoundary';
import AudioPlayerComponent from '../src/components/AudioPlayerComponent';
import { initializePrayerNotifications } from '../src/utils/prayerNotifications';

// Prevent the splash screen from auto-hiding before asset loading is complete
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    // Initialize app services
    const initializeApp = async () => {
      try {
        // Initialize prayer notifications service
        await initializePrayerNotifications();
        
        // Hide splash screen after initialization
        setTimeout(() => {
          SplashScreen.hideAsync();
        }, 1500);
      } catch (error) {
        console.error('Error initializing app:', error);
        // Hide splash screen even if initialization fails
        setTimeout(() => {
          SplashScreen.hideAsync();
        }, 1000);
      }
    };

    initializeApp();
  }, []);

  return (
    <ErrorBoundary>
      <TasbeehProvider>
        <PrayerTimesProvider>
          <AudioPlayerComponent />
          <StatusBar style="auto" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="auth" />
          </Stack>
        </PrayerTimesProvider>
      </TasbeehProvider>
    </ErrorBoundary>
  );
} 