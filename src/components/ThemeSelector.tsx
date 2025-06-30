/**
 * Theme Selector Component
 * Beautiful theme selection interface with previews
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme, getAvailableThemes, ThemeDefinition, ThemeName } from '../utils/theme';
import { useTasbeeh } from '../contexts/TasbeehContext';
import { getButtonA11yProps, announceToScreenReader } from '../utils/accessibility';

const { width } = Dimensions.get('window');

interface ThemeSelectorProps {
  visible: boolean;
  onClose: () => void;
}

export default function ThemeSelector({ visible, onClose }: ThemeSelectorProps) {
  const { colors, theme: currentTheme } = useAppTheme();
  const { settings, updateSettings } = useTasbeeh();
  const [selectedTheme, setSelectedTheme] = useState<ThemeName>(settings.theme as ThemeName);
  
  const availableThemes = getAvailableThemes();
  const autoTheme = {
    name: 'auto' as ThemeName,
    displayName: 'Auto',
    description: 'Follow system appearance',
    isDark: false,
    colors: colors, // Use current colors for preview
  };
  
  const allThemes = [autoTheme, ...availableThemes];

  const handleThemeSelect = (themeName: ThemeName) => {
    setSelectedTheme(themeName);
  };

  const handleSaveTheme = async () => {
    await updateSettings({ theme: selectedTheme });
    announceToScreenReader(`Theme changed to ${allThemes.find(t => t.name === selectedTheme)?.displayName}`);
    onClose();
  };

  const handleCancel = () => {
    setSelectedTheme(settings.theme as ThemeName);
    onClose();
  };

  const renderThemeCard = (themeItem: ThemeDefinition) => {
    const isSelected = selectedTheme === themeItem.name;
    const isCurrentTheme = currentTheme === themeItem.name;
    
    return (
      <TouchableOpacity
        key={themeItem.name}
        style={[
          styles.themeCard,
          {
            backgroundColor: themeItem.colors.surface,
            borderColor: isSelected ? themeItem.colors.primary : themeItem.colors.border,
            borderWidth: isSelected ? 3 : 1,
          }
        ]}
        onPress={() => handleThemeSelect(themeItem.name)}
        {...getButtonA11yProps(
          `Select ${themeItem.displayName} theme`,
          `${themeItem.displayName} theme. ${themeItem.description}. ${isCurrentTheme ? 'Currently active' : ''}`,
          false
        )}
      >
        {/* Theme Preview */}
        <View style={styles.themePreview}>
          <LinearGradient
            colors={[
              themeItem.colors.background,
              themeItem.colors.surface,
              themeItem.colors.surfaceVariant
            ]}
            style={styles.themeGradient}
          >
            {/* Mock app elements */}
            <View style={[styles.mockHeader, { backgroundColor: themeItem.colors.primary }]}>
              <View style={[styles.mockIcon, { backgroundColor: themeItem.colors.text.onPrimary }]} />
              <View style={[styles.mockTitle, { backgroundColor: themeItem.colors.text.onPrimary }]} />
            </View>
            
            <View style={styles.mockContent}>
              <View style={[styles.mockCounter, { backgroundColor: themeItem.colors.card }]}>
                <View style={[styles.mockCounterText, { backgroundColor: themeItem.colors.text.primary }]} />
                <View style={[styles.mockCounterNumber, { backgroundColor: themeItem.colors.primary }]} />
              </View>
              
              <View style={styles.mockButtons}>
                <View style={[styles.mockButton, { backgroundColor: themeItem.colors.secondary }]} />
                <View style={[styles.mockButton, { backgroundColor: themeItem.colors.accent }]} />
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Theme Info */}
        <View style={styles.themeInfo}>
          <View style={styles.themeHeader}>
            <Text style={[styles.themeName, { color: themeItem.colors.text.primary }]}>
              {themeItem.displayName}
            </Text>
            {isCurrentTheme && (
              <View style={[styles.currentBadge, { backgroundColor: themeItem.colors.primary }]}>
                <Text style={[styles.currentBadgeText, { color: themeItem.colors.text.onPrimary }]}>
                  Current
                </Text>
              </View>
            )}
          </View>
          
          <Text style={[styles.themeDescription, { color: themeItem.colors.text.secondary }]}>
            {themeItem.description}
          </Text>
          
          {/* Theme Colors */}
          <View style={styles.colorPreview}>
            <View style={[styles.colorDot, { backgroundColor: themeItem.colors.primary }]} />
            <View style={[styles.colorDot, { backgroundColor: themeItem.colors.secondary }]} />
            <View style={[styles.colorDot, { backgroundColor: themeItem.colors.accent }]} />
            {themeItem.name !== 'auto' && (
              <View style={[styles.colorDot, { backgroundColor: themeItem.colors.islamic.green }]} />
            )}
          </View>
        </View>

        {/* Selection Indicator */}
        {isSelected && (
          <View style={[styles.selectionIndicator, { backgroundColor: themeItem.colors.primary }]}>
            <Ionicons 
              name="checkmark" 
              size={20} 
              color={themeItem.colors.text.onPrimary} 
            />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <LinearGradient
        colors={[colors.background, colors.surface, colors.surfaceVariant]}
        style={styles.modalContainer}
      >
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <TouchableOpacity 
                style={[styles.headerButton, { backgroundColor: colors.surface }]}
                onPress={handleCancel}
                {...getButtonA11yProps('Cancel', 'Cancel theme selection', false)}
              >
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
              
              <View style={styles.headerTitle}>
                <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
                  Choose Theme
                </Text>
                <Text style={[styles.modalSubtitle, { color: colors.text.secondary }]}>
                  Select your preferred appearance
                </Text>
              </View>
              
              <TouchableOpacity 
                style={[
                  styles.headerButton, 
                  styles.saveButton,
                  { backgroundColor: colors.primary }
                ]}
                onPress={handleSaveTheme}
                {...getButtonA11yProps('Save', 'Save selected theme', false)}
              >
                <Ionicons name="checkmark" size={24} color={colors.text.onPrimary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Theme Grid */}
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.themesGrid}>
              {allThemes.map(renderThemeCard)}
            </View>
            
            {/* Additional Info */}
            <View style={[styles.infoSection, { backgroundColor: colors.card }]}>
              <View style={styles.infoHeader}>
                <Ionicons name="information-circle" size={24} color={colors.text.secondary} />
                <Text style={[styles.infoTitle, { color: colors.text.primary }]}>
                  About Themes
                </Text>
              </View>
              <Text style={[styles.infoText, { color: colors.text.secondary }]}>
                Choose a theme that reflects your spiritual journey. Each theme is designed with Islamic aesthetics and accessibility in mind.
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  safeArea: {
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
    justifyContent: 'space-between',
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  themesGrid: {
    gap: 16,
  },
  themeCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  themePreview: {
    height: 120,
    overflow: 'hidden',
  },
  themeGradient: {
    flex: 1,
    padding: 12,
  },
  mockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 8,
  },
  mockIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    opacity: 0.9,
  },
  mockTitle: {
    width: 60,
    height: 12,
    borderRadius: 6,
    marginLeft: 8,
    opacity: 0.9,
  },
  mockContent: {
    flex: 1,
  },
  mockCounter: {
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  mockCounterText: {
    width: 40,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
    opacity: 0.7,
  },
  mockCounterNumber: {
    width: 60,
    height: 20,
    borderRadius: 10,
    opacity: 0.9,
  },
  mockButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  mockButton: {
    width: 30,
    height: 12,
    borderRadius: 6,
    opacity: 0.8,
  },
  themeInfo: {
    padding: 16,
  },
  themeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  themeName: {
    fontSize: 18,
    fontWeight: '600',
  },
  currentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  currentBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  themeDescription: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  colorPreview: {
    flexDirection: 'row',
    gap: 8,
  },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  selectionIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  infoSection: {
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
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