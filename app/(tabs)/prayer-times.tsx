import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { usePrayerTimes } from '../../src/contexts/PrayerTimesContext';
import { useAppTheme } from '../../src/utils/theme';
import { COLORS, PrayerName, PRAYER_NAMES } from '../../src/types';
import { accessibilityManager } from '../../src/utils/accessibility';
import PrayerSettingsModal from '../../src/components/PrayerSettingsModal';
import { PrayerTimesErrorBoundary } from '../../src/components/PrayerTimesErrorBoundary';

const { width } = Dimensions.get('window');

function PrayerTimesScreenContent() {
  const {
    currentTimes,
    isLoading,
    error,
    nextPrayer,
    settings,
    isOnline,
    fetchPrayerTimes,
    updatePrayerAdjustment,
    togglePrayerNotification,
    playAdhan,
    stopAdhan,
  } = usePrayerTimes();

  const { isDark } = useAppTheme();
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const lastFetchedDate = useRef<string | null>(null);

  const accessibleColors = accessibilityManager.getAccessibleColors(isDark ? 'dark' : 'light');

  useEffect(() => {
    // Load prayer times for the selected date when it changes
    if (selectedDate && selectedDate !== lastFetchedDate.current) {
      lastFetchedDate.current = selectedDate;
      fetchPrayerTimes(selectedDate);
    }
  }, [selectedDate]);

  const navigateToDate = (direction: 'prev' | 'next') => {
    const currentDate = new Date(selectedDate);
    if (direction === 'prev') {
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      currentDate.setDate(currentDate.getDate() + 1);
    }
    setSelectedDate(currentDate.toISOString().split('T')[0]);
  };

  const goToToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowString = tomorrow.toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toISOString().split('T')[0];

    if (dateString === today) return 'Today';
    if (dateString === tomorrowString) return 'Tomorrow';
    if (dateString === yesterdayString) return 'Yesterday';

    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatHijriDate = (hijriDate: string) => {
    // Simple formatting - in production, you might want more sophisticated Hijri formatting
    return hijriDate;
  };

  const handlePrayerPress = (prayer: PrayerName) => {
    Alert.alert(
      `${PRAYER_NAMES.en[prayer]} Prayer`,
      'What would you like to do?',
      [
        {
          text: 'Toggle Notification',
          onPress: () => togglePrayerNotification(prayer),
        },
        {
          text: 'Adjust Time',
          onPress: () => showTimeAdjustmentDialog(prayer),
        },
        {
          text: 'Play Adhan',
          onPress: () => handlePlayAdhan(),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const showTimeAdjustmentDialog = (prayer: PrayerName) => {
    const currentAdjustment = settings.timeAdjustments[prayer];
    
    Alert.prompt(
      'Adjust Prayer Time',
      `Enter adjustment in minutes (-30 to +30)\nCurrent: ${currentAdjustment} minutes`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Set',
          onPress: (value) => {
            if (value) {
              const minutes = parseInt(value, 10);
              if (!isNaN(minutes) && minutes >= -30 && minutes <= 30) {
                updatePrayerAdjustment(prayer, minutes);
              } else {
                Alert.alert('Invalid Input', 'Please enter a number between -30 and 30');
              }
            }
          },
        },
      ],
      'plain-text',
      currentAdjustment.toString()
    );
  };

  const handlePlayAdhan = async () => {
    try {
      if (isPlaying) {
        await stopAdhan();
        setIsPlaying(false);
      } else {
        await playAdhan(settings.selectedAudio, settings.volume, settings.fadeInDuration);
        setIsPlaying(true);
        // Auto-stop after duration (would be handled by audio service)
        setTimeout(() => setIsPlaying(false), settings.selectedAudio.duration * 1000);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to play Adhan');
    }
  };

  const handleRefresh = () => {
    fetchPrayerTimes(selectedDate, true);
  };

  const getPrayerTimeStatus = (prayer: PrayerName, time: string) => {
    const now = new Date();
    const today = new Date().toISOString().split('T')[0];
    
    // Only show status for today
    if (selectedDate !== today) return null;

    const [hours, minutes] = time.split(':').map(Number);
    const prayerTime = new Date();
    prayerTime.setHours(hours, minutes, 0, 0);

    if (prayerTime.getTime() < now.getTime()) {
      return 'passed';
    } else if (nextPrayer?.name === prayer) {
      return 'next';
    }
    return 'upcoming';
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'passed':
        return COLORS.neutral.gray400;
      case 'next':
        return COLORS.primary.green;
      case 'upcoming':
        return accessibleColors.text;
      default:
        return accessibleColors.text;
    }
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'passed':
        return 'checkmark-circle';
      case 'next':
        return 'radio-button-on';
      case 'upcoming':
        return 'radio-button-off';
      default:
        return 'radio-button-off';
    }
  };

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: accessibleColors.background }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={COLORS.semantic.error} />
          <Text style={[styles.errorText, { color: accessibleColors.text }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: COLORS.primary.green }]}
            onPress={() => fetchPrayerTimes(selectedDate, true)}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: accessibleColors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* Header */}
      <LinearGradient
        colors={isDark ? [COLORS.neutral.gray800, COLORS.neutral.gray700] : [COLORS.primary.green, COLORS.primary.teal]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.dateNavigation}>
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => navigateToDate('prev')}
              accessibilityLabel="Previous day"
            >
              <Ionicons name="chevron-back" size={24} color={COLORS.neutral.white} />
            </TouchableOpacity>

            <View style={styles.dateContainer}>
              <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
              {currentTimes && (
                <Text style={styles.hijriDateText}>
                  {formatHijriDate(currentTimes.hijriDate)}
                </Text>
              )}
            </View>

            <TouchableOpacity
              style={styles.navButton}
              onPress={() => navigateToDate('next')}
              accessibilityLabel="Next day"
            >
              <Ionicons name="chevron-forward" size={24} color={COLORS.neutral.white} />
            </TouchableOpacity>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.todayButton}
              onPress={goToToday}
              accessibilityLabel="Go to today"
            >
              <Text style={styles.todayButtonText}>Today</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => setShowSettings(true)}
              accessibilityLabel="Prayer settings"
            >
              <Ionicons name="settings" size={20} color={COLORS.neutral.white} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Location Info */}
        {currentTimes && (
          <View style={styles.locationContainer}>
            <Ionicons name="location" size={16} color={COLORS.neutral.white} />
            <Text style={styles.locationText}>
              {currentTimes.location.city}, {currentTimes.location.country}
            </Text>
            {!isOnline && (
              <View style={styles.offlineIndicator}>
                <Ionicons name="cloud-offline" size={16} color={COLORS.semantic.warning} />
                <Text style={styles.offlineText}>Offline</Text>
              </View>
            )}
          </View>
        )}
      </LinearGradient>

      {/* Next Prayer Info */}
      {nextPrayer && selectedDate === new Date().toISOString().split('T')[0] && (
        <View style={[styles.nextPrayerContainer, { backgroundColor: accessibleColors.surface }]}>
          <View style={styles.nextPrayerContent}>
            <View>
              <Text style={[styles.nextPrayerLabel, { color: COLORS.neutral.gray500 }]}>
                Next Prayer
              </Text>
              <Text style={[styles.nextPrayerName, { color: accessibleColors.text }]}>
                {PRAYER_NAMES.en[nextPrayer.name]}
              </Text>
            </View>
            <View style={styles.nextPrayerTime}>
              <Text style={[styles.nextPrayerTimeText, { color: COLORS.primary.green }]}>
                {nextPrayer.time}
              </Text>
              <Text style={[styles.nextPrayerCountdown, { color: COLORS.neutral.gray500 }]}>
                in {nextPrayer.timeUntil}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Prayer Times List */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary.green}
          />
        }
      >
        {currentTimes ? (
          <View style={styles.prayerTimesContainer}>
            {currentTimes.prayers.map((prayer) => {
              const status = getPrayerTimeStatus(prayer.name, prayer.time);
              const statusColor = getStatusColor(status);
              const statusIcon = getStatusIcon(status);
              const hasAdjustment = prayer.adjustment !== 0;

              return (
                <TouchableOpacity
                  key={prayer.name}
                  style={[
                    styles.prayerRow,
                    { backgroundColor: accessibleColors.surface },
                    status === 'next' && styles.nextPrayerRow,
                  ]}
                  onPress={() => handlePrayerPress(prayer.name)}
                  accessibilityLabel={`${PRAYER_NAMES.en[prayer.name]} prayer at ${prayer.time}`}
                >
                  <View style={styles.prayerInfo}>
                    <View style={styles.prayerNameContainer}>
                      <Ionicons
                        name={statusIcon}
                        size={20}
                        color={statusColor}
                        style={styles.statusIcon}
                      />
                      <Text style={[styles.prayerName, { color: statusColor }]}>
                        {PRAYER_NAMES.en[prayer.name]}
                      </Text>
                    </View>
                    
                    <View style={styles.prayerDetails}>
                      <Text style={[styles.prayerTime, { color: statusColor }]}>
                        {prayer.time}
                      </Text>
                      
                      <View style={styles.prayerIndicators}>
                        {hasAdjustment && (
                          <View style={styles.adjustmentIndicator}>
                            <Ionicons
                              name="time"
                              size={12}
                              color={COLORS.semantic.warning}
                            />
                            <Text style={styles.adjustmentText}>
                              {prayer.adjustment > 0 ? '+' : ''}{prayer.adjustment}m
                            </Text>
                          </View>
                        )}
                        
                        <Ionicons
                          name={prayer.notificationEnabled ? 'notifications' : 'notifications-off'}
                          size={16}
                          color={prayer.notificationEnabled ? COLORS.primary.green : COLORS.neutral.gray400}
                        />
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: accessibleColors.text }]}>
              {isLoading ? 'Loading prayer times...' : 'No prayer times available'}
            </Text>
          </View>
        )}

        {/* Calculation Method Info */}
        {currentTimes && (
          <View style={[styles.methodContainer, { backgroundColor: accessibleColors.surface }]}>
            <View style={styles.methodHeader}>
              <Ionicons name="information-circle" size={20} color={COLORS.neutral.gray500} />
              <Text style={[styles.methodTitle, { color: accessibleColors.text }]}>
                Calculation Method
              </Text>
            </View>
            <Text style={[styles.methodName, { color: COLORS.neutral.gray500 }]}>
              {currentTimes.method.name}
            </Text>
            <Text style={[styles.methodDescription, { color: COLORS.neutral.gray400 }]}>
              {currentTimes.method.description}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Audio Control */}
      {settings.enableAdhan && (
        <View style={[styles.audioControlContainer, { backgroundColor: accessibleColors.surface }]}>
          <TouchableOpacity
            style={[
              styles.audioButton,
              { backgroundColor: isPlaying ? COLORS.semantic.error : COLORS.primary.green },
            ]}
            onPress={handlePlayAdhan}
            accessibilityLabel={isPlaying ? 'Stop Adhan' : 'Play Adhan'}
          >
            <Ionicons
              name={isPlaying ? 'stop' : 'play'}
              size={24}
              color={COLORS.neutral.white}
            />
            <Text style={styles.audioButtonText}>
              {isPlaying ? 'Stop Adhan' : 'Play Adhan'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Prayer Settings Modal */}
      <PrayerSettingsModal
        visible={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </View>
  );
}

export default function PrayerTimesScreen() {
  return (
    <PrayerTimesErrorBoundary>
      <PrayerTimesScreenContent />
    </PrayerTimesErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  dateNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  navButton: {
    padding: 8,
  },
  dateContainer: {
    flex: 1,
    alignItems: 'center',
  },
  dateText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.neutral.white,
  },
  hijriDateText: {
    fontSize: 14,
    color: COLORS.neutral.gray200,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  todayButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
  },
  todayButtonText: {
    color: COLORS.neutral.white,
    fontSize: 14,
    fontWeight: '600',
  },
  settingsButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationText: {
    color: COLORS.neutral.white,
    fontSize: 14,
    marginLeft: 4,
  },
  offlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  offlineText: {
    color: COLORS.semantic.warning,
    fontSize: 12,
    marginLeft: 4,
  },
  nextPrayerContainer: {
    margin: 20,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  nextPrayerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nextPrayerLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  nextPrayerName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  nextPrayerTime: {
    alignItems: 'flex-end',
  },
  nextPrayerTimeText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  nextPrayerCountdown: {
    fontSize: 12,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  prayerTimesContainer: {
    paddingHorizontal: 20,
  },
  prayerRow: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  nextPrayerRow: {
    borderWidth: 2,
    borderColor: COLORS.primary.green,
  },
  prayerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  prayerNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusIcon: {
    marginRight: 8,
  },
  prayerName: {
    fontSize: 18,
    fontWeight: '600',
  },
  prayerDetails: {
    alignItems: 'flex-end',
  },
  prayerTime: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  prayerIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  adjustmentIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  adjustmentText: {
    fontSize: 10,
    color: COLORS.semantic.warning,
    marginLeft: 2,
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  methodContainer: {
    margin: 20,
    padding: 16,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  methodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  methodName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  methodDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  audioControlContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.neutral.gray200,
  },
  audioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  audioButtonText: {
    color: COLORS.neutral.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 20,
    lineHeight: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: COLORS.neutral.white,
    fontSize: 16,
    fontWeight: '600',
  },
}); 