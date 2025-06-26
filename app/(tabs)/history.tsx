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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTasbeeh } from '../../src/contexts/TasbeehContext';
import { useAppTheme } from '../../src/utils/theme';
import { COLORS, Session } from '../../src/types';

type FilterType = 'all' | 'today' | 'week' | 'month' | 'counter';
type SortType = 'newest' | 'oldest' | 'longest' | 'shortest';

export default function HistoryScreen() {
  const { isDark } = useAppTheme();
  const { sessions, counters } = useTasbeeh();

  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortType>('newest');
  const [selectedCounterId, setSelectedCounterId] = useState<string | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);

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
              { backgroundColor: counter?.color || COLORS.primary.blue }
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

  return (
    <SafeAreaView style={[
      styles.container,
      { backgroundColor: isDark ? COLORS.neutral.gray900 : COLORS.neutral.gray50 }
    ]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[
          styles.headerTitle,
          { color: isDark ? COLORS.neutral.white : COLORS.neutral.gray900 }
        ]}>
          History & Statistics
        </Text>
        <TouchableOpacity
          style={[
            styles.filterButton,
            { backgroundColor: isDark ? COLORS.neutral.gray800 : COLORS.neutral.white }
          ]}
          onPress={() => setShowFilterModal(true)}
        >
          <Ionicons 
            name="funnel" 
            size={20} 
            color={isDark ? COLORS.neutral.white : COLORS.neutral.gray900} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Statistics Cards */}
        <View style={styles.statsContainer}>
          <View style={[
            styles.statCard,
            { backgroundColor: isDark ? COLORS.neutral.gray800 : COLORS.neutral.white }
          ]}>
            <Text style={[
              styles.statValue,
              { color: COLORS.primary.green }
            ]}>
              {statistics.totalSessions}
            </Text>
            <Text style={[
              styles.statLabel,
              { color: isDark ? COLORS.neutral.gray300 : COLORS.neutral.gray600 }
            ]}>
              Total Sessions
            </Text>
          </View>

          <View style={[
            styles.statCard,
            { backgroundColor: isDark ? COLORS.neutral.gray800 : COLORS.neutral.white }
          ]}>
            <Text style={[
              styles.statValue,
              { color: COLORS.primary.blue }
            ]}>
              {statistics.totalCounts.toLocaleString()}
            </Text>
            <Text style={[
              styles.statLabel,
              { color: isDark ? COLORS.neutral.gray300 : COLORS.neutral.gray600 }
            ]}>
              Total Counts
            </Text>
          </View>

          <View style={[
            styles.statCard,
            { backgroundColor: isDark ? COLORS.neutral.gray800 : COLORS.neutral.white }
          ]}>
            <Text style={[
              styles.statValue,
              { color: COLORS.primary.purple }
            ]}>
              {formatDuration(statistics.totalTime)}
            </Text>
            <Text style={[
              styles.statLabel,
              { color: isDark ? COLORS.neutral.gray300 : COLORS.neutral.gray600 }
            ]}>
              Total Time
            </Text>
          </View>

          <View style={[
            styles.statCard,
            { backgroundColor: isDark ? COLORS.neutral.gray800 : COLORS.neutral.white }
          ]}>
            <Text style={[
              styles.statValue,
              { color: COLORS.primary.orange }
            ]}>
              {formatDuration(statistics.averageSessionTime)}
            </Text>
            <Text style={[
              styles.statLabel,
              { color: isDark ? COLORS.neutral.gray300 : COLORS.neutral.gray600 }
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
      </ScrollView>

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
                  filter === option.key && { backgroundColor: COLORS.primary.green }
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
                      selectedCounterId === counter.id && { backgroundColor: counter.color }
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
                  sort === option.key && { backgroundColor: COLORS.primary.blue }
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
}); 