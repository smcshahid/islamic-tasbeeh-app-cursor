import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  FlatList,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../src/utils/theme';
import { QuranProvider, useQuranContext } from '../../src/contexts/QuranContext';
import { accessibilityManager, getButtonA11yProps } from '../../src/utils/accessibility';
import { secureLogger } from '../../src/utils/secureLogger';
import QuranSurahList from '../../src/components/QuranSurahList';
import QuranReader from '../../src/components/QuranReader';
import QuranAudioPlayer from '../../src/components/QuranAudioPlayer';
import QuranMemorizationTools from '../../src/components/QuranMemorizationTools';
import QuranAdvancedSearch from '../../src/components/QuranAdvancedSearch';
import QuranJuzNavigation from '../../src/components/QuranJuzNavigation';
import QuranPageNavigation from '../../src/components/QuranPageNavigation';
import QuranBookmarkManager from '../../src/components/QuranBookmarkManager';
import { QuranSurah } from '../../src/types';

interface QuickActionProps {
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  color: string;
}

const QuickAction: React.FC<QuickActionProps> = ({ icon, title, subtitle, onPress, color }) => {
  const { colors } = useAppTheme();
  
  return (
    <TouchableOpacity
      style={[styles.quickAction, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={onPress}
      {...getButtonA11yProps(title, subtitle, false)}
    >
      <View style={[styles.quickActionIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon as any} size={24} color={color} />
      </View>
      <View style={styles.quickActionText}>
        <Text style={[styles.quickActionTitle, { color: colors.text.primary }]}>{title}</Text>
        <Text style={[styles.quickActionSubtitle, { color: colors.text.secondary }]}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
    </TouchableOpacity>
  );
};

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  onPress: () => void;
  badge?: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, onPress, badge }) => {
  const { colors } = useAppTheme();
  
  return (
    <TouchableOpacity
      style={[styles.featureCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={onPress}
      {...getButtonA11yProps(title, description, false)}
    >
      <View style={styles.featureCardHeader}>
        <View style={[styles.featureIcon, { backgroundColor: colors.primary + '20' }]}>
          <Ionicons name={icon as any} size={28} color={colors.primary} />
        </View>
        {badge && (
          <View style={[styles.badge, { backgroundColor: colors.accent }]}>
            <Text style={[styles.badgeText, { color: colors.text.onAccent }]}>{badge}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.featureTitle, { color: colors.text.primary }]}>{title}</Text>
      <Text style={[styles.featureDescription, { color: colors.text.secondary }]}>{description}</Text>
    </TouchableOpacity>
  );
};

const QuranDashboard: React.FC = () => {
  const { colors } = useAppTheme();
  const {
    lastReadPosition,
    readingPlans,
    memorationProgress,
    isLoading,
    navigateToLastRead,
    startReadingSession,
  } = useQuranContext();

  const [showPersonaModal, setShowPersonaModal] = useState(false);
  const [showSurahList, setShowSurahList] = useState(false);
  const [showReader, setShowReader] = useState(false);
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  const [showPlaylistPlayer, setShowPlaylistPlayer] = useState(false);
  const [showMemorizationTools, setShowMemorizationTools] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [showJuzNavigation, setShowJuzNavigation] = useState(false);
  const [showPageNavigation, setShowPageNavigation] = useState(false);
  const [showBookmarkManager, setShowBookmarkManager] = useState(false);
  const [readerMode, setReaderMode] = useState<'reciter' | 'seeker' | 'memorizer' | 'auditory' | 'beginner' | 'normal'>('normal');
  const [selectedSurah, setSelectedSurah] = useState(1);
  const [selectedVerse, setSelectedVerse] = useState(1);
  const [selectedJuzData, setSelectedJuzData] = useState<any>(null);
  const [selectedPageData, setSelectedPageData] = useState<any>(null);
  const [highlightBookmark, setHighlightBookmark] = useState<{ surah: number; verse: number } | null>(null);

  const quickActions = [
    {
      icon: 'book',
      title: 'Continue Reading',
      subtitle: lastReadPosition 
        ? `Surah ${lastReadPosition.surah}, Verse ${lastReadPosition.verse}` 
        : 'Start your Quran journey',
      onPress: () => {
        if (lastReadPosition) {
          setSelectedSurah(lastReadPosition.surah);
          setSelectedVerse(lastReadPosition.verse);
        } else {
          setSelectedSurah(1);
          setSelectedVerse(1);
        }
        setReaderMode('normal');
        setShowReader(true);
      },
      color: colors.primary,
    },
    {
      icon: 'search',
      title: 'Search Quran',
      subtitle: 'Find verses, topics, or words',
      onPress: () => setShowAdvancedSearch(true),
      color: colors.secondary,
    },
    {
      icon: 'bookmark',
      title: 'My Bookmarks',
      subtitle: 'Access your saved verses',
      onPress: () => setShowBookmarkManager(true),
      color: colors.accent,
    },
    {
      icon: 'play-circle',
      title: 'Audio Recitation',
      subtitle: 'Listen to beautiful recitations',
      onPress: () => {
        if (lastReadPosition) {
          setSelectedSurah(lastReadPosition.surah);
          setSelectedVerse(lastReadPosition.verse);
        } else {
          setSelectedSurah(1);
          setSelectedVerse(1);
        }
        setShowAudioPlayer(true);
      },
      color: colors.islamic.navy,
    },
    {
      icon: 'musical-notes',
      title: 'Surah Playlist',
      subtitle: 'Continuous surah playback',
      onPress: () => {
        if (lastReadPosition) {
          setSelectedSurah(lastReadPosition.surah);
          setSelectedVerse(lastReadPosition.verse);
        } else {
          setSelectedSurah(1);
          setSelectedVerse(1);
        }
        setShowPlaylistPlayer(true);
      },
      color: colors.islamic.green,
    },
  ];

  const personaFeatures = [
    {
      icon: 'book',
      title: 'Devout Reciter',
      description: 'Clean reading interface with Tajweed rules and distraction-free mode',
      onPress: () => {
        setReaderMode('reciter');
        setSelectedSurah(lastReadPosition?.surah || 1);
        setSelectedVerse(lastReadPosition?.verse || 1);
        setShowReader(true);
        setShowPersonaModal(false);
      },
    },
    {
      icon: 'school',
      title: 'Knowledge Seeker',
      description: 'Tafsir, word-by-word analysis, and detailed commentary',
      onPress: () => {
        setReaderMode('seeker');
        setSelectedSurah(lastReadPosition?.surah || 1);
        setSelectedVerse(lastReadPosition?.verse || 1);
        setShowAdvancedSearch(true);
        setShowPersonaModal(false);
      },
      badge: 'Popular',
    },
    {
      icon: 'fitness',
      title: 'Memorizer (Hafiz)',
      description: 'Specialized tools for memorization, testing, and progress tracking',
      onPress: () => {
        setSelectedSurah(lastReadPosition?.surah || 1);
        setSelectedVerse(lastReadPosition?.verse || 1);
        setShowMemorizationTools(true);
        setShowPersonaModal(false);
      },
    },
    {
      icon: 'headset',
      title: 'Auditory Learner',
      description: 'High-quality audio with background playback and sleep timer',
      onPress: () => {
        setReaderMode('auditory');
        setSelectedSurah(lastReadPosition?.surah || 1);
        setSelectedVerse(lastReadPosition?.verse || 1);
        setShowAudioPlayer(true);
        setShowPersonaModal(false);
      },
    },
    {
      icon: 'star',
      title: 'Beginner',
      description: 'Guided learning with transliteration and interactive lessons',
      onPress: () => {
        setReaderMode('beginner');
        setSelectedSurah(lastReadPosition?.surah || 1);
        setSelectedVerse(lastReadPosition?.verse || 1);
        setShowReader(true);
        setShowPersonaModal(false);
      },
    },
    {
      icon: 'happy',
      title: 'Young Learner',
      description: 'Engaging stories and gamified learning for children',
      onPress: () => Alert.alert('Kids Mode', 'Special children\'s interface coming soon!'),
      badge: 'New',
    },
  ];

  const currentPlan = readingPlans.find(plan => plan.isActive);
  const totalMemorized = memorationProgress.filter(p => p.status === 'mastered').length;

  useEffect(() => {
    secureLogger.info('Quran screen loaded', { 
      hasLastRead: !!lastReadPosition,
      activePlans: readingPlans.filter(p => p.isActive).length 
    });
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
            Loading Quran...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={[styles.welcomeTitle, { color: colors.text.primary }]}>
            Welcome to the Holy Quran
          </Text>
          <Text style={[styles.welcomeSubtitle, { color: colors.text.secondary }]}>
            Choose your reading experience
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Quick Actions</Text>
          {quickActions.map((action, index) => (
            <QuickAction key={index} {...action} />
          ))}
        </View>

        {/* Reading Progress */}
        {(currentPlan || totalMemorized > 0) && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Your Progress</Text>
            <View style={[styles.progressCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {currentPlan && (
                <View style={styles.progressItem}>
                  <Ionicons name="calendar" size={20} color={colors.primary} />
                  <View style={styles.progressText}>
                    <Text style={[styles.progressTitle, { color: colors.text.primary }]}>
                      {currentPlan.name}
                    </Text>
                    <Text style={[styles.progressSubtitle, { color: colors.text.secondary }]}>
                      Day {currentPlan.progress.completedDays} of {currentPlan.duration}
                    </Text>
                  </View>
                </View>
              )}
              
              {totalMemorized > 0 && (
                <View style={styles.progressItem}>
                  <Ionicons name="trophy" size={20} color={colors.accent} />
                  <View style={styles.progressText}>
                    <Text style={[styles.progressTitle, { color: colors.text.primary }]}>
                      Memorized Verses
                    </Text>
                    <Text style={[styles.progressSubtitle, { color: colors.text.secondary }]}>
                      {totalMemorized} verses mastered
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Persona-Based Features */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Personalized Features
            </Text>
            <TouchableOpacity
              onPress={() => setShowPersonaModal(true)}
              {...getButtonA11yProps('View all personas', 'See all available reading modes', false)}
            >
              <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.featuresGrid}>
            {personaFeatures.slice(0, 4).map((feature, index) => (
              <FeatureCard key={index} {...feature} />
            ))}
          </View>
        </View>

        {/* Navigation */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Navigation</Text>
          <View style={styles.navigationButtons}>
            <TouchableOpacity
              style={[styles.navButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowSurahList(true)}
              {...getButtonA11yProps('Browse by Surah', 'Navigate through all 114 Surahs', false)}
            >
              <Ionicons name="list" size={24} color={colors.text.onPrimary} />
              <Text style={[styles.navButtonText, { color: colors.text.onPrimary }]}>
                By Surah
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.navButton, { backgroundColor: colors.secondary }]}
              onPress={() => setShowJuzNavigation(true)}
              {...getButtonA11yProps('Browse by Juz', 'Navigate through 30 Juz (Parts)', false)}
            >
              <Ionicons name="layers" size={24} color={colors.text.onSecondary} />
              <Text style={[styles.navButtonText, { color: colors.text.onSecondary }]}>
                By Juz
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navButton, { backgroundColor: colors.accent }]}
              onPress={() => setShowPageNavigation(true)}
              {...getButtonA11yProps('Browse by Page', 'Navigate through Quran pages', false)}
            >
              <Ionicons name="document" size={24} color={colors.text.onAccent} />
              <Text style={[styles.navButtonText, { color: colors.text.onAccent }]}>
                By Page
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Persona Modal */}
      <Modal
        visible={showPersonaModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPersonaModal(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
              Choose Your Reading Style
            </Text>
            <TouchableOpacity
              onPress={() => setShowPersonaModal(false)}
              {...getButtonA11yProps('Close', 'Close persona selection', false)}
            >
              <Ionicons name="close" size={24} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <Text style={[styles.modalDescription, { color: colors.text.secondary }]}>
              Select the mode that best matches how you want to engage with the Quran today.
            </Text>
            
            <View style={styles.modalFeaturesGrid}>
              {personaFeatures.map((feature, index) => (
                <FeatureCard key={index} {...feature} />
              ))}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Surah List Modal */}
      <QuranSurahList
        visible={showSurahList}
        onClose={() => setShowSurahList(false)}
        onSurahSelect={(surah: QuranSurah) => {
          secureLogger.info('Surah selected from list', { surahId: surah.id });
          setSelectedSurah(surah.id);
          setSelectedVerse(1);
          setReaderMode('normal');
          // Clear navigation data
          setSelectedJuzData(null);
          setSelectedPageData(null);
          setHighlightBookmark(null);
          setShowSurahList(false);
          setShowReader(true);
        }}
        mode="detailed"
        showMemorizationProgress={true}
        showReadingProgress={true}
      />

      {/* Quran Reader */}
      <QuranReader
        visible={showReader}
        onClose={() => {
          setShowReader(false);
          setHighlightBookmark(null);
        }}
        initialSurah={selectedSurah}
        initialVerse={selectedVerse}
        mode={readerMode}
        juzData={selectedJuzData}
        pageData={selectedPageData}
        highlightBookmark={highlightBookmark}
      />

      {/* Quran Audio Player */}
      <QuranAudioPlayer
        visible={showAudioPlayer}
        onClose={() => setShowAudioPlayer(false)}
        surahNumber={selectedSurah}
        verseNumber={selectedVerse}
        autoPlay={true}
      />

      {/* Quran Playlist Player */}
      <QuranAudioPlayer
        visible={showPlaylistPlayer}
        onClose={() => setShowPlaylistPlayer(false)}
        surahNumber={selectedSurah}
        verseNumber={selectedVerse}
        autoPlay={true}
        playlistMode={true}
      />

      {/* Quran Memorization Tools */}
      <QuranMemorizationTools
        visible={showMemorizationTools}
        onClose={() => setShowMemorizationTools(false)}
        surahNumber={selectedSurah}
        verseNumber={selectedVerse}
      />

      {/* Quran Advanced Search */}
      <QuranAdvancedSearch
        visible={showAdvancedSearch}
        onClose={() => setShowAdvancedSearch(false)}
        onVerseSelect={(surah, verse) => {
          setSelectedSurah(surah);
          setSelectedVerse(verse);
          setReaderMode('seeker');
          setShowAdvancedSearch(false);
          setShowReader(true);
        }}
      />

      {/* Juz Navigation */}
      <QuranJuzNavigation
        visible={showJuzNavigation}
        onClose={() => setShowJuzNavigation(false)}
        onJuzSelect={(juzData) => {
          secureLogger.info('Juz selected from navigation', juzData);
          
          // Set Juz mode and data
          setReaderMode('juz');
          setSelectedJuzData(juzData);
          setSelectedPageData(null);
          setHighlightBookmark(null);
          
          setShowJuzNavigation(false);
          setShowReader(true);
        }}
      />

      {/* Page Navigation */}
      <QuranPageNavigation
        visible={showPageNavigation}
        onClose={() => setShowPageNavigation(false)}
        onPageSelect={(pageData) => {
          secureLogger.info('Page selected from navigation', pageData);
          
          // Set Page mode and data
          setReaderMode('page');
          setSelectedPageData(pageData);
          setSelectedJuzData(null);
          setHighlightBookmark(null);
          
          setShowPageNavigation(false);
          setShowReader(true);
        }}
      />

      {/* Bookmark Manager */}
      <QuranBookmarkManager
        visible={showBookmarkManager}
        onClose={() => setShowBookmarkManager(false)}
        onBookmarkSelect={(surah, verse) => {
          secureLogger.info('Bookmark selected', { surah, verse });
          
          // Set highlight for the bookmarked verse
          setHighlightBookmark({ surah, verse });
          setSelectedSurah(surah);
          setSelectedVerse(verse);
          setReaderMode('normal');
          
          // Clear other navigation modes
          setSelectedJuzData(null);
          setSelectedPageData(null);
          
          setShowBookmarkManager(false);
          setShowReader(true);
        }}
      />
    </SafeAreaView>
  );
};

const QuranScreen: React.FC = () => {
  return (
    <QuranProvider>
      <QuranDashboard />
    </QuranProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  welcomeSection: {
    marginBottom: 24,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 16,
    fontWeight: '500',
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  quickActionText: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  quickActionSubtitle: {
    fontSize: 14,
  },
  progressCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  progressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressText: {
    marginLeft: 12,
    flex: 1,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  progressSubtitle: {
    fontSize: 14,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  featureCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  featureDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalDescription: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
    textAlign: 'center',
  },
  modalFeaturesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});

export default QuranScreen; 