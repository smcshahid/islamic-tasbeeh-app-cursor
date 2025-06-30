/**
 * Interactive Theme Demo Component
 * Live showcase of all themes with real-time switching and animations
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme, getAvailableThemes, ThemeDefinition, ThemeName } from '../utils/theme';
import { useTasbeeh } from '../contexts/TasbeehContext';
import { getButtonA11yProps, announceToScreenReader } from '../utils/accessibility';

const { width, height } = Dimensions.get('window');

interface DemoProps {
  onClose?: () => void;
}

export default function InteractiveThemeDemo({ onClose }: DemoProps) {
  const { colors, theme: currentTheme, themeDefinition } = useAppTheme();
  const { updateSettings } = useTasbeeh();
  const [selectedTheme, setSelectedTheme] = useState<ThemeName>(currentTheme);
  const [demoScreen, setDemoScreen] = useState<'counter' | 'settings' | 'history' | 'auth'>('counter');
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  const availableThemes = getAvailableThemes();
  const allThemes = [
    {
      name: 'auto' as ThemeName,
      displayName: 'Auto',
      description: 'Follow system appearance',
      isDark: false,
      colors: colors,
    },
    ...availableThemes
  ];

  // Animation when theme changes
  const handleThemeChange = async (themeName: ThemeName) => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setSelectedTheme(themeName);
    
    // Smooth transition animation
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0.3,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Apply theme change
    await updateSettings({ theme: themeName });
    announceToScreenReader(`Theme changed to ${allThemes.find(t => t.name === themeName)?.displayName}`);
    
    setTimeout(() => setIsTransitioning(false), 500);
  };

  // Screen transition animation
  const handleScreenChange = (screen: typeof demoScreen) => {
    setDemoScreen(screen);
    
    Animated.sequence([
      Animated.timing(slideAnim, {
        toValue: -50,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const renderThemeSelector = () => (
    <View style={styles.themeSelectorContainer}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.themeSelector}
      >
        {allThemes.map((theme) => {
          const isSelected = selectedTheme === theme.name;
          const isCurrent = currentTheme === theme.name;
          
          return (
            <TouchableOpacity
              key={theme.name}
              style={[
                styles.themeCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                  borderWidth: isSelected ? 3 : 1,
                  transform: [{ scale: isSelected ? 1.05 : 1 }],
                }
              ]}
              onPress={() => handleThemeChange(theme.name)}
              disabled={isTransitioning}
              {...getButtonA11yProps(
                `Switch to ${theme.displayName}`,
                `${theme.displayName} theme. ${theme.description}`,
                false
              )}
            >
              {/* Theme preview */}
              <View style={styles.themePreview}>
                <LinearGradient
                  colors={[theme.colors.primary, theme.colors.secondary]}
                  style={styles.themeGradient}
                >
                  <View style={[styles.miniElement, { backgroundColor: theme.colors.text.onPrimary }]} />
                </LinearGradient>
              </View>
              
              <Text style={[styles.themeCardTitle, { color: theme.colors.text.primary }]} numberOfLines={1}>
                {theme.displayName}
              </Text>
              
              {isCurrent && (
                <View style={[styles.currentIndicator, { backgroundColor: theme.colors.accent }]}>
                  <Ionicons name="checkmark" size={12} color={theme.colors.text.onPrimary} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderScreenSelector = () => (
    <View style={[styles.screenSelector, { backgroundColor: colors.surface }]}>
      {[
        { key: 'counter', icon: 'add-circle', label: 'Counter' },
        { key: 'settings', icon: 'settings', label: 'Settings' },
        { key: 'history', icon: 'time', label: 'History' },
        { key: 'auth', icon: 'person', label: 'Auth' },
      ].map((screen) => (
        <TouchableOpacity
          key={screen.key}
          style={[
            styles.screenTab,
            {
              backgroundColor: demoScreen === screen.key ? colors.primary : 'transparent',
            }
          ]}
          onPress={() => handleScreenChange(screen.key as typeof demoScreen)}
        >
          <Ionicons 
            name={screen.icon as any} 
            size={20} 
            color={demoScreen === screen.key ? colors.text.onPrimary : colors.text.secondary} 
          />
          <Text style={[
            styles.screenTabText,
            { 
              color: demoScreen === screen.key ? colors.text.onPrimary : colors.text.secondary,
              fontWeight: demoScreen === screen.key ? '600' : '400',
            }
          ]}>
            {screen.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderCounterDemo = () => (
    <Animated.View 
      style={[
        styles.demoScreen,
        { 
          backgroundColor: colors.background,
          transform: [{ translateY: slideAnim }],
        }
      ]}
    >
      {/* Mock header */}
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        style={styles.mockHeader}
      >
        <Text style={[styles.mockHeaderTitle, { color: colors.text.onPrimary }]}>
          Tasbeeh Counter
        </Text>
        <TouchableOpacity style={[styles.mockHeaderButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
          <Ionicons name="swap-horizontal" size={16} color={colors.text.onPrimary} />
        </TouchableOpacity>
      </LinearGradient>

      {/* Mock counter display */}
      <View style={styles.mockCounterContainer}>
        <View style={[styles.mockCounterCircle, { backgroundColor: colors.primary }]}>
          <Text style={[styles.mockCounterNumber, { color: colors.text.onPrimary }]}>
            247
          </Text>
        </View>
        <Text style={[styles.mockCounterLabel, { color: colors.text.secondary }]}>
          Tap to count
        </Text>
      </View>

      {/* Mock progress */}
      <View style={[styles.mockProgress, { backgroundColor: colors.surface }]}>
        <Text style={[styles.mockProgressLabel, { color: colors.text.primary }]}>
          Progress: 247 / 1000
        </Text>
        <View style={[styles.mockProgressBar, { backgroundColor: colors.border }]}>
          <View style={[styles.mockProgressFill, { backgroundColor: colors.primary, width: '25%' }]} />
        </View>
      </View>

      {/* Mock action buttons */}
      <View style={styles.mockActions}>
        <TouchableOpacity style={[styles.mockActionButton, { backgroundColor: colors.error }]}>
          <Ionicons name="refresh" size={16} color={colors.text.onPrimary} />
          <Text style={[styles.mockActionText, { color: colors.text.onPrimary }]}>Reset</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.mockActionButton, { backgroundColor: colors.secondary }]}>
          <Ionicons name="flag" size={16} color={colors.text.onSecondary} />
          <Text style={[styles.mockActionText, { color: colors.text.onSecondary }]}>Target</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const renderSettingsDemo = () => (
    <Animated.View 
      style={[
        styles.demoScreen,
        { 
          backgroundColor: colors.background,
          transform: [{ translateY: slideAnim }],
        }
      ]}
    >
      <View style={styles.mockSettingsHeader}>
        <Text style={[styles.mockSettingsTitle, { color: colors.text.primary }]}>
          Settings
        </Text>
        <Text style={[styles.mockSettingsSubtitle, { color: colors.text.secondary }]}>
          Customize your experience
        </Text>
      </View>

      <ScrollView style={styles.mockSettingsList}>
        {[
          { icon: 'color-palette', title: 'Theme', subtitle: themeDefinition.displayName },
          { icon: 'language', title: 'Language', subtitle: 'English' },
          { icon: 'notifications', title: 'Notifications', subtitle: 'Enabled' },
          { icon: 'vibrate', title: 'Haptic Feedback', subtitle: 'On' },
          { icon: 'cloud', title: 'Cloud Sync', subtitle: 'Auto' },
        ].map((item, index) => (
          <View key={index} style={[styles.mockSettingsItem, { backgroundColor: colors.surface }]}>
            <View style={[styles.mockSettingsIcon, { backgroundColor: colors.primary }]}>
              <Ionicons name={item.icon as any} size={16} color={colors.text.onPrimary} />
            </View>
            <View style={styles.mockSettingsContent}>
              <Text style={[styles.mockSettingsItemTitle, { color: colors.text.primary }]}>
                {item.title}
              </Text>
              <Text style={[styles.mockSettingsItemSubtitle, { color: colors.text.secondary }]}>
                {item.subtitle}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />
          </View>
        ))}
      </ScrollView>
    </Animated.View>
  );

  const renderHistoryDemo = () => (
    <Animated.View 
      style={[
        styles.demoScreen,
        { 
          backgroundColor: colors.background,
          transform: [{ translateY: slideAnim }],
        }
      ]}
    >
      <View style={styles.mockHistoryHeader}>
        <Text style={[styles.mockHistoryTitle, { color: colors.text.primary }]}>
          Session History
        </Text>
        <Text style={[styles.mockHistorySubtitle, { color: colors.text.secondary }]}>
          Track your spiritual journey
        </Text>
      </View>

      <View style={[styles.mockStatsCard, { backgroundColor: colors.surface }]}>
        <View style={styles.mockStatsRow}>
          <View style={styles.mockStatItem}>
            <Text style={[styles.mockStatNumber, { color: colors.primary }]}>24</Text>
            <Text style={[styles.mockStatLabel, { color: colors.text.secondary }]}>Sessions</Text>
          </View>
          <View style={styles.mockStatItem}>
            <Text style={[styles.mockStatNumber, { color: colors.secondary }]}>8.2k</Text>
            <Text style={[styles.mockStatLabel, { color: colors.text.secondary }]}>Total Counts</Text>
          </View>
          <View style={styles.mockStatItem}>
            <Text style={[styles.mockStatNumber, { color: colors.accent }]}>5h 23m</Text>
            <Text style={[styles.mockStatLabel, { color: colors.text.secondary }]}>Time Spent</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.mockHistoryList}>
        {[
          { date: 'Today', count: 247, duration: '12m 30s', counter: 'Subhan Allah' },
          { date: 'Yesterday', count: 198, duration: '8m 45s', counter: 'Alhamdulillah' },
          { date: '2 days ago', count: 333, duration: '15m 20s', counter: 'Allahu Akbar' },
        ].map((session, index) => (
          <View key={index} style={[styles.mockHistoryItem, { backgroundColor: colors.card }]}>
            <View style={[styles.mockHistoryDot, { backgroundColor: colors.primary }]} />
            <View style={styles.mockHistoryContent}>
              <Text style={[styles.mockHistoryItemTitle, { color: colors.text.primary }]}>
                {session.counter}
              </Text>
              <Text style={[styles.mockHistoryItemSubtitle, { color: colors.text.secondary }]}>
                {session.count} counts • {session.duration}
              </Text>
            </View>
            <Text style={[styles.mockHistoryDate, { color: colors.text.tertiary }]}>
              {session.date}
            </Text>
          </View>
        ))}
      </ScrollView>
    </Animated.View>
  );

  const renderAuthDemo = () => (
    <Animated.View 
      style={[
        styles.demoScreen,
        { 
          backgroundColor: colors.background,
          transform: [{ translateY: slideAnim }],
        }
      ]}
    >
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        style={styles.mockAuthHeader}
      >
        <Text style={[styles.mockAuthTitle, { color: colors.text.onPrimary }]}>
          Tasbeeh
        </Text>
        <Text style={[styles.mockAuthSubtitle, { color: colors.text.onPrimary }]}>
          Digital Prayer Counter
        </Text>
      </LinearGradient>

      <View style={[styles.mockAuthForm, { backgroundColor: colors.card }]}>
        <Text style={[styles.mockAuthFormTitle, { color: colors.text.primary }]}>
          Welcome Back
        </Text>
        
        <View style={[styles.mockInput, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="mail" size={16} color={colors.text.secondary} />
          <Text style={[styles.mockInputText, { color: colors.text.tertiary }]}>
            Email address
          </Text>
        </View>
        
        <View style={[styles.mockInput, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="lock-closed" size={16} color={colors.text.secondary} />
          <Text style={[styles.mockInputText, { color: colors.text.tertiary }]}>
            Password
          </Text>
        </View>
        
        <TouchableOpacity style={[styles.mockAuthButton, { backgroundColor: colors.primary }]}>
          <Text style={[styles.mockAuthButtonText, { color: colors.text.onPrimary }]}>
            Sign In
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.mockGuestButton, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="person-outline" size={16} color={colors.text.primary} />
          <Text style={[styles.mockGuestButtonText, { color: colors.text.primary }]}>
            Continue as Guest
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const renderDemoContent = () => {
    switch (demoScreen) {
      case 'counter':
        return renderCounterDemo();
      case 'settings':
        return renderSettingsDemo();
      case 'history':
        return renderHistoryDemo();
      case 'auth':
        return renderAuthDemo();
      default:
        return renderCounterDemo();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar backgroundColor={colors.primary} barStyle="light-content" />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={[styles.headerIcon, { backgroundColor: colors.primary }]}>
              <Ionicons name="color-palette" size={20} color={colors.text.onPrimary} />
            </View>
            <View>
              <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
                Theme Preview
              </Text>
              <Text style={[styles.headerSubtitle, { color: colors.text.secondary }]}>
                Interactive Demo
              </Text>
            </View>
          </View>
          
          {onClose && (
            <TouchableOpacity 
              style={[styles.closeButton, { backgroundColor: colors.surface }]}
              onPress={onClose}
              {...getButtonA11yProps('Close', 'Close theme preview', false)}
            >
              <Ionicons name="close" size={20} color={colors.text.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Theme Selector */}
      {renderThemeSelector()}

      {/* Screen Selector */}
      {renderScreenSelector()}

      {/* Demo Content */}
      <Animated.View 
        style={[
          styles.demoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          }
        ]}
      >
        {renderDemoContent()}
      </Animated.View>

      {/* Info Footer */}
      <View style={[styles.footer, { backgroundColor: colors.surface }]}>
        <Ionicons name="information-circle" size={16} color={colors.text.secondary} />
        <Text style={[styles.footerText, { color: colors.text.secondary }]}>
          Switch themes above to see live changes • Current: {themeDefinition.displayName}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeSelectorContainer: {
    paddingVertical: 12,
  },
  themeSelector: {
    paddingHorizontal: 16,
    gap: 12,
  },
  themeCard: {
    width: 80,
    alignItems: 'center',
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  themePreview: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 6,
  },
  themeGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniElement: {
    width: 16,
    height: 16,
    borderRadius: 8,
    opacity: 0.9,
  },
  themeCardTitle: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  currentIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenSelector: {
    flexDirection: 'row',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
  },
  screenTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    gap: 4,
  },
  screenTabText: {
    fontSize: 12,
  },
  demoContainer: {
    flex: 1,
    marginHorizontal: 16,
  },
  demoScreen: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  
  // Counter Demo Styles
  mockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  mockHeaderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  mockHeaderButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mockCounterContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  mockCounterCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  mockCounterNumber: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  mockCounterLabel: {
    fontSize: 14,
  },
  mockProgress: {
    margin: 16,
    padding: 12,
    borderRadius: 12,
  },
  mockProgressLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  mockProgressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  mockProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  mockActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  mockActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  mockActionText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Settings Demo Styles
  mockSettingsHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  mockSettingsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  mockSettingsSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  mockSettingsList: {
    flex: 1,
    padding: 16,
  },
  mockSettingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  mockSettingsIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  mockSettingsContent: {
    flex: 1,
  },
  mockSettingsItemTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  mockSettingsItemSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },

  // History Demo Styles
  mockHistoryHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  mockHistoryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  mockHistorySubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  mockStatsCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  mockStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  mockStatItem: {
    alignItems: 'center',
  },
  mockStatNumber: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  mockStatLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  mockHistoryList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  mockHistoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  mockHistoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  mockHistoryContent: {
    flex: 1,
  },
  mockHistoryItemTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  mockHistoryItemSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  mockHistoryDate: {
    fontSize: 11,
  },

  // Auth Demo Styles
  mockAuthHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  mockAuthTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  mockAuthSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  mockAuthForm: {
    flex: 1,
    margin: 16,
    padding: 20,
    borderRadius: 16,
  },
  mockAuthFormTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  mockInput: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
    gap: 8,
  },
  mockInputText: {
    fontSize: 14,
  },
  mockAuthButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  mockAuthButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  mockGuestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  mockGuestButtonText: {
    fontSize: 14,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    gap: 8,
  },
  footerText: {
    fontSize: 12,
    flex: 1,
  },
}); 