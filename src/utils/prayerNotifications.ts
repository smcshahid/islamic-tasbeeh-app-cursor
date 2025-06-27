import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { secureLogger } from './secureLogger';
import { audioService } from './audioService';
import { hapticFeedback } from './haptics';
import { PrayerName, PrayerTime, DayPrayerTimes, PrayerSettings } from '../types';

// Background task name
const PRAYER_NOTIFICATION_TASK = 'prayer-notification-background-task';
const DAILY_UPDATE_TASK = 'daily-prayer-update-task';

// Storage keys
const SCHEDULED_NOTIFICATIONS_KEY = 'scheduled_prayer_notifications';
const SNOOZE_INFO_KEY = 'prayer_snooze_info';
const LAST_NOTIFICATION_DATE_KEY = 'last_notification_date';

export interface ScheduledNotification {
  id: string;
  prayer: PrayerName;
  time: string;
  date: string;
  isScheduled: boolean;
}

export interface SnoozeInfo {
  prayer: PrayerName;
  originalTime: string;
  snoozeCount: number;
  nextSnoozeTime: string;
  maxSnoozes: number;
  snoozeDuration: number;
}

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const data = notification.request.content.data;
    const isPrayerNotification = data?.type === 'prayer_time';
    
    return {
      shouldShowBanner: isPrayerNotification,
      shouldShowList: isPrayerNotification,
      shouldPlaySound: isPrayerNotification,
      shouldSetBadge: isPrayerNotification,
    };
  },
});

export class PrayerNotificationService {
  private static instance: PrayerNotificationService;
  private isInitialized = false;
  private notificationListener?: Notifications.Subscription;
  private responseListener?: Notifications.Subscription;

  private constructor() {}

  public static getInstance(): PrayerNotificationService {
    if (!PrayerNotificationService.instance) {
      PrayerNotificationService.instance = new PrayerNotificationService();
    }
    return PrayerNotificationService.instance;
  }

  /**
   * Initialize notification service
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Request permissions
      const permission = await this.requestNotificationPermissions();
      if (!permission.granted) {
        secureLogger.warn('Notification permissions not granted');
        return;
      }

      // Set up notification categories
      await this.setupNotificationCategories();

      // Set up listeners
      this.setupNotificationListeners();

      // Register background tasks
      await this.registerBackgroundTasks();

      // Set up daily background fetch
      await this.setupDailyBackgroundFetch();

      this.isInitialized = true;
      secureLogger.info('Prayer notification service initialized');
    } catch (error) {
      secureLogger.error('Failed to initialize notification service', { error });
    }
  }

  /**
   * Request notification permissions
   */
  public async requestNotificationPermissions(): Promise<Notifications.NotificationPermissionsStatus> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
            allowAnnouncements: true,
          },
          android: {
            allowSound: true,
            allowVibration: true,
          },
        });
        finalStatus = status;
      }

      secureLogger.info('Notification permission status', { status: finalStatus });
      return { status: finalStatus, granted: finalStatus === 'granted' } as any;
    } catch (error) {
      secureLogger.error('Failed to request notification permissions', { error });
      return { status: 'denied', granted: false } as any;
    }
  }

  /**
   * Schedule all prayer notifications for a day
   */
  public async scheduleAllNotifications(
    prayerTimes: DayPrayerTimes,
    settings: PrayerSettings
  ): Promise<void> {
    try {
      // Cancel existing notifications for the date
      await this.cancelNotificationsForDate(prayerTimes.date);

      const scheduledNotifications: ScheduledNotification[] = [];

      for (const prayer of prayerTimes.prayers) {
        if (settings.notifications[prayer.name]) {
          const notificationId = await this.schedulePrayerNotification(
            prayer,
            prayerTimes.date,
            settings
          );

          if (notificationId) {
            scheduledNotifications.push({
              id: notificationId,
              prayer: prayer.name,
              time: prayer.time,
              date: prayerTimes.date,
              isScheduled: true,
            });
          }
        }
      }

      // Save scheduled notifications
      await this.saveScheduledNotifications(prayerTimes.date, scheduledNotifications);

      secureLogger.info('All prayer notifications scheduled', {
        date: prayerTimes.date,
        count: scheduledNotifications.length,
      });
    } catch (error) {
      secureLogger.error('Failed to schedule all notifications', { error });
    }
  }

  /**
   * Schedule a single prayer notification
   */
  private async schedulePrayerNotification(
    prayer: PrayerTime,
    date: string,
    settings: PrayerSettings
  ): Promise<string | null> {
    try {
      const [hours, minutes] = prayer.time.split(':').map(Number);
      const notificationDate = new Date(date);
      notificationDate.setHours(hours, minutes, 0, 0);

      // Don't schedule past notifications
      if (notificationDate.getTime() <= Date.now()) {
        secureLogger.info('Skipping past prayer notification', {
          prayer: prayer.name,
          time: prayer.time,
          date,
        });
        return null;
      }

      const prayerDisplayName = this.getPrayerDisplayName(prayer.name);

      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: `${prayerDisplayName} Prayer Time`,
          body: `It's time for ${prayerDisplayName} prayer (${prayer.time})`,
          sound: settings.enableAdhan ? false : true, // Custom sound handling
          data: {
            type: 'prayer_time',
            prayer: prayer.name,
            time: prayer.time,
            date,
            adjustment: prayer.adjustment,
          },
          categoryIdentifier: 'PRAYER_NOTIFICATION',
        },
        trigger: {
          date: notificationDate,
        },
      });

      secureLogger.info('Prayer notification scheduled', {
        prayer: prayer.name,
        time: prayer.time,
        date,
        identifier,
        scheduledFor: notificationDate.toISOString(),
      });

      return identifier;
    } catch (error) {
      secureLogger.error('Failed to schedule prayer notification', {
        error,
        prayer: prayer.name,
        time: prayer.time,
        date,
      });
      return null;
    }
  }

  /**
   * Handle prayer notification received
   */
  private async handlePrayerNotification(
    notification: Notifications.Notification
  ): Promise<void> {
    try {
      const data = notification.request.content.data;
      if (data?.type !== 'prayer_time') return;

      const prayer = data.prayer as PrayerName;
      const settings = await this.getPrayerSettings();

      secureLogger.info('Prayer notification received', {
        prayer,
        time: data.time,
        date: data.date,
      });

      // Play Adhan if enabled
      if (settings.enableAdhan && settings.selectedAudio) {
        try {
          await audioService.playAdhan(
            settings.selectedAudio,
            settings.volume,
            settings.fadeInDuration
          );
        } catch (error) {
          secureLogger.error('Failed to play Adhan', { error });
        }
      }

      // Trigger haptic feedback if enabled
      if (settings.enableVibration) {
        await hapticFeedback.impactAsync('heavy');
      }

      // Mark prayer as notified
      await this.markPrayerAsNotified(prayer, data.date);

    } catch (error) {
      secureLogger.error('Failed to handle prayer notification', { error });
    }
  }

  /**
   * Snooze prayer notification
   */
  public async snoozePrayerNotification(
    prayer: PrayerName,
    originalTime: string,
    date: string,
    settings: PrayerSettings
  ): Promise<boolean> {
    try {
      // Get current snooze info
      const currentSnooze = await this.getSnoozeInfo(prayer, date);
      const snoozeCount = currentSnooze ? currentSnooze.snoozeCount + 1 : 1;

      // Check if max snoozes reached
      if (snoozeCount > settings.maxSnoozes) {
        secureLogger.info('Max snoozes reached for prayer', { prayer, date });
        return false;
      }

      // Calculate next snooze time
      const now = new Date();
      const snoozeTime = new Date(now.getTime() + settings.snoozeDuration * 60 * 1000);

      const snoozeInfo: SnoozeInfo = {
        prayer,
        originalTime,
        snoozeCount,
        nextSnoozeTime: snoozeTime.toTimeString().slice(0, 5),
        maxSnoozes: settings.maxSnoozes,
        snoozeDuration: settings.snoozeDuration,
      };

      // Save snooze info
      await this.saveSnoozeInfo(prayer, date, snoozeInfo);

      // Schedule snooze notification
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: `${this.getPrayerDisplayName(prayer)} Prayer Reminder`,
          body: `Snooze ${snoozeCount}/${settings.maxSnoozes} - Time for ${this.getPrayerDisplayName(prayer)} prayer`,
          sound: settings.enableAdhan ? false : true,
          data: {
            type: 'prayer_snooze',
            prayer,
            originalTime,
            snoozeCount,
            date,
          },
          categoryIdentifier: 'PRAYER_SNOOZE',
        },
        trigger: {
          date: snoozeTime,
        },
      });

      secureLogger.info('Prayer notification snoozed', {
        prayer,
        snoozeCount,
        snoozeTime: snoozeTime.toISOString(),
        identifier,
      });

      return true;
    } catch (error) {
      secureLogger.error('Failed to snooze prayer notification', { error });
      return false;
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  public async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await AsyncStorage.removeItem(SCHEDULED_NOTIFICATIONS_KEY);
      await AsyncStorage.removeItem(SNOOZE_INFO_KEY);
      
      secureLogger.info('All prayer notifications cancelled');
    } catch (error) {
      secureLogger.error('Failed to cancel all notifications', { error });
    }
  }

  /**
   * Cancel notifications for a specific date
   */
  public async cancelNotificationsForDate(date: string): Promise<void> {
    try {
      const scheduledNotifications = await this.getScheduledNotifications(date);
      
      for (const notification of scheduledNotifications) {
        await Notifications.cancelScheduledNotificationAsync(notification.id);
      }

      // Remove from storage
      const allScheduled = await AsyncStorage.getItem(SCHEDULED_NOTIFICATIONS_KEY);
      if (allScheduled) {
        const parsed = JSON.parse(allScheduled);
        delete parsed[date];
        await AsyncStorage.setItem(SCHEDULED_NOTIFICATIONS_KEY, JSON.stringify(parsed));
      }

      secureLogger.info('Notifications cancelled for date', { date });
    } catch (error) {
      secureLogger.error('Failed to cancel notifications for date', { error, date });
    }
  }

  /**
   * Recreate notifications daily (called by background task)
   */
  public async recreateNotificationsDaily(): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const lastNotificationDate = await AsyncStorage.getItem(LAST_NOTIFICATION_DATE_KEY);

      // Only recreate if it's a new day
      if (lastNotificationDate === today) {
        secureLogger.info('Notifications already created for today');
        return;
      }

      secureLogger.info('Recreating daily notifications', { today, lastDate: lastNotificationDate });

      // Get current prayer times and settings
      const prayerTimes = await this.getCurrentPrayerTimes();
      const settings = await this.getPrayerSettings();

      if (!prayerTimes) {
        secureLogger.warn('No prayer times available for notification recreation');
        return;
      }

      // Clear old notifications
      await this.cancelAllNotifications();

      // Schedule new notifications
      await this.scheduleAllNotifications(prayerTimes, settings);

      // Update last notification date
      await AsyncStorage.setItem(LAST_NOTIFICATION_DATE_KEY, today);

      secureLogger.info('Daily notifications recreated successfully');
    } catch (error) {
      secureLogger.error('Failed to recreate daily notifications', { error });
    }
  }

  /**
   * Set up notification categories for actions
   */
  private async setupNotificationCategories(): Promise<void> {
    try {
      await Notifications.setNotificationCategoryAsync('PRAYER_NOTIFICATION', [
        {
          identifier: 'SNOOZE',
          buttonTitle: 'Snooze',
          options: { opensAppToForeground: false },
        },
        {
          identifier: 'STOP',
          buttonTitle: 'Stop',
          options: { opensAppToForeground: false },
        },
      ]);

      await Notifications.setNotificationCategoryAsync('PRAYER_SNOOZE', [
        {
          identifier: 'SNOOZE_AGAIN',
          buttonTitle: 'Snooze',
          options: { opensAppToForeground: false },
        },
        {
          identifier: 'STOP',
          buttonTitle: 'Stop',
          options: { opensAppToForeground: false },
        },
      ]);

      secureLogger.info('Notification categories set up');
    } catch (error) {
      secureLogger.error('Failed to set up notification categories', { error });
    }
  }

  /**
   * Set up notification listeners
   */
  private setupNotificationListeners(): void {
    // Notification received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener(
      this.handlePrayerNotification.bind(this)
    );

    // User interacted with notification
    this.responseListener = Notifications.addNotificationResponseReceivedListener(
      async (response) => {
        const data = response.notification.request.content.data;
        const actionIdentifier = response.actionIdentifier;

        if (data?.type === 'prayer_time' || data?.type === 'prayer_snooze') {
          await this.handleNotificationAction(actionIdentifier, data);
        }
      }
    );

    secureLogger.info('Notification listeners set up');
  }

  /**
   * Handle notification actions (snooze, stop)
   */
  private async handleNotificationAction(
    actionIdentifier: string,
    data: any
  ): Promise<void> {
    try {
      const prayer = data.prayer as PrayerName;
      const date = data.date;

      switch (actionIdentifier) {
        case 'SNOOZE':
        case 'SNOOZE_AGAIN':
          const settings = await this.getPrayerSettings();
          await this.snoozePrayerNotification(prayer, data.originalTime || data.time, date, settings);
          break;

        case 'STOP':
          await audioService.stopAudio(2); // Fade out over 2 seconds
          await this.clearSnoozeInfo(prayer, date);
          break;

        default:
          // Default action (tap notification)
          secureLogger.info('Prayer notification tapped', { prayer, date });
          break;
      }
    } catch (error) {
      secureLogger.error('Failed to handle notification action', { error });
    }
  }

  /**
   * Register background tasks
   */
  private async registerBackgroundTasks(): Promise<void> {
    try {
      // Define the background task
      TaskManager.defineTask(DAILY_UPDATE_TASK, async () => {
        try {
          await this.recreateNotificationsDaily();
          return BackgroundFetch.BackgroundFetchResult.NewData;
        } catch (error) {
          secureLogger.error('Background task failed', { error });
          return BackgroundFetch.BackgroundFetchResult.Failed;
        }
      });

      secureLogger.info('Background tasks registered');
    } catch (error) {
      secureLogger.error('Failed to register background tasks', { error });
    }
  }

  /**
   * Set up daily background fetch
   */
  private async setupDailyBackgroundFetch(): Promise<void> {
    try {
      const status = await BackgroundFetch.getStatusAsync();
      if (status === BackgroundFetch.BackgroundFetchStatus.Available) {
        await BackgroundFetch.registerTaskAsync(DAILY_UPDATE_TASK, {
          minimumInterval: 24 * 60 * 60 * 1000, // 24 hours
          stopOnTerminate: false,
          startOnBoot: true,
        });

        secureLogger.info('Daily background fetch registered');
      } else {
        secureLogger.warn('Background fetch not available', { status });
      }
    } catch (error) {
      secureLogger.error('Failed to set up background fetch', { error });
    }
  }

  /**
   * Helper methods for storage operations
   */
  private async saveScheduledNotifications(
    date: string,
    notifications: ScheduledNotification[]
  ): Promise<void> {
    try {
      const existing = await AsyncStorage.getItem(SCHEDULED_NOTIFICATIONS_KEY);
      const allNotifications = existing ? JSON.parse(existing) : {};
      allNotifications[date] = notifications;
      await AsyncStorage.setItem(SCHEDULED_NOTIFICATIONS_KEY, JSON.stringify(allNotifications));
    } catch (error) {
      secureLogger.error('Failed to save scheduled notifications', { error });
    }
  }

  private async getScheduledNotifications(date: string): Promise<ScheduledNotification[]> {
    try {
      const stored = await AsyncStorage.getItem(SCHEDULED_NOTIFICATIONS_KEY);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      return parsed[date] || [];
    } catch (error) {
      secureLogger.error('Failed to get scheduled notifications', { error });
      return [];
    }
  }

  private async saveSnoozeInfo(prayer: PrayerName, date: string, info: SnoozeInfo): Promise<void> {
    try {
      const existing = await AsyncStorage.getItem(SNOOZE_INFO_KEY);
      const allSnoozes = existing ? JSON.parse(existing) : {};
      const key = `${date}_${prayer}`;
      allSnoozes[key] = info;
      await AsyncStorage.setItem(SNOOZE_INFO_KEY, JSON.stringify(allSnoozes));
    } catch (error) {
      secureLogger.error('Failed to save snooze info', { error });
    }
  }

  private async getSnoozeInfo(prayer: PrayerName, date: string): Promise<SnoozeInfo | null> {
    try {
      const stored = await AsyncStorage.getItem(SNOOZE_INFO_KEY);
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      const key = `${date}_${prayer}`;
      return parsed[key] || null;
    } catch (error) {
      secureLogger.error('Failed to get snooze info', { error });
      return null;
    }
  }

  private async clearSnoozeInfo(prayer: PrayerName, date: string): Promise<void> {
    try {
      const existing = await AsyncStorage.getItem(SNOOZE_INFO_KEY);
      if (!existing) return;
      const parsed = JSON.parse(existing);
      const key = `${date}_${prayer}`;
      delete parsed[key];
      await AsyncStorage.setItem(SNOOZE_INFO_KEY, JSON.stringify(parsed));
    } catch (error) {
      secureLogger.error('Failed to clear snooze info', { error });
    }
  }

  private async markPrayerAsNotified(prayer: PrayerName, date: string): Promise<void> {
    // This would integrate with the prayer times context to mark the prayer as notified
    // Implementation depends on how the prayer times state is managed
    secureLogger.info('Prayer marked as notified', { prayer, date });
  }

  private getPrayerDisplayName(prayer: PrayerName): string {
    const names = {
      fajr: 'Fajr',
      dhuhr: 'Dhuhr', 
      asr: 'Asr',
      maghrib: 'Maghrib',
      isha: 'Isha',
    };
    return names[prayer] || prayer;
  }

  private async getCurrentPrayerTimes(): Promise<DayPrayerTimes | null> {
    // Get current prayer times from AsyncStorage as a fallback
    try {
      const cached = await AsyncStorage.getItem('prayer_times_state');
      if (cached) {
        const parsed = JSON.parse(cached);
        return parsed.currentTimes || null;
      }
    } catch (error) {
      secureLogger.error('Failed to get current prayer times', { error });
    }
    return null;
  }

  private async getPrayerSettings(): Promise<PrayerSettings> {
    // Get prayer settings from AsyncStorage
    try {
      const cached = await AsyncStorage.getItem('prayer_settings');
      if (cached) {
        const parsed = JSON.parse(cached);
        return parsed;
      }
    } catch (error) {
      secureLogger.error('Failed to get prayer settings', { error });
    }

    // Return default settings as fallback
    const { CALCULATION_METHODS, DEFAULT_ADHAN_AUDIOS } = await import('../types');
    return {
      calculationMethod: CALCULATION_METHODS[1], // ISNA
      selectedAudio: DEFAULT_ADHAN_AUDIOS[0], // Mishary
      enableAdhan: true,
      enableVibration: true,
      snoozeEnabled: true,
      snoozeDuration: 5,
      maxSnoozes: 3,
      fadeInDuration: 3,
      fadeOutDuration: 2,
      volume: 0.8,
      location: { type: 'auto' },
      timeAdjustments: {
        fajr: 0,
        dhuhr: 0,
        asr: 0,
        maghrib: 0,
        isha: 0,
      },
      notifications: {
        fajr: true,
        dhuhr: true,
        asr: true,
        maghrib: true,
        isha: true,
      },
    };
  }

  /**
   * Clean up listeners and resources
   */
  public dispose(): void {
    if (this.notificationListener) {
      this.notificationListener.remove();
      this.notificationListener = undefined;
    }

    if (this.responseListener) {
      this.responseListener.remove();
      this.responseListener = undefined;
    }

    secureLogger.info('Prayer notification service disposed');
  }
}

// Create singleton instance
const prayerNotificationService = PrayerNotificationService.getInstance();

// Export wrapper functions for easy use
export const initializePrayerNotifications = async (): Promise<void> => {
  return prayerNotificationService.initialize();
};

export const scheduleAllPrayerNotifications = async (
  prayerTimes: DayPrayerTimes,
  settings: PrayerSettings
): Promise<void> => {
  return prayerNotificationService.scheduleAllNotifications(prayerTimes, settings);
};

export const cancelAllPrayerNotifications = async (): Promise<void> => {
  return prayerNotificationService.cancelAllNotifications();
};

export const cancelNotificationsForDate = async (date: string): Promise<void> => {
  return prayerNotificationService.cancelNotificationsForDate(date);
};

export const snoozePrayerNotification = async (
  prayer: PrayerName,
  originalTime: string,
  date: string,
  settings: PrayerSettings
): Promise<boolean> => {
  return prayerNotificationService.snoozePrayerNotification(prayer, originalTime, date, settings);
};

export const recreateNotificationsDaily = async (): Promise<void> => {
  return prayerNotificationService.recreateNotificationsDaily();
};

export const requestNotificationPermissions = async (): Promise<Notifications.NotificationPermissionsStatus> => {
  return prayerNotificationService.requestNotificationPermissions();
};

// Export the service instance as well for advanced use
export { prayerNotificationService }; 