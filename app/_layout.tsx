import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import 'react-native-reanimated';

import { TasbeehProvider } from '../src/contexts/TasbeehContext';
import { PrayerTimesProvider } from '../src/contexts/PrayerTimesContext';
import { QuranProvider } from '../src/contexts/QuranContext';
import { GlobalActionProvider } from '../src/contexts/GlobalActionContext';
import ErrorBoundary from '../src/components/ErrorBoundary';
import { PrayerTimesErrorBoundary } from '../src/components/PrayerTimesErrorBoundary';
import AudioPlayerComponent from '../src/components/AudioPlayerComponent';
import UnifiedAudioPlayerComponent from '../src/components/UnifiedAudioPlayerComponent';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    // Hide splash screen after a short delay to allow contexts to initialize
    const timer = setTimeout(() => {
      SplashScreen.hideAsync();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <ErrorBoundary>
        <TasbeehProvider>
          <PrayerTimesProvider>
            <PrayerTimesErrorBoundary>
              <QuranProvider>
                <GlobalActionProvider>
                  {/* Global Audio Components - Hidden service components */}
                  <AudioPlayerComponent />
                  <UnifiedAudioPlayerComponent />
                  
                  <Stack>
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    <Stack.Screen name="auth" options={{ presentation: 'modal' }} />
                    <Stack.Screen name="+not-found" />
                  </Stack>
                </GlobalActionProvider>
              </QuranProvider>
            </PrayerTimesErrorBoundary>
          </PrayerTimesProvider>
        </TasbeehProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
} 