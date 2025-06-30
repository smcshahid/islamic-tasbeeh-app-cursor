import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTasbeeh } from '../../src/contexts/TasbeehContext';
import { useAppTheme } from '../../src/utils/theme';
import { notifications } from '../../src/utils/notifications';
import storage from '../../src/utils/storage';
import { COLORS, Counter, ColorKey } from '../../src/types';
import { SettingsErrorBoundary } from '../../src/components/ErrorBoundary';
import PrayerSettingsModal from '../../src/components/PrayerSettingsModal';
import ThemeSelector from '../../src/components/ThemeSelector';
import ThemeDemoLauncher from '../../src/components/ThemeDemoLauncher';
import { 
  getButtonA11yProps, 
  getToggleA11yProps,
  announceToScreenReader,
  getFontScale
} from '../../src/utils/accessibility';

export default function SettingsScreen() {
  const { colors, themeDefinition, isDark } = useAppTheme();
  const {
    settings,
    counters,
    sessions,
    user,
    updateSettings,
    deleteCounter,
    updateCounter,
    createCounter,
    signInAsGuest,
    signOut,
    syncWithCloud,
    loadFromStorage,
    isLoading,
    error,
  } = useTasbeeh();

  const [showEditCounterModal, setShowEditCounterModal] = useState(false);
  const [editingCounter, setEditingCounter] = useState<Counter | null>(null);
  const [editCounterName, setEditCounterName] = useState('');
  const [editCounterTarget, setEditCounterTarget] = useState('');
  const [editCounterColor, setEditCounterColor] = useState(colors.primary);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showPrayerSettings, setShowPrayerSettings] = useState(false);
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  
  // Accessibility configuration
  const fontScale = getFontScale();

  const handleEditCounter = (counter: Counter) => {
    setEditingCounter(counter);
    setEditCounterName(counter.name);
    setEditCounterTarget(counter.target?.toString() || '');
    setEditCounterColor(counter.color);
    setShowEditCounterModal(true);
  };

  const handleSaveCounterEdit = async () => {
    if (!editingCounter || !editCounterName.trim()) return;

    const target = editCounterTarget ? parseInt(editCounterTarget, 10) : undefined;
    
    await updateCounter(editingCounter.id, {
      name: editCounterName.trim(),
      target,
      color: editCounterColor,
    });

    setShowEditCounterModal(false);
    setEditingCounter(null);
    setEditCounterName('');
    setEditCounterTarget('');
    setEditCounterColor(colors.primary);
  };

  const handleDeleteCounter = (counter: Counter) => {
    Alert.alert(
      'Delete Counter',
      `Are you sure you want to delete "${counter.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteCounter(counter.id),
        },
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: signOut,
        },
      ]
    );
  };

  const handleNavigateToAuth = () => {
    router.push('/auth');
  };

  const handleSyncNow = async () => {
    if (!user || user.isGuest) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to sync your data to the cloud.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: handleNavigateToAuth },
        ]
      );
      return;
    }

    Alert.alert(
      'Sync Data',
      'This will sync your counters and sessions to the cloud. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sync Now', 
          onPress: async () => {
            await syncWithCloud();
            if (!error) {
              Alert.alert('Success', 'Your data has been synced to the cloud!');
            }
          }
        },
      ]
    );
  };

  const handleExportData = async () => {
    try {
      setIsExporting(true);
      const totalCounts = counters.reduce((sum, counter) => sum + counter.count, 0);
      
      Alert.alert(
        'Export Data',
        `Export your data to backup file?\n\nCounters: ${counters.length}\nSessions: ${sessions.length}\nTotal Counts: ${totalCounts.toLocaleString()}`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Export',
            onPress: async () => {
              try {
                await storage.exportData();
                Alert.alert(
                  'Export Successful',
                  'Your data has been exported successfully. The backup file has been shared.',
                  [{ text: 'OK' }]
                );
              } catch (error) {
                Alert.alert(
                  'Export Failed',
                  error instanceof Error ? error.message : 'Failed to export data. Please try again.',
                  [{ text: 'OK' }]
                );
              }
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        'Export Failed',
        'Failed to prepare export. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportData = async () => {
    try {
      setIsImporting(true);
      
      Alert.alert(
        'Import Data',
        'Choose how to import your backup data:',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Replace All',
            style: 'destructive',
            onPress: async () => {
              await performImport('replace');
            },
          },
          {
            text: 'Merge',
            onPress: async () => {
              await performImport('merge');
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        'Import Failed',
        'Failed to start import. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsImporting(false);
    }
  };

  const performImport = async (mode: 'replace' | 'merge') => {
    try {
      const result = await storage.importData();
      
      if (!result.success) {
        Alert.alert(
          'Import Failed',
          result.error || 'Failed to import data.',
          [{ text: 'OK' }]
        );
        return;
      }

      if (!result.data) {
        Alert.alert('Import Failed', 'No data found in the selected file.', [{ text: 'OK' }]);
        return;
      }

      const importData = result.data;
      const modeText = mode === 'replace' ? 'replace all current data' : 'merge with current data';
      
      Alert.alert(
        'Confirm Import',
        `Import ${importData.metadata.totalCounters} counters and ${importData.metadata.totalSessions} sessions?\n\nThis will ${modeText}.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Import',
            onPress: async () => {
              try {
                await storage.applyImportedData(importData, mode);
                await loadFromStorage(); // Reload data in the app
                
                Alert.alert(
                  'Import Successful',
                  `Data imported successfully!\n\nCounters: ${importData.metadata.totalCounters}\nSessions: ${importData.metadata.totalSessions}`,
                  [{ text: 'OK' }]
                );
              } catch (error) {
                Alert.alert(
                  'Import Failed',
                  error instanceof Error ? error.message : 'Failed to import data.',
                  [{ text: 'OK' }]
                );
              }
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        'Import Failed',
        'Failed to process import file. Please check the file format.',
        [{ text: 'OK' }]
      );
    }
  };

  const SettingItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    rightComponent 
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightComponent?: React.ReactNode;
  }) => (
    <TouchableOpacity 
      style={[
        styles.settingItem,
        { backgroundColor: colors.surface }
      ]}
      onPress={onPress}
      disabled={!onPress}
      {...getButtonA11yProps(
        title,
        subtitle ? `${title}. ${subtitle}` : title,
        !onPress
      )}
      accessibilityHint={
        rightComponent ? `${title}. ${subtitle || ''}` : 
        onPress ? `${title}. ${subtitle || ''}. Tap to ${title.toLowerCase()}.` : undefined
      }
    >
      <View style={styles.settingLeft}>
        <Ionicons 
          name={icon as any} 
          size={24} 
          color={colors.text.primary}
          accessibilityElementsHidden={true}
        />
        <View style={styles.settingText}>
          <Text style={[
            styles.settingTitle,
            { 
              color: colors.text.primary,
              fontSize: 16 * fontScale
            }
          ]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[
              styles.settingSubtitle,
              { 
                color: colors.text.secondary,
                fontSize: 14 * fontScale
              }
            ]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      {rightComponent || (onPress && (
        <Ionicons 
          name="chevron-forward" 
          size={20} 
          color={colors.text.secondary}
          accessibilityElementsHidden={true}
        />
      ))}
    </TouchableOpacity>
  );



  return (
    <SafeAreaView style={[
      styles.container,
      { backgroundColor: colors.background }
    ]}>
      <SettingsErrorBoundary>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text 
            style={[
              styles.headerTitle,
              { 
                color: colors.text.primary,
                fontSize: 28 * fontScale
              }
            ]}
            accessibilityRole="header"
            accessibilityLabel="Settings screen"
          >
            Settings
          </Text>
        </View>

        {/* User Section */}
        <View style={styles.section}>
          <Text style={[
            styles.sectionTitle,
            { color: colors.text.primary }
          ]}>
            Account
          </Text>
          
          {user ? (
            <>
              <SettingItem
                icon="person"
                title={user.isGuest ? 'Guest User' : user.email || 'User'}
                subtitle={user.isGuest ? 'Tap to sign in for cloud sync' : `Signed in${user.lastSyncAt ? ` • Last sync: ${new Date(user.lastSyncAt).toLocaleDateString()}` : ''}`}
                onPress={user.isGuest ? handleNavigateToAuth : handleSignOut}
              />
              
              {!user.isGuest && (
                <SettingItem
                  icon="cloud-upload"
                  title="Sync Now"
                  subtitle="Upload your data to the cloud"
                  onPress={handleSyncNow}
                />
              )}
            </>
          ) : (
            <SettingItem
              icon="person-add"
              title="Sign In"
              subtitle="Sign in to sync your data"
              onPress={handleNavigateToAuth}
            />
          )}
        </View>

        {/* App Preferences */}
        <View style={styles.section}>
          <Text style={[
            styles.sectionTitle,
            { color: colors.text.primary }
          ]}>
            Preferences
          </Text>
          
          <SettingItem
            icon="color-palette"
            title="Theme"
            subtitle={themeDefinition.displayName}
            onPress={() => setShowThemeSelector(true)}
          />

          {/* Theme Demo Launcher */}
          <View style={styles.themeDemoContainer}>
            <ThemeDemoLauncher 
              buttonText="🎨 Interactive Theme Preview"
              size="medium"
              style={styles.themeDemoButton}
            />
          </View>

          {/* Theme Test Screen - for debugging */}
          <SettingItem
            icon="bug"
            title="Theme Test (Debug)"
            subtitle="Visual validation of all theme colors"
            onPress={() => {
              // You can navigate to theme test screen here if needed
              console.log('Theme test pressed - add navigation here');
            }}
          />

          <SettingItem
            icon="language"
            title="Language"
            subtitle={settings.language === 'en' ? 'English' : 'العربية'}
            onPress={() => {
              updateSettings({ language: settings.language === 'en' ? 'ar' : 'en' });
            }}
          />

          <SettingItem
            icon="time"
            title="Prayer Times"
            subtitle="Configure Islamic prayer time settings"
            onPress={() => setShowPrayerSettings(true)}
          />

          <SettingItem
            icon="phone-portrait"
            title="Haptic Feedback"
            subtitle="Vibrate when counting"
            rightComponent={
              <Switch
                value={settings.hapticFeedback}
                onValueChange={(value) => {
                  updateSettings({ hapticFeedback: value });
                  announceToScreenReader(
                    `Haptic feedback ${value ? 'enabled' : 'disabled'}`
                  );
                }}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={settings.hapticFeedback ? colors.text.onPrimary : colors.text.tertiary}
                {...getToggleA11yProps(
                  'Haptic Feedback',
                  settings.hapticFeedback,
                  'Toggle vibration when counting dhikr'
                )}
              />
            }
          />

          <SettingItem
            icon="notifications"
            title="Notifications"
            subtitle="Receive achievement notifications"
            rightComponent={
              <Switch
                value={settings.notifications}
                onValueChange={(value) => {
                  updateSettings({ notifications: value });
                  announceToScreenReader(
                    `Notifications ${value ? 'enabled' : 'disabled'}`
                  );
                }}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={settings.notifications ? colors.text.onPrimary : colors.text.tertiary}
                {...getToggleA11yProps(
                  'Notifications',
                  settings.notifications,
                  'Toggle achievement and milestone notifications'
                )}
              />
            }
          />

          {settings.notifications && (
            <SettingItem
              icon="megaphone"
              title="Test Notifications"
              subtitle="Send a test notification"
              onPress={async () => {
                const { granted } = await notifications.requestPermissions();
                if (granted) {
                  await notifications.showTestNotification();
                } else {
                  Alert.alert(
                    'Notifications Disabled',
                    'Please enable notifications in your device settings to receive alerts.',
                    [{ text: 'OK' }]
                  );
                }
              }}
            />
          )}

          <SettingItem
            icon="sync"
            title="Auto Sync"
            subtitle="Automatically sync when signed in"
            rightComponent={
              <Switch
                value={settings.autoSync}
                onValueChange={(value) => {
                  updateSettings({ autoSync: value });
                  announceToScreenReader(
                    `Auto sync ${value ? 'enabled' : 'disabled'}`
                  );
                }}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={settings.autoSync ? colors.text.onPrimary : colors.text.tertiary}
                {...getToggleA11yProps(
                  'Auto Sync',
                  settings.autoSync,
                  'Toggle automatic cloud synchronization when signed in'
                )}
              />
            }
          />

          <SettingItem
            icon="cloud-upload"
            title="Export Data"
            subtitle="Export your data to a backup file"
            onPress={handleExportData}
          />

          <SettingItem
            icon="cloud-download"
            title="Import Data"
            subtitle="Import data from a backup file"
            onPress={handleImportData}
          />
        </View>

        {/* Counter Management */}
        <View style={styles.section}>
          <Text style={[
            styles.sectionTitle,
            { color: colors.text.primary }
          ]}>
            Counters ({counters.length})
          </Text>
          
          {counters.map((counter) => (
            <View key={counter.id} style={[
              styles.counterItem,
              { backgroundColor: colors.surface }
            ]}>
              <View style={styles.counterLeft}>
                <View style={[
                  styles.counterColorIndicator,
                  { backgroundColor: counter.color }
                ]} />
                <View style={styles.counterInfo}>
                  <Text style={[
                    styles.counterName,
                    { color: colors.text.primary }
                  ]}>
                    {counter.name}
                  </Text>
                  <Text style={[
                    styles.counterStats,
                    { color: colors.text.secondary }
                  ]}>
                    Count: {counter.count.toLocaleString()}
                    {counter.target && ` • Target: ${counter.target.toLocaleString()}`}
                  </Text>
                </View>
              </View>
              
              <View style={styles.counterActions}>
                <TouchableOpacity
                  style={[styles.counterActionButton, { backgroundColor: colors.secondary }]}
                  onPress={() => handleEditCounter(counter)}
                >
                  <Ionicons name="pencil" size={16} color={colors.text.onSecondary} />
                </TouchableOpacity>
                
                {counters.length > 1 && (
                  <TouchableOpacity
                    style={[styles.counterActionButton, { backgroundColor: colors.error }]}
                    onPress={() => handleDeleteCounter(counter)}
                  >
                    <Ionicons name="trash" size={16} color={colors.text.onPrimary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <Text style={[
            styles.sectionTitle,
            { color: colors.text.primary }
          ]}>
            About
          </Text>
          
          <SettingItem
            icon="information-circle"
            title="Version"
            subtitle="1.0.0"
          />

          <SettingItem
            icon="star"
            title="Rate the App"
            subtitle="Help us improve"
            onPress={() => {
              Alert.alert('Rate the App', 'Thank you for your support!');
            }}
          />

          <SettingItem
            icon="help-circle"
            title="Help & Support"
            subtitle="Get help using the app"
            onPress={() => {
              Alert.alert('Help & Support', 'For support, please contact support@tasbeehapp.com');
            }}
          />
        </View>

        <View style={styles.bottomSpacing} />

        {/* Loading indicator */}
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <Text style={[styles.loadingText, { color: colors.text.primary }]}>
              Loading...
            </Text>
          </View>
        )}

        {/* Error message */}
        {error && (
          <View style={[styles.errorContainer, { backgroundColor: colors.error }]}>
            <Text style={[styles.errorText, { color: colors.text.onPrimary }]}>{error}</Text>
          </View>
        )}
      </ScrollView>
      </SettingsErrorBoundary>

      {/* Edit Counter Modal */}
      <Modal
        visible={showEditCounterModal}
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
              Edit Counter
            </Text>
            <TouchableOpacity onPress={() => setShowEditCounterModal(false)}>
              <Ionicons 
                name="close" 
                size={24} 
                color={isDark ? COLORS.neutral.white : COLORS.neutral.gray900} 
              />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={[
              styles.inputLabel,
              { color: isDark ? COLORS.neutral.white : COLORS.neutral.gray900 }
            ]}>
              Counter Name
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: isDark ? COLORS.neutral.gray800 : COLORS.neutral.gray100,
                  color: isDark ? COLORS.neutral.white : COLORS.neutral.gray900,
                }
              ]}
              value={editCounterName}
              onChangeText={setEditCounterName}
              placeholder="Enter counter name"
              placeholderTextColor={isDark ? COLORS.neutral.gray400 : COLORS.neutral.gray500}
            />

            <Text style={[
              styles.inputLabel,
              { color: isDark ? COLORS.neutral.white : COLORS.neutral.gray900 }
            ]}>
              Target (Optional)
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: isDark ? COLORS.neutral.gray800 : COLORS.neutral.gray100,
                  color: isDark ? COLORS.neutral.white : COLORS.neutral.gray900,
                }
              ]}
              value={editCounterTarget}
              onChangeText={setEditCounterTarget}
              placeholder="Enter target count"
              placeholderTextColor={isDark ? COLORS.neutral.gray400 : COLORS.neutral.gray500}
              keyboardType="numeric"
            />

            <Text style={[
              styles.inputLabel,
              { color: isDark ? COLORS.neutral.white : COLORS.neutral.gray900 }
            ]}>
              Color
            </Text>
            <View style={styles.colorPicker}>
              <TouchableOpacity
                style={[
                  styles.colorOption,
                  { backgroundColor: colors.primary },
                  editCounterColor === colors.primary && styles.selectedColor
                ]}
                onPress={() => setEditCounterColor(colors.primary)}
              />
              <TouchableOpacity
                style={[
                  styles.colorOption,
                  { backgroundColor: colors.secondary },
                  editCounterColor === colors.secondary && styles.selectedColor
                ]}
                onPress={() => setEditCounterColor(colors.secondary)}
              />
              <TouchableOpacity
                style={[
                  styles.colorOption,
                  { backgroundColor: colors.accent },
                  editCounterColor === colors.accent && styles.selectedColor
                ]}
                onPress={() => setEditCounterColor(colors.accent)}
              />
              <TouchableOpacity
                style={[
                  styles.colorOption,
                  { backgroundColor: colors.islamic.green },
                  editCounterColor === colors.islamic.green && styles.selectedColor
                ]}
                onPress={() => setEditCounterColor(colors.islamic.green)}
              />
              <TouchableOpacity
                style={[
                  styles.colorOption,
                  { backgroundColor: colors.islamic.gold },
                  editCounterColor === colors.islamic.gold && styles.selectedColor
                ]}
                onPress={() => setEditCounterColor(colors.islamic.gold)}
              />
              <TouchableOpacity
                style={[
                  styles.colorOption,
                  { backgroundColor: colors.islamic.navy },
                  editCounterColor === colors.islamic.navy && styles.selectedColor
                ]}
                onPress={() => setEditCounterColor(colors.islamic.navy)}
              />
            </View>

            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: editCounterColor }]}
              onPress={handleSaveCounterEdit}
            >
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Prayer Settings Modal */}
      <PrayerSettingsModal
        visible={showPrayerSettings}
        onClose={() => setShowPrayerSettings(false)}
      />

      {/* Theme Selector Modal */}
      <ThemeSelector
        visible={showThemeSelector}
        onClose={() => setShowThemeSelector(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 20,
    marginBottom: 10,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 15,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
  },
  counterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  counterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  counterColorIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 15,
  },
  counterInfo: {
    flex: 1,
  },
  counterName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  counterStats: {
    fontSize: 14,
  },
  counterActions: {
    flexDirection: 'row',
    gap: 8,
  },
  counterActionButton: {
    padding: 8,
    borderRadius: 16,
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomSpacing: {
    height: 50,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
  },
  errorContainer: {
    margin: 20,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
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
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 20,
  },
  textInput: {
    padding: 15,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 10,
  },
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 30,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    margin: 5,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  selectedColor: {
    borderColor: '#FFFFFF',
  },
  saveButton: {
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  themeDemoContainer: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  themeDemoButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderStyle: 'dashed',
  },
}); 