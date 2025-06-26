import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Alert } from 'react-native';
import { secureLogger } from './secureLogger';
import type { Achievement } from './achievements';

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
      secureLogger.error('Error requesting notification permissions', error, 'Notifications');
      return { granted: false };
    }
  },

  // Show achievement notification for significant milestones
  async showAchievementNotification(counterName: string, target: number, count: number) {
    try {
      // Only show notifications for significant target achievements (not every target)
      if (target >= 1000 || (target >= 100 && count === target)) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '🏆 Major Target Achieved!',
            body: `Outstanding! You've reached your target of ${target.toLocaleString()} for ${counterName}. Current count: ${count.toLocaleString()}`,
            sound: true,
          },
          trigger: null, // Show immediately
        });
      }
    } catch (error) {
      secureLogger.error('Error showing achievement notification', error, 'Notifications');
    }
  },

  // Show milestone notification for significant counts
  async showMilestoneNotification(counterName: string, count: number) {
    try {
      // Major milestones that deserve notifications
      const majorMilestones = [100, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000];
      
      if (majorMilestones.includes(count)) {
        let title = '🎯 Milestone Reached!';
        let emoji = '🎯';
        
        // Special titles for major milestones
        if (count >= 100000) {
          title = '👑 Legendary Master!';
          emoji = '👑';
        } else if (count >= 50000) {
          title = '🏆 Grand Master!';
          emoji = '🏆';
        } else if (count >= 25000) {
          title = '🥇 Master Level!';
          emoji = '🥇';
        } else if (count >= 10000) {
          title = '⭐ Expert Level!';
          emoji = '⭐';
        } else if (count >= 5000) {
          title = '🌟 Advanced Level!';
          emoji = '🌟';
        } else if (count >= 1000) {
          title = '🎊 Thousand Milestone!';
          emoji = '🎊';
        }

        await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body: `${emoji} Amazing! You've reached ${count.toLocaleString()} counts for ${counterName}. Keep up the excellent work!`,
            sound: true,
          },
          trigger: null,
        });
      }
    } catch (error) {
      secureLogger.error('Error showing milestone notification', error, 'Notifications');
    }
  },

  // Show streak notification for consistent usage
  async showStreakNotification(days: number) {
    try {
      if (days >= 7 && days % 7 === 0) { // Weekly streak milestones
        let title = '🔥 Streak Achievement!';
        let message = `Incredible! You've maintained a ${days}-day streak. Consistency is the key to success!`;
        
        if (days >= 30) {
          title = '🔥 Monthly Streak Master!';
          message = `Outstanding! ${days} days of consistent practice. You're building an amazing habit!`;
        } else if (days >= 14) {
          title = '🔥 Two-Week Warrior!';
          message = `Fantastic! ${days} days straight. Your dedication is paying off!`;
        }

        await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body: message,
            sound: true,
          },
          trigger: null,
        });
      }
    } catch (error) {
      secureLogger.error('Error showing streak notification', error, 'Notifications');
    }
  },

  // Show session achievement notification
  async showSessionAchievement(sessionCount: number) {
    try {
      const sessionMilestones = [10, 25, 50, 100, 250, 500];
      
      if (sessionMilestones.includes(sessionCount)) {
        let title = '📊 Session Milestone!';
        let emoji = '📊';
        
        if (sessionCount >= 500) {
          title = '🌟 Session Legend!';
          emoji = '🌟';
        } else if (sessionCount >= 100) {
          title = '🏅 Session Master!';
          emoji = '🏅';
        } else if (sessionCount >= 50) {
          title = '🎯 Session Expert!';
          emoji = '🎯';
        }

        await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body: `${emoji} You've completed ${sessionCount} sessions! Your commitment to regular practice is inspiring.`,
            sound: true,
          },
          trigger: null,
        });
      }
    } catch (error) {
      secureLogger.error('Error showing session achievement', error, 'Notifications');
    }
  },

  // Show time-based achievement
  async showTimeAchievement(totalMinutes: number) {
    try {
      // Time milestones in minutes
      const timeMilestones = [60, 300, 600, 1200, 3000, 6000]; // 1h, 5h, 10h, 20h, 50h, 100h
      
      if (timeMilestones.includes(totalMinutes)) {
        const hours = Math.round(totalMinutes / 60);
        
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '⏰ Time Achievement!',
            body: `Remarkable! You've spent ${hours} hours in meditation and dhikr. Time well invested in spiritual growth!`,
            sound: true,
          },
          trigger: null,
        });
      }
    } catch (error) {
      secureLogger.error('Error showing time achievement', error, 'Notifications');
    }
  },

  // Test notification (for settings)
  async showTestNotification() {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🕌 Tasbeeh App',
          body: 'Notifications are working! You\'ll receive alerts for major milestones, streaks, and achievements.',
          sound: true,
        },
        trigger: null,
      });
      
      // Also show an alert for immediate feedback
      Alert.alert(
        'Test Notification Sent!',
        'Check your notification panel to see if it appeared. You\'ll only receive notifications for significant achievements and milestones.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      secureLogger.error('Error showing test notification', error, 'Notifications');
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
      secureLogger.error('Error scheduling reminder', error, 'Notifications');
    }
  },

  // Show daily goal achievement
  async showDailyGoalAchievement(goalCount: number, actualCount: number) {
    try {
      if (actualCount >= goalCount) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '🎯 Daily Goal Achieved!',
            body: `Excellent! You've reached your daily goal of ${goalCount.toLocaleString()} counts. Well done!`,
            sound: true,
          },
          trigger: null,
        });
      }
    } catch (error) {
      secureLogger.error('Error showing daily goal achievement', error, 'Notifications');
    }
  },

  // Smart achievement notification (new system)
  async showSmartAchievementNotification(achievement: Achievement) {
    try {
      let title = '';
      let body = '';
      
      switch (achievement.type) {
        case 'level':
          title = `🎊 Level Up! ${achievement.level?.name}`;
          body = `Congratulations! ${achievement.description} ${achievement.level?.icon}`;
          break;
        case 'milestone':
          title = `${achievement.icon} ${achievement.name}`;
          body = `Amazing progress! ${achievement.description}`;
          break;
        case 'streak':
          title = `${achievement.icon} ${achievement.name}`;
          body = `Incredible consistency! ${achievement.description}`;
          break;
        case 'session':
          title = `${achievement.icon} ${achievement.name}`;
          body = `Great dedication! ${achievement.description}`;
          break;
        case 'time':
          title = `${achievement.icon} ${achievement.name}`;
          body = `Time well spent! ${achievement.description}`;
          break;
        default:
          title = `🏆 Achievement Unlocked!`;
          body = achievement.description;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
          data: {
            type: 'achievement',
            achievementId: achievement.id,
            achievementType: achievement.type
          }
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      secureLogger.error('Error showing smart achievement notification', error, 'Notifications');
    }
  },

  // Target achievement notification (for user-set targets)
  async showTargetAchievementNotification(counterName: string, target: number, count: number) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🎯 Personal Target Reached!',
          body: `Excellent! You've reached your target of ${target.toLocaleString()} for ${counterName}. Current count: ${count.toLocaleString()}`,
          sound: true,
          data: {
            type: 'target',
            counterName,
            target,
            count
          }
        },
        trigger: null,
      });
    } catch (error) {
      secureLogger.error('Error showing target achievement notification', error, 'Notifications');
    }
  },

  // Show achievement notification for significant milestones (legacy - now only for major ones)
  async showAchievementNotification(counterName: string, target: number, count: number) {
    try {
      // Only show notifications for significant target achievements (not every target)
      if (target >= 1000 || (target >= 100 && count === target)) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '🏆 Major Target Achieved!',
            body: `Outstanding! You've reached your target of ${target.toLocaleString()} for ${counterName}. Current count: ${count.toLocaleString()}`,
            sound: true,
          },
          trigger: null, // Show immediately
        });
      }
    } catch (error) {
      secureLogger.error('Error showing achievement notification', error, 'Notifications');
    }
  },

  // Show milestone notification for significant counts (legacy - now more selective)
  async showMilestoneNotification(counterName: string, count: number) {
    try {
      // Only major milestones that deserve notifications
      const majorMilestones = [1000, 5000, 10000, 25000, 50000, 100000];
      
      if (majorMilestones.includes(count)) {
        let title = '🎯 Major Milestone Reached!';
        let emoji = '🎯';
        
        // Special titles for major milestones
        if (count >= 100000) {
          title = '👑 Legendary Master!';
          emoji = '👑';
        } else if (count >= 50000) {
          title = '🏆 Grand Master!';
          emoji = '🏆';
        } else if (count >= 25000) {
          title = '🥇 Master Level!';
          emoji = '🥇';
        } else if (count >= 10000) {
          title = '⭐ Ten Thousand Milestone!';
          emoji = '⭐';
        } else if (count >= 5000) {
          title = '🌟 Five Thousand Milestone!';
          emoji = '🌟';
        }

        await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body: `${emoji} Amazing! You've reached ${count.toLocaleString()} counts for ${counterName}. Keep up the excellent work!`,
            sound: true,
          },
          trigger: null,
        });
      }
    } catch (error) {
      secureLogger.error('Error showing milestone notification', error, 'Notifications');
    }
  },

  // Cancel all notifications
  async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      secureLogger.error('Error canceling notifications', error, 'Notifications');
    }
  }
}; 