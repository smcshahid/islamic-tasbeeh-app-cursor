/**
 * Achievement and Level System for Tasbeeh App
 * Determines when users should receive notifications and their current level
 */

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  threshold: number;
  type: 'milestone' | 'streak' | 'session' | 'time' | 'level' | 'ranking';
  level?: UserLevel;
  isSecret?: boolean; // Hidden until unlocked
}

export interface UserLevel {
  id: string;
  name: string;
  minCounts: number;
  maxCounts?: number;
  color: string;
  icon: string;
  benefits: string[];
}

export interface UserStats {
  level: UserLevel;
  totalCounts: number;
  totalSessions: number;
  totalTimeMinutes: number;
  currentStreak: number;
  longestStreak: number;
  averageSessionLength: number;
  dailyAverage: number;
  weeklyAverage: number;
  monthlyAverage: number;
  achievements: string[]; // Achievement IDs
  lastNotificationTime: number;
  notificationCooldown: number; // Minutes between notifications
}

export interface GlobalStats {
  totalUsers: number;
  totalCounts: number;
  averageDailyCounts: number;
  topPercentileThreshold: number; // 90th percentile threshold
  medianCounts: number;
  averageStreak: number;
}

// User Level Definitions
export const USER_LEVELS: UserLevel[] = [
  {
    id: 'newcomer',
    name: 'Newcomer',
    minCounts: 0,
    maxCounts: 99,
    color: '#94A3B8',
    icon: '🌱',
    benefits: ['Welcome to your spiritual journey!']
  },
  {
    id: 'beginner',
    name: 'Beginner',
    minCounts: 100,
    maxCounts: 499,
    color: '#10B981',
    icon: '🌿',
    benefits: ['Basic achievement tracking', 'Daily goal setting']
  },
  {
    id: 'devoted',
    name: 'Devoted',
    minCounts: 500,
    maxCounts: 1499,
    color: '#3B82F6',
    icon: '🌸',
    benefits: ['Weekly insights', 'Advanced statistics']
  },
  {
    id: 'intermediate',
    name: 'Intermediate',
    minCounts: 1500,
    maxCounts: 4999,
    color: '#8B5CF6',
    icon: '🌺',
    benefits: ['Monthly reports', 'Streak bonuses', 'Custom counters']
  },
  {
    id: 'advanced',
    name: 'Advanced',
    minCounts: 5000,
    maxCounts: 14999,
    color: '#F59E0B',
    icon: '🌟',
    benefits: ['Premium insights', 'Goal recommendations', 'Time analysis']
  },
  {
    id: 'expert',
    name: 'Expert',
    minCounts: 15000,
    maxCounts: 49999,
    color: '#EF4444',
    icon: '⭐',
    benefits: ['Expert analytics', 'Spiritual milestones', 'Advanced customization']
  },
  {
    id: 'master',
    name: 'Master',
    minCounts: 50000,
    maxCounts: 99999,
    color: '#DC2626',
    icon: '🏆',
    benefits: ['Master insights', 'Legacy tracking', 'Wisdom sharing']
  },
  {
    id: 'sage',
    name: 'Sage',
    minCounts: 100000,
    color: '#7C2D12',
    icon: '👑',
    benefits: ['Sage status', 'Infinite wisdom', 'Community recognition']
  }
];

// Achievement Definitions - Only the most meaningful and special achievements
export const ACHIEVEMENTS: Achievement[] = [
  // Level Achievements - Notify for each level progression
  {
    id: 'level_beginner',
    name: 'First Steps',
    description: 'Reached Beginner level with 100 dhikr counts',
    icon: '🌿',
    threshold: 100,
    type: 'level',
    level: USER_LEVELS.find(l => l.id === 'beginner')
  },
  {
    id: 'level_devoted',
    name: 'Devoted Soul',
    description: 'Reached Devoted level with 500 dhikr counts',
    icon: '🌸',
    threshold: 500,
    type: 'level',
    level: USER_LEVELS.find(l => l.id === 'devoted')
  },
  {
    id: 'level_intermediate',
    name: 'Spiritual Progress',
    description: 'Reached Intermediate level with 1,500 dhikr counts',
    icon: '🌺',
    threshold: 1500,
    type: 'level',
    level: USER_LEVELS.find(l => l.id === 'intermediate')
  },
  {
    id: 'level_advanced',
    name: 'Advanced Practitioner',
    description: 'Reached Advanced level with 5,000 dhikr counts',
    icon: '🌟',
    threshold: 5000,
    type: 'level',
    level: USER_LEVELS.find(l => l.id === 'advanced')
  },
  {
    id: 'level_expert',
    name: 'Dhikr Expert',
    description: 'Reached Expert level with 15,000 dhikr counts',
    icon: '⭐',
    threshold: 15000,
    type: 'level',
    level: USER_LEVELS.find(l => l.id === 'expert')
  },
  {
    id: 'level_master',
    name: 'Spiritual Master',
    description: 'Reached Master level with 50,000 dhikr counts',
    icon: '🏆',
    threshold: 50000,
    type: 'level',
    level: USER_LEVELS.find(l => l.id === 'master')
  },
  {
    id: 'level_sage',
    name: 'Enlightened Sage',
    description: 'Reached Sage level with 100,000 dhikr counts',
    icon: '👑',
    threshold: 100000,
    type: 'level',
    level: USER_LEVELS.find(l => l.id === 'sage')
  },

  // Special Legendary Achievements
  {
    id: 'week_warrior',
    name: 'Week Warrior',
    description: 'Practiced dhikr for 7 consecutive days',
    icon: '🔥',
    threshold: 7,
    type: 'streak'
  },
  {
    id: 'month_master',
    name: 'Month Master',
    description: 'Practiced dhikr for 30 consecutive days',
    icon: '🌙',
    threshold: 30,
    type: 'streak'
  },
  {
    id: 'year_devotion',
    name: 'Year-long Devotion',
    description: 'Practiced dhikr for 365 consecutive days',
    icon: '🌟',
    threshold: 365,
    type: 'streak'
  },
  {
    id: 'dedicated_devotee',
    name: 'Dedicated Devotee',
    description: 'Completed 100 dhikr sessions',
    icon: '📿',
    threshold: 100,
    type: 'session'
  },
  {
    id: 'session_legend',
    name: 'Session Legend',
    description: 'Completed 500 dhikr sessions',
    icon: '🧘',
    threshold: 500,
    type: 'session'
  },
  {
    id: 'thousand_session_master',
    name: 'Thousand Session Master',
    description: 'Completed 1,000 dhikr sessions',
    icon: '⚡',
    threshold: 1000,
    type: 'session'
  },
  {
    id: 'hundred_hour_devotion',
    name: 'Hundred Hour Devotion',
    description: 'Spent 100 hours in dhikr practice',
    icon: '⏰',
    threshold: 6000, // 100 hours in minutes
    type: 'time'
  },
  {
    id: 'time_legend',
    name: 'Time Legend',
    description: 'Spent 500 hours in dhikr practice',
    icon: '⌛',
    threshold: 30000, // 500 hours in minutes
    type: 'time'
  },
  {
    id: 'million_count_legend',
    name: 'Million Count Legend',
    description: 'Completed 1,000,000 dhikr counts',
    icon: '💎',
    threshold: 1000000,
    type: 'milestone'
  },

  // Ranking Achievement
  {
    id: 'top_10_achiever',
    name: 'Elite Performer',
    description: 'Reached Top 10 among all users',
    icon: '🏅',
    threshold: 90, // 90th percentile
    type: 'ranking'
  }
];

export class AchievementManager {
  private static instance: AchievementManager;
  private lastNotificationTime: number = 0;
  private readonly NOTIFICATION_COOLDOWN = 30000; // 30 seconds between notifications

  static getInstance(): AchievementManager {
    if (!AchievementManager.instance) {
      AchievementManager.instance = new AchievementManager();
    }
    return AchievementManager.instance;
  }

  /**
   * Calculate user's current level based on total counts
   */
  calculateUserLevel(totalCounts: number): UserLevel {
    for (let i = USER_LEVELS.length - 1; i >= 0; i--) {
      const level = USER_LEVELS[i];
      if (totalCounts >= level.minCounts) {
        return level;
      }
    }
    return USER_LEVELS[0]; // Default to newcomer
  }

  /**
   * Calculate comprehensive user statistics
   */
  calculateUserStats(
    counters: any[],
    sessions: any[],
    achievements: string[] = []
  ): UserStats {
    const totalCounts = counters.reduce((sum, counter) => sum + counter.count, 0);
    const totalSessions = sessions.length;
    const totalTimeMinutes = Math.round(
      sessions.reduce((sum, session) => sum + session.duration, 0) / 60
    );

    // Calculate streaks
    const { currentStreak, longestStreak } = this.calculateStreaks(sessions);

    // Calculate averages
    const { dailyAverage, weeklyAverage, monthlyAverage } = this.calculateAverages(sessions);

    const averageSessionLength = totalSessions > 0 
      ? Math.round(totalTimeMinutes / totalSessions) 
      : 0;

    const level = this.calculateUserLevel(totalCounts);

    return {
      level,
      totalCounts,
      totalSessions,
      totalTimeMinutes,
      currentStreak,
      longestStreak,
      averageSessionLength,
      dailyAverage,
      weeklyAverage,
      monthlyAverage,
      achievements,
      lastNotificationTime: this.lastNotificationTime,
      notificationCooldown: this.NOTIFICATION_COOLDOWN / 1000 / 60 // in minutes
    };
  }

  /**
   * Check if user should receive achievement notifications
   * Only triggers for the most special and meaningful achievements with cooldown
   */
  shouldNotify(
    previousStats: UserStats | null,
    newStats: UserStats,
    userRanking?: { percentile: number; rank: string }
  ): Achievement[] {
    const now = Date.now();
    
    // Respect notification cooldown
    if (now - this.lastNotificationTime < this.NOTIFICATION_COOLDOWN) {
      return [];
    }

    const triggeredAchievements: Achievement[] = [];

    // Check for level progression (always notify for level ups)
    if (!previousStats || previousStats.level.id !== newStats.level.id) {
      const levelAchievement = ACHIEVEMENTS.find(
        a => a.type === 'level' && a.level?.id === newStats.level.id
      );
      if (levelAchievement) {
        triggeredAchievements.push(levelAchievement);
      }
    }

    // Check for legendary milestone achievements (only Million Count Legend)
    const milestoneAchievements = ACHIEVEMENTS.filter(a => a.type === 'milestone');
    for (const achievement of milestoneAchievements) {
      const wasCompleted = previousStats ? previousStats.totalCounts >= achievement.threshold : false;
      const isNowCompleted = newStats.totalCounts >= achievement.threshold;
      
      if (!wasCompleted && isNowCompleted) {
        triggeredAchievements.push(achievement);
      }
    }

    // Check for special streak achievements (Week Warrior, Month Master, Year-long Devotion)
    const streakAchievements = ACHIEVEMENTS.filter(a => a.type === 'streak');
    for (const achievement of streakAchievements) {
      const wasCompleted = previousStats ? previousStats.currentStreak >= achievement.threshold : false;
      const isNowCompleted = newStats.currentStreak >= achievement.threshold;
      
      if (!wasCompleted && isNowCompleted) {
        triggeredAchievements.push(achievement);
      }
    }

    // Check for legendary session achievements
    const sessionAchievements = ACHIEVEMENTS.filter(a => a.type === 'session');
    for (const achievement of sessionAchievements) {
      const wasCompleted = previousStats ? previousStats.totalSessions >= achievement.threshold : false;
      const isNowCompleted = newStats.totalSessions >= achievement.threshold;
      
      if (!wasCompleted && isNowCompleted) {
        triggeredAchievements.push(achievement);
      }
    }

    // Check for legendary time achievements
    const timeAchievements = ACHIEVEMENTS.filter(a => a.type === 'time');
    for (const achievement of timeAchievements) {
      const wasCompleted = previousStats ? previousStats.totalTimeMinutes >= achievement.threshold : false;
      const isNowCompleted = newStats.totalTimeMinutes >= achievement.threshold;
      
      if (!wasCompleted && isNowCompleted) {
        triggeredAchievements.push(achievement);
      }
    }

    // Check for ranking achievements (Top 10)
    if (userRanking) {
      const rankingAchievements = ACHIEVEMENTS.filter(a => a.type === 'ranking');
      for (const achievement of rankingAchievements) {
        const wasInTop10 = previousStats ? false : false; // We don't track previous ranking
        const isNowInTop10 = userRanking.percentile >= achievement.threshold;
        
        // Only notify if they're newly in top 10 (simplified check)
        if (isNowInTop10 && userRanking.rank.includes('Top 10')) {
          triggeredAchievements.push(achievement);
        }
      }
    }

    // Update last notification time if we're sending notifications
    if (triggeredAchievements.length > 0) {
      this.lastNotificationTime = now;
    }

    return triggeredAchievements;
  }

  /**
   * Calculate user's ranking compared to global stats
   */
  calculateUserRanking(userStats: UserStats, globalStats: GlobalStats): {
    percentile: number;
    rank: 'Top 1%' | 'Top 5%' | 'Top 10%' | 'Top 25%' | 'Top 50%' | 'Above Average' | 'Getting Started';
    comparison: string;
  } {
    const userCounts = userStats.totalCounts;
    
    // Calculate percentile based on total counts
    let percentile = 50; // Default to median
    
    if (globalStats.totalUsers > 0) {
      // Simplified percentile calculation
      // In a real implementation, this would come from the database
      if (userCounts >= globalStats.topPercentileThreshold) {
        percentile = 90;
      } else if (userCounts >= globalStats.medianCounts * 2) {
        percentile = 75;
      } else if (userCounts >= globalStats.medianCounts) {
        percentile = 50;
      } else {
        percentile = Math.max(10, (userCounts / globalStats.medianCounts) * 50);
      }
    }

    // Determine rank
    let rank: 'Top 1%' | 'Top 5%' | 'Top 10%' | 'Top 25%' | 'Top 50%' | 'Above Average' | 'Getting Started';
    if (percentile >= 99) rank = 'Top 1%';
    else if (percentile >= 95) rank = 'Top 5%';
    else if (percentile >= 90) rank = 'Top 10%';
    else if (percentile >= 75) rank = 'Top 25%';
    else if (percentile >= 50) rank = 'Top 50%';
    else if (percentile >= 25) rank = 'Above Average';
    else rank = 'Getting Started';

    // Generate comparison message
    const comparison = this.generateComparisonMessage(userStats, globalStats, rank);

    return { percentile, rank, comparison };
  }

  private calculateStreaks(sessions: any[]): { currentStreak: number; longestStreak: number } {
    if (sessions.length === 0) return { currentStreak: 0, longestStreak: 0 };

    // Group sessions by date
    const sessionsByDate = sessions.reduce((acc, session) => {
      const date = new Date(session.startTime).toDateString();
      if (!acc[date]) acc[date] = [];
      acc[date].push(session);
      return acc;
    }, {} as Record<string, any[]>);

    const sortedDates = Object.keys(sessionsByDate)
      .map(date => new Date(date))
      .sort((a, b) => b.getTime() - a.getTime());

    // Calculate current streak
    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < sortedDates.length; i++) {
      const sessionDate = new Date(sortedDates[i]);
      sessionDate.setHours(0, 0, 0, 0);
      
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);
      expectedDate.setHours(0, 0, 0, 0);

      if (sessionDate.getTime() === expectedDate.getTime()) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 0;
    let previousDate: Date | null = null;

    for (const date of sortedDates.reverse()) {
      if (previousDate) {
        const dayDiff = Math.abs(date.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24);
        if (dayDiff === 1) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      } else {
        tempStreak = 1;
      }
      previousDate = date;
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    return { currentStreak, longestStreak };
  }

  private calculateAverages(sessions: any[]): {
    dailyAverage: number;
    weeklyAverage: number;
    monthlyAverage: number;
  } {
    if (sessions.length === 0) return { dailyAverage: 0, weeklyAverage: 0, monthlyAverage: 0 };

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const dailySessions = sessions.filter(s => new Date(s.startTime) >= oneDayAgo);
    const weeklySessions = sessions.filter(s => new Date(s.startTime) >= sevenDaysAgo);
    const monthlySessions = sessions.filter(s => new Date(s.startTime) >= thirtyDaysAgo);

    const dailyAverage = dailySessions.reduce((sum, s) => sum + s.totalCounts, 0);
    const weeklyAverage = Math.round(weeklySessions.reduce((sum, s) => sum + s.totalCounts, 0) / 7);
    const monthlyAverage = Math.round(monthlySessions.reduce((sum, s) => sum + s.totalCounts, 0) / 30);

    return { dailyAverage, weeklyAverage, monthlyAverage };
  }

  private generateComparisonMessage(
    userStats: UserStats,
    globalStats: GlobalStats,
    rank: string
  ): string {
    const messages = [
      `You're in the ${rank} of all users! 🎉`,
      `Your daily average (${userStats.dailyAverage}) is ${
        userStats.dailyAverage > globalStats.averageDailyCounts ? 'above' : 'below'
      } the global average of ${Math.round(globalStats.averageDailyCounts)}.`,
      `You've completed ${userStats.totalSessions} sessions with an average of ${userStats.averageSessionLength} minutes each.`
    ];

    if (userStats.currentStreak > globalStats.averageStreak) {
      messages.push(`Your current ${userStats.currentStreak}-day streak is impressive! 🔥`);
    }

    return messages.join(' ');
  }
}

export const achievementManager = AchievementManager.getInstance(); 