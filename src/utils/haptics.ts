/**
 * Enhanced Haptic Feedback Utility
 * Provides contextual haptic patterns for different counting scenarios
 */
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export interface HapticPattern {
  type: Haptics.ImpactFeedbackStyle;
  delay?: number;
  repeat?: number;
}

export class HapticManager {
  private static instance: HapticManager;
  private isEnabled: boolean = true;
  private lastHapticTime: number = 0;
  private readonly MIN_HAPTIC_INTERVAL = 50; // Minimum 50ms between haptics

  static getInstance(): HapticManager {
    if (!HapticManager.instance) {
      HapticManager.instance = new HapticManager();
    }
    return HapticManager.instance;
  }

  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Play contextual haptic feedback based on count and target
   */
  async playCountHaptic(count: number, target?: number): Promise<void> {
    if (!this.shouldPlayHaptic()) return;

    const pattern = this.getCountPattern(count, target);
    await this.playPattern(pattern);
  }

  /**
   * Play achievement haptic feedback
   */
  async playAchievementHaptic(achievementType: 'milestone' | 'target' | 'level' | 'streak'): Promise<void> {
    if (!this.shouldPlayHaptic()) return;

    const pattern = this.getAchievementPattern(achievementType);
    await this.playPattern(pattern);
  }

  /**
   * Play simple increment haptic
   */
  async playSimpleHaptic(): Promise<void> {
    if (!this.shouldPlayHaptic()) return;
    
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      this.lastHapticTime = Date.now();
    } catch (error) {
      // Silently handle haptic errors
    }
  }

  /**
   * Play error haptic
   */
  async playErrorHaptic(): Promise<void> {
    if (!this.shouldPlayHaptic()) return;

    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      this.lastHapticTime = Date.now();
    } catch (error) {
      // Silently handle haptic errors
    }
  }

  /**
   * Play success haptic
   */
  async playSuccessHaptic(): Promise<void> {
    if (!this.shouldPlayHaptic()) return;

    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      this.lastHapticTime = Date.now();
    } catch (error) {
      // Silently handle haptic errors
    }
  }

  private shouldPlayHaptic(): boolean {
    if (!this.isEnabled || Platform.OS === 'web') return false;
    
    const now = Date.now();
    if (now - this.lastHapticTime < this.MIN_HAPTIC_INTERVAL) return false;
    
    return true;
  }

  private getCountPattern(count: number, target?: number): HapticPattern {
    // Target achieved - strongest feedback
    if (target && count === target) {
      return { type: Haptics.ImpactFeedbackStyle.Heavy };
    }

    // Tasbih complete (33, 66, 99, etc.)
    if (count % 33 === 0) {
      return { type: Haptics.ImpactFeedbackStyle.Medium };
    }

    // Hundred milestone
    if (count % 100 === 0) {
      return { type: Haptics.ImpactFeedbackStyle.Medium };
    }

    // Ten milestone
    if (count % 10 === 0) {
      return { type: Haptics.ImpactFeedbackStyle.Light };
    }

    // Regular count
    return { type: Haptics.ImpactFeedbackStyle.Light };
  }

  private getAchievementPattern(type: 'milestone' | 'target' | 'level' | 'streak'): HapticPattern {
    switch (type) {
      case 'level':
        return { type: Haptics.ImpactFeedbackStyle.Heavy, repeat: 2, delay: 100 };
      case 'milestone':
        return { type: Haptics.ImpactFeedbackStyle.Heavy };
      case 'target':
        return { type: Haptics.ImpactFeedbackStyle.Medium, repeat: 3, delay: 80 };
      case 'streak':
        return { type: Haptics.ImpactFeedbackStyle.Medium, repeat: 2, delay: 120 };
      default:
        return { type: Haptics.ImpactFeedbackStyle.Light };
    }
  }

  private async playPattern(pattern: HapticPattern): Promise<void> {
    try {
      await Haptics.impactAsync(pattern.type);
      this.lastHapticTime = Date.now();

      // Play repeated haptics if specified
      if (pattern.repeat && pattern.repeat > 1 && pattern.delay) {
        for (let i = 1; i < pattern.repeat; i++) {
          await new Promise(resolve => setTimeout(resolve, pattern.delay));
          await Haptics.impactAsync(pattern.type);
        }
      }
    } catch (error) {
      // Silently handle haptic errors
    }
  }
}

// Export singleton instance
export const hapticManager = HapticManager.getInstance();

// Convenience functions
export const playCountHaptic = (count: number, target?: number) => 
  hapticManager.playCountHaptic(count, target);

export const playAchievementHaptic = (type: 'milestone' | 'target' | 'level' | 'streak') => 
  hapticManager.playAchievementHaptic(type);

export const playSimpleHaptic = () => 
  hapticManager.playSimpleHaptic();

export const playErrorHaptic = () => 
  hapticManager.playErrorHaptic();

export const playSuccessHaptic = () => 
  hapticManager.playSuccessHaptic();

export const setHapticsEnabled = (enabled: boolean) => 
  hapticManager.setEnabled(enabled);

// Export hapticFeedback object for backward compatibility
export const hapticFeedback = {
  light: async () => {
    try {
      await playSimpleHaptic();
    } catch (error) {
      // Silently handle haptic errors
    }
  },
  success: async () => {
    try {
      await playSuccessHaptic();
    } catch (error) {
      // Silently handle haptic errors
    }
  },
  error: async () => {
    try {
      await playErrorHaptic();
    } catch (error) {
      // Silently handle haptic errors
    }
  }
}; 