import { useColorScheme } from 'react-native';
import { useTasbeeh } from '../contexts/TasbeehContext';

// Enhanced theme type definitions
export type ThemeName = 'auto' | 'light' | 'dark' | 'medina' | 'fzhh-blue' | 'white-gold';

export interface ThemeColors {
  // Primary brand colors
  primary: string;
  primaryLight: string;
  primaryDark: string;
  
  // Secondary colors
  secondary: string;
  secondaryLight: string;
  secondaryDark: string;
  
  // Accent color
  accent: string;
  accentLight: string;
  
  // Background colors
  background: string;
  surface: string;
  surfaceVariant: string;
  
  // Text colors
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    inverse: string;
    onPrimary: string;
    onSecondary: string;
    onAccent: string;
  };
  
  // Border and divider colors
  border: string;
  borderLight: string;
  divider: string;
  
  // Status colors
  success: string;
  warning: string;
  error: string;
  info: string;
  
  // Islamic themed colors
  islamic: {
    green: string;
    gold: string;
    navy: string;
    cream: string;
  };
  
  // Component specific colors
  card: string;
  modal: string;
  overlay: string;
  shadow: string;
}

export interface ThemeDefinition {
  name: ThemeName;
  displayName: string;
  description: string;
  isDark: boolean;
  colors: ThemeColors;
}

// Theme definitions
const themes: Record<ThemeName, ThemeDefinition> = {
  auto: {
    name: 'auto',
    displayName: 'Auto',
    description: 'Follow system theme',
    isDark: false, // Will be determined dynamically
    colors: {} as ThemeColors, // Will be resolved dynamically
  },
  
  light: {
    name: 'light',
    displayName: 'Light',
    description: 'Classic light theme',
    isDark: false,
    colors: {
      primary: '#22C55E',
      primaryLight: '#4ADE80',
      primaryDark: '#16A34A',
      
      secondary: '#3B82F6',
      secondaryLight: '#60A5FA',
      secondaryDark: '#2563EB',
      
      accent: '#8B5CF6',
      accentLight: '#A78BFA',
      
      background: '#FFFFFF',
      surface: '#F8FAFC',
      surfaceVariant: '#F1F5F9',
      
      text: {
        primary: '#1E293B',
        secondary: '#64748B',
        tertiary: '#94A3B8',
        inverse: '#FFFFFF',
        onPrimary: '#FFFFFF',
        onSecondary: '#FFFFFF',
        onAccent: '#FFFFFF',
      },
      
      border: '#E2E8F0',
      borderLight: '#F1F5F9',
      divider: '#E5E7EB',
      
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#3B82F6',
      
      islamic: {
        green: '#22C55E',
        gold: '#F59E0B',
        navy: '#1E40AF',
        cream: '#FEF7ED',
      },
      
      card: '#FFFFFF',
      modal: '#FFFFFF',
      overlay: 'rgba(0, 0, 0, 0.5)',
      shadow: 'rgba(0, 0, 0, 0.1)',
    },
  },
  
  dark: {
    name: 'dark',
    displayName: 'Dark',
    description: 'Enhanced dark theme with Islamic aesthetics',
    isDark: true,
    colors: {
      primary: '#22C55E',
      primaryLight: '#4ADE80',
      primaryDark: '#16A34A',
      
      secondary: '#3B82F6',
      secondaryLight: '#60A5FA',
      secondaryDark: '#1D4ED8',
      
      accent: '#F59E0B',
      accentLight: '#FBBF24',
      
      background: '#0F172A',
      surface: '#1E293B',
      surfaceVariant: '#334155',
      
      text: {
        primary: '#F8FAFC',
        secondary: '#CBD5E1',
        tertiary: '#94A3B8',
        inverse: '#1E293B',
        onPrimary: '#FFFFFF',
        onSecondary: '#FFFFFF',
        onAccent: '#1E293B',
      },
      
      border: '#334155',
      borderLight: '#475569',
      divider: '#334155',
      
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#3B82F6',
      
      islamic: {
        green: '#22C55E',
        gold: '#F59E0B',
        navy: '#1E40AF',
        cream: '#FEF7ED',
      },
      
      card: '#1E293B',
      modal: '#1E293B',
      overlay: 'rgba(0, 0, 0, 0.8)',
      shadow: 'rgba(0, 0, 0, 0.3)',
    },
  },
  
  medina: {
    name: 'medina',
    displayName: 'Medina Munawara',
    description: 'Sacred green theme inspired by the holy city',
    isDark: false,
    colors: {
      primary: '#059669',
      primaryLight: '#10B981',
      primaryDark: '#047857',
      
      secondary: '#0D9488',
      secondaryLight: '#14B8A6',
      secondaryDark: '#0F766E',
      
      accent: '#D97706',
      accentLight: '#F59E0B',
      
      background: '#F0FDF4',
      surface: '#ECFDF5',
      surfaceVariant: '#D1FAE5',
      
      text: {
        primary: '#064E3B',
        secondary: '#047857',
        tertiary: '#059669',
        inverse: '#F0FDF4',
        onPrimary: '#FFFFFF',
        onSecondary: '#FFFFFF',
        onAccent: '#FFFFFF',
      },
      
      border: '#A7F3D0',
      borderLight: '#D1FAE5',
      divider: '#BBF7D0',
      
      success: '#10B981',
      warning: '#F59E0B',
      error: '#DC2626',
      info: '#0D9488',
      
      islamic: {
        green: '#059669',
        gold: '#D97706',
        navy: '#1E40AF',
        cream: '#FEF7ED',
      },
      
      card: '#FFFFFF',
      modal: '#FFFFFF',
      overlay: 'rgba(6, 78, 59, 0.5)',
      shadow: 'rgba(5, 150, 105, 0.2)',
    },
  },
  
  'fzhh-blue': {
    name: 'fzhh-blue',
    displayName: 'FZHH Blue',
    description: 'Professional charity organization theme',
    isDark: false,
    colors: {
      primary: '#2563EB',
      primaryLight: '#3B82F6',
      primaryDark: '#1D4ED8',
      
      secondary: '#0EA5E9',
      secondaryLight: '#38BDF8',
      secondaryDark: '#0284C7',
      
      accent: '#059669',
      accentLight: '#10B981',
      
      background: '#F8FAFC',
      surface: '#FFFFFF',
      surfaceVariant: '#F1F5F9',
      
      text: {
        primary: '#1E293B',
        secondary: '#475569',
        tertiary: '#64748B',
        inverse: '#FFFFFF',
        onPrimary: '#FFFFFF',
        onSecondary: '#FFFFFF',
        onAccent: '#FFFFFF',
      },
      
      border: '#CBD5E1',
      borderLight: '#E2E8F0',
      divider: '#E5E7EB',
      
      success: '#059669',
      warning: '#F59E0B',
      error: '#DC2626',
      info: '#2563EB',
      
      islamic: {
        green: '#059669',
        gold: '#D97706',
        navy: '#1E40AF',
        cream: '#FEF7ED',
      },
      
      card: '#FFFFFF',
      modal: '#FFFFFF',
      overlay: 'rgba(37, 99, 235, 0.5)',
      shadow: 'rgba(37, 99, 235, 0.1)',
    },
  },
  
  'white-gold': {
    name: 'white-gold',
    displayName: 'White & Gold',
    description: 'Elegant luxury theme with golden accents',
    isDark: false,
    colors: {
      primary: '#D97706',
      primaryLight: '#F59E0B',
      primaryDark: '#B45309',
      
      secondary: '#92400E',
      secondaryLight: '#D97706',
      secondaryDark: '#78350F',
      
      accent: '#7C2D12',
      accentLight: '#DC2626',
      
      background: '#FFFBEB',
      surface: '#FFFFFF',
      surfaceVariant: '#FEF3C7',
      
      text: {
        primary: '#78350F',
        secondary: '#92400E',
        tertiary: '#A16207',
        inverse: '#FFFBEB',
        onPrimary: '#FFFFFF',
        onSecondary: '#FFFFFF',
        onAccent: '#FFFFFF',
      },
      
      border: '#FDE68A',
      borderLight: '#FEF3C7',
      divider: '#FBBF24',
      
      success: '#059669',
      warning: '#F59E0B',
      error: '#DC2626',
      info: '#2563EB',
      
      islamic: {
        green: '#059669',
        gold: '#D97706',
        navy: '#1E40AF',
        cream: '#FEF7ED',
      },
      
      card: '#FFFFFF',
      modal: '#FFFFFF',
      overlay: 'rgba(217, 119, 6, 0.5)',
      shadow: 'rgba(217, 119, 6, 0.15)',
    },
  },
};

// Enhanced theme hook
export function useAppTheme() {
  const systemTheme = useColorScheme();
  const { settings } = useTasbeeh();
  
  // Get user's selected theme or default to 'auto'
  const selectedTheme = (settings.theme as ThemeName) || 'auto';
  
  // Resolve the actual theme to use
  let resolvedTheme: ThemeName;
  if (selectedTheme === 'auto') {
    resolvedTheme = systemTheme === 'dark' ? 'dark' : 'light';
  } else {
    resolvedTheme = selectedTheme;
  }
  
  // Get theme definition
  const themeDefinition = themes[resolvedTheme];
  
  // For backward compatibility
  const isDark = themeDefinition.isDark;
  
  return {
    // New enhanced theme system
    theme: resolvedTheme,
    themeDefinition,
    colors: themeDefinition.colors,
    
    // Backward compatibility
    isDark,
    systemTheme,
    userTheme: selectedTheme,
    
    // Theme utilities
    isSystemTheme: selectedTheme === 'auto',
    availableThemes: Object.values(themes).filter(t => t.name !== 'auto'),
  };
}

// Utility function to get all available themes
export function getAvailableThemes(): ThemeDefinition[] {
  return Object.values(themes).filter(theme => theme.name !== 'auto');
}

// Utility function to get theme by name
export function getThemeByName(name: ThemeName): ThemeDefinition | undefined {
  return themes[name];
}

// Legacy support - maintain existing color system
export const THEME_COLORS = {
  primary: {
    green: '#22C55E',
    blue: '#3B82F6',
    purple: '#8B5CF6',
    orange: '#F97316',
    pink: '#EC4899',
    teal: '#14B8A6',
    indigo: '#6366F1',
    emerald: '#10B981',
  },
  neutral: {
    white: '#FFFFFF',
    gray50: '#F9FAFB',
    gray100: '#F3F4F6',
    gray200: '#E5E7EB',
    gray300: '#D1D5DB',
    gray400: '#9CA3AF',
    gray500: '#6B7280',
    gray600: '#4B5563',
    gray700: '#374151',
    gray800: '#1F2937',
    gray900: '#111827',
    black: '#000000',
  },
  semantic: {
    error: '#EF4444',
    warning: '#F59E0B',
    success: '#10B981',
    info: '#3B82F6',
  },
} as const; 