import { useColorScheme } from 'react-native';
import { useTasbeeh } from '../contexts/TasbeehContext';

export function useAppTheme() {
  const systemTheme = useColorScheme();
  const { settings } = useTasbeeh();
  
  // Determine effective theme based on settings
  const effectiveTheme = settings.theme === 'auto' 
    ? systemTheme || 'light' 
    : settings.theme;
  
  const isDark = effectiveTheme === 'dark';
  
  return {
    theme: effectiveTheme,
    isDark,
    systemTheme,
    userTheme: settings.theme,
  };
} 