import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useTasbeeh } from '../../src/contexts/TasbeehContext';
import { useAppTheme } from '../../src/utils/theme';
import { useGlobalAction } from '../../src/contexts/GlobalActionContext';
import { HistoryErrorBoundary } from '../../src/components/ErrorBoundary';
import { COLORS, Session } from '../../src/types';

const { width } = Dimensions.get('window');

type FilterType = 'all' | 'today' | 'week' | 'month' | 'counter';
type SortType = 'newest' | 'oldest' | 'longest' | 'shortest';
type ViewType = 'history' | 'achievements';

interface Achievement {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  category: string;
  isUnlocked: boolean;
  progress?: number;
  maxProgress?: number;
  color: string;
}

export default function HistoryScreen() {
  const { colors, isDark } = useAppTheme();
  const { sessions, counters } = useTasbeeh();
  const { pendingAction, clearPendingAction } = useGlobalAction();

  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortType>('newest');
  const [selectedCounterId, setSelectedCounterId] = useState<string | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [currentView, setCurrentView] = useState<ViewType>('history');

  // Handle pending actions from global search
  useFocusEffect(
    React.useCallback(() => {
      if (pendingAction && pendingAction.screen === '/(tabs)/history') {
        // Execute the pending action
        switch (pendingAction.type) {
          case 'openAchievements':
            setCurrentView('achievements');
            break;
          case 'openSessionHistory':
            setCurrentView('history');
            break;
          case 'openStatistics':
            setCurrentView('history'); // Statistics are part of history view
            break;
        }
        // Clear the pending action
        clearPendingAction();
      }
    }, [pendingAction, clearPendingAction])
  );

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const filteredAndSortedSessions = useMemo(() => {
    let filtered = sessions.filter(session => session.endTime); // Only completed sessions

    // Apply filters
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    switch (filter) {
      case 'today':
        filtered = filtered.filter(session => new Date(session.startTime) >= today);
        break;
      case 'week':
        filtered = filtered.filter(session => new Date(session.startTime) >= weekAgo);
        break;
      case 'month':
        filtered = filtered.filter(session => new Date(session.startTime) >= monthAgo);
        break;
      case 'counter':
        if (selectedCounterId) {
          filtered = filtered.filter(session => session.counterId === selectedCounterId);
        }
        break;
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sort) {
        case 'newest':
          return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
        case 'oldest':
          return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
        case 'longest':
          return b.duration - a.duration;
        case 'shortest':
          return a.duration - b.duration;
        default:
          return 0;
      }
    });

    return filtered;
  }, [sessions, filter, sort, selectedCounterId]);

  const statistics = useMemo(() => {
    const completedSessions = sessions.filter(session => session.endTime);
    
    if (completedSessions.length === 0) {
      return {
        totalSessions: 0,
        totalCounts: 0,
        totalTime: 0,
        averageSessionTime: 0,
        averageCounts: 0,
        longestSession: 0,
        mostProductiveDay: 'N/A',
      };
    }

    const totalSessions = completedSessions.length;
    const totalCounts = completedSessions.reduce((sum, session) => sum + session.totalCounts, 0);
    const totalTime = completedSessions.reduce((sum, session) => sum + session.duration, 0);
    const averageSessionTime = Math.floor(totalTime / totalSessions);
    const averageCounts = Math.floor(totalCounts / totalSessions);
    const longestSession = Math.max(...completedSessions.map(session => session.duration));

    // Find most productive day
    const dayStats: { [key: string]: number } = {};
    completedSessions.forEach(session => {
      const day = new Date(session.startTime).toLocaleDateString('en-US', { weekday: 'long' });
      dayStats[day] = (dayStats[day] || 0) + session.totalCounts;
    });
    const mostProductiveDay = Object.entries(dayStats).reduce((a, b) => 
      dayStats[a[0]] > dayStats[b[0]] ? a : b
    )[0];

    return {
      totalSessions,
      totalCounts,
      totalTime,
      averageSessionTime,
      averageCounts,
      longestSession,
      mostProductiveDay,
    };
  }, [sessions]);

  const achievements = useMemo(() => {
    const completedSessions = sessions.filter(session => session.endTime);
    const totalCounts = completedSessions.reduce((sum, session) => sum + session.totalCounts, 0);
    const totalSessions = completedSessions.length;
    const totalTime = completedSessions.reduce((sum, session) => sum + session.duration, 0);
    const totalTimeMinutes = Math.floor(totalTime / 60);
    const totalTimeHours = Math.floor(totalTime / 3600);
    const longestSession = totalSessions > 0 ? Math.max(...completedSessions.map(session => session.duration)) : 0;
    
    // Calculate streaks
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
    const todaySessions = completedSessions.filter(session => 
      new Date(session.startTime).toDateString() === today
    );
    const yesterdaySessions = completedSessions.filter(session => 
      new Date(session.startTime).toDateString() === yesterday
    );
    
    // Week activity
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const thisWeekSessions = completedSessions.filter(session => 
      new Date(session.startTime) >= weekStart
    );
    const thisWeekCounts = thisWeekSessions.reduce((sum, session) => sum + session.totalCounts, 0);
    
    // Target achievements
    const targetsReached = counters.filter(counter => counter.target && counter.count >= counter.target).length;
    const countersWithTargets = counters.filter(counter => counter.target).length;
    
    // Most active counter
    const mostActiveCounter = counters.reduce((max, counter) => 
      counter.count > (max?.count || 0) ? counter : max
    , counters[0]);
    
    // Calculate consecutive days (simplified)
    const sortedDates = [...new Set(completedSessions.map(session => 
      new Date(session.startTime).toDateString()
    ))].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    
    let currentStreak = 0;
    let checkDate = new Date();
    
    for (let i = 0; i < sortedDates.length; i++) {
      const sessionDate = new Date(sortedDates[i]);
      const expectedDate = new Date(checkDate);
      expectedDate.setDate(expectedDate.getDate() - i);
      
      if (sessionDate.toDateString() === expectedDate.toDateString()) {
        currentStreak++;
      } else {
        break;
      }
    }

    const achievementList: Achievement[] = [
      // BEGINNER ACHIEVEMENTS (Getting Started)
      {
        id: 'first_count',
        icon: '🌱',
        title: 'First Steps',
        subtitle: 'Complete your first count',
        category: 'Beginner',
        isUnlocked: totalCounts >= 1,
        color: colors.islamic.green,
      },
      {
        id: 'ten_counts',
        icon: '🌿',
        title: 'Growing Faith',
        subtitle: 'Reach 10 total counts',
        category: 'Beginner',
        isUnlocked: totalCounts >= 10,
        progress: Math.min(totalCounts, 10),
        maxProgress: 10,
        color: colors.islamic.green,
      },
      {
        id: 'first_session',
        icon: '⭐',
        title: 'First Session',
        subtitle: 'Complete your first session',
        category: 'Beginner',
        isUnlocked: totalSessions >= 1,
        color: colors.primary,
      },
      {
        id: 'five_sessions',
        icon: '🎯',
        title: 'Consistent Start',
        subtitle: 'Complete 5 sessions',
        category: 'Beginner',
        isUnlocked: totalSessions >= 5,
        progress: Math.min(totalSessions, 5),
        maxProgress: 5,
        color: colors.primary,
      },
      {
        id: 'hundred_counts',
        icon: '🥉',
        title: 'Bronze Counter',
        subtitle: 'Reach 100 total counts',
        category: 'Beginner',
        isUnlocked: totalCounts >= 100,
        progress: Math.min(totalCounts, 100),
        maxProgress: 100,
        color: colors.accent,
      },

      // INTERMEDIATE ACHIEVEMENTS (Building Habit)
      {
        id: 'five_hundred_counts',
        icon: '🥈',
        title: 'Silver Counter',
        subtitle: 'Reach 500 total counts',
        category: 'Intermediate',
        isUnlocked: totalCounts >= 500,
        progress: Math.min(totalCounts, 500),
        maxProgress: 500,
        color: COLORS.primary.teal,
      },
      {
        id: 'thousand_counts',
        icon: '🥇',
        title: 'Gold Counter',
        subtitle: 'Reach 1,000 total counts',
        category: 'Intermediate',
        isUnlocked: totalCounts >= 1000,
        progress: Math.min(totalCounts, 1000),
        maxProgress: 1000,
        color: COLORS.primary.orange,
      },
      {
        id: 'twenty_sessions',
        icon: '📈',
        title: 'Building Momentum',
        subtitle: 'Complete 20 sessions',
        category: 'Intermediate',
        isUnlocked: totalSessions >= 20,
        progress: Math.min(totalSessions, 20),
        maxProgress: 20,
        color: COLORS.primary.blue,
      },
      {
        id: 'one_hour_total',
        icon: '⏰',
        title: 'Hour of Devotion',
        subtitle: 'Spend 1 total hour in sessions',
        category: 'Intermediate',
        isUnlocked: totalTimeMinutes >= 60,
        progress: Math.min(totalTimeMinutes, 60),
        maxProgress: 60,
        color: COLORS.primary.purple,
      },
      {
        id: 'daily_warrior',
        icon: '🌅',
        title: 'Daily Warrior',
        subtitle: 'Active today',
        category: 'Intermediate',
        isUnlocked: todaySessions.length > 0,
        color: COLORS.primary.pink,
      },
      {
        id: 'weekly_warrior',
        icon: '📅',
        title: 'Weekly Warrior',
        subtitle: 'Active this week',
        category: 'Intermediate',
        isUnlocked: thisWeekSessions.length > 0,
        color: COLORS.primary.indigo,
      },

      // ADVANCED ACHIEVEMENTS (Mastery)
      {
        id: 'five_thousand_counts',
        icon: '💎',
        title: 'Diamond Counter',
        subtitle: 'Reach 5,000 total counts',
        category: 'Advanced',
        isUnlocked: totalCounts >= 5000,
        progress: Math.min(totalCounts, 5000),
        maxProgress: 5000,
        color: COLORS.primary.teal,
      },
      {
        id: 'ten_thousand_counts',
        icon: '🏆',
        title: 'Master Counter',
        subtitle: 'Reach 10,000 total counts',
        category: 'Advanced',
        isUnlocked: totalCounts >= 10000,
        progress: Math.min(totalCounts, 10000),
        maxProgress: 10000,
        color: COLORS.primary.orange,
      },
      {
        id: 'fifty_sessions',
        icon: '📊',
        title: 'Session Pro',
        subtitle: 'Complete 50 sessions',
        category: 'Advanced',
        isUnlocked: totalSessions >= 50,
        progress: Math.min(totalSessions, 50),
        maxProgress: 50,
        color: COLORS.primary.blue,
      },
      {
        id: 'hundred_sessions',
        icon: '🎖️',
        title: 'Session Master',
        subtitle: 'Complete 100 sessions',
        category: 'Advanced',
        isUnlocked: totalSessions >= 100,
        progress: Math.min(totalSessions, 100),
        maxProgress: 100,
        color: COLORS.primary.indigo,
      },
      {
        id: 'ten_hours_total',
        icon: '⚡',
        title: 'Time Master',
        subtitle: 'Spend 10 total hours in sessions',
        category: 'Advanced',
        isUnlocked: totalTimeHours >= 10,
        progress: Math.min(totalTimeHours, 10),
        maxProgress: 10,
        color: COLORS.primary.purple,
      },
      {
        id: 'long_session',
        icon: '🔥',
        title: 'Marathon Session',
        subtitle: 'Complete a 30+ minute session',
        category: 'Advanced',
        isUnlocked: longestSession >= 1800,
        color: COLORS.primary.pink,
      },

      // EXPERT ACHIEVEMENTS (Ultimate Goals)
      {
        id: 'twenty_five_thousand_counts',
        icon: '🌟',
        title: 'Elite Counter',
        subtitle: 'Reach 25,000 total counts',
        category: 'Expert',
        isUnlocked: totalCounts >= 25000,
        progress: Math.min(totalCounts, 25000),
        maxProgress: 25000,
        color: COLORS.primary.emerald,
      },
      {
        id: 'fifty_thousand_counts',
        icon: '👑',
        title: 'Royal Counter',
        subtitle: 'Reach 50,000 total counts',
        category: 'Expert',
        isUnlocked: totalCounts >= 50000,
        progress: Math.min(totalCounts, 50000),
        maxProgress: 50000,
        color: COLORS.primary.orange,
      },
      {
        id: 'hundred_thousand_counts',
        icon: '🌌',
        title: 'Cosmic Counter',
        subtitle: 'Reach 100,000 total counts',
        category: 'Expert',
        isUnlocked: totalCounts >= 100000,
        progress: Math.min(totalCounts, 100000),
        maxProgress: 100000,
        color: COLORS.primary.purple,
      },
      {
        id: 'two_hundred_sessions',
        icon: '🎯',
        title: 'Session Legend',
        subtitle: 'Complete 200 sessions',
        category: 'Expert',
        isUnlocked: totalSessions >= 200,
        progress: Math.min(totalSessions, 200),
        maxProgress: 200,
        color: COLORS.primary.blue,
      },
      {
        id: 'fifty_hours_total',
        icon: '🕐',
        title: 'Time Legend',
        subtitle: 'Spend 50 total hours in sessions',
        category: 'Expert',
        isUnlocked: totalTimeHours >= 50,
        progress: Math.min(totalTimeHours, 50),
        maxProgress: 50,
        color: COLORS.primary.indigo,
      },

      // SPECIAL ACHIEVEMENTS (Consistency & Dedication)
      {
        id: 'three_day_streak',
        icon: '🔥',
        title: 'Three Day Streak',
        subtitle: 'Active for 3 consecutive days',
        category: 'Special',
        isUnlocked: currentStreak >= 3,
        progress: Math.min(currentStreak, 3),
        maxProgress: 3,
        color: COLORS.primary.pink,
      },
      {
        id: 'week_streak',
        icon: '🌟',
        title: 'Week Warrior',
        subtitle: 'Active for 7 consecutive days',
        category: 'Special',
        isUnlocked: currentStreak >= 7,
        progress: Math.min(currentStreak, 7),
        maxProgress: 7,
        color: COLORS.primary.emerald,
      },
      {
        id: 'month_streak',
        icon: '🏅',
        title: 'Month Master',
        subtitle: 'Active for 30 consecutive days',
        category: 'Special',
        isUnlocked: currentStreak >= 30,
        progress: Math.min(currentStreak, 30),
        maxProgress: 30,
        color: COLORS.primary.orange,
      },
      {
        id: 'target_achiever',
        icon: '🎯',
        title: 'Target Achiever',
        subtitle: `Reached ${targetsReached || 0} target${(targetsReached || 0) !== 1 ? 's' : ''}`,
        category: 'Special',
        isUnlocked: targetsReached > 0,
        progress: targetsReached || 0,
        maxProgress: Math.max(countersWithTargets, 1), // Ensure maxProgress is at least 1
        color: COLORS.primary.teal,
      },
      {
        id: 'multi_counter',
        icon: '🔄',
        title: 'Multi-Counter',
        subtitle: 'Use multiple counters',
        category: 'Special',
        isUnlocked: counters.length >= 2,
        progress: Math.min(counters.length, 5),
        maxProgress: 5,
        color: COLORS.primary.blue,
      },
      {
        id: 'dedicated_devotee',
        icon: '🙏',
        title: 'Dedicated Devotee',
        subtitle: 'Complete 500+ counts in a week',
        category: 'Special',
        isUnlocked: thisWeekCounts >= 500,
        progress: Math.min(thisWeekCounts, 500),
        maxProgress: 500,
                      color: colors.islamic.green,
      },

      // LEGENDARY ACHIEVEMENTS (Ultimate Mastery)
      {
        id: 'million_counts',
        icon: '🌠',
        title: 'Million Count Legend',
        subtitle: 'Reach 1,000,000 total counts',
        category: 'Legendary',
        isUnlocked: totalCounts >= 1000000,
        progress: Math.min(totalCounts, 1000000),
        maxProgress: 1000000,
        color: COLORS.primary.purple,
      },
      {
        id: 'thousand_sessions',
        icon: '⭐',
        title: 'Thousand Session Master',
        subtitle: 'Complete 1,000 sessions',
        category: 'Legendary',
        isUnlocked: totalSessions >= 1000,
        progress: Math.min(totalSessions, 1000),
        maxProgress: 1000,
        color: COLORS.primary.blue,
      },
      {
        id: 'hundred_hours',
        icon: '🌙',
        title: 'Hundred Hour Devotion',
        subtitle: 'Spend 100 total hours in sessions',
        category: 'Legendary',
        isUnlocked: totalTimeHours >= 100,
        progress: Math.min(totalTimeHours, 100),
        maxProgress: 100,
        color: COLORS.primary.indigo,
      },
      {
        id: 'year_streak',
        icon: '🌈',
        title: 'Year-Long Devotion',
        subtitle: 'Active for 365 consecutive days',
        category: 'Legendary',
        isUnlocked: currentStreak >= 365,
        progress: Math.min(currentStreak, 365),
        maxProgress: 365,
        color: COLORS.primary.emerald,
      },
    ];

    return achievementList;
  }, [sessions, counters]);

  const renderSessionItem = ({ item }: { item: Session }) => {
    const counter = counters.find(c => c.id === item.counterId);
    
    return (
      <View style={[
        styles.sessionCard,
        { backgroundColor: isDark ? COLORS.neutral.gray800 : COLORS.neutral.white }
      ]}>
        <View style={styles.sessionHeader}>
          <View style={styles.sessionTitleContainer}>
            <View style={[
              styles.counterIndicator,
              { backgroundColor: colors.primary }
            ]} />
            <Text style={[
              styles.sessionTitle,
              { color: isDark ? COLORS.neutral.white : COLORS.neutral.gray900 }
            ]}>
              {item.counterName}
            </Text>
          </View>
          <Text style={[
            styles.sessionDate,
            { color: isDark ? COLORS.neutral.gray300 : COLORS.neutral.gray600 }
          ]}>
            {formatDate(item.startTime)}
          </Text>
        </View>

        <View style={styles.sessionStats}>
          <View style={styles.statItem}>
            <Ionicons 
              name="finger-print" 
              size={16} 
              color={isDark ? COLORS.neutral.gray400 : COLORS.neutral.gray500} 
            />
            <Text style={[
              styles.statText,
              { color: isDark ? COLORS.neutral.gray300 : COLORS.neutral.gray600 }
            ]}>
              {item.totalCounts} counts
            </Text>
          </View>

          <View style={styles.statItem}>
            <Ionicons 
              name="time" 
              size={16} 
              color={isDark ? COLORS.neutral.gray400 : COLORS.neutral.gray500} 
            />
            <Text style={[
              styles.statText,
              { color: isDark ? COLORS.neutral.gray300 : COLORS.neutral.gray600 }
            ]}>
              {formatDuration(item.duration)}
            </Text>
          </View>

          <View style={styles.statItem}>
            <Ionicons 
              name="trending-up" 
              size={16} 
              color={isDark ? COLORS.neutral.gray400 : COLORS.neutral.gray500} 
            />
            <Text style={[
              styles.statText,
              { color: isDark ? COLORS.neutral.gray300 : COLORS.neutral.gray600 }
            ]}>
              {item.startCount} → {item.endCount}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const AchievementBadge = ({ achievement }: { achievement: Achievement }) => {
    if (!achievement || !achievement.title || !achievement.subtitle) {
      return null;
    }

    return (
      <View style={[
        styles.achievementBadge,
        { 
          backgroundColor: isDark ? COLORS.neutral.gray800 : COLORS.neutral.white,
          opacity: achievement.isUnlocked ? 1 : 0.6 
        }
      ]}>
        <View style={[
          styles.achievementIconContainer,
          { backgroundColor: achievement.isUnlocked ? achievement.color : COLORS.neutral.gray400 }
        ]}>
          <Text style={styles.achievementIcon}>{achievement.icon || '🏆'}</Text>
        </View>
        <View style={styles.achievementContent}>
          <Text style={[
            styles.achievementTitle,
            { color: isDark ? COLORS.neutral.white : COLORS.neutral.gray900 }
          ]}>
            {achievement.title}
          </Text>
          <Text style={[
            styles.achievementSubtitle,
            { color: isDark ? COLORS.neutral.gray300 : COLORS.neutral.gray600 }
          ]}>
            {achievement.subtitle}
          </Text>
          {achievement.progress !== undefined && achievement.maxProgress && achievement.maxProgress > 0 && (
            <View style={styles.progressContainer}>
              <View style={[
                styles.progressBar,
                { backgroundColor: isDark ? COLORS.neutral.gray600 : COLORS.neutral.gray300 }
              ]}>
                <View style={[
                  styles.progressFill,
                  { 
                    width: `${Math.min(100, Math.max(0, (achievement.progress / achievement.maxProgress) * 100))}%`,
                    backgroundColor: achievement.color 
                  }
                ]} />
              </View>
              <Text style={[
                styles.progressText,
                { color: isDark ? COLORS.neutral.gray400 : COLORS.neutral.gray500 }
              ]}>
                {achievement.progress || 0}/{achievement.maxProgress || 0}
              </Text>
            </View>
          )}
        </View>
        {achievement.isUnlocked && (
          <Ionicons name="checkmark-circle" size={24} color={achievement.color || colors.primary} />
        )}
      </View>
    );
  };

  const renderAchievementsByCategory = () => {
    const categories = ['Beginner', 'Intermediate', 'Advanced', 'Expert', 'Special', 'Legendary'];
    
    return categories.map(category => {
      const categoryAchievements = achievements.filter(a => a && a.category === category);
      const unlockedCount = categoryAchievements.filter(a => a && a.isUnlocked).length;
      
      if (categoryAchievements.length === 0) return null;
      
      return (
        <View key={category} style={styles.achievementCategory}>
          <View style={styles.categoryHeader}>
            <Text style={[
              styles.categoryTitle,
              { color: isDark ? COLORS.neutral.white : COLORS.neutral.gray900 }
            ]}>
              {category} ({unlockedCount}/{categoryAchievements.length})
            </Text>
          </View>
          {categoryAchievements
            .filter(achievement => achievement && achievement.id && achievement.title && achievement.subtitle)
            .map(achievement => (
              <AchievementBadge key={achievement.id} achievement={achievement} />
            ))}
        </View>
      );
    }).filter(Boolean); // Remove any null values
  };

  return (
    <SafeAreaView style={[
      styles.container,
      { backgroundColor: colors.background }
    ]}>
      <HistoryErrorBoundary>
        {/* Header */}
      <View style={styles.header}>
        <Text style={[
          styles.headerTitle,
          { color: colors.text.primary }
        ]}>
          History & Statistics
        </Text>
        <TouchableOpacity
          style={[
            styles.filterButton,
            { backgroundColor: colors.surface }
          ]}
          onPress={() => setShowFilterModal(true)}
        >
          <Ionicons 
            name="funnel" 
            size={20} 
            color={colors.text.primary} 
          />
        </TouchableOpacity>
      </View>

      {/* View Switcher */}
      <View style={styles.viewSwitcher}>
        <TouchableOpacity
          style={[
            styles.switcherButton,
            { backgroundColor: colors.surface },
            currentView === 'history' && { backgroundColor: colors.primary }
          ]}
          onPress={() => setCurrentView('history')}
        >
          <Ionicons 
            name="time" 
            size={20} 
            color={currentView === 'history' ? colors.text.onPrimary : colors.text.primary} 
          />
          <Text style={[
            styles.switcherText,
            { color: currentView === 'history' ? colors.text.onPrimary : colors.text.primary }
          ]}>
            History
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.switcherButton,
            { backgroundColor: colors.surface },
            currentView === 'achievements' && { backgroundColor: colors.primary }
          ]}
          onPress={() => setCurrentView('achievements')}
        >
          <Ionicons 
            name="trophy" 
            size={20} 
            color={currentView === 'achievements' ? colors.text.onPrimary : colors.text.primary} 
          />
          <Text style={[
            styles.switcherText,
            { color: currentView === 'achievements' ? colors.text.onPrimary : colors.text.primary }
          ]}>
            Achievements ({achievements.filter(a => a.isUnlocked).length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {currentView === 'history' ? (
          <>
            {/* Statistics Cards */}
            <View style={styles.statsContainer}>
              <View style={[
                styles.statCard,
                { backgroundColor: colors.card }
              ]}>
                <Text style={[
                  styles.statValue,
                  { color: colors.islamic.green }
                ]}>
                  {statistics.totalSessions}
                </Text>
                <Text style={[
                  styles.statLabel,
                  { color: colors.text.secondary }
                ]}>
                  Total Sessions
                </Text>
              </View>

              <View style={[
                styles.statCard,
                { backgroundColor: colors.card }
              ]}>
                <Text style={[
                  styles.statValue,
                  { color: colors.primary }
                ]}>
                  {statistics.totalCounts.toLocaleString()}
                </Text>
                <Text style={[
                  styles.statLabel,
                  { color: colors.text.secondary }
                ]}>
                  Total Counts
                </Text>
              </View>

              <View style={[
                styles.statCard,
                { backgroundColor: colors.card }
              ]}>
                <Text style={[
                  styles.statValue,
                  { color: colors.islamic.navy }
                ]}>
                  {formatDuration(statistics.totalTime)}
                </Text>
                <Text style={[
                  styles.statLabel,
                  { color: colors.text.secondary }
                ]}>
                  Total Time
                </Text>
              </View>

              <View style={[
                styles.statCard,
                { backgroundColor: colors.card }
              ]}>
                <Text style={[
                  styles.statValue,
                  { color: colors.accent }
                ]}>
                  {formatDuration(statistics.averageSessionTime)}
                </Text>
                <Text style={[
                  styles.statLabel,
                  { color: colors.text.secondary }
                ]}>
                  Avg Session
                </Text>
              </View>
            </View>

            {/* Sessions List */}
            <View style={styles.sessionsSection}>
              <Text style={[
                styles.sectionTitle,
                { color: isDark ? COLORS.neutral.white : COLORS.neutral.gray900 }
              ]}>
                Recent Sessions ({filteredAndSortedSessions.length})
              </Text>

              {filteredAndSortedSessions.length === 0 ? (
                <View style={[
                  styles.emptyState,
                  { backgroundColor: isDark ? COLORS.neutral.gray800 : COLORS.neutral.white }
                ]}>
                  <Ionicons 
                    name="time-outline" 
                    size={48} 
                    color={isDark ? COLORS.neutral.gray500 : COLORS.neutral.gray400} 
                  />
                  <Text style={[
                    styles.emptyStateText,
                    { color: isDark ? COLORS.neutral.gray400 : COLORS.neutral.gray500 }
                  ]}>
                    No sessions found
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={filteredAndSortedSessions}
                  renderItem={renderSessionItem}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  showsVerticalScrollIndicator={false}
                />
              )}
            </View>
          </>
        ) : (
          <View style={styles.achievementsSection}>
            <View style={styles.achievementsSummary}>
              <Text style={[
                styles.achievementsSummaryText,
                { color: isDark ? COLORS.neutral.gray300 : COLORS.neutral.gray600 }
              ]}>
                {achievements.filter(a => a.isUnlocked).length} of {achievements.length} achievements unlocked
              </Text>
            </View>
            {renderAchievementsByCategory()}
          </View>
        )}
      </ScrollView>
      </HistoryErrorBoundary>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={[
          styles.modalContainer,
          { backgroundColor: isDark ? COLORS.neutral.gray900 : COLORS.neutral.white }
        ]}>
          <View style={styles.modalHeader}>
            <Text style={[
              styles.modalTitle,
              { color: isDark ? COLORS.neutral.white : COLORS.neutral.gray900 }
            ]}>
              Filter & Sort
            </Text>
            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
              <Ionicons 
                name="close" 
                size={24} 
                color={isDark ? COLORS.neutral.white : COLORS.neutral.gray900} 
              />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Filter Options */}
            <Text style={[
              styles.sectionLabel,
              { color: isDark ? COLORS.neutral.white : COLORS.neutral.gray900 }
            ]}>
              Filter by Time
            </Text>
            
            {[
              { key: 'all', label: 'All Time' },
              { key: 'today', label: 'Today' },
              { key: 'week', label: 'This Week' },
              { key: 'month', label: 'This Month' },
              { key: 'counter', label: 'By Counter' },
            ].map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.filterOption,
                                { backgroundColor: isDark ? COLORS.neutral.gray800 : COLORS.neutral.gray100 },
              filter === option.key && { backgroundColor: colors.primary }
                ]}
                onPress={() => setFilter(option.key as FilterType)}
              >
                <Text style={[
                  styles.filterOptionText,
                  { color: isDark ? COLORS.neutral.white : COLORS.neutral.gray900 },
                  filter === option.key && { color: COLORS.neutral.white }
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}

            {/* Counter Selection */}
            {filter === 'counter' && (
              <>
                <Text style={[
                  styles.sectionLabel,
                  { color: isDark ? COLORS.neutral.white : COLORS.neutral.gray900 }
                ]}>
                  Select Counter
                </Text>
                
                {counters.map((counter) => (
                  <TouchableOpacity
                    key={counter.id}
                    style={[
                      styles.filterOption,
                      { backgroundColor: isDark ? COLORS.neutral.gray800 : COLORS.neutral.gray100 },
                      selectedCounterId === counter.id && { backgroundColor: colors.primary }
                    ]}
                    onPress={() => setSelectedCounterId(counter.id)}
                  >
                    <View style={styles.counterOption}>
                      <View style={[
                        styles.counterIndicator,
                        { backgroundColor: counter.color }
                      ]} />
                      <Text style={[
                        styles.filterOptionText,
                        { color: isDark ? COLORS.neutral.white : COLORS.neutral.gray900 },
                        selectedCounterId === counter.id && { color: COLORS.neutral.white }
                      ]}>
                        {counter.name}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </>
            )}

            {/* Sort Options */}
            <Text style={[
              styles.sectionLabel,
              { color: isDark ? COLORS.neutral.white : COLORS.neutral.gray900 }
            ]}>
              Sort by
            </Text>
            
            {[
              { key: 'newest', label: 'Newest First' },
              { key: 'oldest', label: 'Oldest First' },
              { key: 'longest', label: 'Longest Duration' },
              { key: 'shortest', label: 'Shortest Duration' },
            ].map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.filterOption,
                                { backgroundColor: isDark ? COLORS.neutral.gray800 : COLORS.neutral.gray100 },
              sort === option.key && { backgroundColor: colors.secondary }
                ]}
                onPress={() => setSort(option.key as SortType)}
              >
                <Text style={[
                  styles.filterOptionText,
                  { color: isDark ? COLORS.neutral.white : COLORS.neutral.gray900 },
                  sort === option.key && { color: COLORS.neutral.white }
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  filterButton: {
    padding: 10,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    padding: 20,
    borderRadius: 16,
    marginBottom: 10,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    textAlign: 'center',
  },
  sessionsSection: {
    padding: 20,
    paddingTop: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
  },
  sessionCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sessionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  counterIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  sessionDate: {
    fontSize: 12,
  },
  sessionStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statText: {
    fontSize: 12,
    marginLeft: 4,
  },
  emptyState: {
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyStateText: {
    fontSize: 16,
    marginTop: 10,
  },
  modalContainer: {
    flex: 1,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
  },
  filterOption: {
    padding: 15,
    borderRadius: 12,
    marginBottom: 8,
  },
  filterOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  counterOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // View Switcher Styles
  viewSwitcher: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    backgroundColor: 'transparent',
    gap: 8,
  },
  switcherButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  switcherText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Achievements Styles
  achievementsSection: {
    padding: 20,
  },
  achievementsSummary: {
    marginBottom: 20,
    alignItems: 'center',
  },
  achievementsSummaryText: {
    fontSize: 16,
    fontWeight: '500',
  },
  achievementCategory: {
    marginBottom: 30,
  },
  categoryHeader: {
    marginBottom: 15,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  achievementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  achievementIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  achievementIcon: {
    fontSize: 24,
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  achievementSubtitle: {
    fontSize: 14,
    marginBottom: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
    minWidth: 50,
    textAlign: 'right',
  },
}); 