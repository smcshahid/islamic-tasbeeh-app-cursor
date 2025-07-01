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
import { FlashList } from '@shopify/flash-list';
import { useAppTheme } from '../utils/theme';
import { useQuranContext } from '../contexts/QuranContext';
import { QuranVerse, QuranSurah } from '../types';
import { accessibilityManager, getButtonA11yProps } from '../utils/accessibility';
import { hapticFeedback } from '../utils/haptics';
import { secureLogger } from '../utils/secureLogger';
import { quranApi, getSurahName } from '../utils/quranApi';
import QuranAudioPlayer from './QuranAudioPlayer';
import { playQuranVerse, unifiedAudioService, setAudioStateListener, AudioState } from '../utils/unifiedAudioService';

const { width, height } = Dimensions.get('window');

interface QuranReaderProps {
  visible: boolean;
  onClose: () => void;
  initialSurah?: number;
  initialVerse?: number;
  mode?: 'reciter' | 'seeker' | 'memorizer' | 'auditory' | 'beginner' | 'normal' | 'juz' | 'page';
  juzData?: {
    juzNumber: number;
    startSurah: number;
    startVerse: number;
    endSurah: number;
    endVerse: number;
    name: string;
    arabicName: string;
  };
  pageData?: {
    pageNumber: number;
    startSurah: number;
    startVerse: number;
    endSurah: number;
    endVerse: number;
    juzNumber: number;
    description: string;
  };
  highlightBookmark?: {
    surah: number;
    verse: number;
  };
}

interface VerseComponentProps {
  verse: QuranVerse;
  surahNumber: number;
  isBookmarked: boolean;
  isHighlighted: boolean;
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
  isVisible: boolean;
  onVisibilityChange: (verse: QuranVerse, isVisible: boolean) => void;
  audioState: AudioState;
  isCurrentlyPlaying: boolean;
}

const VerseComponent: React.FC<VerseComponentProps> = ({
  verse,
  surahNumber,
  isBookmarked,
  isHighlighted,
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
  isVisible,
  onVisibilityChange,
  audioState,
  isCurrentlyPlaying,
}) => {
  const { colors } = useAppTheme();
  const { markAsRead } = useQuranContext();
  const [hasBeenRead, setHasBeenRead] = useState(false);
  const [bookmarkPulse, setBookmarkPulse] = useState(false);
  const visibilityTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Handle bookmark pulse effect
  useEffect(() => {
    if (isBookmarked) {
      setBookmarkPulse(true);
      setTimeout(() => setBookmarkPulse(false), 300);
    }
  }, [isBookmarked]);
  
  // Enhanced highlight effect
  useEffect(() => {
    if (isHighlighted) {
      // Add a small vibration for highlighted verse
      hapticFeedback.light();
    }
  }, [isHighlighted]);

  // Handle visibility changes and reading timer
  useEffect(() => {
    if (isVisible && !hasBeenRead) {
      // Clear any existing timer
      if (visibilityTimerRef.current) {
        clearTimeout(visibilityTimerRef.current);
      }
      
      // Start new timer
      visibilityTimerRef.current = setTimeout(() => {
        setHasBeenRead(true);
        markAsRead(surahNumber, verse.verseNumber);
        secureLogger.info('Verse marked as read after being visible', { 
          surah: surahNumber, 
          verse: verse.verseNumber 
        });
      }, 3000); // 3 seconds of visibility required
      
    } else if (!isVisible && visibilityTimerRef.current) {
      // Clear timer if verse becomes invisible
      clearTimeout(visibilityTimerRef.current);
      visibilityTimerRef.current = null;
    }
  }, [isVisible, hasBeenRead, surahNumber, verse.verseNumber]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (visibilityTimerRef.current) {
        clearTimeout(visibilityTimerRef.current);
      }
    };
  }, []);

  // Show audio progress for currently playing verse
  const renderAudioProgress = () => {
    if (!isCurrentlyPlaying) return null;

    const progress = audioState.duration > 0 ? audioState.position / audioState.duration : 0;
    
    return (
      <View style={[styles.inlineAudioProgress, { backgroundColor: colors.primary + '10' }]}>
        <View style={styles.audioProgressContainer}>
          <View style={[styles.audioProgressTrack, { backgroundColor: colors.border }]}>
            <View 
              style={[
                styles.audioProgressFill,
                {
                  width: `${progress * 100}%`,
                  backgroundColor: colors.primary,
                }
              ]}
            />
          </View>
          <Text style={[styles.audioProgressText, { color: colors.text.secondary }]}>
            {Math.floor(audioState.position / 1000)}s / {Math.floor(audioState.duration / 1000)}s
          </Text>
        </View>
      </View>
    );
  };
  
  const renderArabicText = () => {
    if (showWordByWord && onWordPress) {
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

  const handleAudioPress = async () => {
    try {
      if (isCurrentlyPlaying) {
        // If this verse is currently playing, pause it
        await unifiedAudioService.pauseAudio();
      } else {
        // Start playing this verse
        onPlayAudio(verse);
      }
    } catch (error) {
      secureLogger.error('Error handling verse audio', error);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.verseContainer,
        {
          backgroundColor: isHighlighted 
            ? colors.accent + '20'  // Special highlight color for bookmarked verses
            : colors.surface,
          borderColor: isHighlighted 
            ? colors.accent + '80'
            : isCurrentlyPlaying 
            ? colors.primary 
            : colors.border,
          borderWidth: isHighlighted ? 3 : isCurrentlyPlaying ? 2 : 1,
          marginBottom: readingMode === 'focus' ? 24 : 16,
          padding: readingMode === 'focus' ? 24 : 16,
          opacity: hasBeenRead ? 1 : 0.95,
          // Enhanced shadow for highlighted verses
          shadowColor: isHighlighted ? colors.accent : colors.shadow,
          shadowOffset: isHighlighted ? { width: 0, height: 4 } : { width: 0, height: 2 },
          shadowOpacity: isHighlighted ? 0.3 : 0.1,
          shadowRadius: isHighlighted ? 8 : 4,
          elevation: isHighlighted ? 8 : 2,
        }
      ]}
      onPress={() => onVersePress(verse)}
      {...getButtonA11yProps(
        `Verse ${verse.verseNumber}${isBookmarked ? ' (Bookmarked)' : ''}${isHighlighted ? ' (Highlighted)' : ''}`,
        `${verse.text}. ${showTranslation ? verse.translation : ''}`,
        false
      )}
    >
      <View style={styles.verseHeader}>
        <View style={[
          styles.verseNumber, 
          { 
            backgroundColor: hasBeenRead 
              ? colors.primary + '30' 
              : isVisible
              ? colors.primary + '25'
              : colors.primary + '20' 
          }
        ]}>
          <Text style={[styles.verseNumberText, { color: colors.primary }]}>
            {verse.verseNumber}
          </Text>
          {hasBeenRead && (
            <View style={styles.readIndicator}>
              <Ionicons name="checkmark-circle" size={12} color={colors.primary} />
            </View>
          )}
          {isVisible && !hasBeenRead && (
            <View style={styles.viewingIndicator}>
              <Ionicons name="eye" size={10} color={colors.secondary} />
            </View>
          )}
        </View>
        
        <View style={styles.verseActions}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              isCurrentlyPlaying && { backgroundColor: colors.primary + '20' }
            ]}
            onPress={handleAudioPress}
            {...getButtonA11yProps(
              isCurrentlyPlaying ? 'Pause audio' : 'Play audio', 
              `${isCurrentlyPlaying ? 'Pause' : 'Play'} recitation for verse ${verse.verseNumber}`, 
              isCurrentlyPlaying
            )}
          >
            {audioState.isLoading && isCurrentlyPlaying ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons 
                name={isCurrentlyPlaying ? 'pause-circle' : 'play-circle'} 
                size={24} 
                color={isCurrentlyPlaying ? colors.primary : colors.secondary} 
              />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                backgroundColor: isBookmarked 
                  ? colors.accent + '20' 
                  : 'transparent',
                borderWidth: isBookmarked ? 1 : 0,
                borderColor: isBookmarked ? colors.accent : 'transparent',
                transform: bookmarkPulse ? [{ scale: 1.1 }] : [{ scale: 1 }],
              }
            ]}
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
            {isBookmarked && (
              <View style={[styles.bookmarkIndicator, { backgroundColor: colors.accent }]}>
                <Text style={[styles.bookmarkIndicatorText, { color: colors.text.onAccent }]}>
                  ●
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Inline audio progress */}
      {renderAudioProgress()}

      <View style={styles.arabicContainer}>
        {renderArabicText()}
      </View>

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
  juzData,
  pageData,
  highlightBookmark,
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
    markAsRead,
    updateQuranSettings,
    getWordAnalysis,
    getTafsir,
  } = useQuranContext();

  const [surah, setSurah] = useState<QuranSurah | null>(null);
  // New state for multi-surah content (juz/page modes)
  const [multiSurahContent, setMultiSurahContent] = useState<QuranSurah[]>([]);
  const [displayMode, setDisplayMode] = useState<'single' | 'multi'>('single');
  const [isLoading, setIsLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showTafsir, setShowTafsir] = useState(false);
  const [selectedVerse, setSelectedVerse] = useState<QuranVerse | null>(null);
  const [tafsirText, setTafsirText] = useState('');
  const [wordAnalysis, setWordAnalysis] = useState<any>(null);
  
  // Audio player state
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  const [audioPlayerSurah, setAudioPlayerSurah] = useState<number>(1);
  const [audioPlayerVerse, setAudioPlayerVerse] = useState<number>(1);
  
  // Audio state for inline playback
  const [audioState, setAudioState] = useState<AudioState>(unifiedAudioService.getState());
  const [currentPlayingVerse, setCurrentPlayingVerse] = useState<number | null>(null);
  
  // Simplified bookmark highlighting
  const [highlightedVerse, setHighlightedVerse] = useState<{ surah: number; verse: number } | null>(null);
  
  const flashListRef = useRef<FlashList<QuranVerse>>(null);

  // Listen to audio state changes
  useEffect(() => {
    const unsubscribe = setAudioStateListener((state) => {
      setAudioState(state);
      
      // Update currently playing verse based on audio state
      if (state.audioType === 'quran' && state.currentAudio && 'verse' in state.currentAudio) {
        if (state.isPlaying) {
          setCurrentPlayingVerse(state.currentAudio.verse);
        } else {
          setCurrentPlayingVerse(null);
        }
      } else {
        setCurrentPlayingVerse(null);
      }
    });
    
    return unsubscribe;
  }, []);

  const getModeSettings = useCallback(() => {
    switch (mode) {
      case 'reciter':
        return {
          showTranslation: true,
          showTransliteration: true,
          showWordByWord: false,
          arabicFontSize: settings.arabicFontSize + 2,
          readingMode: 'focus',
        };
      case 'seeker':
        return {
          showTranslation: true,
          showTransliteration: true,
          showWordByWord: true,
          arabicFontSize: settings.arabicFontSize,
          readingMode: 'normal',
        };
      case 'memorizer':
        return {
          showTranslation: false,
          showTransliteration: false,
          showWordByWord: false,
          arabicFontSize: settings.arabicFontSize + 4,
          readingMode: 'focus',
        };
      case 'auditory':
        return {
          showTranslation: true,
          showTransliteration: false,
          showWordByWord: false,
          arabicFontSize: settings.arabicFontSize + 2,
          readingMode: 'focus',
        };
      case 'beginner':
        return {
          showTranslation: true,
          showTransliteration: true,
          showWordByWord: false,
          arabicFontSize: settings.arabicFontSize,
          readingMode: 'normal',
        };
      case 'juz':
        return {
          showTranslation: settings.showTranslation !== false,
          showTransliteration: settings.showTransliteration,
          showWordByWord: false, // Simplified for multi-surah view
          arabicFontSize: settings.arabicFontSize,
          readingMode: 'normal',
        };
      case 'page':
        return {
          showTranslation: settings.showTranslation !== false,
          showTransliteration: settings.showTransliteration,
          showWordByWord: false, // Simplified for multi-surah view
          arabicFontSize: settings.arabicFontSize,
          readingMode: 'normal',
        };
      default:
        return {
          showTranslation: settings.showTranslation !== false,
          showTransliteration: settings.showTransliteration,
          showWordByWord: settings.showWordByWord,
          arabicFontSize: settings.arabicFontSize,
          readingMode: 'normal',
        };
    }
  }, [mode, settings]);

  const modeSettings = getModeSettings();

  useEffect(() => {
    if (visible) {
      if (mode === 'juz' && juzData) {
        loadJuzContent(juzData);
      } else if (mode === 'page' && pageData) {
        loadPageContent(pageData);
      } else {
        loadSurah(initialSurah);
      }
      
      // Handle bookmark highlighting
      if (highlightBookmark) {
        setHighlightedVerse(highlightBookmark);
        // Clear highlight after 5 seconds
        setTimeout(() => {
          setHighlightedVerse(null);
        }, 5000);
      }
    }
  }, [visible, initialSurah, mode, juzData, pageData, highlightBookmark]);

  const loadSurah = async (surahNumber: number) => {
    try {
      setIsLoading(true);
      setDisplayMode('single');
      secureLogger.info('Loading surah for reading', { surahNumber, mode, highlightBookmark });
      
      const surahData = await quranApi.getSurah(surahNumber, settings.defaultTranslation);
      setSurah(surahData);
      setMultiSurahContent([]);
      secureLogger.info('Surah loaded successfully for reading', { 
        surahNumber, 
        verses: surahData.verses.length 
      });
      
    } catch (error) {
      secureLogger.error('Error loading surah for reading', error);
      Alert.alert('Error', 'Unable to load Surah. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadJuzContent = async (juz: typeof juzData) => {
    if (!juz) return;
    
    try {
      setIsLoading(true);
      setDisplayMode('multi');
      secureLogger.info('Loading Juz content', { 
        juzNumber: juz.juzNumber, 
        startSurah: juz.startSurah, 
        endSurah: juz.endSurah 
      });
      
      const surahs: QuranSurah[] = [];
      
      // Load all surahs in the Juz range
      for (let surahNum = juz.startSurah; surahNum <= juz.endSurah; surahNum++) {
        const surahData = await quranApi.getSurah(surahNum, settings.defaultTranslation);
        
        // Filter verses based on Juz boundaries
        let filteredVerses = surahData.verses;
        
        if (surahNum === juz.startSurah && surahNum === juz.endSurah) {
          // Single surah spanning partial Juz
          filteredVerses = surahData.verses.filter(v => 
            v.verseNumber >= juz.startVerse && v.verseNumber <= juz.endVerse
          );
        } else if (surahNum === juz.startSurah) {
          // First surah in Juz - from startVerse to end
          filteredVerses = surahData.verses.filter(v => v.verseNumber >= juz.startVerse);
        } else if (surahNum === juz.endSurah) {
          // Last surah in Juz - from start to endVerse
          filteredVerses = surahData.verses.filter(v => v.verseNumber <= juz.endVerse);
        }
        // Middle surahs use all verses
        
        if (filteredVerses.length > 0) {
          surahs.push({
            ...surahData,
            verses: filteredVerses
          });
        }
      }
      
      setMultiSurahContent(surahs);
      setSurah(null);
      secureLogger.info('Juz content loaded successfully', { 
        juzNumber: juz.juzNumber,
        surahsLoaded: surahs.length,
        totalVerses: surahs.reduce((sum, s) => sum + s.verses.length, 0)
      });
      
    } catch (error) {
      secureLogger.error('Error loading Juz content', error);
      Alert.alert('Error', 'Unable to load Juz content. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPageContent = async (page: typeof pageData) => {
    if (!page) return;
    
    try {
      setIsLoading(true);
      setDisplayMode('multi');
      secureLogger.info('Loading Page content', { 
        pageNumber: page.pageNumber, 
        startSurah: page.startSurah, 
        endSurah: page.endSurah 
      });
      
      const surahs: QuranSurah[] = [];
      
      // Load all surahs in the Page range
      for (let surahNum = page.startSurah; surahNum <= page.endSurah; surahNum++) {
        const surahData = await quranApi.getSurah(surahNum, settings.defaultTranslation);
        
        // Filter verses based on Page boundaries
        let filteredVerses = surahData.verses;
        
        if (surahNum === page.startSurah && surahNum === page.endSurah) {
          // Single surah on page
          filteredVerses = surahData.verses.filter(v => 
            v.verseNumber >= page.startVerse && v.verseNumber <= page.endVerse
          );
        } else if (surahNum === page.startSurah) {
          // First surah on page - from startVerse to end
          filteredVerses = surahData.verses.filter(v => v.verseNumber >= page.startVerse);
        } else if (surahNum === page.endSurah) {
          // Last surah on page - from start to endVerse
          filteredVerses = surahData.verses.filter(v => v.verseNumber <= page.endVerse);
        }
        // Middle surahs use all verses
        
        if (filteredVerses.length > 0) {
          surahs.push({
            ...surahData,
            verses: filteredVerses
          });
        }
      }
      
      setMultiSurahContent(surahs);
      setSurah(null);
      secureLogger.info('Page content loaded successfully', { 
        pageNumber: page.pageNumber,
        surahsLoaded: surahs.length,
        totalVerses: surahs.reduce((sum, s) => sum + s.verses.length, 0)
      });
      
    } catch (error) {
      secureLogger.error('Error loading Page content', error);
      Alert.alert('Error', 'Unable to load Page content. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Simple and reliable scrolling after surah loads
  useEffect(() => {
    if (!isLoading && surah && flashListRef.current) {
      const targetVerse = highlightBookmark?.verse || initialVerse;
      if (targetVerse > 1) {
        // Use a more reliable timeout approach
        setTimeout(() => {
          scrollToVerse(targetVerse);
        }, 800); // Increased delay for FlashList to fully render
      }
    }
  }, [isLoading, surah, highlightBookmark, initialVerse]);

  const scrollToVerse = (verseNumber: number) => {
    try {
      if (!flashListRef.current || !surah) {
        secureLogger.warn('FlashList ref or surah not available');
        return;
      }

      const verseIndex = surah.verses.findIndex(v => v.verseNumber === verseNumber);
      if (verseIndex >= 0) {
        secureLogger.info('Scrolling to verse', { verseNumber, verseIndex });
        
        // FlashList has better scrollToIndex support
        flashListRef.current.scrollToIndex({
          index: verseIndex,
          animated: true,
        });
        
        secureLogger.info('Successfully scrolled to verse', { verseNumber, verseIndex });
      } else {
        secureLogger.warn('Verse not found', { verseNumber, totalVerses: surah.verses.length });
      }
    } catch (error) {
      secureLogger.error('Error scrolling to verse', { error: error instanceof Error ? error.message : String(error), verseNumber });
    }
  };

  // Handle viewport changes to track which verses are visible
  const onViewableItemsChanged = useCallback(() => {
    // Simplified - FlashList handles viewability better
  }, []);

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 500,
  };

  const handleVersePress = async (verse: QuranVerse) => {
    try {
      if (!verse || !surah) {
        secureLogger.warn('Invalid verse or surah data for verse press');
        return;
      }

      hapticFeedback.light();
      
      await markAsRead(surah.id, verse.verseNumber);
      
      setSelectedVerse(verse);
      
      secureLogger.info('Verse pressed and marked as read', { 
        surah: surah.id, 
        verse: verse.verseNumber, 
        mode 
      });
      
      if (mode === 'seeker') {
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
        try {
          // Use unified audio service for auditory mode
          await playQuranVerse(surah.id, verse.verseNumber);
          secureLogger.info('Audio playback started for auditory mode', { surah: surah.id, verse: verse.verseNumber });
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
      secureLogger.info('Playing verse audio inline', { 
        surah: surah.id, 
        verse: verse.verseNumber 
      });
      
      // Play the verse using unified audio service
      await playQuranVerse(surah.id, verse.verseNumber);
      
      // Update currently playing verse
      setCurrentPlayingVerse(verse.verseNumber);
      
      secureLogger.info('Verse audio playback started', { 
        surah: surah.id, 
        verse: verse.verseNumber 
      });
    } catch (error) {
      secureLogger.error('Error playing verse audio', error);
      // Show user-friendly error
      Alert.alert('Audio Error', 'Unable to play audio. Please check your internet connection and try again.');
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
    return bookmarks.some(bookmark => 
      bookmark.surahNumber === surah.id && bookmark.verseNumber === verse.verseNumber
    );
  };

  const renderVerse = ({ item: verse, index }: { item: QuranVerse; index: number }) => {
    const isCurrentlyPlaying = currentPlayingVerse === verse.verseNumber && 
                              audioState.audioType === 'quran' && 
                              audioState.isPlaying;
    
    const isHighlighted = highlightedVerse && 
                         highlightedVerse.surah === (surah?.id || 1) && 
                         highlightedVerse.verse === verse.verseNumber;
    
    return (
      <VerseComponent
        verse={verse}
        surahNumber={surah?.id || 1}
        isBookmarked={isVerseBookmarked(verse)}
        isHighlighted={isHighlighted || false}
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
        isVisible={true}
        onVisibilityChange={() => {}}
        audioState={audioState}
        isCurrentlyPlaying={isCurrentlyPlaying}
      />
    );
  };

  const renderHeader = () => {
    let title = '';
    let subtitle = '';
    
    if (mode === 'juz' && juzData) {
      title = `Juz ${juzData.juzNumber} - ${juzData.name}`;
      subtitle = `${juzData.arabicName} • Surah ${juzData.startSurah}:${juzData.startVerse} - ${juzData.endSurah}:${juzData.endVerse}`;
    } else if (mode === 'page' && pageData) {
      title = `Page ${pageData.pageNumber}`;
      subtitle = `${pageData.description} • Juz ${pageData.juzNumber}`;
    } else if (surah) {
      title = surah.englishName;
      subtitle = `${surah.name} • ${surah.totalVerses} verses • ${surah.revelationType}`;
    } else if (multiSurahContent.length > 0) {
      const totalVerses = multiSurahContent.reduce((sum, s) => sum + s.verses.length, 0);
      title = `${multiSurahContent.length} Surahs`;
      subtitle = `${totalVerses} verses`;
    }
    
    return (
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={onClose}
          {...getButtonA11yProps('Close reader', 'Close Quran reader', false)}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={[styles.surahTitle, { color: colors.text.primary }]}>
            {title}
          </Text>
          <Text style={[styles.surahSubtitle, { color: colors.text.secondary }]}>
            {subtitle}
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
  };

  const renderModeIndicator = () => {
    if (mode === 'normal') return null;
    
    const modeConfig = {
      reciter: { icon: 'book', label: 'Reciter Mode', color: colors.primary },
      seeker: { icon: 'school', label: 'Knowledge Seeker', color: colors.secondary },
      memorizer: { icon: 'fitness', label: 'Memorizer Mode', color: colors.accent },
      auditory: { icon: 'headset', label: 'Audio Mode', color: colors.secondary },
      beginner: { icon: 'star', label: 'Beginner Mode', color: colors.islamic.green },
      juz: { icon: 'layers', label: 'Juz Mode', color: colors.islamic.gold },
      page: { icon: 'document', label: 'Page Mode', color: colors.primary },
    };
    
    const config = modeConfig[mode];
    
    return (
      <View style={[styles.modeIndicator, { backgroundColor: config.color + '20' }]}>
        <Ionicons name={config.icon as any} size={16} color={config.color} />
        <Text style={[styles.modeText, { color: config.color }]}>{config.label}</Text>
      </View>
    );
  };

  const renderBismillah = (showBismillah: boolean = true) => {
    if (!showBismillah) return null;
    
    return (
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
    );
  };

  // Render single surah content
  const renderSingleSurahContent = () => {
    if (!surah) return null;
    
    return (
      <View style={{ flex: 1 }}>
        {surah.bismillahPre && renderBismillah(true)}
        <FlashList
          ref={flashListRef}
          data={surah.verses}
          renderItem={renderVerse}
          keyExtractor={(item) => item.id.toString()}
          estimatedItemSize={180} // FlashList uses estimatedItemSize instead of getItemLayout
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.flashListContent}
        />
      </View>
    );
  };

  // Render multi-surah content (for juz/page modes)
  const renderMultiSurahContent = () => {
    if (multiSurahContent.length === 0) return null;
    
    // Create a flat list of all verses with surah separators
    const allContent: Array<{ type: 'surah-header' | 'verse', data: any, surahId: number }> = [];
    
    multiSurahContent.forEach((currentSurah, surahIndex) => {
      // Add surah header
      allContent.push({
        type: 'surah-header',
        data: currentSurah,
        surahId: currentSurah.id
      });
      
      // Add verses
      currentSurah.verses.forEach(verse => {
        allContent.push({
          type: 'verse',
          data: verse,
          surahId: currentSurah.id
        });
      });
    });
    
    const renderMultiItem = ({ item }: { item: typeof allContent[0] }) => {
      if (item.type === 'surah-header') {
        const surahData = item.data;
        return (
          <View style={[styles.surahHeader, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.surahHeaderTitle, { color: colors.text.primary }]}>
              {surahData.englishName}
            </Text>
            <Text style={[styles.surahHeaderSubtitle, { color: colors.text.secondary }]}>
              {surahData.name} • {surahData.revelationType}
            </Text>
            {surahData.bismillahPre && renderBismillah(true)}
          </View>
        );
      } else {
        const verse = item.data;
        const isCurrentlyPlaying = currentPlayingVerse === verse.verseNumber && 
                                  audioState.audioType === 'quran' && 
                                  audioState.isPlaying;
        
        const isHighlighted = highlightedVerse && 
                             highlightedVerse.surah === item.surahId && 
                             highlightedVerse.verse === verse.verseNumber;
        
        return (
          <VerseComponent
            verse={verse}
            surahNumber={item.surahId}
            isBookmarked={isVerseBookmarked(verse)}
            isHighlighted={isHighlighted || false}
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
            isVisible={true}
            onVisibilityChange={() => {}}
            audioState={audioState}
            isCurrentlyPlaying={isCurrentlyPlaying}
          />
        );
      }
    };
    
    return (
      <FlashList
        data={allContent}
        renderItem={renderMultiItem}
        keyExtractor={(item, index) => `${item.type}-${item.surahId}-${index}`}
        estimatedItemSize={180}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.flashListContent}
      />
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
          renderSingleSurahContent()
        ) : multiSurahContent.length > 0 ? (
          renderMultiSurahContent()
        ) : (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: colors.text.secondary }]}>
              Unable to load content. Please try again.
            </Text>
          </View>
        )}

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

        {/* Audio Player Modal */}
        <QuranAudioPlayer
          visible={showAudioPlayer}
          onClose={() => setShowAudioPlayer(false)}
          surahNumber={audioPlayerSurah}
          verseNumber={audioPlayerVerse}
          autoPlay={true}
        />
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
      flashListContent: {
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
    position: 'relative',
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
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
    textAlign: 'center',
    marginBottom: 16,
  },
  modalContent: {
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  tafsirText: {
    fontSize: 16,
    lineHeight: 24,
  },
  readIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    padding: 1,
  },
  viewingIndicator: {
    position: 'absolute',
    top: -2,
    left: -2,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    padding: 1,
  },
  inlineAudioProgress: {
    height: 20,
    borderRadius: 10,
    marginBottom: 12,
  },
  audioProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  audioProgressTrack: {
    flex: 1,
    height: '100%',
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
  },
  audioProgressFill: {
    height: '100%',
    borderRadius: 10,
    backgroundColor: '#007BFF',
  },
  audioProgressText: {
    marginLeft: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  surahHeader: {
    padding: 16,
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  surahHeaderTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  surahHeaderSubtitle: {
    fontSize: 14,
    marginTop: 4,
    fontWeight: '400',
  },
  bookmarkIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 12,
    height: 12,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookmarkIndicatorText: {
    fontSize: 10,
    fontWeight: '600',
  },
});

export default QuranReader; 