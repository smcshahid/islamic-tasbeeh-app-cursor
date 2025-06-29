import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { usePrayerTimes } from '../contexts/PrayerTimesContext';
import { useGlobalAction } from '../contexts/GlobalActionContext';
import { useAppTheme } from '../utils/theme';
import { COLORS, CalculationMethod, AdhanAudio, City, PrayerName, PRAYER_NAMES } from '../types';
import { accessibilityManager } from '../utils/accessibility';
import { 
  getAudioState, 
  setAudioStateListener, 
  togglePlayback, 
  previewAudio as previewAudioDirect,
  AudioState 
} from '../utils/audioService';


interface PrayerSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  initialTab?: 'general' | 'location' | 'notifications';
}

export default function PrayerSettingsModal({ visible, onClose, initialTab = 'general' }: PrayerSettingsModalProps) {
  const {
    settings,
    availableMethods,
    availableAudios,
    availableCities,
    updateCalculationMethod,
    updateAdhanAudio,
    updatePrayerSettings,
    updateLocation,
    enableAutoLocation,
    previewAudio,
    resetToProduction,
  } = usePrayerTimes();

  const { isDark } = useAppTheme();
  const { pendingAction, clearPendingAction } = useGlobalAction();
  const accessibleColors = accessibilityManager.getAccessibleColors(isDark ? 'dark' : 'light');

  const [activeTab, setActiveTab] = useState<'general' | 'location' | 'notifications'>('general');
  const [showMethodPicker, setShowMethodPicker] = useState(false);
  const [showAudioPicker, setShowAudioPicker] = useState(false);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Audio state management
  const [audioState, setAudioState] = useState<AudioState>(getAudioState());
  
  // Local slider state to prevent continuous updates during drag
  const [localVolume, setLocalVolume] = useState<number>(typeof settings.volume === 'number' ? settings.volume : 0.7);
  const [localFadeIn, setLocalFadeIn] = useState<number>(typeof settings.fadeInDuration === 'number' ? settings.fadeInDuration : 2);
  const [localFadeOut, setLocalFadeOut] = useState<number>(typeof settings.fadeOutDuration === 'number' ? settings.fadeOutDuration : 2);

  // Set initial tab when modal becomes visible
  useEffect(() => {
    if (visible) {
      setActiveTab(initialTab);
      
      // Check if we should auto-open calculation method picker
      if (pendingAction && pendingAction.type === 'openCalculationMethod') {
        setTimeout(() => {
          setShowMethodPicker(true);
          clearPendingAction();
        }, 500); // Small delay to let modal open first
      }
    }
  }, [visible, initialTab, pendingAction, clearPendingAction]);

  // Listen to audio state changes
  useEffect(() => {
    const unsubscribe = setAudioStateListener((state: AudioState) => {
      setAudioState(state);
    });

    // Get initial state
    setAudioState(getAudioState());

    return () => {
      // Cleanup listener (note: current implementation doesn't return unsubscribe)
    };
  }, []);

  // Sync local state with settings when they change
  useEffect(() => {
    setLocalVolume(typeof settings.volume === 'number' ? settings.volume : 0.7);
    setLocalFadeIn(typeof settings.fadeInDuration === 'number' ? settings.fadeInDuration : 2);
    setLocalFadeOut(typeof settings.fadeOutDuration === 'number' ? settings.fadeOutDuration : 2);
  }, [settings.volume, settings.fadeInDuration, settings.fadeOutDuration]);

  const filteredCities = availableCities.filter(city =>
    city.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    city.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleMethodSelect = async (method: CalculationMethod) => {
    try {
      await updateCalculationMethod(method);
      setShowMethodPicker(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update calculation method');
    }
  };

  const handleAudioSelect = async (audio: AdhanAudio) => {
    try {
      await updateAdhanAudio(audio);
      setShowAudioPicker(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update audio selection');
    }
  };



  const handleCitySelect = async (city: City) => {
    try {
      await updateLocation(city);
      setShowCityPicker(false);
      setSearchQuery('');
    } catch (error) {
      Alert.alert('Error', 'Failed to update location');
    }
  };

  const handleAutoLocation = async () => {
    try {
      await enableAutoLocation();
    } catch (error) {
      Alert.alert('Location Error', error.message);
    }
  };

  const handlePreviewAudio = async (audio: AdhanAudio) => {
    try {
      await previewAudioDirect(audio);
    } catch (error) {
      Alert.alert('Error', 'Failed to preview audio');
    }
  };

  const handleTogglePlayback = async (audio: AdhanAudio) => {
    try {
      const newState = await togglePlayback(audio, settings.volume, settings.fadeInDuration);
      // State will be updated through the listener
    } catch (error) {
      Alert.alert('Error', 'Failed to control audio playback');
    }
  };

  // Check if the current audio is the one being displayed
  const isCurrentAudioPlaying = (audio: AdhanAudio) => {
    return audioState.isPlaying && audioState.currentAudio?.id === audio.id;
  };



  const renderTabBar = () => (
    <View style={[styles.tabBar, { backgroundColor: accessibleColors.surface }]}>
      {[
        { key: 'general', label: 'General', icon: 'settings' },
        { key: 'location', label: 'Location', icon: 'location' },
        { key: 'notifications', label: 'Notifications', icon: 'notifications' },
      ].map(tab => (
        <TouchableOpacity
          key={tab.key}
          style={[
            styles.tabItem,
            activeTab === tab.key && styles.activeTab,
          ]}
          onPress={() => setActiveTab(tab.key as any)}
        >
          <Ionicons
            name={tab.icon as any}
            size={20}
            color={activeTab === tab.key ? COLORS.primary.green : COLORS.neutral.gray500}
          />
          <Text
            style={[
              styles.tabLabel,
              {
                color: activeTab === tab.key ? COLORS.primary.green : COLORS.neutral.gray500,
              },
            ]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderGeneralSettings = () => (
    <View style={styles.tabContent}>
      {/* Calculation Method */}
      <View style={[styles.settingSection, { backgroundColor: accessibleColors.surface }]}>
        <Text style={[styles.sectionTitle, { color: accessibleColors.text }]}>
          Calculation Method
        </Text>
        <TouchableOpacity
          style={styles.settingRow}
          onPress={() => setShowMethodPicker(true)}
        >
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: accessibleColors.text }]}>
              {settings.calculationMethod.name}
            </Text>
            <Text style={[styles.settingDescription, { color: COLORS.neutral.gray500 }]}>
              {settings.calculationMethod.description}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.neutral.gray400} />
        </TouchableOpacity>
      </View>

      {/* Time Format */}
      <View style={[styles.settingSection, { backgroundColor: accessibleColors.surface }]}>
        <Text style={[styles.sectionTitle, { color: accessibleColors.text }]}>
          Time Format
        </Text>
        
        <TouchableOpacity
          style={[
            styles.locationOption,
            settings.timeFormat === '24h' && styles.selectedLocationOption,
          ]}
          onPress={() => updatePrayerSettings({ timeFormat: '24h' })}
        >
          <Ionicons
            name="time"
            size={20}
            color={settings.timeFormat === '24h' ? COLORS.primary.green : COLORS.neutral.gray500}
          />
          <View style={styles.locationInfo}>
            <Text style={[
              styles.locationLabel,
              {
                color: settings.timeFormat === '24h' ? COLORS.primary.green : accessibleColors.text,
              },
            ]}>
              24-Hour Format
            </Text>
            <Text style={[styles.locationDescription, { color: COLORS.neutral.gray500 }]}>
              13:30, 18:45 (Military time)
            </Text>
          </View>
          {settings.timeFormat === '24h' && (
            <Ionicons name="checkmark-circle" size={20} color={COLORS.primary.green} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.locationOption,
            settings.timeFormat === '12h' && styles.selectedLocationOption,
          ]}
          onPress={() => updatePrayerSettings({ timeFormat: '12h' })}
        >
          <Ionicons
            name="time"
            size={20}
            color={settings.timeFormat === '12h' ? COLORS.primary.green : COLORS.neutral.gray500}
          />
          <View style={styles.locationInfo}>
            <Text style={[
              styles.locationLabel,
              {
                color: settings.timeFormat === '12h' ? COLORS.primary.green : accessibleColors.text,
              },
            ]}>
              12-Hour Format
            </Text>
            <Text style={[styles.locationDescription, { color: COLORS.neutral.gray500 }]}>
              1:30 PM, 6:45 PM (AM/PM)
            </Text>
          </View>
          {settings.timeFormat === '12h' && (
            <Ionicons name="checkmark-circle" size={20} color={COLORS.primary.green} />
          )}
        </TouchableOpacity>
      </View>

      {/* Adhan Settings */}
      <View style={[styles.settingSection, { backgroundColor: accessibleColors.surface }]}>
        <Text style={[styles.sectionTitle, { color: accessibleColors.text }]}>
          Adhan Settings
        </Text>
        
        <View style={styles.settingRow}>
          <Text style={[styles.settingLabel, { color: accessibleColors.text }]}>
            Enable Adhan
          </Text>
          <Switch
            value={settings.enableAdhan}
            onValueChange={(value) => updatePrayerSettings({ enableAdhan: value })}
            trackColor={{ false: COLORS.neutral.gray300, true: COLORS.primary.green }}
            thumbColor={COLORS.neutral.white}
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={[styles.settingLabel, { color: accessibleColors.text }]}>
            Enable Vibration
          </Text>
          <Switch
            value={settings.enableVibration}
            onValueChange={(value) => updatePrayerSettings({ enableVibration: value })}
            trackColor={{ false: COLORS.neutral.gray300, true: COLORS.primary.green }}
            thumbColor={COLORS.neutral.white}
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={[styles.settingLabel, { color: accessibleColors.text }]}>
            Enable Snooze
          </Text>
          <Switch
            value={settings.snoozeEnabled}
            onValueChange={(value) => updatePrayerSettings({ snoozeEnabled: value })}
            trackColor={{ false: COLORS.neutral.gray300, true: COLORS.primary.green }}
            thumbColor={COLORS.neutral.white}
          />
        </View>

        {settings.snoozeEnabled && (
          <>
            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: accessibleColors.text }]}>
                Snooze Duration: {settings.snoozeDuration} min
              </Text>
            </View>
            <View style={styles.sliderContainer}>
              <Text style={[styles.sliderLabel, { color: COLORS.neutral.gray500 }]}>5 min</Text>
              <Slider
                style={styles.slider}
                minimumValue={5}
                maximumValue={15}
                step={5}
                value={settings.snoozeDuration}
                onValueChange={(value) => updatePrayerSettings({ snoozeDuration: value as 5 | 10 | 15 })}
                minimumTrackTintColor={COLORS.primary.green}
                maximumTrackTintColor={COLORS.neutral.gray300}
                thumbTintColor={COLORS.primary.green}
                trackStyle={styles.sliderTrack}
                thumbStyle={styles.sliderThumb}
              />
              <Text style={[styles.sliderLabel, { color: COLORS.neutral.gray500 }]}>15 min</Text>
            </View>

            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: accessibleColors.text }]}>
                Max Snoozes: {settings.maxSnoozes}
              </Text>
            </View>
            <View style={styles.sliderContainer}>
              <Text style={[styles.sliderLabel, { color: COLORS.neutral.gray500 }]}>1</Text>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={5}
                step={1}
                value={settings.maxSnoozes}
                onValueChange={(value) => updatePrayerSettings({ maxSnoozes: Math.round(value) })}
                minimumTrackTintColor={COLORS.primary.green}
                maximumTrackTintColor={COLORS.neutral.gray300}
                thumbTintColor={COLORS.primary.green}
                trackStyle={styles.sliderTrack}
                thumbStyle={styles.sliderThumb}
              />
              <Text style={[styles.sliderLabel, { color: COLORS.neutral.gray500 }]}>5</Text>
            </View>
          </>
        )}
      </View>

      {/* Audio Settings */}
      <View style={[styles.settingSection, { backgroundColor: accessibleColors.surface }]}>
        <Text style={[styles.sectionTitle, { color: accessibleColors.text }]}>
          Audio Settings
        </Text>
        
        {/* Audio Selection */}
        <TouchableOpacity
          style={styles.settingRow}
          onPress={() => setShowAudioPicker(true)}
        >
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: accessibleColors.text }]}>
              Selected Adhan
            </Text>
            <Text style={[styles.settingDescription, { color: COLORS.neutral.gray500 }]}>
              {settings.selectedAudio.name} - {settings.selectedAudio.reciter}
              {isCurrentAudioPlaying(settings.selectedAudio) && ' • Playing'}
            </Text>
          </View>
          <View style={styles.audioControls}>
            <TouchableOpacity
              style={[styles.previewButton, { marginRight: 8 }]}
              onPress={() => handlePreviewAudio(settings.selectedAudio)}
            >
              <Ionicons name="play-skip-forward" size={14} color={COLORS.neutral.gray600} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.playButton,
                isCurrentAudioPlaying(settings.selectedAudio) && styles.playButtonActive
              ]}
              onPress={() => handleTogglePlayback(settings.selectedAudio)}
            >
              <Ionicons 
                name={isCurrentAudioPlaying(settings.selectedAudio) ? "stop" : "play"} 
                size={16} 
                color={isCurrentAudioPlaying(settings.selectedAudio) ? COLORS.neutral.white : COLORS.primary.green} 
              />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {/* Volume Control */}
        <View style={styles.settingRow}>
          <Text style={[styles.settingLabel, { color: accessibleColors.text }]}>
            Volume: {Math.round(localVolume * 100)}%
          </Text>
        </View>
        <View style={styles.sliderContainer}>
          <Ionicons name="volume-low" size={20} color={COLORS.neutral.gray500} />
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={1}
            value={localVolume}
            onValueChange={(value) => {
              const numericValue = Array.isArray(value) ? value[0] : value;
              setLocalVolume(numericValue);
            }}
            onSlidingComplete={(value) => {
              const numericValue = Array.isArray(value) ? value[0] : value;
              updatePrayerSettings({ volume: numericValue });
            }}
            minimumTrackTintColor={COLORS.primary.green}
            maximumTrackTintColor={COLORS.neutral.gray300}
            thumbTintColor={COLORS.primary.green}
          />
          <Ionicons name="volume-high" size={20} color={COLORS.neutral.gray500} />
        </View>

        {/* Fade Effects */}
        <View style={styles.settingRow}>
          <Text style={[styles.settingLabel, { color: accessibleColors.text }]}>
            Fade In: {localFadeIn}s
          </Text>
        </View>
        <View style={styles.sliderContainer}>
          <Text style={[styles.sliderLabel, { color: COLORS.neutral.gray500 }]}>0s</Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={10}
            step={1}
            value={localFadeIn}
            onValueChange={(value) => {
              const numericValue = Array.isArray(value) ? value[0] : value;
              setLocalFadeIn(Math.round(numericValue));
            }}
            onSlidingComplete={(value) => {
              const numericValue = Array.isArray(value) ? value[0] : value;
              updatePrayerSettings({ fadeInDuration: Math.round(numericValue) });
            }}
            minimumTrackTintColor={COLORS.primary.green}
            maximumTrackTintColor={COLORS.neutral.gray300}
            thumbTintColor={COLORS.primary.green}
          />
          <Text style={[styles.sliderLabel, { color: COLORS.neutral.gray500 }]}>10s</Text>
        </View>

        <View style={styles.settingRow}>
          <Text style={[styles.settingLabel, { color: accessibleColors.text }]}>
            Fade Out: {localFadeOut}s
          </Text>
        </View>
        <View style={styles.sliderContainer}>
          <Text style={[styles.sliderLabel, { color: COLORS.neutral.gray500 }]}>0s</Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={10}
            step={1}
            value={localFadeOut}
            onValueChange={(value) => {
              const numericValue = Array.isArray(value) ? value[0] : value;
              setLocalFadeOut(Math.round(numericValue));
            }}
            onSlidingComplete={(value) => {
              const numericValue = Array.isArray(value) ? value[0] : value;
              updatePrayerSettings({ fadeOutDuration: Math.round(numericValue) });
            }}
            minimumTrackTintColor={COLORS.primary.green}
            maximumTrackTintColor={COLORS.neutral.gray300}
            thumbTintColor={COLORS.primary.green}
          />
          <Text style={[styles.sliderLabel, { color: COLORS.neutral.gray500 }]}>10s</Text>
        </View>
      </View>

      {/* Production Reset Section */}
      <View style={[styles.settingSection, { backgroundColor: accessibleColors.surface }]}>
        <Text style={[styles.sectionTitle, { color: accessibleColors.text }]}>
          Advanced Settings
        </Text>
        
        <TouchableOpacity
          style={[styles.resetButton, { borderColor: COLORS.semantic.warning }]}
          onPress={() => {
            Alert.alert(
              'Reset to Production Mode',
              'This will clear all cached sample data and get your real location (Vancouver) with live prayer times. Are you sure?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Reset',
                  style: 'destructive',
                  onPress: () => {
                    onClose(); // Close settings first
                    setTimeout(() => {
                      resetToProduction();
                    }, 500);
                  },
                },
              ]
            );
          }}
        >
          <Ionicons name="refresh" size={20} color={COLORS.semantic.warning} />
          <View style={styles.resetButtonInfo}>
            <Text style={[styles.resetButtonLabel, { color: COLORS.semantic.warning }]}>
              Reset to Production Mode
            </Text>
            <Text style={[styles.resetButtonDescription, { color: COLORS.neutral.gray500 }]}>
              Clear sample data and use real location & current date
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );



  const renderLocationSettings = () => (
    <View style={styles.tabContent}>
      {/* Location Type */}
      <View style={[styles.settingSection, { backgroundColor: accessibleColors.surface }]}>
        <Text style={[styles.sectionTitle, { color: accessibleColors.text }]}>
          Location Settings
        </Text>
        
        <TouchableOpacity
          style={[
            styles.locationOption,
            settings.location.type === 'auto' && styles.selectedLocationOption,
          ]}
          onPress={handleAutoLocation}
        >
          <Ionicons
            name="location"
            size={20}
            color={settings.location.type === 'auto' ? COLORS.primary.green : COLORS.neutral.gray500}
          />
          <View style={styles.locationInfo}>
            <Text style={[
              styles.locationLabel,
              {
                color: settings.location.type === 'auto' ? COLORS.primary.green : accessibleColors.text,
              },
            ]}>
              Automatic (GPS)
            </Text>
            <Text style={[styles.locationDescription, { color: COLORS.neutral.gray500 }]}>
              Use device location for accurate prayer times
            </Text>
          </View>
          {settings.location.type === 'auto' && (
            <Ionicons name="checkmark-circle" size={20} color={COLORS.primary.green} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.locationOption,
            settings.location.type === 'manual' && styles.selectedLocationOption,
          ]}
          onPress={() => setShowCityPicker(true)}
        >
          <Ionicons
            name="business"
            size={20}
            color={settings.location.type === 'manual' ? COLORS.primary.green : COLORS.neutral.gray500}
          />
          <View style={styles.locationInfo}>
            <Text style={[
              styles.locationLabel,
              {
                color: settings.location.type === 'manual' ? COLORS.primary.green : accessibleColors.text,
              },
            ]}>
              Manual Selection
            </Text>
            <Text style={[styles.locationDescription, { color: COLORS.neutral.gray500 }]}>
              {settings.location.selectedCity 
                ? `${settings.location.selectedCity.name}, ${settings.location.selectedCity.country}`
                : 'Choose a city manually'
              }
            </Text>
          </View>
          {settings.location.type === 'manual' && (
            <Ionicons name="checkmark-circle" size={20} color={COLORS.primary.green} />
          )}
        </TouchableOpacity>
      </View>

      {/* Current Location Info */}
      {(settings.location.lastKnownLocation || settings.location.selectedCity) && (
        <View style={[styles.settingSection, { backgroundColor: accessibleColors.surface }]}>
          <Text style={[styles.sectionTitle, { color: accessibleColors.text }]}>
            Current Location
          </Text>
          <View style={styles.currentLocationInfo}>
            <Ionicons name="location" size={16} color={COLORS.primary.green} />
            <Text style={[styles.currentLocationText, { color: accessibleColors.text }]}>
              {settings.location.type === 'manual' && settings.location.selectedCity
                ? `${settings.location.selectedCity.name}, ${settings.location.selectedCity.country}`
                : settings.location.lastKnownLocation
                ? `${settings.location.lastKnownLocation.city}, ${settings.location.lastKnownLocation.country}`
                : 'Location not set'
              }
            </Text>
          </View>
        </View>
      )}
    </View>
  );

  const renderNotificationSettings = () => (
    <View style={styles.tabContent}>
      <View style={[styles.settingSection, { backgroundColor: accessibleColors.surface }]}>
        <Text style={[styles.sectionTitle, { color: accessibleColors.text }]}>
          Prayer Notifications
        </Text>
        
        {(['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as PrayerName[]).map(prayer => (
          <View key={prayer} style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: accessibleColors.text }]}>
              {PRAYER_NAMES.en[prayer]}
            </Text>
            <Switch
              value={settings.notifications[prayer]}
              onValueChange={(value) => 
                updatePrayerSettings({
                  notifications: { ...settings.notifications, [prayer]: value }
                })
              }
              trackColor={{ false: COLORS.neutral.gray300, true: COLORS.primary.green }}
              thumbColor={COLORS.neutral.white}
            />
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.container, { backgroundColor: accessibleColors.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: accessibleColors.surface }]}>
          <Text style={[styles.headerTitle, { color: accessibleColors.text }]}>
            Prayer Settings
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={accessibleColors.text} />
          </TouchableOpacity>
        </View>

        {/* Tab Bar */}
        {renderTabBar()}

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {activeTab === 'general' && renderGeneralSettings()}
          {activeTab === 'location' && renderLocationSettings()}
          {activeTab === 'notifications' && renderNotificationSettings()}
        </ScrollView>

        {/* Method Picker Modal */}
        <Modal visible={showMethodPicker} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={[styles.pickerModal, { backgroundColor: accessibleColors.surface }]}>
              <View style={styles.pickerHeader}>
                <Text style={[styles.pickerTitle, { color: accessibleColors.text }]}>
                  Calculation Method
                </Text>
                <TouchableOpacity onPress={() => setShowMethodPicker(false)}>
                  <Ionicons name="close" size={24} color={accessibleColors.text} />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.pickerContent}>
                {availableMethods.map(method => (
                  <TouchableOpacity
                    key={method.id}
                    style={[
                      styles.pickerItem,
                      method.id === settings.calculationMethod.id && styles.selectedPickerItem,
                    ]}
                    onPress={() => handleMethodSelect(method)}
                  >
                    <View style={styles.pickerItemContent}>
                      <Text style={[
                        styles.pickerItemTitle,
                        {
                          color: method.id === settings.calculationMethod.id 
                            ? COLORS.primary.green 
                            : accessibleColors.text,
                        },
                      ]}>
                        {method.name}
                      </Text>
                      <Text style={[styles.pickerItemDescription, { color: COLORS.neutral.gray500 }]}>
                        {method.description}
                      </Text>
                    </View>
                    {method.id === settings.calculationMethod.id && (
                      <Ionicons name="checkmark" size={20} color={COLORS.primary.green} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Audio Picker Modal */}
        <Modal visible={showAudioPicker} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={[styles.pickerModal, { backgroundColor: accessibleColors.surface }]}>
              <View style={styles.pickerHeader}>
                <Text style={[styles.pickerTitle, { color: accessibleColors.text }]}>
                  Select Adhan
                </Text>
                <TouchableOpacity onPress={() => setShowAudioPicker(false)}>
                  <Ionicons name="close" size={24} color={accessibleColors.text} />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.pickerContent}>
                {availableAudios.map(audio => (
                  <TouchableOpacity
                    key={audio.id}
                    style={[
                      styles.pickerItem,
                      audio.id === settings.selectedAudio.id && styles.selectedPickerItem,
                    ]}
                    onPress={() => handleAudioSelect(audio)}
                  >
                    <View style={styles.pickerItemContent}>
                      <Text style={[
                        styles.pickerItemTitle,
                        {
                          color: audio.id === settings.selectedAudio.id 
                            ? COLORS.primary.green 
                            : accessibleColors.text,
                        },
                      ]}>
                        {audio.name}
                      </Text>
                      <Text style={[styles.pickerItemDescription, { color: COLORS.neutral.gray500 }]}>
                        {audio.reciter}
                      </Text>
                    </View>
                    <View style={styles.audioActions}>
                      <TouchableOpacity
                        style={styles.previewButton}
                        onPress={() => handlePreviewAudio(audio)}
                      >
                        <Ionicons name="play" size={16} color={COLORS.primary.green} />
                      </TouchableOpacity>
                      {audio.id === settings.selectedAudio.id && (
                        <Ionicons name="checkmark" size={20} color={COLORS.primary.green} />
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* City Picker Modal */}
        <Modal visible={showCityPicker} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={[styles.pickerModal, { backgroundColor: accessibleColors.surface }]}>
              <View style={styles.pickerHeader}>
                <Text style={[styles.pickerTitle, { color: accessibleColors.text }]}>
                  Select City
                </Text>
                <TouchableOpacity onPress={() => setShowCityPicker(false)}>
                  <Ionicons name="close" size={24} color={accessibleColors.text} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color={COLORS.neutral.gray400} />
                <TextInput
                  style={[styles.searchInput, { color: accessibleColors.text }]}
                  placeholder="Search cities..."
                  placeholderTextColor={COLORS.neutral.gray400}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>

              <ScrollView style={styles.pickerContent}>
                {filteredCities.map(city => (
                  <TouchableOpacity
                    key={city.id}
                    style={[
                      styles.pickerItem,
                      settings.location.selectedCity?.id === city.id && styles.selectedPickerItem,
                    ]}
                    onPress={() => handleCitySelect(city)}
                  >
                    <View style={styles.pickerItemContent}>
                      <Text style={[
                        styles.pickerItemTitle,
                        {
                          color: settings.location.selectedCity?.id === city.id 
                            ? COLORS.primary.green 
                            : accessibleColors.text,
                        },
                      ]}>
                        {city.name}
                      </Text>
                      <Text style={[styles.pickerItemDescription, { color: COLORS.neutral.gray500 }]}>
                        {city.country}
                      </Text>
                    </View>
                    {settings.location.selectedCity?.id === city.id && (
                      <Ionicons name="checkmark" size={20} color={COLORS.primary.green} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
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
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutral.gray200,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutral.gray200,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary.green,
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 20,
  },
  settingSection: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
  },
  settingDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  slider: {
    flex: 1,
    marginHorizontal: 12,
    height: 40,
  },
  sliderTrack: {
    height: 6,
    borderRadius: 3,
  },
  sliderThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary.green,
    borderWidth: 2,
    borderColor: COLORS.neutral.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 5,
  },
  sliderLabel: {
    fontSize: 12,
    fontWeight: '500',
  },

  locationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedLocationOption: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  locationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  locationLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  locationDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  currentLocationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentLocationText: {
    marginLeft: 8,
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerModal: {
    maxHeight: '80%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutral.gray200,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 20,
    padding: 12,
    backgroundColor: COLORS.neutral.gray100,
    borderRadius: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  pickerContent: {
    maxHeight: 400,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutral.gray100,
  },
  selectedPickerItem: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  pickerItemContent: {
    flex: 1,
  },
  pickerItemTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  pickerItemDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  audioControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  audioActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  previewButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  playButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  playButtonActive: {
    backgroundColor: COLORS.primary.green,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  resetButtonInfo: {
    flex: 1,
    marginLeft: 12,
  },
  resetButtonLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  resetButtonDescription: {
    fontSize: 12,
    marginTop: 2,
  },
}); 