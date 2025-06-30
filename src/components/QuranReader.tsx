import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../utils/theme';
import { useQuranContext } from '../contexts/QuranContext';
import { QuranVerse, QuranSurah } from '../types';
import { accessibilityManager, getButtonA11yProps } from '../utils/accessibility';
import { hapticFeedback } from '../utils/haptics';
import { secureLogger } from '../utils/secureLogger';
import { quranApi, getSurahName } from '../utils/quranApi';

const { width, height } = Dimensions.get('window');

interface QuranReaderProps {
  visible: boolean;
  onClose: () => void;
  initialSurah?: number;
  initialVerse?: number;
  mode?: 'reciter' | 'seeker' | 'memorizer' | 'auditory' | 'beginner' | 'normal';
}

interface VerseComponentProps {
  verse: QuranVerse;
  surahNumber: number;
  isBookmarked: boolean;
  showTranslation: boolean;
  showTransliteration: boolean;
  showWordByWord: boolean;
  arabicFontSize: number;
  translationFontSize: number;
  readingMode: string;
  onVersePress: (verse: QuranVerse) => void;
  onBookmarkToggle: (verse: QuranVerse) => void;
  onPlayAudio: (verse: QuranVerse) => void;
  onWordPress?: (word: string, index: number) => void;
}

const VerseComponent: React.FC<VerseComponentProps> = ({
  verse,
  surahNumber,
  isBookmarked,
  showTranslation,
  showTransliteration,
  showWordByWord,
  arabicFontSize,
  translationFontSize,
  readingMode,
  onVersePress,
  onBookmarkToggle,
  onPlayAudio,
  onWordPress,
}) => {
  const { colors } = useAppTheme();
  
  const renderArabicText = () => {
    if (showWordByWord && onWordPress) {
      // Split Arabic text into words for word-by-word analysis
      const words = verse.text.split(' ');
      return (
        <View style={styles.wordByWordContainer}>
          {words.map((word, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.wordButton, { borderColor: colors.border }]}
              onPress={() => onWordPress(word, index)}
              {...getButtonA11yProps(`Arabic word ${index + 1}`, `${word}, tap for analysis`, false)}
            >
              <Text style={[
                styles.arabicWord,
                {
                  fontSize: arabicFontSize,
                  color: colors.text.primary,
                }
              ]}>
                {word}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      );
    }
    
    return (
      <Text style={[
        styles.arabicText,
        {
          fontSize: arabicFontSize,
          color: colors.text.primary,
          textAlign: 'right',
          lineHeight: arabicFontSize * 1.8,
        }
      ]}>
        {verse.text}
      </Text>
    );
  };

  return (
    <TouchableOpacity
      style={[
        styles.verseContainer,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          marginBottom: readingMode === 'focus' ? 24 : 16,
          padding: readingMode === 'focus' ? 24 : 16,
        }
      ]}
      onPress={() => onVersePress(verse)}
      {...getButtonA11yProps(
        `Verse ${verse.verseNumber}`,
        `${verse.text}. ${showTranslation ? verse.translation : ''}`,
        false
      )}
    >
      {/* Verse Header */}
      <View style={styles.verseHeader}>
        <View style={[styles.verseNumber, { backgroundColor: colors.primary + '20' }]}>
          <Text style={[styles.verseNumberText, { color: colors.primary }]}>
            {verse.verseNumber}
          </Text>
        </View>
        
        <View style={styles.verseActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onPlayAudio(verse)}
            {...getButtonA11yProps('Play audio', `Play recitation for verse ${verse.verseNumber}`, false)}
          >
            <Ionicons name="play-circle" size={24} color={colors.secondary} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onBookmarkToggle(verse)}
            {...getButtonA11yProps(
              isBookmarked ? 'Remove bookmark' : 'Add bookmark',
              `${isBookmarked ? 'Remove' : 'Add'} bookmark for verse ${verse.verseNumber}`,
              isBookmarked
            )}
          >
            <Ionicons 
              name={isBookmarked ? 'bookmark' : 'bookmark-outline'} 
              size={20} 
              color={isBookmarked ? colors.accent : colors.text.secondary} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Arabic Text */}
      <View style={styles.arabicContainer}>
        {renderArabicText()}
      </View>

      {/* Transliteration */}
      {showTransliteration && verse.transliteration && (
        <Text style={[
          styles.transliteration,
          {
            fontSize: translationFontSize,
            color: colors.text.secondary,
            fontStyle: 'italic',
          }
        ]}>
          {verse.transliteration}
        </Text>
      )}

      {/* Translation */}
      {showTranslation && (
        <Text style={[
          styles.translation,
          {
            fontSize: translationFontSize,
            color: colors.text.primary,
            lineHeight: translationFontSize * 1.6,
          }
        ]}>
          {verse.translation}
        </Text>
      )}

      {/* Sajda indicator */}
      {verse.sajda && (
        <View style={[styles.sajdaIndicator, { backgroundColor: colors.islamic.green + '20' }]}>
          <Ionicons name="arrow-down" size={16} color={colors.islamic.green} />
          <Text style={[styles.sajdaText, { color: colors.islamic.green }]}>Sajda</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const QuranReader: React.FC<QuranReaderProps> = ({
  visible,
  onClose,
  initialSurah = 1,
  initialVerse = 1,
  mode = 'normal',
}) => {
  const { colors } = useAppTheme();
  const {
    currentSurah,
    currentVerse,
    settings,
    bookmarks,
    navigateToSurah,
    addBookmark,
    removeBookmark,
    playAudio,
    markAsRead,
    updateQuranSettings,
    getWordAnalysis,
    getTafsir,
  } = useQuranContext();

  const [surah, setSurah] = useState<QuranSurah | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showTafsir, setShowTafsir] = useState(false);
  const [selectedVerse, setSelectedVerse] = useState<QuranVerse | null>(null);
  const [tafsirText, setTafsirText] = useState('');
  const [wordAnalysis, setWordAnalysis] = useState<any>(null);
  
  const scrollViewRef = useRef<ScrollView>(null);

  // Mode-specific settings
  const getModeSettings = useCallback(() => {
    switch (mode) {
      case 'reciter':
        return {
          showTranslation: false,
          showTransliteration: false,
          showWordByWord: false,
          readingMode: 'focus',
          arabicFontSize: Math.max(settings.arabicFontSize, 20),
        };
      case 'seeker':
        return {
          showTranslation: true,
          showTransliteration: true,
          showWordByWord: true,
          readingMode: 'normal',
          arabicFontSize: settings.arabicFontSize,
        };
      case 'memorizer':
        return {
          showTranslation: settings.hideTranslation ? false : true,
          showTransliteration: false,
          showWordByWord: false,
          readingMode: 'memorization',
          arabicFontSize: settings.arabicFontSize,
        };
      case 'auditory':
        return {
          showTranslation: true,
          showTransliteration: false,
          showWordByWord: false,
          readingMode: 'normal',
          arabicFontSize: settings.arabicFontSize,
        };
      case 'beginner':
        return {
          showTranslation: true,
          showTransliteration: true,
          showWordByWord: true,
          readingMode: 'normal',
          arabicFontSize: Math.min(settings.arabicFontSize, 18),
        };
      default:
        return {
          showTranslation: settings.showTranslation !== false, // Always show translation by default
          showTransliteration: settings.showTransliteration,
          showWordByWord: settings.showWordByWord,
          readingMode: 'normal',
          arabicFontSize: settings.arabicFontSize,
        };
    }
  }, [mode, settings]);

  const modeSettings = getModeSettings();

  // Load surah data
  useEffect(() => {
    if (visible) {
      loadSurah(initialSurah);
    }
  }, [visible, initialSurah]);

  const loadSurah = async (surahNumber: number) => {
    try {
      setIsLoading(true);
      secureLogger.info('Loading surah for reading', { surahNumber, mode });
      
      const surahData = await quranApi.getSurah(surahNumber, settings.defaultTranslation);
      setSurah(surahData);
      secureLogger.info('Surah loaded successfully for reading', { 
        surahNumber, 
        verses: surahData.verses.length 
      });
      
      // Navigate to initial verse if specified
      if (initialVerse > 1) {
        setTimeout(() => {
          scrollToVerse(initialVerse);
        }, 500);
      }
    } catch (error) {
      secureLogger.error('Error loading surah for reading', error);
      Alert.alert('Error', 'Unable to load Surah. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToVerse = (verseNumber: number) => {
    // This would need to be implemented with proper verse positioning
    // For now, just log the action
    secureLogger.info('Scrolling to verse', { verseNumber });
  };

  const handleVersePress = async (verse: QuranVerse) => {
    try {
      if (!verse || !surah) {
        secureLogger.warn('Invalid verse or surah data for verse press');
        return;
      }

      hapticFeedback.light();
      
      // Mark as read
      await markAsRead(surah.id, verse.verseNumber);
      
      // Set selected verse for additional actions
      setSelectedVerse(verse);
      
      secureLogger.info('Verse pressed successfully', { 
        surah: surah.id, 
        verse: verse.verseNumber, 
        mode 
      });
      
      // Mode-specific actions
      if (mode === 'seeker') {
        // Load tafsir for knowledge seekers
        try {
          const tafsir = await getTafsir(surah.id, verse.verseNumber);
          setTafsirText(tafsir || 'No tafsir available for this verse.');
          setShowTafsir(true);
        } catch (tafsirError) {
          secureLogger.warn('Tafsir loading failed, showing basic info', tafsirError);
          setTafsirText('Tafsir information is currently unavailable.');
          setShowTafsir(true);
        }
      } else if (mode === 'auditory') {
        // Auto-play audio for auditory learners
        try {
          await playAudio(surah.id, verse.verseNumber);
        } catch (audioError) {
          secureLogger.warn('Audio playback failed in auditory mode', audioError);
        }
      }
    } catch (error) {
      secureLogger.error('Error handling verse press', error);
    }
  };

  const handleBookmarkToggle = async (verse: QuranVerse) => {
    try {
      if (!verse || !surah) {
        secureLogger.warn('Invalid verse or surah data for bookmark toggle');
        return;
      }

      hapticFeedback.success();
      
      const existingBookmark = bookmarks.find(
        b => b.surahNumber === surah.id && b.verseNumber === verse.verseNumber
      );
      
      if (existingBookmark) {
        await removeBookmark(existingBookmark.id);
        secureLogger.info('Bookmark removed', { surah: surah.id, verse: verse.verseNumber });
      } else {
        await addBookmark(surah.id, verse.verseNumber, `${getSurahName(surah.id)} ${verse.verseNumber}`);
        secureLogger.info('Bookmark added', { surah: surah.id, verse: verse.verseNumber });
      }
    } catch (error) {
      secureLogger.error('Error toggling bookmark', error);
      // Don't show alert, just log the error
      secureLogger.info('Bookmark operation failed, continuing without interruption');
    }
  };

  const handlePlayAudio = async (verse: QuranVerse) => {
    try {
      if (!verse || !surah) {
        secureLogger.warn('Invalid verse or surah data for audio playback');
        return;
      }

      hapticFeedback.light();
      await playAudio(surah.id, verse.verseNumber);
      secureLogger.info('Audio playback initiated', { surah: surah.id, verse: verse.verseNumber });
    } catch (error) {
      secureLogger.error('Error playing audio', error);
      // Don't show alert, just log the error
      secureLogger.info('Audio playback failed, continuing without interruption');
    }
  };

  const handleWordPress = async (word: string, index: number) => {
    if (mode !== 'seeker' && mode !== 'beginner') return;
    
    try {
      if (selectedVerse) {
        const analysis = await getWordAnalysis(currentSurah, selectedVerse.verseNumber, index);
        setWordAnalysis(analysis);
      }
    } catch (error) {
      secureLogger.error('Error getting word analysis', error);
    }
  };

  const isVerseBookmarked = (verse: QuranVerse) => {
    if (!verse || !surah) return false;
    return bookmarks.some(
      b => b.surahNumber === surah.id && b.verseNumber === verse.verseNumber
    );
  };

  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <TouchableOpacity
        onPress={onClose}
        {...getButtonA11yProps('Close reader', 'Close Quran reader', false)}
      >
        <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
      </TouchableOpacity>
      
      <View style={styles.headerCenter}>
        <Text style={[styles.surahTitle, { color: colors.text.primary }]}>
          {surah?.englishName}
        </Text>
        <Text style={[styles.surahSubtitle, { color: colors.text.secondary }]}>
          {surah?.name} • {surah?.totalVerses} verses • {surah?.revelationType}
        </Text>
      </View>
      
      <TouchableOpacity
        onPress={() => setShowSettings(true)}
        {...getButtonA11yProps('Reading settings', 'Open reading preferences', false)}
      >
        <Ionicons name="settings" size={24} color={colors.text.secondary} />
      </TouchableOpacity>
    </View>
  );

  const renderModeIndicator = () => {
    if (mode === 'normal') return null;
    
    const modeConfig = {
      reciter: { icon: 'book', label: 'Reciter Mode', color: colors.primary },
      seeker: { icon: 'school', label: 'Knowledge Seeker', color: colors.secondary },
      memorizer: { icon: 'fitness', label: 'Memorizer Mode', color: colors.accent },
      auditory: { icon: 'headset', label: 'Audio Mode', color: colors.islamic.blue },
      beginner: { icon: 'star', label: 'Beginner Mode', color: colors.islamic.green },
    };
    
    const config = modeConfig[mode];
    
    return (
      <View style={[styles.modeIndicator, { backgroundColor: config.color + '20' }]}>
        <Ionicons name={config.icon as any} size={16} color={config.color} />
        <Text style={[styles.modeText, { color: config.color }]}>{config.label}</Text>
      </View>
    );
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {renderHeader()}
        {renderModeIndicator()}
        
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
              Loading Surah...
            </Text>
          </View>
        ) : surah ? (
          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Bismillah */}
            {surah.bismillahPre && (
              <View style={[styles.bismillahContainer, { backgroundColor: colors.surface }]}>
                <Text style={[styles.bismillah, { 
                  fontSize: modeSettings.arabicFontSize + 2,
                  color: colors.text.primary 
                }]}>
                  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                </Text>
                <Text style={[styles.bismillahTranslation, { color: colors.text.secondary }]}>
                  In the name of Allah, the Most Gracious, the Most Merciful
                </Text>
              </View>
            )}

            {/* Verses */}
            {surah.verses.map((verse) => (
              <VerseComponent
                key={verse.id}
                verse={verse}
                surahNumber={surah.id}
                isBookmarked={isVerseBookmarked(verse)}
                showTranslation={modeSettings.showTranslation}
                showTransliteration={modeSettings.showTransliteration}
                showWordByWord={modeSettings.showWordByWord}
                arabicFontSize={modeSettings.arabicFontSize}
                translationFontSize={settings.translationFontSize}
                readingMode={modeSettings.readingMode}
                onVersePress={handleVersePress}
                onBookmarkToggle={handleBookmarkToggle}
                onPlayAudio={handlePlayAudio}
                onWordPress={modeSettings.showWordByWord ? handleWordPress : undefined}
              />
            ))}
          </ScrollView>
        ) : (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: colors.text.secondary }]}>
              Unable to load Surah. Please try again.
            </Text>
          </View>
        )}

        {/* Tafsir Modal */}
        <Modal
          visible={showTafsir}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowTafsir(false)}
        >
          <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
                Tafsir - Verse {selectedVerse?.verseNumber}
              </Text>
              <TouchableOpacity onPress={() => setShowTafsir(false)}>
                <Ionicons name="close" size={24} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalContent}>
              <Text style={[styles.tafsirText, { color: colors.text.primary }]}>
                {tafsirText || 'Loading tafsir...'}
              </Text>
            </ScrollView>
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  surahTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  surahSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  modeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 20,
  },
  modeText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  bismillahContainer: {
    padding: 20,
    marginBottom: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  bismillah: {
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 8,
  },
  bismillahTranslation: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  verseContainer: {
    borderRadius: 12,
    borderWidth: 1,
  },
  verseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  verseNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verseNumberText: {
    fontSize: 14,
    fontWeight: '600',
  },
  verseActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  arabicContainer: {
    marginBottom: 12,
  },
  arabicText: {
    fontWeight: '400',
  },
  wordByWordContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  wordButton: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 6,
    margin: 2,
  },
  arabicWord: {
    textAlign: 'center',
  },
  transliteration: {
    marginBottom: 8,
    textAlign: 'left',
  },
  translation: {
    textAlign: 'left',
  },
  sajdaIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  sajdaText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
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
    fontSize: 18,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  tafsirText: {
    fontSize: 16,
    lineHeight: 24,
  },
});

export default QuranReader; 