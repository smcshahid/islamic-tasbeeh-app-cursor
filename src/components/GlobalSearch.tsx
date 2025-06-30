import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  FlatList,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useAppTheme } from '../utils/theme';
import { useTasbeeh } from '../contexts/TasbeehContext';
import { useGlobalAction } from '../contexts/GlobalActionContext';
import { COLORS, SearchResult, SearchCategory } from '../types';
import { 
  getButtonA11yProps, 
  getAccessibleColors,
  getFontScale,
  announceToScreenReader 
} from '../utils/accessibility';

const { width, height } = Dimensions.get('window');

interface GlobalSearchProps {
  visible: boolean;
  onClose: () => void;
}

export default function GlobalSearch({ visible, onClose }: GlobalSearchProps) {
  const { isDark } = useAppTheme();
  const { counters, settings, setCurrentCounter } = useTasbeeh();
  const { setPendingAction } = useGlobalAction();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const searchInputRef = useRef<TextInput>(null);
  
  const fontScale = getFontScale();
  const accessibleColors = getAccessibleColors(isDark ? 'dark' : 'light');

  // Focus search input when modal opens
  useEffect(() => {
    if (visible) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 300);
    } else {
      setSearchQuery('');
      setSelectedCategory(null);
    }
  }, [visible]);

  const searchCategories: SearchCategory[] = [
    { id: 'screens', name: 'Screens', icon: 'apps', color: COLORS.primary.blue },
    { id: 'counters', name: 'Counters', icon: 'calculator', color: COLORS.primary.green },
    { id: 'quran', name: 'Quran', icon: 'book', color: COLORS.primary.indigo },
    { id: 'prayers', name: 'Prayer Times', icon: 'time', color: COLORS.primary.purple },
    { id: 'settings', name: 'Settings', icon: 'settings', color: COLORS.primary.orange },
    { id: 'history', name: 'History', icon: 'library', color: COLORS.primary.teal },
    { id: 'features', name: 'Features', icon: 'star', color: COLORS.primary.emerald },
  ];

  const allSearchResults: SearchResult[] = useMemo(() => [
    // Screens
    {
      id: 'counter-screen',
      title: 'Counter',
      subtitle: 'Count dhikr and track sessions',
      category: 'screens',
      icon: 'calculator',
      screen: '/(tabs)/',
      keywords: ['counter', 'count', 'dhikr', 'tasbih', 'main', 'home'],
    },
    {
      id: 'prayer-times-screen',
      title: 'Prayer Times',
      subtitle: 'View Islamic prayer schedules',
      category: 'screens',
      icon: 'time',
      screen: '/(tabs)/prayer-times',
      keywords: ['prayer', 'times', 'salah', 'adhan', 'islamic'],
    },
    {
      id: 'quran-screen',
      title: 'Quran',
      subtitle: 'Read, listen, and study the Holy Quran',
      category: 'screens',
      icon: 'book',
      screen: '/(tabs)/quran',
      keywords: ['quran', 'holy', 'book', 'islam', 'read', 'recite', 'surah', 'verse'],
    },
    {
      id: 'history-screen',
      title: 'History',
      subtitle: 'View past sessions and achievements',
      category: 'screens',
      icon: 'library',
      screen: '/(tabs)/history',
      keywords: ['history', 'sessions', 'achievements', 'stats', 'records'],
    },
    {
      id: 'settings-screen',
      title: 'Settings',
      subtitle: 'Configure app preferences',
      category: 'screens',
      icon: 'settings',
      screen: '/(tabs)/settings',
      keywords: ['settings', 'preferences', 'config', 'options'],
    },
    {
      id: 'auth-screen',
      title: 'Authentication',
      subtitle: 'Sign in or create account',
      category: 'screens',
      icon: 'log-in',
      screen: '/auth',
      keywords: ['auth', 'authentication', 'sign', 'in', 'up', 'login', 'register'],
    },

    // Counter Features
    {
      id: 'new-counter',
      title: 'Create New Counter',
      subtitle: 'Add a new dhikr counter',
      category: 'counters',
      icon: 'add-circle',
      screen: '/(tabs)/',
      action: () => {
        setPendingAction({
          type: 'createNewCounter',
          screen: '/(tabs)/',
        });
        announceToScreenReader('Opening new counter creation');
      },
      keywords: ['new', 'create', 'counter', 'add', 'dhikr'],
    },
    {
      id: 'reset-counter',
      title: 'Reset Counter',
      subtitle: 'Reset current counter to zero',
      category: 'counters',
      icon: 'refresh',
      screen: '/(tabs)/',
      action: () => {
        setPendingAction({
          type: 'resetCounter',
          screen: '/(tabs)/',
        });
        announceToScreenReader('Opening reset confirmation');
      },
      keywords: ['reset', 'clear', 'zero', 'restart'],
    },
    {
      id: 'set-target',
      title: 'Set Counter Target',
      subtitle: 'Set a goal for your counter',
      category: 'counters',
      icon: 'flag',
      screen: '/(tabs)/',
      action: () => {
        setPendingAction({
          type: 'setCounterTarget',
          screen: '/(tabs)/',
        });
        announceToScreenReader('Opening target setting');
      },
      keywords: ['target', 'goal', 'aim', 'objective'],
    },

    // Prayer Features
    {
      id: 'prayer-settings',
      title: 'Prayer Settings',
      subtitle: 'Configure prayer time preferences',
      category: 'prayers',
      icon: 'settings',
      screen: '/(tabs)/prayer-times',
      action: () => {
        setPendingAction({
          type: 'openPrayerSettings',
          screen: '/(tabs)/prayer-times',
          data: { initialTab: 'general' },
        });
        announceToScreenReader('Opening prayer settings');
      },
      keywords: ['prayer', 'settings', 'adhan', 'notification', 'audio'],
    },
    {
      id: 'adjust-prayer-times',
      title: 'Adjust Prayer Times',
      subtitle: 'Modify prayer time calculations',
      category: 'prayers',
      icon: 'time',
      screen: '/(tabs)/prayer-times',
      action: () => {
        setPendingAction({
          type: 'adjustPrayerTimes',
          screen: '/(tabs)/prayer-times',
          data: { prayer: 'fajr' },
        });
        announceToScreenReader('Opening prayer time adjustments');
      },
      keywords: ['adjust', 'modify', 'prayer', 'times', 'offset'],
    },
    {
      id: 'prayer-notifications',
      title: 'Prayer Notifications',
      subtitle: 'Enable/disable prayer alerts',
      category: 'prayers',
      icon: 'notifications',
      screen: '/(tabs)/prayer-times',
      action: () => {
        setPendingAction({
          type: 'openPrayerNotifications',
          screen: '/(tabs)/prayer-times',
          data: { initialTab: 'notifications' },
        });
        announceToScreenReader('Opening prayer notifications');
      },
      keywords: ['notification', 'alert', 'prayer', 'reminder'],
    },
    {
      id: 'calculation-method',
      title: 'Calculation Method',
      subtitle: 'Select prayer time calculation method',
      category: 'prayers',
      icon: 'calculator',
      screen: '/(tabs)/prayer-times',
      action: () => {
        setPendingAction({
          type: 'openCalculationMethod',
          screen: '/(tabs)/prayer-times',
          data: { initialTab: 'general', showMethodPicker: true },
        });
        announceToScreenReader('Opening calculation method selection');
      },
      keywords: ['calculation', 'method', 'prayer', 'time', 'islamic', 'algorithm'],
    },

    // Quran Features
    {
      id: 'browse-surahs',
      title: 'Browse Surahs',
      subtitle: 'Navigate through all 114 Surahs',
      category: 'quran',
      icon: 'list',
      screen: '/(tabs)/quran',
      action: () => {
        setPendingAction({
          type: 'openSurahList',
          screen: '/(tabs)/quran',
        });
        announceToScreenReader('Opening Surah list');
      },
      keywords: ['surah', 'browse', 'list', 'navigate', 'chapter'],
    },
    {
      id: 'devout-reciter',
      title: 'Devout Reciter Mode',
      subtitle: 'Clean interface for focused recitation',
      category: 'quran',
      icon: 'book',
      screen: '/(tabs)/quran',
      keywords: ['reciter', 'recitation', 'reading', 'clean', 'focus', 'tajweed'],
    },
    {
      id: 'knowledge-seeker',
      title: 'Knowledge Seeker Mode',
      subtitle: 'Tafsir, translations, and detailed study',
      category: 'quran',
      icon: 'school',
      screen: '/(tabs)/quran',
      keywords: ['knowledge', 'tafsir', 'translation', 'study', 'commentary', 'meaning'],
    },
    {
      id: 'memorizer-mode',
      title: 'Memorizer Mode',
      subtitle: 'Tools for Quran memorization',
      category: 'quran',
      icon: 'brain',
      screen: '/(tabs)/quran',
      keywords: ['memorize', 'memorization', 'hafiz', 'hafiza', 'repeat', 'test'],
    },
    {
      id: 'audio-recitation',
      title: 'Audio Recitation',
      subtitle: 'Listen to beautiful Quran recitations',
      category: 'quran',
      icon: 'headset',
      screen: '/(tabs)/quran',
      keywords: ['audio', 'recitation', 'listen', 'qari', 'sound', 'play'],
    },
    {
      id: 'quran-search',
      title: 'Search Quran',
      subtitle: 'Find verses, topics, or words',
      category: 'quran',
      icon: 'search',
      screen: '/(tabs)/quran',
      action: () => {
        setPendingAction({
          type: 'openQuranSearch',
          screen: '/(tabs)/quran',
        });
        announceToScreenReader('Opening Quran search');
      },
      keywords: ['search', 'find', 'verse', 'topic', 'word', 'ayah'],
    },
    {
      id: 'quran-bookmarks',
      title: 'Quran Bookmarks',
      subtitle: 'Access your saved verses',
      category: 'quran',
      icon: 'bookmark',
      screen: '/(tabs)/quran',
      action: () => {
        setPendingAction({
          type: 'openQuranBookmarks',
          screen: '/(tabs)/quran',
        });
        announceToScreenReader('Opening Quran bookmarks');
      },
      keywords: ['bookmark', 'saved', 'verse', 'favorite', 'mark'],
    },
    {
      id: 'reading-progress',
      title: 'Reading Progress',
      subtitle: 'Track your Quran reading journey',
      category: 'quran',
      icon: 'stats-chart',
      screen: '/(tabs)/quran',
      keywords: ['progress', 'reading', 'journey', 'track', 'statistics'],
    },
    {
      id: 'quran-translations',
      title: 'Translations',
      subtitle: 'Multiple trusted Quran translations',
      category: 'quran',
      icon: 'language',
      screen: '/(tabs)/quran',
      keywords: ['translation', 'english', 'meaning', 'sahih', 'pickthall'],
    },
    {
      id: 'continue-reading',
      title: 'Continue Reading',
      subtitle: 'Resume from where you left off',
      category: 'quran',
      icon: 'play-circle',
      screen: '/(tabs)/quran',
      action: () => {
        setPendingAction({
          type: 'continueReading',
          screen: '/(tabs)/quran',
        });
        announceToScreenReader('Continuing from last read position');
      },
      keywords: ['continue', 'resume', 'last', 'position', 'reading'],
    },
    {
      id: 'quran-navigation',
      title: 'Navigation',
      subtitle: 'Navigate by Surah, Juz, or Page',
      category: 'quran',
      icon: 'compass',
      screen: '/(tabs)/quran',
      keywords: ['navigation', 'navigate', 'surah', 'juz', 'page', 'chapter', 'para'],
    },

    // Settings Features
    {
      id: 'theme-setting',
      title: 'Theme',
      subtitle: `Current: ${settings.theme === 'auto' ? 'System' : settings.theme === 'dark' ? 'Dark' : 'Light'}`,
      category: 'settings',
      icon: 'color-palette',
      screen: '/(tabs)/settings',
      keywords: ['theme', 'dark', 'light', 'appearance', 'color'],
    },
    {
      id: 'language-setting',
      title: 'Language',
      subtitle: `Current: ${settings.language === 'en' ? 'English' : 'Arabic'}`,
      category: 'settings',
      icon: 'language',
      screen: '/(tabs)/settings',
      keywords: ['language', 'english', 'arabic', 'locale'],
    },
    {
      id: 'haptic-setting',
      title: 'Haptic Feedback',
      subtitle: `${settings.hapticFeedback ? 'Enabled' : 'Disabled'}`,
      category: 'settings',
      icon: 'phone-portrait',
      screen: '/(tabs)/settings',
      keywords: ['haptic', 'vibration', 'feedback', 'touch'],
    },
    {
      id: 'notifications-setting',
      title: 'Notifications',
      subtitle: `${settings.notifications ? 'Enabled' : 'Disabled'}`,
      category: 'settings',
      icon: 'notifications',
      screen: '/(tabs)/settings',
      keywords: ['notifications', 'alerts', 'achievements'],
    },
    {
      id: 'account-setting',
      title: 'Account',
      subtitle: 'Sign in or manage account',
      category: 'settings',
      icon: 'person',
      screen: '/(tabs)/settings',
      keywords: ['account', 'sign in', 'login', 'user', 'sync'],
    },
    {
      id: 'data-export',
      title: 'Export Data',
      subtitle: 'Backup your counters and sessions',
      category: 'settings',
      icon: 'download',
      screen: '/(tabs)/settings',
      keywords: ['export', 'backup', 'data', 'save'],
    },
    {
      id: 'data-import',
      title: 'Import Data',
      subtitle: 'Restore from backup file',
      category: 'settings',
      icon: 'cloud-upload',
      screen: '/(tabs)/settings',
      keywords: ['import', 'restore', 'data', 'backup'],
    },
    {
      id: 'sign-in',
      title: 'Sign In',
      subtitle: 'Access your account and sync data',
      category: 'settings',
      icon: 'log-in',
      screen: '/auth',
      keywords: ['sign', 'in', 'login', 'account', 'auth', 'sync'],
    },

    // History Features
    {
      id: 'session-history',
      title: 'Session History',
      subtitle: 'View all completed sessions',
      category: 'history',
      icon: 'time',
      screen: '/(tabs)/history',
      action: () => {
        setPendingAction({
          type: 'openSessionHistory',
          screen: '/(tabs)/history',
          data: { initialView: 'history' },
        });
        announceToScreenReader('Opening session history');
      },
      keywords: ['sessions', 'history', 'completed', 'past'],
    },
    {
      id: 'achievements',
      title: 'Achievements',
      subtitle: 'View unlocked badges and progress',
      category: 'history',
      icon: 'trophy',
      screen: '/(tabs)/history',
      action: () => {
        setPendingAction({
          type: 'openAchievements',
          screen: '/(tabs)/history',
          data: { initialView: 'achievements' },
        });
        announceToScreenReader('Opening achievements');
      },
      keywords: ['achievements', 'badges', 'trophies', 'rewards'],
    },
    {
      id: 'statistics',
      title: 'Statistics',
      subtitle: 'View detailed usage stats',
      category: 'history',
      icon: 'stats-chart',
      screen: '/(tabs)/history',
      action: () => {
        setPendingAction({
          type: 'openStatistics',
          screen: '/(tabs)/history',
          data: { initialView: 'history' },
        });
        announceToScreenReader('Opening statistics');
      },
      keywords: ['statistics', 'stats', 'data', 'analytics'],
    },

    // Counter Management (only features with actual modals/actions)
    {
      id: 'switch-counter',
      title: 'Switch Counter',
      subtitle: 'Select different counter from list',
      category: 'counters',
      icon: 'swap-horizontal',
      screen: '/(tabs)/',
      action: () => {
        setPendingAction({
          type: 'openCounterSelector',
          screen: '/(tabs)/',
        });
        announceToScreenReader('Opening counter selection');
      },
      keywords: ['switch', 'change', 'counter', 'select', 'choose'],
    },

    // Basic Features (only existing UI elements)
    {
      id: 'session-timer',
      title: 'Session Timer',
      subtitle: 'Automatic session time tracking',
      category: 'features',
      icon: 'stopwatch',
      screen: '/(tabs)/',
      keywords: ['session', 'timer', 'time', 'tracking', 'automatic'],
    },

    // Dynamic counter results
    ...counters.map(counter => ({
      id: `counter-${counter.id}`,
      title: counter.name,
      subtitle: `Count: ${counter.count.toLocaleString()}${counter.target ? ` / ${counter.target.toLocaleString()}` : ''}`,
      category: 'counters',
      icon: 'calculator',
      screen: '/(tabs)/',
      action: () => {
        // Switch to the specific counter
        setCurrentCounter(counter);
        announceToScreenReader(`Switching to ${counter.name} counter`);
      },
      keywords: [counter.name.toLowerCase(), 'counter', 'dhikr'],
    })),
  ], [counters, settings]);

  const filteredResults = useMemo(() => {
    let results = allSearchResults;

    // Apply category filter
    if (selectedCategory) {
      results = results.filter(result => result.category === selectedCategory);
    }

    // Apply search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      results = results.filter(result => 
        result.title.toLowerCase().includes(query) ||
        result.subtitle?.toLowerCase().includes(query) ||
        result.keywords.some(keyword => keyword.includes(query))
      );
    }

    return results;
  }, [allSearchResults, searchQuery, selectedCategory]);

  const handleResultPress = (result: SearchResult) => {
    if (result.action) {
      result.action();
    }
    
    if (result.screen) {
      router.push(result.screen as any);
    }
    
    announceToScreenReader(`Selected ${result.title}`);
    onClose();
  };

  const handleClose = () => {
    setSearchQuery('');
    setSelectedCategory(null);
    onClose();
  };

  const renderSearchResult = ({ item }: { item: SearchResult }) => {
    const category = searchCategories.find(cat => cat.id === item.category);
    
    return (
      <TouchableOpacity
        style={[styles.resultItem, { backgroundColor: accessibleColors.surface }]}
        onPress={() => handleResultPress(item)}
        {...getButtonA11yProps(
          item.title,
          `${item.title}${item.subtitle ? `. ${item.subtitle}` : ''}. From ${category?.name || item.category} category.`,
          false
        )}
      >
        <View style={[styles.resultIcon, { backgroundColor: category?.color || COLORS.neutral.gray400 }]}>
          <Ionicons name={item.icon as any} size={20} color={COLORS.neutral.white} />
        </View>
        
        <View style={styles.resultContent}>
          <Text style={[styles.resultTitle, { color: accessibleColors.primaryText }]}>
            {item.title}
          </Text>
          {item.subtitle && (
            <Text style={[styles.resultSubtitle, { color: accessibleColors.secondaryText }]}>
              {item.subtitle}
            </Text>
          )}
        </View>
        
        <View style={styles.resultCategory}>
          <Text style={[styles.categoryText, { color: category?.color || COLORS.neutral.gray500 }]}>
            {category?.name || item.category}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderCategoryFilter = ({ item }: { item: SearchCategory }) => {
    const isSelected = selectedCategory === item.id;
    
    return (
      <TouchableOpacity
        style={[
          styles.categoryChip,
          { 
            backgroundColor: isSelected ? item.color : accessibleColors.surface,
            borderColor: item.color,
            borderWidth: isSelected ? 0 : 1,
          }
        ]}
        onPress={() => setSelectedCategory(isSelected ? null : item.id)}
        {...getButtonA11yProps(
          item.name,
          `Filter by ${item.name}. ${isSelected ? 'Currently selected' : 'Tap to select'}`,
          false
        )}
      >
        <Ionicons 
          name={item.icon as any} 
          size={16} 
          color={isSelected ? COLORS.neutral.white : item.color} 
        />
        <Text style={[
          styles.categoryChipText,
          { color: isSelected ? COLORS.neutral.white : item.color }
        ]}>
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <LinearGradient
          colors={isDark 
            ? [COLORS.neutral.gray900, COLORS.neutral.gray800] 
            : [COLORS.neutral.white, COLORS.neutral.gray50]
          }
          style={styles.content}
        >
          {/* Header */}
          <BlurView intensity={80} style={styles.header}>
            <View style={styles.headerContent}>
              <View style={styles.searchContainer}>
                <Ionicons 
                  name="search" 
                  size={20} 
                  color={accessibleColors.secondaryText} 
                  style={styles.searchIcon}
                />
                <TextInput
                  ref={searchInputRef}
                  style={[
                    styles.searchInput,
                    { 
                      color: accessibleColors.primaryText,
                      fontSize: 16 * fontScale
                    }
                  ]}
                  placeholder="Search screens, settings, features..."
                  placeholderTextColor={accessibleColors.secondaryText}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  returnKeyType="search"
                  accessibilityLabel="Search input"
                  accessibilityHint="Type to search for screens, settings, counter actions, prayer features, or history"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    style={styles.clearButton}
                    onPress={() => setSearchQuery('')}
                    {...getButtonA11yProps('Clear search', 'Clear search input', false)}
                  >
                    <Ionicons name="close-circle" size={20} color={accessibleColors.secondaryText} />
                  </TouchableOpacity>
                )}
              </View>
              
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleClose}
                {...getButtonA11yProps('Close search', 'Close global search', false)}
              >
                <Ionicons name="close" size={24} color={accessibleColors.primaryText} />
              </TouchableOpacity>
            </View>
          </BlurView>

          {/* Category Filters */}
          <View style={styles.categoriesContainer}>
            <FlatList
              data={searchCategories}
              renderItem={renderCategoryFilter}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesContent}
              accessibilityLabel="Category filters"
            />
          </View>

          {/* Search Results */}
          <View style={styles.resultsContainer}>
            {filteredResults.length > 0 ? (
              <>
                <Text style={[
                  styles.resultsHeader,
                  { color: accessibleColors.secondaryText }
                ]}>
                  {filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''}
                  {selectedCategory && ` in ${searchCategories.find(cat => cat.id === selectedCategory)?.name}`}
                </Text>
                
                <FlatList
                  data={filteredResults}
                  renderItem={renderSearchResult}
                  keyExtractor={(item) => item.id}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.resultsContent}
                  accessibilityLabel="Search results"
                />
              </>
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons 
                  name="search" 
                  size={48} 
                  color={accessibleColors.secondaryText} 
                  style={styles.emptyIcon}
                />
                <Text style={[styles.emptyTitle, { color: accessibleColors.primaryText }]}>
                  {searchQuery.trim() ? 'No results found' : 'Start typing to search'}
                </Text>
                <Text style={[styles.emptySubtitle, { color: accessibleColors.secondaryText }]}>
                  {searchQuery.trim() 
                    ? 'Try different keywords or browse categories' 
                    : 'Search for features, screens, settings, and more'
                  }
                </Text>
              </View>
            )}
          </View>
        </LinearGradient>
      </KeyboardAvoidingView>
    </Modal>
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
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
  },
  clearButton: {
    padding: 4,
  },
  closeButton: {
    padding: 4,
  },
  categoriesContainer: {
    paddingVertical: 16,
  },
  categoriesContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  resultsHeader: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
  },
  resultsContent: {
    paddingBottom: 20,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    gap: 12,
  },
  resultIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultContent: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  resultSubtitle: {
    fontSize: 14,
    opacity: 0.8,
  },
  resultCategory: {
    alignItems: 'flex-end',
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
  },
}); 