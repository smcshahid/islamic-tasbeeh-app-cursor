import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { secureLogger } from './secureLogger';
import { audioService } from './audioService';
import { hapticFeedback } from './haptics';
import { PrayerName, PrayerTime, DayPrayerTimes, PrayerSettings } from '../types';

// Background task name
const PRAYER_NOTIFICATION_TASK = 'prayer-notification-background-task';

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
      // For Android 13+, we need to create a notification channel first
      if (Platform.OS === 'android') {
        await this.setupNotificationChannels();
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
            allowAnnouncements: false,
          },
        });
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        secureLogger.warn('Notification permissions not granted', { status: finalStatus });
      } else {
        secureLogger.info('Notification permissions granted');
      }

      return { status: finalStatus } as Notifications.NotificationPermissionsStatus;
    } catch (error) {
      secureLogger.error('Failed to request notification permissions', { error });
      throw error;
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
      const today = new Date().toISOString().split('T')[0];
      
      // Only schedule notifications for today
      if (prayerTimes.date !== today) {
        secureLogger.info('Skipping notification scheduling for non-today date', {
          requestedDate: prayerTimes.date,
          today
        });
        return;
      }

      // Cancel ALL existing notifications first to avoid duplicates
      await this.cancelAllNotifications();

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

      secureLogger.info('Today\'s prayer notifications scheduled', {
        date: prayerTimes.date,
        count: scheduledNotifications.length,
        prayers: scheduledNotifications.map(n => n.prayer)
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
      
      // Apply time adjustments
      const adjustedMinutes = minutes + prayer.adjustment;
      let adjustedHours = hours;
      let finalMinutes = adjustedMinutes;
      
      // Handle minute overflow/underflow
      if (adjustedMinutes >= 60) {
        adjustedHours += Math.floor(adjustedMinutes / 60);
        finalMinutes = adjustedMinutes % 60;
      } else if (adjustedMinutes < 0) {
        adjustedHours -= Math.ceil(Math.abs(adjustedMinutes) / 60);
        finalMinutes = 60 + (adjustedMinutes % 60);
      }
      
      // Handle hour overflow/underflow
      if (adjustedHours >= 24) {
        adjustedHours = adjustedHours % 24;
        notificationDate.setDate(notificationDate.getDate() + 1);
      } else if (adjustedHours < 0) {
        adjustedHours = 24 + adjustedHours;
        notificationDate.setDate(notificationDate.getDate() - 1);
      }
      
      notificationDate.setHours(adjustedHours, finalMinutes, 0, 0);

      // Don't schedule past notifications
      if (notificationDate.getTime() <= Date.now()) {
        secureLogger.info('Skipping past prayer notification', {
          prayer: prayer.name,
          originalTime: prayer.time,
          adjustedTime: `${adjustedHours.toString().padStart(2, '0')}:${finalMinutes.toString().padStart(2, '0')}`,
          adjustment: prayer.adjustment,
          date,
        });
        return null;
      }

      const prayerDisplayName = this.getPrayerDisplayName(prayer.name);
      const adjustedTimeStr = `${adjustedHours.toString().padStart(2, '0')}:${finalMinutes.toString().padStart(2, '0')}`;

      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: `${prayerDisplayName} Prayer Time`,
          body: `It's time for ${prayerDisplayName} prayer (${adjustedTimeStr})${prayer.adjustment !== 0 ? ` [Adjusted ${prayer.adjustment > 0 ? '+' : ''}${prayer.adjustment} min]` : ''}`,
          sound: false, // We'll handle custom audio in the notification handler
          data: {
            type: 'prayer_time',
            prayer: prayer.name,
            time: prayer.time,
            adjustedTime: adjustedTimeStr,
            date,
            adjustment: prayer.adjustment,
            enableAdhan: settings.enableAdhan,
            selectedAudio: settings.selectedAudio,
            volume: settings.volume,
            fadeInDuration: settings.fadeInDuration,
          },
          categoryIdentifier: 'PRAYER_NOTIFICATION',
        },
        trigger: {
          date: notificationDate,
          channelId: 'prayer-notifications',
        },
      });

      secureLogger.info('Prayer notification scheduled', {
        prayer: prayer.name,
        originalTime: prayer.time,
        adjustedTime: adjustedTimeStr,
        adjustment: prayer.adjustment,
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
        adjustment: prayer.adjustment,
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

      secureLogger.info('Prayer notification received', {
        prayer,
        originalTime: data.time,
        adjustedTime: data.adjustedTime,
        date: data.date,
        adjustment: data.adjustment,
      });

      // Play Adhan if enabled (using settings from notification data)
      if (data.enableAdhan && data.selectedAudio) {
        try {
          await audioService.playAdhan(
            data.selectedAudio,
            data.volume || 0.8,
            data.fadeInDuration || 3
          );
          
          secureLogger.info('Adhan started playing for prayer notification', {
            prayer,
            audio: data.selectedAudio.name,
            volume: data.volume,
          });
        } catch (error) {
          secureLogger.error('Failed to play Adhan', { error, prayer });
        }
      }

      // Trigger haptic feedback if enabled
      const settings = await this.getPrayerSettings();
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
          sound: false,
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
          channelId: 'prayer-snooze',
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
      TaskManager.defineTask(PRAYER_NOTIFICATION_TASK, async () => {
        try {
          await this.recreateNotificationsDaily();
          return TaskManager.TaskResult.NewData;
        } catch (error) {
          secureLogger.error('Background task failed', { error });
          return TaskManager.TaskResult.Failed;
        }
      });

      secureLogger.info('Background tasks registered');
    } catch (error) {
      secureLogger.error('Failed to register background tasks', { error });
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

  /**
   * Initialize today's notifications on app start
   * This should be called when the app starts to ensure notifications are set up
   */
  public async initializeTodaysNotifications(): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      secureLogger.info('Initializing today\'s notifications on app start', { today });

      // Get current prayer times and settings
      const prayerTimes = await this.getCurrentPrayerTimes();
      const settings = await this.getPrayerSettings();

      if (!prayerTimes || prayerTimes.date !== today) {
        secureLogger.warn('No current prayer times available for today', { 
          hasPrayerTimes: !!prayerTimes,
          prayerTimesDate: prayerTimes?.date,
          today
        });
        return;
      }

      // Cancel any existing notifications first
      await this.cancelAllNotifications();

      // Schedule notifications for today's prayers
      await this.scheduleAllNotifications(prayerTimes, settings);

      secureLogger.info('Today\'s notifications initialized successfully');
    } catch (error) {
      secureLogger.error('Failed to initialize today\'s notifications', { error });
    }
  }

  /**
   * Set up notification channels for different types of notifications
   */
  private async setupNotificationChannels(): Promise<void> {
    try {
      if (Platform.OS !== 'android') return;

      // Main prayer notification channel
      await Notifications.setNotificationChannelAsync('prayer-notifications', {
        name: 'Prayer Time Notifications',
        description: 'Notifications for Islamic prayer times',
        importance: Notifications.AndroidImportance.HIGH,
        sound: false, // We handle custom audio separately
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#4CAF50',
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: true,
        showBadge: true,
      });

      // Snooze notification channel
      await Notifications.setNotificationChannelAsync('prayer-snooze', {
        name: 'Prayer Reminders',
        description: 'Snoozed prayer time reminders',
        importance: Notifications.AndroidImportance.DEFAULT,
        sound: false,
        vibrationPattern: [0, 100, 100, 100],
        lightColor: '#FF9800',
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        showBadge: true,
      });

      // Default channel for other notifications
      await Notifications.setNotificationChannelAsync('default', {
        name: 'General Notifications',
        description: 'General app notifications',
        importance: Notifications.AndroidImportance.DEFAULT,
        sound: true,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2196F3',
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        showBadge: true,
      });

      secureLogger.info('Notification channels set up successfully');
    } catch (error) {
      secureLogger.error('Failed to set up notification channels', { error });
      throw error;
    }
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

export const initializeTodaysNotifications = async (): Promise<void> => {
  return prayerNotificationService.initializeTodaysNotifications();
};

// Export the service instance as well for advanced use
export { prayerNotificationService }; 