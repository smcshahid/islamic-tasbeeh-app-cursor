/**
 * Accessibility Test Screen
 * Demonstrates all accessibility features implemented in the Tasbeeh app
 * Used for testing and validation of accessibility compliance
 */
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  accessibilityManager,
  getCounterA11yProps,
  getButtonA11yProps,
  getProgressA11yProps,
  getToggleA11yProps,
  announceToScreenReader,
  getAnimationConfig,
  getFontScale,
  getAccessibleColors,
  getIslamicCountingLabels,
} from '../utils/accessibility';
import { COLORS } from '../types';

export default function AccessibilityTestScreen({ onClose }: { onClose: () => void }) {
  const [count, setCount] = useState(0);
  const [target, setTarget] = useState(33);
  const [isEnabled, setIsEnabled] = useState(true);
  const [isDark, setIsDark] = useState(false);

  const fontScale = getFontScale();
  const accessibleColors = getAccessibleColors(isDark ? 'dark' : 'light');
  const animationConfig = getAnimationConfig();

  const handleIncrement = () => {
    const newCount = count + 1;
    setCount(newCount);
    
    // Test Islamic counting announcements
    if (newCount % 33 === 0 || newCount === target) {
      const announcement = getIslamicCountingLabels(newCount, 'tasbih');
      announceToScreenReader(announcement);
    }
  };

  const TestSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={[styles.section, { backgroundColor: accessibleColors.surface }]}>
      <Text 
        style={[
          styles.sectionTitle,
          { 
            color: accessibleColors.primaryText,
            fontSize: 18 * fontScale
          }
        ]}
        accessibilityRole="header"
      >
        {title}
      </Text>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: accessibleColors.background }]}>
      <LinearGradient
        colors={[COLORS.primary.blue, COLORS.primary.green]}
        style={styles.header}
      >
        <TouchableOpacity
          onPress={onClose}
          style={styles.closeButton}
          {...getButtonA11yProps('Close', 'Close accessibility test screen')}
        >
          <Ionicons name="close" size={24} color={COLORS.neutral.white} />
        </TouchableOpacity>
        
        <Text 
          style={[styles.headerTitle, { fontSize: 24 * fontScale }]}
          accessibilityRole="header"
          accessibilityLabel="Accessibility Test Screen"
        >
          Accessibility Test
        </Text>
        
        <Text 
          style={[styles.headerSubtitle, { fontSize: 16 * fontScale }]}
          accessibilityLabel="Test screen for validating accessibility features"
        >
          Testing all A11y features
        </Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Counter Test Section */}
        <TestSection title="Counter Accessibility">
          <View style={styles.counterContainer}>
            <TouchableOpacity
              style={[styles.counterButton, { backgroundColor: COLORS.primary.green }]}
              onPress={handleIncrement}
              {...getCounterA11yProps(count, 'Test Counter', target)}
              accessibilityLabel={getIslamicCountingLabels(count, 'tasbih')}
            >
              <Text 
                style={[
                  styles.counterValue,
                  { fontSize: 48 * fontScale }
                ]}
                accessibilityElementsHidden={true}
              >
                {count}
              </Text>
              <Text 
                style={[styles.counterLabel, { fontSize: 14 * fontScale }]}
                accessibilityElementsHidden={true}
              >
                Tap to count
              </Text>
            </TouchableOpacity>

            {/* Progress Bar Test */}
            <View 
              style={styles.progressContainer}
              {...getProgressA11yProps(count, target, 'Test progress')}
            >
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.min((count / target) * 100, 100)}%` }
                  ]}
                />
              </View>
              <Text 
                style={[
                  styles.progressText,
                  { 
                    color: accessibleColors.primaryText,
                    fontSize: 14 * fontScale
                  }
                ]}
                accessibilityLabel={`Progress: ${count} out of ${target} completed. ${Math.round((count / target) * 100)}% complete.`}
              >
                {count} / {target} ({Math.round((count / target) * 100)}%)
              </Text>
            </View>
          </View>
        </TestSection>

        {/* Button Test Section */}
        <TestSection title="Button Accessibility">
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.testButton, { backgroundColor: COLORS.primary.orange }]}
              onPress={() => setCount(0)}
              {...getButtonA11yProps('Reset Counter', 'Reset the test counter to zero')}
            >
              <Ionicons name="refresh" size={20} color={COLORS.neutral.white} />
              <Text style={[styles.buttonText, { fontSize: 16 * fontScale }]}>Reset</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.testButton, { backgroundColor: COLORS.primary.purple }]}
              onPress={() => {
                setTarget(target === 33 ? 99 : 33);
                announceToScreenReader(`Target changed to ${target === 33 ? 99 : 33}`);
              }}
              {...getButtonA11yProps(
                'Change Target',
                `Current target is ${target}. Tap to change target.`
              )}
            >
              <Ionicons name="flag" size={20} color={COLORS.neutral.white} />
              <Text style={[styles.buttonText, { fontSize: 16 * fontScale }]}>
                Target: {target}
              </Text>
            </TouchableOpacity>
          </View>
        </TestSection>

        {/* Toggle Test Section */}
        <TestSection title="Toggle Accessibility">
          <View style={styles.toggleContainer}>
            <Text 
              style={[
                styles.toggleLabel,
                { 
                  color: accessibleColors.primaryText,
                  fontSize: 16 * fontScale
                }
              ]}
            >
              Test Toggle
            </Text>
            <Switch
              value={isEnabled}
              onValueChange={(value) => {
                setIsEnabled(value);
                announceToScreenReader(`Test toggle ${value ? 'enabled' : 'disabled'}`);
              }}
              trackColor={{ false: COLORS.neutral.gray300, true: COLORS.primary.green }}
              thumbColor={isEnabled ? COLORS.neutral.white : COLORS.neutral.gray500}
              {...getToggleA11yProps(
                'Test Toggle',
                isEnabled,
                'Toggle for testing accessibility of switch components'
              )}
            />
          </View>

          <View style={styles.toggleContainer}>
            <Text 
              style={[
                styles.toggleLabel,
                { 
                  color: accessibleColors.primaryText,
                  fontSize: 16 * fontScale
                }
              ]}
            >
              Dark Mode
            </Text>
            <Switch
              value={isDark}
              onValueChange={(value) => {
                setIsDark(value);
                announceToScreenReader(`Dark mode ${value ? 'enabled' : 'disabled'}`);
              }}
              trackColor={{ false: COLORS.neutral.gray300, true: COLORS.primary.blue }}
              thumbColor={isDark ? COLORS.neutral.white : COLORS.neutral.gray500}
              {...getToggleA11yProps(
                'Dark Mode',
                isDark,
                'Toggle dark mode for testing color accessibility'
              )}
            />
          </View>
        </TestSection>

        {/* Announcement Test Section */}
        <TestSection title="Screen Reader Announcements">
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.testButton, { backgroundColor: COLORS.semantic.success }]}
              onPress={() => announceToScreenReader('This is a test announcement for screen readers')}
              {...getButtonA11yProps('Test Announcement', 'Send a test message to screen readers')}
            >
              <Ionicons name="megaphone" size={20} color={COLORS.neutral.white} />
              <Text style={[styles.buttonText, { fontSize: 16 * fontScale }]}>Announce</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.testButton, { backgroundColor: COLORS.semantic.info }]}
              onPress={() => {
                const config = accessibilityManager.getConfig();
                Alert.alert(
                  'Accessibility Status',
                  `Screen Reader: ${config.isScreenReaderEnabled ? 'Enabled' : 'Disabled'}\n` +
                  `Reduce Motion: ${config.isReduceMotionEnabled ? 'Enabled' : 'Disabled'}\n` +
                  `Bold Text: ${config.isBoldTextEnabled ? 'Enabled' : 'Disabled'}\n` +
                  `Font Scale: ${fontScale}x\n` +
                  `Animation Duration: ${animationConfig.duration}ms`
                );
              }}
              {...getButtonA11yProps('Check Status', 'Show current accessibility configuration')}
            >
              <Ionicons name="information-circle" size={20} color={COLORS.neutral.white} />
              <Text style={[styles.buttonText, { fontSize: 16 * fontScale }]}>Status</Text>
            </TouchableOpacity>
          </View>
        </TestSection>

        {/* Color Contrast Test Section */}
        <TestSection title="Color Accessibility">
          <View style={styles.colorContainer}>
            <View style={[styles.colorCard, { backgroundColor: accessibleColors.surface }]}>
              <Text style={[styles.colorLabel, { color: accessibleColors.primaryText }]}>
                Primary Text
              </Text>
              <Text style={[styles.colorValue, { color: accessibleColors.primaryText }]}>
                {accessibleColors.primaryText}
              </Text>
            </View>

            <View style={[styles.colorCard, { backgroundColor: accessibleColors.surface }]}>
              <Text style={[styles.colorLabel, { color: accessibleColors.secondaryText }]}>
                Secondary Text
              </Text>
              <Text style={[styles.colorValue, { color: accessibleColors.secondaryText }]}>
                {accessibleColors.secondaryText}
              </Text>
            </View>

            <View style={[styles.colorCard, { backgroundColor: accessibleColors.focus }]}>
              <Text style={[styles.colorLabel, { color: COLORS.neutral.white }]}>
                Focus Color
              </Text>
              <Text style={[styles.colorValue, { color: COLORS.neutral.white }]}>
                {accessibleColors.focus}
              </Text>
            </View>
          </View>
        </TestSection>

        {/* Islamic Context Test */}
        <TestSection title="Islamic Accessibility Labels">
          <View style={styles.islamicContainer}>
            <Text style={[styles.islamicLabel, { color: accessibleColors.primaryText }]}>
              Common Counts:
            </Text>
            {[33, 66, 99, 100].map((testCount) => (
              <TouchableOpacity
                key={testCount}
                style={[styles.islamicButton, { backgroundColor: COLORS.primary.green }]}
                onPress={() => {
                  setCount(testCount);
                  const label = getIslamicCountingLabels(testCount, 'tasbih');
                  announceToScreenReader(label);
                }}
                accessibilityLabel={getIslamicCountingLabels(testCount, 'tasbih')}
                accessibilityRole="button"
              >
                <Text style={styles.islamicButtonText}>{testCount}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TestSection>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 40,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: COLORS.neutral.white,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerSubtitle: {
    color: COLORS.neutral.white,
    opacity: 0.9,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 16,
  },
  counterContainer: {
    alignItems: 'center',
  },
  counterButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  counterValue: {
    color: COLORS.neutral.white,
    fontWeight: 'bold',
  },
  counterLabel: {
    color: COLORS.neutral.white,
    opacity: 0.8,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: COLORS.neutral.gray300,
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary.green,
    borderRadius: 4,
  },
  progressText: {
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  testButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  buttonText: {
    color: COLORS.neutral.white,
    fontWeight: '600',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  toggleLabel: {
    fontWeight: '500',
  },
  colorContainer: {
    gap: 12,
  },
  colorCard: {
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  colorLabel: {
    fontWeight: '500',
  },
  colorValue: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
  islamicContainer: {
    alignItems: 'center',
  },
  islamicLabel: {
    fontWeight: '500',
    marginBottom: 12,
  },
  islamicButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
    marginBottom: 8,
  },
  islamicButtonText: {
    color: COLORS.neutral.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 