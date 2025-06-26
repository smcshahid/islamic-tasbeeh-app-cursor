import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Alert } from 'react-native';

// Configure notifications behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const notifications = {
  // Request notification permissions
  async requestPermissions() {
    try {
      if (Platform.OS === 'web') {
        // Web doesn't need permissions for local notifications
        return { granted: true };
      }

      const { status } = await Notifications.requestPermissionsAsync();
      return { granted: status === 'granted' };
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return { granted: false };
    }
  },

  // Show achievement notification
  async showAchievementNotification(counterName: string, target: number, count: number) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🎉 Target Achieved!',
          body: `Congratulations! You've reached your target of ${target} for ${counterName}. Current count: ${count}`,
          sound: true,
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.error('Error showing achievement notification:', error);
    }
  },

  // Show milestone notification
  async showMilestoneNotification(counterName: string, count: number) {
    try {
      const milestones = [100, 500, 1000, 5000, 10000];
      if (milestones.includes(count)) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '📈 Milestone Reached!',
            body: `Amazing! You've reached ${count} counts for ${counterName}. Keep up the great work!`,
            sound: true,
          },
          trigger: null,
        });
      }
    } catch (error) {
      console.error('Error showing milestone notification:', error);
    }
  },

  // Test notification (for settings)
  async showTestNotification() {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🕌 Tasbeeh App',
          body: 'Notifications are working! You\'ll receive alerts when you reach your targets and milestones.',
          sound: true,
        },
        trigger: null,
      });
      
      // Also show an alert for immediate feedback
      Alert.alert(
        'Test Notification Sent!',
        'Check your notification panel to see if it appeared. Make sure notifications are enabled in your device settings.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error showing test notification:', error);
      Alert.alert(
        'Error',
        'Failed to send test notification. Please check your notification permissions.',
        [{ text: 'OK' }]
      );
    }
  },

  // Schedule reminder notification
  async scheduleReminder(title: string, body: string, seconds: number) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
        },
        trigger: { seconds },
      });
    } catch (error) {
      console.error('Error scheduling reminder:', error);
    }
  },

  // Cancel all notifications
  async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling notifications:', error);
    }
  }
}; 