/**
 * Skeleton Loading Components
 * Provides smooth skeleton screens for better perceived performance
 */
import React from 'react';
import { View, StyleSheet, Animated, useColorScheme } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../types';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: any;
}

export const SkeletonBox: React.FC<SkeletonProps> = ({ 
  width = '100%', 
  height = 20, 
  borderRadius = 4, 
  style 
}) => {
  const isDark = useColorScheme() === 'dark';
  const shimmerValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(shimmerValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    );
    
    shimmerAnimation.start();

    return () => shimmerAnimation.stop();
  }, [shimmerValue]);

  const translateX = shimmerValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 100],
  });

  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: isDark ? COLORS.neutral.gray700 : COLORS.neutral.gray200,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          {
            transform: [{ translateX }],
          },
        ]}
      >
        <LinearGradient
          colors={[
            'transparent',
            isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.8)',
            'transparent',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>
    </View>
  );
};

export const CounterSkeleton: React.FC = () => {
  const isDark = useColorScheme() === 'dark';
  
  return (
    <View style={[styles.counterSkeleton, { backgroundColor: isDark ? COLORS.neutral.gray900 : COLORS.neutral.gray50 }]}>
      {/* Header Skeleton */}
      <View style={styles.headerSkeleton}>
        <SkeletonBox width={120} height={24} borderRadius={6} />
        <SkeletonBox width={80} height={16} borderRadius={4} />
      </View>

      {/* Progress Bar Skeleton */}
      <View style={styles.progressSkeleton}>
        <SkeletonBox width="100%" height={8} borderRadius={4} />
        <View style={styles.progressTextSkeleton}>
          <SkeletonBox width={60} height={14} borderRadius={3} />
        </View>
      </View>

      {/* Main Counter Skeleton */}
      <View style={styles.mainCounterSkeleton}>
        <SkeletonBox width={200} height={120} borderRadius={12} />
        <SkeletonBox width={100} height={16} borderRadius={4} style={{ marginTop: 12 }} />
      </View>

      {/* Action Buttons Skeleton */}
      <View style={styles.actionButtonsSkeleton}>
        <SkeletonBox width={80} height={44} borderRadius={22} />
        <SkeletonBox width={80} height={44} borderRadius={22} />
      </View>
    </View>
  );
};

export const HistoryListSkeleton: React.FC = () => {
  const isDark = useColorScheme() === 'dark';
  
  return (
    <View style={[styles.historyListSkeleton, { backgroundColor: isDark ? COLORS.neutral.gray900 : COLORS.neutral.gray50 }]}>
      {/* Header */}
      <View style={styles.historyHeaderSkeleton}>
        <SkeletonBox width={150} height={28} borderRadius={6} />
        <SkeletonBox width={100} height={20} borderRadius={4} />
      </View>

      {/* Stats Cards */}
      <View style={styles.statsCardsSkeleton}>
        {[1, 2, 3].map((index) => (
          <View key={index} style={[styles.statsCardSkeleton, { backgroundColor: isDark ? COLORS.neutral.gray800 : COLORS.neutral.white }]}>
            <SkeletonBox width={60} height={32} borderRadius={4} />
            <SkeletonBox width={80} height={14} borderRadius={3} style={{ marginTop: 8 }} />
          </View>
        ))}
      </View>

      {/* Session List */}
      <View style={styles.sessionListSkeleton}>
        {[1, 2, 3, 4, 5].map((index) => (
          <View key={index} style={[styles.sessionItemSkeleton, { backgroundColor: isDark ? COLORS.neutral.gray800 : COLORS.neutral.white }]}>
            <View style={styles.sessionMainSkeleton}>
              <SkeletonBox width={100} height={18} borderRadius={4} />
              <SkeletonBox width={60} height={24} borderRadius={4} />
            </View>
            <View style={styles.sessionDetailsSkeleton}>
              <SkeletonBox width={80} height={14} borderRadius={3} />
              <SkeletonBox width={120} height={14} borderRadius={3} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

export const SettingsListSkeleton: React.FC = () => {
  const isDark = useColorScheme() === 'dark';
  
  return (
    <View style={[styles.settingsListSkeleton, { backgroundColor: isDark ? COLORS.neutral.gray900 : COLORS.neutral.gray50 }]}>
      {/* Header */}
      <View style={styles.settingsHeaderSkeleton}>
        <SkeletonBox width={120} height={28} borderRadius={6} />
      </View>

      {/* Settings Sections */}
      {[1, 2, 3].map((section) => (
        <View key={section} style={styles.settingsSectionSkeleton}>
          <SkeletonBox width={100} height={16} borderRadius={4} style={{ marginBottom: 12 }} />
          
          {[1, 2, 3, 4].map((item) => (
            <View key={item} style={[styles.settingsItemSkeleton, { backgroundColor: isDark ? COLORS.neutral.gray800 : COLORS.neutral.white }]}>
              <View style={styles.settingsItemLeft}>
                <SkeletonBox width={24} height={24} borderRadius={12} />
                <View style={styles.settingsItemText}>
                  <SkeletonBox width={120} height={16} borderRadius={4} />
                  <SkeletonBox width={80} height={12} borderRadius={3} style={{ marginTop: 4 }} />
                </View>
              </View>
              <SkeletonBox width={40} height={20} borderRadius={10} />
            </View>
          ))}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  counterSkeleton: {
    flex: 1,
    padding: 20,
  },
  headerSkeleton: {
    alignItems: 'center',
    marginBottom: 20,
  },
  progressSkeleton: {
    marginBottom: 30,
  },
  progressTextSkeleton: {
    alignItems: 'center',
    marginTop: 8,
  },
  mainCounterSkeleton: {
    alignItems: 'center',
    marginBottom: 40,
  },
  actionButtonsSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 40,
  },
  
  historyListSkeleton: {
    flex: 1,
    padding: 20,
  },
  historyHeaderSkeleton: {
    alignItems: 'center',
    marginBottom: 20,
  },
  statsCardsSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statsCardSkeleton: {
    flex: 1,
    padding: 16,
    marginHorizontal: 4,
    borderRadius: 12,
    alignItems: 'center',
  },
  sessionListSkeleton: {
    flex: 1,
  },
  sessionItemSkeleton: {
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
  },
  sessionMainSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionDetailsSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  
  settingsListSkeleton: {
    flex: 1,
    padding: 20,
  },
  settingsHeaderSkeleton: {
    marginBottom: 30,
  },
  settingsSectionSkeleton: {
    marginBottom: 24,
  },
  settingsItemSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingsItemText: {
    marginLeft: 12,
    flex: 1,
  },
}); 