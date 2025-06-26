/**
 * Achievement and Level System for Tasbeeh App
 * Determines when users should receive notifications and their current level
 * PERFORMANCE OPTIMIZED: Added caching and throttling mechanisms
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

// Performance optimization: Cache for computed stats
interface StatsCache {
  data: UserStats | null;
  timestamp: number;
  countersHash: string;
  sessionsHash: string;
}

// Performance optimization: Major milestone thresholds for quick checking
const MAJOR_MILESTONES = new Set([
  100, 500, 1000, 2500, 5000, 10000, 15000, 25000, 50000, 100000, 250000, 500000, 1000000
]);

// Performance optimization: Check if a count is a major milestone
const isMajorMilestone = (count: number): boolean => {
  return MAJOR_MILESTONES.has(count) || count % 10000 === 0;
};

// Performance optimization: Quick hash function for arrays
const quickHash = (data: any[]): string => {
  return `${data.length}_${data[0]?.id || ''}_${data[data.length - 1]?.updatedAt || ''}`;
};

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
  
  // Performance optimization: Add caching
  private statsCache: StatsCache = {
    data: null,
    timestamp: 0,
    countersHash: '',
    sessionsHash: ''
  };
  private readonly CACHE_DURATION = 60000; // 1 minute cache
  
  // Performance optimization: Achievement check throttling
  private lastAchievementCheck: number = 0;
  private readonly ACHIEVEMENT_CHECK_COOLDOWN = 5000; // 5 seconds between achievement checks

  static getInstance(): AchievementManager {
    if (!AchievementManager.instance) {
      AchievementManager.instance = new AchievementManager();
    }
    return AchievementManager.instance;
  }

  /**
   * Calculate user's current level based on total counts
   * PERFORMANCE OPTIMIZED: Using binary search for level lookup
   */
  calculateUserLevel(totalCounts: number): UserLevel {
    // Binary search optimization for large level arrays
    let left = 0;
    let right = USER_LEVELS.length - 1;
    let result = USER_LEVELS[0];
    
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const level = USER_LEVELS[mid];
      
      if (totalCounts >= level.minCounts) {
        result = level;
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }
    
    return result;
  }

  /**
   * Calculate comprehensive user statistics
   * PERFORMANCE OPTIMIZED: Added caching and early returns
   */
  calculateUserStats(
    counters: any[],
    sessions: any[],
    achievements: string[] = []
  ): UserStats {
    // Performance optimization: Check cache first
    const countersHash = quickHash(counters);
    const sessionsHash = quickHash(sessions);
    const now = Date.now();
    
    if (
      this.statsCache.data &&
      now - this.statsCache.timestamp < this.CACHE_DURATION &&
      this.statsCache.countersHash === countersHash &&
      this.statsCache.sessionsHash === sessionsHash
    ) {
      return this.statsCache.data;
    }

    // Compute stats
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

    const stats: UserStats = {
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

    // Performance optimization: Update cache
    this.statsCache = {
      data: stats,
      timestamp: now,
      countersHash,
      sessionsHash
    };

    return stats;
  }

  /**
   * Check if user should receive achievement notifications
   * PERFORMANCE OPTIMIZED: Added throttling and early returns
   */
  shouldNotify(
    previousStats: UserStats | null,
    newStats: UserStats,
    userRanking?: { percentile: number; rank: string }
  ): Achievement[] {
    const now = Date.now();
    
    // Performance optimization: Respect notification cooldown
    if (now - this.lastNotificationTime < this.NOTIFICATION_COOLDOWN) {
      return [];
    }

    // Performance optimization: Throttle achievement checks
    if (now - this.lastAchievementCheck < this.ACHIEVEMENT_CHECK_COOLDOWN) {
      return [];
    }
    this.lastAchievementCheck = now;

    // Performance optimization: Early return if no significant change
    if (previousStats) {
      const countDiff = newStats.totalCounts - previousStats.totalCounts;
      const sessionDiff = newStats.totalSessions - previousStats.totalSessions;
      const streakDiff = newStats.currentStreak - previousStats.currentStreak;
      
      // Only check achievements if there's a significant change
      if (countDiff === 0 && sessionDiff === 0 && streakDiff === 0) {
        return [];
      }
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

    // Performance optimization: Only check milestone achievements for major milestones
    if (!previousStats || isMajorMilestone(newStats.totalCounts)) {
      const milestoneAchievements = ACHIEVEMENTS.filter(a => a.type === 'milestone');
      for (const achievement of milestoneAchievements) {
        const wasCompleted = previousStats ? previousStats.totalCounts >= achievement.threshold : false;
        const isNowCompleted = newStats.totalCounts >= achievement.threshold;
        
        if (!wasCompleted && isNowCompleted) {
          triggeredAchievements.push(achievement);
        }
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
   * Performance optimization: Quick check if count should trigger achievement check
   */
  shouldCheckAchievements(count: number, previousCount?: number): boolean {
    // Always check for major milestones
    if (isMajorMilestone(count)) return true;
    
    // Check every 33 counts (Tasbih completion)
    if (count % 33 === 0) return true;
    
    // Check every 99 counts (Asma ul Husna completion)
    if (count % 99 === 0) return true;
    
    // Check if crossing a hundred boundary
    if (previousCount && Math.floor(count / 100) > Math.floor(previousCount / 100)) return true;
    
    return false;
  }

  /**
   * Clear cache - useful when data changes significantly
   */
  clearCache(): void {
    this.statsCache = {
      data: null,
      timestamp: 0,
      countersHash: '',
      sessionsHash: ''
    };
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
    
    for (let i = sortedDates.length - 1; i >= 0; i--) {
      if (i === sortedDates.length - 1) {
        tempStreak = 1;
      } else {
        const currentDate = sortedDates[i];
        const nextDate = sortedDates[i + 1];
        const dayDiff = Math.floor((currentDate.getTime() - nextDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (dayDiff === 1) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    return { currentStreak, longestStreak };
  }

  private calculateAverages(sessions: any[]): {
    dailyAverage: number;
    weeklyAverage: number;
    monthlyAverage: number;
  } {
    if (sessions.length === 0) {
      return { dailyAverage: 0, weeklyAverage: 0, monthlyAverage: 0 };
    }

    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const weekMs = 7 * dayMs;
    const monthMs = 30 * dayMs;

    const dailySessions = sessions.filter(s => 
      now - new Date(s.startTime).getTime() <= dayMs
    );
    const weeklySessions = sessions.filter(s => 
      now - new Date(s.startTime).getTime() <= weekMs
    );
    const monthlySessions = sessions.filter(s => 
      now - new Date(s.startTime).getTime() <= monthMs
    );

    return {
      dailyAverage: dailySessions.reduce((sum, s) => sum + s.totalCounts, 0),
      weeklyAverage: Math.round(weeklySessions.reduce((sum, s) => sum + s.totalCounts, 0) / 7),
      monthlyAverage: Math.round(monthlySessions.reduce((sum, s) => sum + s.totalCounts, 0) / 30),
    };
  }

  private generateComparisonMessage(
    userStats: UserStats,
    globalStats: GlobalStats,
    rank: string
  ): string {
    const comparison = userStats.totalCounts / globalStats.medianCounts;
    
    if (rank.includes('Top')) {
      return `You're in the ${rank} of all users! Your ${userStats.totalCounts.toLocaleString()} counts place you among the most dedicated practitioners.`;
    } else if (comparison >= 1) {
      return `You're ${Math.round(comparison)}x above the average user! Keep up the excellent spiritual practice.`;
    } else {
      return `You're building a beautiful practice! Every count brings you closer to your spiritual goals.`;
    }
  }
}

// Export singleton instance with performance optimizations
export const achievementManager = AchievementManager.getInstance();

// Performance helper functions
export const shouldCheckAchievements = achievementManager.shouldCheckAchievements.bind(achievementManager);
export const clearAchievementCache = achievementManager.clearCache.bind(achievementManager); 