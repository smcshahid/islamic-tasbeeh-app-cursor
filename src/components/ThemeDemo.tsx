/**
 * Theme Demonstration Component
 * Interactive showcase of all available themes
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme, getAvailableThemes, ThemeDefinition } from '../utils/theme';
import { useTasbeeh } from '../contexts/TasbeehContext';

export default function ThemeDemo() {
  const { colors, theme: currentTheme } = useAppTheme();
  const { updateSettings } = useTasbeeh();
  const [selectedDemo, setSelectedDemo] = useState(currentTheme);
  
  const availableThemes = getAvailableThemes();

  const renderThemePreview = (themeItem: ThemeDefinition) => {
    const isSelected = selectedDemo === themeItem.name;
    const isCurrent = currentTheme === themeItem.name;
    
    return (
      <View key={themeItem.name} style={styles.themePreviewContainer}>
        <TouchableOpacity
          style={[
            styles.previewCard,
            {
              backgroundColor: themeItem.colors.surface,
              borderColor: isSelected ? themeItem.colors.primary : themeItem.colors.border,
              borderWidth: isSelected ? 3 : 1,
            }
          ]}
          onPress={() => setSelectedDemo(themeItem.name)}
        >
          {/* Theme Header */}
          <View style={styles.previewHeader}>
            <Text style={[styles.previewTitle, { color: themeItem.colors.text.primary }]}>
              {themeItem.displayName}
            </Text>
            {isCurrent && (
              <View style={[styles.currentBadge, { backgroundColor: themeItem.colors.primary }]}>
                <Text style={[styles.currentText, { color: themeItem.colors.text.onPrimary }]}>
                  Active
                </Text>
              </View>
            )}
          </View>

          {/* Mock App Preview */}
          <LinearGradient
            colors={[
              themeItem.colors.background,
              themeItem.colors.surface,
              themeItem.colors.surfaceVariant
            ]}
            style={styles.mockApp}
          >
            {/* Mock Navigation */}
            <View style={[styles.mockNav, { backgroundColor: themeItem.colors.primary }]}>
              <View style={[styles.mockNavItem, { backgroundColor: themeItem.colors.text.onPrimary }]} />
              <View style={[styles.mockNavItem, { backgroundColor: themeItem.colors.text.onPrimary }]} />
              <View style={[styles.mockNavItem, { backgroundColor: themeItem.colors.text.onPrimary }]} />
            </View>

            {/* Mock Counter */}
            <View style={styles.mockCounterArea}>
              <View style={[styles.mockCounterDisplay, { backgroundColor: themeItem.colors.card }]}>
                <View style={[styles.mockCountNumber, { backgroundColor: themeItem.colors.primary }]} />
                <View style={[styles.mockCountLabel, { backgroundColor: themeItem.colors.text.secondary }]} />
              </View>
            </View>

            {/* Mock Action Buttons */}
            <View style={styles.mockActions}>
              <View style={[styles.mockActionBtn, { backgroundColor: themeItem.colors.secondary }]} />
              <View style={[styles.mockActionBtn, { backgroundColor: themeItem.colors.accent }]} />
            </View>

            {/* Islamic Color Accent */}
            <View style={styles.mockIslamicAccent}>
              <View style={[styles.islamicDot, { backgroundColor: themeItem.colors.islamic.green }]} />
              <View style={[styles.islamicDot, { backgroundColor: themeItem.colors.islamic.gold }]} />
            </View>
          </LinearGradient>

          {/* Theme Description */}
          <View style={styles.previewFooter}>
            <Text style={[styles.previewDescription, { color: themeItem.colors.text.secondary }]}>
              {themeItem.description}
            </Text>
            
            {/* Color Palette */}
            <View style={styles.colorPalette}>
              <View style={[styles.colorSample, { backgroundColor: themeItem.colors.primary }]} />
              <View style={[styles.colorSample, { backgroundColor: themeItem.colors.secondary }]} />
              <View style={[styles.colorSample, { backgroundColor: themeItem.colors.accent }]} />
              <View style={[styles.colorSample, { backgroundColor: themeItem.colors.islamic.green }]} />
              <View style={[styles.colorSample, { backgroundColor: themeItem.colors.islamic.gold }]} />
            </View>
          </View>

          {/* Apply Button */}
          <TouchableOpacity
            style={[
              styles.applyButton,
              { 
                backgroundColor: themeItem.colors.primary,
                opacity: isCurrent ? 0.6 : 1
              }
            ]}
            onPress={() => updateSettings({ theme: themeItem.name as any })}
            disabled={isCurrent}
          >
            <Text style={[styles.applyButtonText, { color: themeItem.colors.text.onPrimary }]}>
              {isCurrent ? 'Currently Active' : 'Apply Theme'}
            </Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.background, colors.surface, colors.surfaceVariant]}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={[styles.headerIcon, { backgroundColor: colors.primary }]}>
              <Ionicons name="color-palette" size={24} color={colors.text.onPrimary} />
            </View>
            <View style={styles.headerText}>
              <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
                Theme Gallery
              </Text>
              <Text style={[styles.headerSubtitle, { color: colors.text.secondary }]}>
                Experience Islamic-inspired themes
              </Text>
            </View>
          </View>
        </View>

        {/* Themes List */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {availableThemes.map(renderThemePreview)}
          
          {/* Info Section */}
          <View style={[styles.infoBox, { backgroundColor: colors.card }]}>
            <View style={styles.infoHeader}>
              <Ionicons name="information-circle" size={20} color={colors.text.secondary} />
              <Text style={[styles.infoTitle, { color: colors.text.primary }]}>
                About These Themes
              </Text>
            </View>
            <Text style={[styles.infoText, { color: colors.text.secondary }]}>
              Each theme is carefully crafted with Islamic aesthetics in mind, ensuring accessibility 
              and spiritual harmony in your digital tasbeeh experience.
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 20,
  },
  themePreviewContainer: {
    marginBottom: 4,
  },
  previewCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  currentBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currentText: {
    fontSize: 12,
    fontWeight: '600',
  },
  mockApp: {
    height: 160,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  mockNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  mockNavItem: {
    width: 20,
    height: 4,
    borderRadius: 2,
    opacity: 0.8,
  },
  mockCounterArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  mockCounterDisplay: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  mockCountNumber: {
    width: 40,
    height: 20,
    borderRadius: 10,
    marginBottom: 4,
  },
  mockCountLabel: {
    width: 24,
    height: 8,
    borderRadius: 4,
    opacity: 0.7,
  },
  mockActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  mockActionBtn: {
    width: 40,
    height: 16,
    borderRadius: 8,
    opacity: 0.8,
  },
  mockIslamicAccent: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  islamicDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.9,
  },
  previewFooter: {
    padding: 16,
    paddingTop: 0,
  },
  previewDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  colorPalette: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  colorSample: {
    width: 20,
    height: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 1,
  },
  applyButton: {
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
}); 