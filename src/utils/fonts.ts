import { Platform } from 'react-native';
import * as Font from 'expo-font';

// Font family names - using system fonts with better fallbacks
export const FONT_FAMILIES = {
  // Arabic fonts for Quran text
  arabic: {
    primary: Platform.select({
      ios: 'GeezaPro-Bold', // Excellent Arabic font on iOS
      android: 'serif', // Android serif supports Arabic well
      default: 'serif',
    }),
    fallback: Platform.select({
      ios: 'Damascus', // Another good iOS Arabic font
      android: 'sans-serif', // Android fallback
      default: 'monospace',
    }),
  },
  // English fonts for UI text
  english: {
    primary: Platform.select({
      ios: 'San Francisco', // iOS system font
      android: 'Roboto', // Android system font
      default: 'system',
    }),
    secondary: Platform.select({
      ios: 'Helvetica Neue',
      android: 'sans-serif',
      default: 'sans-serif',
    }),
  },
};

/**
 * Get the best Arabic font with enhanced styling
 */
export const getArabicFont = (
  weight: 'regular' | 'bold' = 'regular',
  style: 'quran' | 'ui' = 'quran'
): string => {
  // For now, use system fonts optimized for Arabic
  if (Platform.OS === 'ios') {
    return weight === 'bold' ? 'GeezaPro-Bold' : 'GeezaPro';
  } else {
    return 'serif'; // Android serif handles Arabic well
  }
};

/**
 * Get the best English font
 */
export const getEnglishFont = (
  weight: 'regular' | 'medium' | 'semibold' | 'bold' = 'regular'
): string => {
  if (Platform.OS === 'ios') {
    switch (weight) {
      case 'bold':
      case 'semibold':
        return 'San Francisco';
      default:
        return 'San Francisco';
    }
  } else {
    return weight === 'bold' ? 'Roboto' : 'Roboto';
  }
};

/**
 * Enhanced Arabic text styles using optimized system fonts
 */
export const getArabicTextStyle = (
  fontSize: number = 18,
  customStyle?: any,
  variant: 'quran' | 'ui' = 'quran'
) => {
  const baseLineHeight = variant === 'quran' ? fontSize * 2.2 : fontSize * 1.8;
  
  // Platform-specific Arabic font optimization
  const fontFamily = Platform.select({
    ios: variant === 'quran' ? 'GeezaPro-Bold' : 'GeezaPro', // Excellent Arabic support on iOS
    android: 'serif', // Android serif handles Arabic well
    default: 'serif',
  });
  
  return {
    fontSize,
    fontFamily,
    textAlign: 'right' as const,
    lineHeight: baseLineHeight,
    fontWeight: variant === 'quran' ? '500' : '400' as const,
    letterSpacing: variant === 'quran' ? 1.2 : 0.8,
    writingDirection: 'rtl' as const,
    // Enhanced styling for better readability
    ...(Platform.OS === 'ios' && {
      textShadowColor: 'rgba(0, 0, 0, 0.1)',
      textShadowOffset: { width: 0, height: 0.5 },
      textShadowRadius: 1,
    }),
    ...customStyle,
  };
};

/**
 * Enhanced English text styles using system fonts
 */
export const getEnglishTextStyle = (
  fontSize: number = 16,
  weight: 'regular' | 'medium' | 'semibold' | 'bold' = 'regular',
  customStyle?: any
) => {
  const fontFamily = Platform.select({
    ios: 'San Francisco',
    android: 'Roboto',
    default: 'system',
  });

  const fontWeight = weight === 'bold' ? '700' : 
                    weight === 'semibold' ? '600' : 
                    weight === 'medium' ? '500' : '400';

  return {
    fontSize,
    fontFamily,
    lineHeight: fontSize * 1.5,
    letterSpacing: 0.3,
    textAlign: 'left' as const,
    fontWeight,
    ...customStyle,
  };
};

/**
 * Typography presets optimized for Quran app
 */
export const TYPOGRAPHY_PRESETS = {
  // Quran text styles - optimized for readability
  quranVerse: (size: number = 20) => getArabicTextStyle(size, {
    lineHeight: size * 2.4,
    letterSpacing: 1.5,
    fontWeight: '500',
  }, 'quran'),
  
  quranTitle: (size: number = 24) => getArabicTextStyle(size, {
    fontWeight: '600',
    lineHeight: size * 2.2,
    letterSpacing: 1.2,
  }, 'quran'),
  
  // App UI text styles
  appTitle: (size: number = 28) => getEnglishTextStyle(size, 'bold', {
    lineHeight: size * 1.3,
    letterSpacing: -0.5,
  }),
  
  sectionTitle: (size: number = 20) => getEnglishTextStyle(size, 'semibold', {
    lineHeight: size * 1.4,
  }),
  
  bodyText: (size: number = 16) => getEnglishTextStyle(size, 'regular'),
  
  bodyBold: (size: number = 16) => getEnglishTextStyle(size, 'semibold'),
  
  caption: (size: number = 14) => getEnglishTextStyle(size, 'regular', {
    opacity: 0.8,
    lineHeight: size * 1.4,
  }),
  
  // Arabic UI elements
  arabicButton: (size: number = 16) => getArabicTextStyle(size, {
    fontWeight: '500',
    lineHeight: size * 1.6,
  }, 'ui'),
  
  arabicLabel: (size: number = 14) => getArabicTextStyle(size, {
    lineHeight: size * 1.8,
  }, 'ui'),
  
  // Specialized for Surah names
  surahNameArabic: (size: number = 18) => getArabicTextStyle(size, {
    fontWeight: '600',
    lineHeight: size * 1.9,
    letterSpacing: 1.0,
    // Special styling for Surah names
    ...(Platform.OS === 'ios' && {
      fontFamily: 'GeezaPro-Bold',
    }),
  }, 'ui'),
  
  surahNameEnglish: (size: number = 16) => getEnglishTextStyle(size, 'semibold', {
    letterSpacing: 0.5,
  }),
  
  // Enhanced search result styles
  searchResultArabic: (size: number = 18) => getArabicTextStyle(size, {
    lineHeight: size * 2.1,
    letterSpacing: 1.0,
    fontWeight: '500',
  }, 'quran'),
  
  searchResultTranslation: (size: number = 15) => getEnglishTextStyle(size, 'regular', {
    lineHeight: size * 1.6,
    color: 'rgba(0,0,0,0.8)',
  }),
};

/**
 * Initialize font system (using optimized system fonts)
 */
export const initializeFonts = async (): Promise<boolean> => {
  try {
    console.log('✅ Font system initialized with optimized system fonts');
    console.log('📱 Platform:', Platform.OS);
    console.log('🔤 Arabic font:', Platform.OS === 'ios' ? 'GeezaPro' : 'serif');
    console.log('🔤 English font:', Platform.OS === 'ios' ? 'San Francisco' : 'Roboto');
    return true;
  } catch (error) {
    console.warn('⚠️ Font initialization failed:', error);
    return false;
  }
};

/**
 * Check if custom fonts are available (false for system fonts)
 */
export const areCustomFontsLoaded = (): boolean => {
  return false; // Using optimized system fonts
};

export default {
  initializeFonts,
  areCustomFontsLoaded,
  getArabicFont,
  getEnglishFont,
  getArabicTextStyle,
  getEnglishTextStyle,
  TYPOGRAPHY_PRESETS,
  FONT_FAMILIES,
}; 