/**
 * Accessibility Utilities
 * Provides comprehensive accessibility support for screen readers, keyboard navigation, and inclusive design
 */
import { AccessibilityInfo, Platform } from 'react-native';
import { secureLogger } from './secureLogger';

export interface AccessibilityConfig {
  isScreenReaderEnabled: boolean;
  isReduceMotionEnabled: boolean;
  isBoldTextEnabled: boolean;
  isGrayscaleEnabled: boolean;
  isInvertColorsEnabled: boolean;
  preferredContentSizeCategory: string;
}

export interface AccessibilityLabel {
  label: string;
  hint?: string;
  role?: 'button' | 'text' | 'image' | 'none' | 'link' | 'search' | 'keyboardkey' | 'header' | 'summary' | 'alert' | 'checkbox' | 'combobox' | 'menu' | 'menubar' | 'menuitem' | 'progressbar' | 'radio' | 'radiogroup' | 'scrollbar' | 'spinbutton' | 'switch' | 'tab' | 'tablist' | 'timer' | 'toolbar';
  state?: {
    disabled?: boolean;
    selected?: boolean;
    checked?: boolean | 'mixed';
    expanded?: boolean;
    busy?: boolean;
  };
  value?: {
    min?: number;
    max?: number;
    now?: number;
    text?: string;
  };
}

export class AccessibilityManager {
  private static instance: AccessibilityManager;
  private config: AccessibilityConfig = {
    isScreenReaderEnabled: false,
    isReduceMotionEnabled: false,
    isBoldTextEnabled: false,
    isGrayscaleEnabled: false,
    isInvertColorsEnabled: false,
    preferredContentSizeCategory: 'medium',
  };
  private listeners: Set<(config: AccessibilityConfig) => void> = new Set();

  static getInstance(): AccessibilityManager {
    if (!AccessibilityManager.instance) {
      AccessibilityManager.instance = new AccessibilityManager();
    }
    return AccessibilityManager.instance;
  }

  constructor() {
    this.initializeAccessibility();
  }

  /**
   * Initialize accessibility monitoring
   */
  private async initializeAccessibility() {
    try {
      // Check initial accessibility states
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        this.config.isScreenReaderEnabled = await AccessibilityInfo.isScreenReaderEnabled();
        this.config.isReduceMotionEnabled = await AccessibilityInfo.isReduceMotionEnabled();
        this.config.isBoldTextEnabled = await AccessibilityInfo.isBoldTextEnabled();
        
        if (Platform.OS === 'ios') {
          this.config.isGrayscaleEnabled = await AccessibilityInfo.isGrayscaleEnabled();
          this.config.isInvertColorsEnabled = await AccessibilityInfo.isInvertColorsEnabled();
        }

        // Set up event listeners
        AccessibilityInfo.addEventListener('screenReaderChanged', this.handleScreenReaderChange);
        AccessibilityInfo.addEventListener('reduceMotionChanged', this.handleReduceMotionChange);
        AccessibilityInfo.addEventListener('boldTextChanged', this.handleBoldTextChange);
        
        if (Platform.OS === 'ios') {
          AccessibilityInfo.addEventListener('grayscaleChanged', this.handleGrayscaleChange);
          AccessibilityInfo.addEventListener('invertColorsChanged', this.handleInvertColorsChange);
        }
      }

      secureLogger.info('Accessibility initialized', this.config, 'AccessibilityManager');
    } catch (error) {
      secureLogger.error('Failed to initialize accessibility', error, 'AccessibilityManager');
    }
  }

  /**
   * Get current accessibility configuration
   */
  getConfig(): AccessibilityConfig {
    return { ...this.config };
  }

  /**
   * Subscribe to accessibility changes
   */
  onChange(listener: (config: AccessibilityConfig) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Create accessibility props for counter display
   */
  getCounterAccessibilityProps(count: number, counterName: string, target?: number): any {
    const progress = target ? Math.min((count / target) * 100, 100) : 0;
    const targetText = target ? ` out of ${target}` : '';
    
    return {
      accessible: true,
      accessibilityRole: 'text' as const,
      accessibilityLabel: `${counterName} counter: ${count}${targetText}`,
      accessibilityHint: target 
        ? `${progress.toFixed(0)}% complete. Tap to increment counter.`
        : 'Tap to increment counter.',
      accessibilityValue: target ? {
        min: 0,
        max: target,
        now: count,
        text: `${count} of ${target}`,
      } : undefined,
    };
  }

  /**
   * Create accessibility props for action buttons
   */
  getButtonAccessibilityProps(action: string, description?: string, isDisabled?: boolean): any {
    return {
      accessible: true,
      accessibilityRole: 'button' as const,
      accessibilityLabel: action,
      accessibilityHint: description,
      accessibilityState: {
        disabled: isDisabled || false,
      },
    };
  }

  /**
   * Create accessibility props for progress indicators
   */
  getProgressAccessibilityProps(current: number, total: number, label: string): any {
    const percentage = Math.round((current / total) * 100);
    
    return {
      accessible: true,
      accessibilityRole: 'progressbar' as const,
      accessibilityLabel: `${label} progress`,
      accessibilityValue: {
        min: 0,
        max: total,
        now: current,
        text: `${percentage}% complete`,
      },
      accessibilityHint: `${current} out of ${total} completed`,
    };
  }

  /**
   * Create accessibility props for navigation tabs
   */
  getTabAccessibilityProps(tabName: string, isSelected: boolean, tabIndex: number, totalTabs: number): any {
    return {
      accessible: true,
      accessibilityRole: 'tab' as const,
      accessibilityLabel: tabName,
      accessibilityHint: `Tab ${tabIndex + 1} of ${totalTabs}`,
      accessibilityState: {
        selected: isSelected,
      },
    };
  }

  /**
   * Create accessibility props for settings toggles
   */
  getToggleAccessibilityProps(setting: string, isEnabled: boolean, description?: string): any {
    return {
      accessible: true,
      accessibilityRole: 'switch' as const,
      accessibilityLabel: setting,
      accessibilityHint: description || `Toggle ${setting}`,
      accessibilityState: {
        checked: isEnabled,
      },
    };
  }

  /**
   * Create accessibility props for achievement notifications
   */
  getAchievementAccessibilityProps(achievement: string, description: string): any {
    return {
      accessible: true,
      accessibilityRole: 'alert' as const,
      accessibilityLabel: `Achievement unlocked: ${achievement}`,
      accessibilityHint: description,
      accessibilityLiveRegion: 'polite' as const,
    };
  }

  /**
   * Create accessibility props for session stats
   */
  getStatsAccessibilityProps(statName: string, value: string | number, unit?: string): any {
    const valueText = unit ? `${value} ${unit}` : value.toString();
    
    return {
      accessible: true,
      accessibilityRole: 'text' as const,
      accessibilityLabel: `${statName}: ${valueText}`,
    };
  }

  /**
   * Get font scale factor for better readability
   */
  getFontScale(): number {
    if (this.config.isBoldTextEnabled) {
      return 1.1; // Slightly larger for bold text users
    }
    return 1.0;
  }

  /**
   * Get animation configuration based on reduce motion preference
   */
  getAnimationConfig(): { duration: number; useNativeDriver: boolean; enableAnimations: boolean } {
    return {
      duration: this.config.isReduceMotionEnabled ? 0 : 300,
      useNativeDriver: true,
      enableAnimations: !this.config.isReduceMotionEnabled,
    };
  }

  /**
   * Announce important information to screen readers
   */
  announceToScreenReader(message: string): void {
    if (this.config.isScreenReaderEnabled) {
      AccessibilityInfo.announceForAccessibility(message);
    }
  }

  /**
   * Set accessibility focus on element
   */
  setAccessibilityFocus(reactTag: number): void {
    if (this.config.isScreenReaderEnabled) {
      AccessibilityInfo.setAccessibilityFocus(reactTag);
    }
  }

  /**
   * Check if user prefers high contrast
   */
  prefersHighContrast(): boolean {
    return this.config.isInvertColorsEnabled || this.config.isGrayscaleEnabled;
  }

  /**
   * Get color adjustments for accessibility
   */
  getAccessibleColors(theme: 'light' | 'dark'): {
    primaryText: string;
    secondaryText: string;
    background: string;
    surface: string;
    border: string;
    focus: string;
  } {
    const isHighContrast = this.prefersHighContrast();
    
    if (theme === 'dark') {
      return {
        primaryText: isHighContrast ? '#FFFFFF' : '#F8F9FA',
        secondaryText: isHighContrast ? '#E0E0E0' : '#DEE2E6',
        background: isHighContrast ? '#000000' : '#1A1A1A',
        surface: isHighContrast ? '#1A1A1A' : '#2D2D2D',
        border: isHighContrast ? '#FFFFFF' : '#404040',
        focus: '#FFD700', // High contrast yellow for focus
      };
    }
    
    return {
      primaryText: isHighContrast ? '#000000' : '#212529',
      secondaryText: isHighContrast ? '#333333' : '#6C757D',
      background: isHighContrast ? '#FFFFFF' : '#F8F9FA',
      surface: isHighContrast ? '#F0F0F0' : '#FFFFFF',
      border: isHighContrast ? '#000000' : '#DEE2E6',
      focus: '#0066CC', // High contrast blue for focus
    };
  }

  /**
   * Generate semantic labels for Islamic counting
   */
  getIslamicCountingLabels(count: number, type: 'tasbih' | 'tahmid' | 'takbir' | 'asma' | 'general' = 'general'): string {
    const typeLabels = {
      tasbih: 'Subhan Allah',
      tahmid: 'Alhamdulillah', 
      takbir: 'Allahu Akbar',
      asma: 'Beautiful Names of Allah',
      general: 'Dhikr',
    };

    const typeName = typeLabels[type];
    
    // Provide context for common Islamic counting milestones
    if (count === 33) {
      return `${typeName} count: ${count}. Completed one round of Tasbih.`;
    } else if (count === 99) {
      return `${typeName} count: ${count}. Completed Asma ul Husna or three rounds of Tasbih.`;
    } else if (count === 100) {
      return `${typeName} count: ${count}. Completed one hundred recitations.`;
    } else if (count % 33 === 0) {
      const rounds = count / 33;
      return `${typeName} count: ${count}. Completed ${rounds} rounds of Tasbih.`;
    }
    
    return `${typeName} count: ${count}`;
  }

  // Event handlers
  private handleScreenReaderChange = (isEnabled: boolean) => {
    this.config.isScreenReaderEnabled = isEnabled;
    this.notifyListeners();
    secureLogger.info('Screen reader state changed', { isEnabled }, 'AccessibilityManager');
  };

  private handleReduceMotionChange = (isEnabled: boolean) => {
    this.config.isReduceMotionEnabled = isEnabled;
    this.notifyListeners();
    secureLogger.info('Reduce motion state changed', { isEnabled }, 'AccessibilityManager');
  };

  private handleBoldTextChange = (isEnabled: boolean) => {
    this.config.isBoldTextEnabled = isEnabled;
    this.notifyListeners();
    secureLogger.info('Bold text state changed', { isEnabled }, 'AccessibilityManager');
  };

  private handleGrayscaleChange = (isEnabled: boolean) => {
    this.config.isGrayscaleEnabled = isEnabled;
    this.notifyListeners();
    secureLogger.info('Grayscale state changed', { isEnabled }, 'AccessibilityManager');
  };

  private handleInvertColorsChange = (isEnabled: boolean) => {
    this.config.isInvertColorsEnabled = isEnabled;
    this.notifyListeners();
    secureLogger.info('Invert colors state changed', { isEnabled }, 'AccessibilityManager');
  };

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.config));
  }

  /**
   * Cleanup listeners
   */
  destroy(): void {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      AccessibilityInfo.removeEventListener('screenReaderChanged', this.handleScreenReaderChange);
      AccessibilityInfo.removeEventListener('reduceMotionChanged', this.handleReduceMotionChange);
      AccessibilityInfo.removeEventListener('boldTextChanged', this.handleBoldTextChange);
      
      if (Platform.OS === 'ios') {
        AccessibilityInfo.removeEventListener('grayscaleChanged', this.handleGrayscaleChange);
        AccessibilityInfo.removeEventListener('invertColorsChanged', this.handleInvertColorsChange);
      }
    }
    this.listeners.clear();
  }
}

// Export singleton instance
export const accessibilityManager = AccessibilityManager.getInstance();

// Convenience functions
export const getCounterA11yProps = (count: number, name: string, target?: number) =>
  accessibilityManager.getCounterAccessibilityProps(count, name, target);

export const getButtonA11yProps = (action: string, description?: string, isDisabled?: boolean) =>
  accessibilityManager.getButtonAccessibilityProps(action, description, isDisabled);

export const getProgressA11yProps = (current: number, total: number, label: string) =>
  accessibilityManager.getProgressAccessibilityProps(current, total, label);

export const getToggleA11yProps = (setting: string, isEnabled: boolean, description?: string) =>
  accessibilityManager.getToggleAccessibilityProps(setting, isEnabled, description);

export const announceToScreenReader = (message: string) =>
  accessibilityManager.announceToScreenReader(message);

export const getAnimationConfig = () =>
  accessibilityManager.getAnimationConfig();

export const getFontScale = () =>
  accessibilityManager.getFontScale();

export const getAccessibleColors = (theme: 'light' | 'dark') =>
  accessibilityManager.getAccessibleColors(theme);

export const getIslamicCountingLabels = (count: number, type?: 'tasbih' | 'tahmid' | 'takbir' | 'asma' | 'general') =>
  accessibilityManager.getIslamicCountingLabels(count, type); 