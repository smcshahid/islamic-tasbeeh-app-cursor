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
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import Slider from '@react-native-community/slider';
import { useFocusEffect } from 'expo-router';
import { usePrayerTimes } from '../../src/contexts/PrayerTimesContext';
import { useAppTheme } from '../../src/utils/theme';
import { useGlobalAction } from '../../src/contexts/GlobalActionContext';
import { COLORS, PrayerName, PRAYER_NAMES } from '../../src/types';
import { accessibilityManager } from '../../src/utils/accessibility';
import { getPrayerDisplayTime } from '../../src/utils/helpers';
import PrayerSettingsModal from '../../src/components/PrayerSettingsModal';
import { PrayerTimesErrorBoundary } from '../../src/components/PrayerTimesErrorBoundary';
import { PrayerTimeAdjustmentModal } from '../../src/components/PrayerTimeAdjustmentModal';


const { width } = Dimensions.get('window');

function PrayerTimesScreenContent() {
  const {
    currentTimes,
    currentDate,
    isLoading,
    error,
    nextPrayer,
    settings,
    isOnline,
    availableAudios,
    fetchPrayerTimes,
    updatePrayerAdjustment,
    applyAllAdjustments,
    updatePrayerSettings,
    updateAdhanAudio,
    togglePrayerNotification,
    playAdhan,
    stopAdhan,
    navigateToDate: contextNavigateToDate,
    getInitialDate,
  } = usePrayerTimes();

  const { colors } = useAppTheme();
  const { pendingAction, clearPendingAction } = useGlobalAction();
  const [showSettings, setShowSettings] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<'general' | 'location' | 'notifications'>('general');
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [selectedPrayerForAdjustment, setSelectedPrayerForAdjustment] = useState<PrayerName | null>(null);

  // Handle pending actions from global search
  useFocusEffect(
    React.useCallback(() => {
      if (pendingAction && pendingAction.screen === '/(tabs)/prayer-times') {
        // Execute the pending action
        switch (pendingAction.type) {
          case 'openPrayerSettings':
            setSettingsInitialTab('general');
            setShowSettings(true);
            break;
          case 'openPrayerNotifications':
            setSettingsInitialTab('notifications');
            setShowSettings(true);
            break;
          case 'openCalculationMethod':
            setSettingsInitialTab('general');
            setShowSettings(true);
            // Note: Method picker will be handled within PrayerSettingsModal
            break;
          case 'adjustPrayerTimes':
            // Show adjustment modal for the first prayer (Fajr) as default
            setSelectedPrayerForAdjustment('fajr');
            setShowAdjustmentModal(true);
            break;
        }
        // Clear the pending action
        clearPendingAction();
      }
    }, [pendingAction, clearPendingAction])
  );

  const navigateToDate = async (direction: 'prev' | 'next') => {
    // Parse DD-MM-YYYY format
    const [day, month, year] = currentDate.split('-');
    const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    if (direction === 'prev') {
      dateObj.setDate(dateObj.getDate() - 1);
    } else {
      dateObj.setDate(dateObj.getDate() + 1);
    }
    
    // Convert back to DD-MM-YYYY format
    const targetDate = `${dateObj.getDate().toString().padStart(2, '0')}-${(dateObj.getMonth() + 1).toString().padStart(2, '0')}-${dateObj.getFullYear()}`;
    
    // Use context navigation for validation
    await contextNavigateToDate(targetDate);
    // Context will handle updating currentDate and showing any error messages
  };

  const goToToday = async () => {
    const todayDate = getInitialDate(); // Use initial date instead of actual today
    await contextNavigateToDate(todayDate);
    // Context will handle updating currentDate
  };

  const formatDate = (dateString: string) => {
    // Parse DD-MM-YYYY format
    const [day, month, year] = dateString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    const currentDemoDate = getInitialDate(); // Get today's mapped demo date
    const [currentDay, currentMonth, currentYear] = currentDemoDate.split('-');
    const currentDemoDateObj = new Date(parseInt(currentYear), parseInt(currentMonth) - 1, parseInt(currentDay));
    
    const tomorrow = new Date(currentDemoDateObj);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowString = `${tomorrow.getDate().toString().padStart(2, '0')}-${(tomorrow.getMonth() + 1).toString().padStart(2, '0')}-${tomorrow.getFullYear()}`;
    
    const yesterday = new Date(currentDemoDateObj);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = `${yesterday.getDate().toString().padStart(2, '0')}-${(yesterday.getMonth() + 1).toString().padStart(2, '0')}-${yesterday.getFullYear()}`;

    // For sample data mode, show relative dates based on real current date
    if (dateString === currentDemoDate) return 'Today';
    if (dateString === tomorrowString) return 'Tomorrow';
    if (dateString === yesterdayString) return 'Yesterday';

    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
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
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const showTimeAdjustmentDialog = (prayer: PrayerName) => {
    setSelectedPrayerForAdjustment(prayer);
    setShowAdjustmentModal(true);
  };

  const handleAdjustmentConfirm = (minutes: number) => {
    if (selectedPrayerForAdjustment) {
      updatePrayerAdjustment(selectedPrayerForAdjustment, minutes);
    }
  };

  const handleAdjustmentConfirmAll = (minutes: number) => {
    applyAllAdjustments(minutes);
  };

  const handleAdjustmentModalClose = () => {
    setShowAdjustmentModal(false);
    setSelectedPrayerForAdjustment(null);
  };



  const handleRefresh = () => {
    fetchPrayerTimes(currentDate, true);
  };

  const getPrayerTimeStatus = (prayer: PrayerName, time: string) => {
    const now = new Date();
    const todayMappedDate = getInitialDate(); // Get today's mapped date
    
    // Only show status for today's date
    if (currentDate !== todayMappedDate) return null;

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
        return colors.text.tertiary;
      case 'next':
        return colors.primary;
      case 'upcoming':
        return colors.text.primary;
      default:
        return colors.text.primary;
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

  // Handle remaining error cases (not navigation errors, which are now handled in context)
  useEffect(() => {
    if (error && currentTimes) {
      // Only handle non-navigation errors here since navigation errors are now handled in context with alerts
      if (!error.includes('Navigation failed') && !error.includes('Demo Limitation') && !error.includes('Month Not Available')) {
        if (error.includes('currently unavailable')) {
          Alert.alert(
            'Data Unavailable',
            error,
            [
              { text: 'OK' },
              { text: 'Retry', onPress: () => fetchPrayerTimes(currentDate, true) }
            ]
          );
        }
      }
    }
  }, [error, currentTimes, fetchPrayerTimes, currentDate]);

  // Only show full-screen error if we have no prayer times at all
  if (error && !currentTimes) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style="auto" />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.text.primary }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={() => fetchPrayerTimes(currentDate, true)}
          >
            <Text style={[styles.retryButtonText, { color: colors.text.onPrimary }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="auto" />
      
      {/* Header */}
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.dateNavigation}>
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => navigateToDate('prev')}
              accessibilityLabel="Previous day"
            >
              <Ionicons name="chevron-back" size={24} color={colors.text.onPrimary} />
            </TouchableOpacity>

            <View style={styles.dateContainer}>
              <Text style={[styles.dateText, { color: colors.text.onPrimary }]}>{formatDate(currentDate)}</Text>
              {currentTimes && (
                <Text style={[styles.hijriDateText, { color: colors.text.onPrimary }]}>
                  {formatHijriDate(currentTimes.hijriDate)}
                </Text>
              )}
            </View>

            <TouchableOpacity
              style={styles.navButton}
              onPress={() => navigateToDate('next')}
              accessibilityLabel="Next day"
            >
              <Ionicons name="chevron-forward" size={24} color={colors.text.onPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.todayButton}
              onPress={goToToday}
              accessibilityLabel="Go to today's date"
            >
              <Text style={[styles.todayButtonText, { color: colors.text.onPrimary }]}>Today</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => setShowSettings(true)}
              accessibilityLabel="Prayer settings"
            >
              <Ionicons name="settings" size={20} color={colors.text.onPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Location Info */}
        {currentTimes && (
          <View style={styles.locationContainer}>
            <Ionicons name="location" size={16} color={colors.text.onPrimary} />
            <Text style={[styles.locationText, { color: colors.text.onPrimary }]}>
              {currentTimes.location.city}, {currentTimes.location.country}
            </Text>
            {!isOnline && (
              <View style={styles.offlineIndicator}>
                <Ionicons name="cloud-offline" size={16} color={colors.warning} />
                <Text style={[styles.offlineText, { color: colors.warning }]}>Offline</Text>
              </View>
            )}
          </View>
        )}
      </LinearGradient>

      {/* Next Prayer Info */}
      {nextPrayer && (
        <View style={[styles.nextPrayerContainer, { backgroundColor: colors.surface }]}>
          <View style={styles.nextPrayerContent}>
            <View>
              <Text style={[styles.nextPrayerLabel, { color: colors.text.secondary }]}>
                Next Prayer
              </Text>
              <Text style={[styles.nextPrayerName, { color: colors.text.primary }]}>
                {PRAYER_NAMES.en[nextPrayer.name]}
              </Text>
            </View>
            <View style={styles.nextPrayerTime}>
              <Text style={[styles.nextPrayerTimeText, { color: colors.primary }]}>
                {getPrayerDisplayTime({time: nextPrayer.time, adjustment: 0}, settings.timeFormat).displayTime}
              </Text>
              <Text style={[styles.nextPrayerCountdown, { color: colors.text.secondary }]}>
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
            tintColor={colors.primary}
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
                    { backgroundColor: colors.surface },
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
                        {getPrayerDisplayTime(prayer, settings.timeFormat).displayTime}
                      </Text>
                      
                      <View style={styles.prayerIndicators}>
                        {hasAdjustment && (
                          <View style={styles.adjustmentIndicator}>
                            <Ionicons
                              name="time"
                              size={12}
                              color={colors.warning}
                            />
                            <Text style={[styles.adjustmentText, { color: colors.warning }]}>
                              {prayer.adjustment > 0 ? '+' : ''}{prayer.adjustment}m
                            </Text>
                          </View>
                        )}
                        
                        <Ionicons
                          name={prayer.notificationEnabled ? 'notifications' : 'notifications-off'}
                          size={16}
                          color={prayer.notificationEnabled ? colors.primary : colors.text.tertiary}
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
            <Text style={[styles.loadingText, { color: colors.text.primary }]}>
              {isLoading ? 'Loading prayer times...' : 'No prayer times available'}
            </Text>
          </View>
        )}

        {/* Calculation Method Info */}
        {currentTimes && (
          <View style={[styles.methodContainer, { backgroundColor: colors.surface }]}>
            <View style={styles.methodHeader}>
              <Ionicons name="information-circle" size={20} color={colors.text.secondary} />
              <Text style={[styles.methodTitle, { color: colors.text.primary }]}>
                Calculation Method
              </Text>
            </View>
            <Text style={[styles.methodName, { color: colors.text.secondary }]}>
              {currentTimes.method.name}
            </Text>
            <Text style={[styles.methodDescription, { color: colors.text.tertiary }]}>
              {currentTimes.method.description}
            </Text>
          </View>
        )}
      </ScrollView>



      {/* Prayer Settings Modal */}
      <PrayerSettingsModal
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        initialTab={settingsInitialTab}
      />

      {/* Prayer Time Adjustment Modal */}
      {selectedPrayerForAdjustment && (
        <PrayerTimeAdjustmentModal
          visible={showAdjustmentModal}
          onClose={handleAdjustmentModalClose}
          onConfirm={handleAdjustmentConfirm}
          onConfirmAll={handleAdjustmentConfirmAll}
          prayer={selectedPrayerForAdjustment}
          currentAdjustment={settings.timeAdjustments[selectedPrayerForAdjustment]}

        />
      )}

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
  },
  hijriDateText: {
    fontSize: 14,
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
    fontSize: 14,
    marginLeft: 4,
  },
  offlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  offlineText: {
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
    fontSize: 16,
    fontWeight: '600',
  },
}); 