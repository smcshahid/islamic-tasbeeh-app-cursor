import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  FlatList,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useAppTheme } from '../utils/theme';
import { useQuranContext } from '../contexts/QuranContext';
import { QuranReciter } from '../types';
import { accessibilityManager, getButtonA11yProps } from '../utils/accessibility';
import { hapticFeedback } from '../utils/haptics';
import { secureLogger } from '../utils/secureLogger';
import { quranApi, getSurahName, AVAILABLE_RECITERS } from '../utils/quranApi';

const { width } = Dimensions.get('window');

interface QuranAudioPlayerProps {
  visible: boolean;
  onClose: () => void;
  surahNumber?: number;
  verseNumber?: number;
  autoPlay?: boolean;
}

interface ReciterSelectionProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (reciter: QuranReciter) => void;
  currentReciter: QuranReciter;
}

const ReciterSelection: React.FC<ReciterSelectionProps> = ({
  visible,
  onClose,
  onSelect,
  currentReciter,
}) => {
  const { colors } = useAppTheme();

  const renderReciter = ({ item }: { item: QuranReciter }) => (
    <TouchableOpacity
      style={[
        styles.reciterItem,
        {
          backgroundColor: item.id === currentReciter.id ? colors.primary + '20' : colors.surface,
          borderColor: colors.border,
        }
      ]}
      onPress={() => {
        onSelect(item);
        onClose();
      }}
      {...getButtonA11yProps(item.name, `Select ${item.name} as reciter`, item.id === currentReciter.id)}
    >
      <View style={styles.reciterInfo}>
        <Text style={[styles.reciterName, { color: colors.text.primary }]}>
          {item.name}
        </Text>
        <Text style={[styles.reciterDetails, { color: colors.text.secondary }]}>
          {item.language} • {item.audioQuality} quality
        </Text>
      </View>
      {item.id === currentReciter.id && (
        <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
      )}
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
            Select Reciter
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>
        
        <FlatList
          data={AVAILABLE_RECITERS}
          renderItem={renderReciter}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.reciterList}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </Modal>
  );
};

const QuranAudioPlayer: React.FC<QuranAudioPlayerProps> = ({
  visible,
  onClose,
  surahNumber = 1,
  verseNumber = 1,
  autoPlay = false,
}) => {
  const { colors } = useAppTheme();
  const { settings, updateQuranSettings } = useQuranContext();

  // Audio player hooks
  const player = useAudioPlayer();
  const status = useAudioPlayerStatus(player);

  // Audio state
  const [currentSurah, setCurrentSurah] = useState(surahNumber);
  const [currentVerse, setCurrentVerse] = useState(verseNumber);
  const [isLoading, setIsLoading] = useState(false);
  
  // UI state
  const [showReciterSelection, setShowReciterSelection] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(settings.audioPlaybackSpeed || 1.0);
  const [repeatMode, setRepeatMode] = useState<'none' | 'verse' | 'surah'>(settings.repeatMode || 'none');
  const [sleepTimer, setSleepTimer] = useState<number | null>(null);
  const [sleepTimeRemaining, setSleepTimeRemaining] = useState<number | null>(null);

  // Refs
  const sleepTimerInterval = useRef<NodeJS.Timeout | null>(null);
  const hasHandledCompletion = useRef(false);

  // Current reciter
  const currentReciter = AVAILABLE_RECITERS.find(r => r.id === settings.defaultReciter) || AVAILABLE_RECITERS[0];

  // Derived state from player status
  const isPlaying = status?.playing || false;
  const position = (status?.currentTime || 0) * 1000; // Convert to milliseconds
  const duration = (status?.duration || 0) * 1000;

  // Initialize audio on mount
  useEffect(() => {
    if (visible) {
      initializeAudio();
    }
  }, [visible, currentSurah, currentVerse, currentReciter.id]);

  // Auto-play if requested
  useEffect(() => {
    if (visible && autoPlay && player.isLoaded && !isLoading) {
      playAudio();
    }
  }, [visible, autoPlay, player.isLoaded, isLoading]);

  // Listen to player status changes
  useEffect(() => {
    if (status) {
      // Handle playback completion - only once per audio session
      if (status.didJustFinish && !hasHandledCompletion.current) {
        secureLogger.info('Quran audio playback completed');
        hasHandledCompletion.current = true;
        handlePlaybackEnd();
      }
    }
  }, [status]);

  // Sleep timer countdown
  useEffect(() => {
    if (sleepTimeRemaining && sleepTimeRemaining > 0) {
      sleepTimerInterval.current = setTimeout(() => {
        setSleepTimeRemaining(prev => prev ? prev - 1 : null);
      }, 1000);
    } else if (sleepTimeRemaining === 0) {
      pauseAudio();
      setSleepTimer(null);
      setSleepTimeRemaining(null);
    }

    return () => {
      if (sleepTimerInterval.current) {
        clearTimeout(sleepTimerInterval.current);
      }
    };
  }, [sleepTimeRemaining]);

  const initializeAudio = async () => {
    try {
      setIsLoading(true);
      hasHandledCompletion.current = false; // Reset completion tracking

      const audioUrl = quranApi.getAudioUrl(currentSurah, currentVerse, currentReciter.id);
      secureLogger.info('Loading Quran audio', { audioUrl, surah: currentSurah, verse: currentVerse });

      // Load audio into player
      const audioSource = { uri: audioUrl };
      player.replace(audioSource);

      secureLogger.info('Quran audio loaded successfully');
    } catch (error) {
      secureLogger.error('Error initializing audio', error);
      // Don't show alert, just log the error
      secureLogger.info('Audio initialization failed, continuing without audio');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlaybackEnd = async () => {
    try {
      if (!player.isLoaded) {
        secureLogger.info('Player not loaded during playback end, skipping handler');
        return;
      }

      secureLogger.info('Handling playback end', { 
        repeatMode, 
        currentVerse, 
        currentSurah 
      });

      switch (repeatMode) {
        case 'verse':
          // Repeat current verse
          secureLogger.info('Repeating current verse');
          if (player.isLoaded) {
            await seekTo(0);
            await playAudio();
          }
          break;
        case 'surah':
          // Move to next verse or repeat surah
          secureLogger.info('Moving to next verse in surah');
          await playNextVerse();
          break;
        default:
          // Stop playback
          secureLogger.info('Playback ended, stopping');
          setIsPlaying(false);
          break;
      }
    } catch (error) {
      secureLogger.error('Error handling playback end', { 
        error: error instanceof Error ? error.message : String(error),
        repeatMode,
        currentVerse,
        playerLoaded: player?.isLoaded || false
      });
      // Gracefully handle the error without breaking the app
      setIsPlaying(false);
    }
  };

  const playAudio = async () => {
    try {
      if (!player.isLoaded) {
        secureLogger.info('Quran audio not loaded, attempting to initialize');
        await initializeAudio();
        return;
      }
      
      hapticFeedback.light();
      player.play();
      secureLogger.info('Quran audio playback started successfully');
    } catch (error) {
      secureLogger.error('Error playing Quran audio', error);
      secureLogger.info('Quran audio playback failed, continuing without audio');
    }
  };

  const pauseAudio = async () => {
    try {
      if (!player.isLoaded) {
        secureLogger.info('Quran audio not loaded for pause');
        return;
      }
      
      hapticFeedback.light();
      player.pause();
      secureLogger.info('Quran audio paused successfully');
    } catch (error) {
      secureLogger.error('Error pausing Quran audio', error);
    }
  };

  const stopAudio = async () => {
    try {
      if (!player.isLoaded) {
        secureLogger.info('Quran audio not loaded for stop');
        return;
      }
      
      hapticFeedback.light();
      player.pause();
      player.seekTo(0);
      secureLogger.info('Quran audio stopped successfully');
    } catch (error) {
      secureLogger.error('Error stopping Quran audio', error);
    }
  };

  const seekTo = async (positionSeconds: number) => {
    try {
      if (!player.isLoaded) return;
      
      player.seekTo(positionSeconds);
      secureLogger.info('Quran audio seek completed', { position: positionSeconds });
    } catch (error) {
      secureLogger.error('Error seeking Quran audio', error);
    }
  };

  const setSpeed = async (speed: number) => {
    try {
      setPlaybackSpeed(speed);
      await updateQuranSettings({ audioPlaybackSpeed: speed });
      
      // Note: expo-audio player volume property might be used for speed in some cases
      if (player.isLoaded && typeof player.volume !== 'undefined') {
        // For now, just update the state - actual speed control depends on player implementation
        secureLogger.info('Playback speed updated in settings', { speed });
      }
    } catch (error) {
      secureLogger.error('Error setting Quran audio playback speed', error);
    }
  };

  const playNextVerse = async () => {
    // Implementation would depend on surah verse count
    setCurrentVerse(prev => prev + 1);
  };

  const playPreviousVerse = async () => {
    if (currentVerse > 1) {
      setCurrentVerse(prev => prev - 1);
    }
  };

  const toggleRepeatMode = async () => {
    const modes: Array<'none' | 'verse' | 'surah'> = ['none', 'verse', 'surah'];
    const currentIndex = modes.indexOf(repeatMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    
    setRepeatMode(nextMode);
    await updateQuranSettings({ repeatMode: nextMode });
    hapticFeedback.light();
  };

  const setSleepTimerMinutes = (minutes: number) => {
    setSleepTimer(minutes);
    setSleepTimeRemaining(minutes * 60);
    hapticFeedback.success();
  };

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatSleepTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderProgressBar = () => {
    const progress = duration > 0 ? position / duration : 0;
    
    return (
      <View style={styles.progressContainer}>
        <Text style={[styles.timeText, { color: colors.text.secondary }]}>
          {formatTime(position)}
        </Text>
        
        <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
          <TouchableOpacity
            style={[
              styles.progressFill,
              {
                width: `${progress * 100}%`,
                backgroundColor: colors.primary,
              }
            ]}
            onPress={(event) => {
              const { locationX } = event.nativeEvent;
              const trackWidth = width - 120; // Approximate track width
              const newPositionSeconds = (locationX / trackWidth) * (duration / 1000);
              seekTo(newPositionSeconds);
            }}
          />
        </View>
        
        <Text style={[styles.timeText, { color: colors.text.secondary }]}>
          {formatTime(duration)}
        </Text>
      </View>
    );
  };

  const renderControls = () => (
    <View style={styles.controlsContainer}>
      {/* Previous */}
      <TouchableOpacity
        style={styles.controlButton}
        onPress={playPreviousVerse}
        disabled={currentVerse <= 1}
        {...getButtonA11yProps('Previous verse', 'Play previous verse', false)}
      >
        <Ionicons 
          name="play-skip-back" 
          size={24} 
          color={currentVerse <= 1 ? colors.text.tertiary : colors.text.primary} 
        />
      </TouchableOpacity>

      {/* Seek backward */}
      <TouchableOpacity
        style={styles.controlButton}
        onPress={() => seekTo(Math.max(0, (position / 1000) - 10))}
        {...getButtonA11yProps('Rewind 10 seconds', 'Go back 10 seconds', false)}
      >
        <Ionicons name="play-back" size={20} color={colors.text.primary} />
      </TouchableOpacity>

      {/* Play/Pause */}
      <TouchableOpacity
        style={[styles.playButton, { backgroundColor: colors.primary }]}
        onPress={isPlaying ? pauseAudio : playAudio}
        disabled={isLoading}
        {...getButtonA11yProps(
          isPlaying ? 'Pause' : 'Play', 
          `${isPlaying ? 'Pause' : 'Play'} audio recitation`, 
          false
        )}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.text.onPrimary} />
        ) : (
          <Ionicons 
            name={isPlaying ? 'pause' : 'play'} 
            size={32} 
            color={colors.text.onPrimary} 
          />
        )}
      </TouchableOpacity>

      {/* Seek forward */}
      <TouchableOpacity
        style={styles.controlButton}
        onPress={() => seekTo(Math.min(duration / 1000, (position / 1000) + 10))}
        {...getButtonA11yProps('Fast forward 10 seconds', 'Go forward 10 seconds', false)}
      >
        <Ionicons name="play-forward" size={20} color={colors.text.primary} />
      </TouchableOpacity>

      {/* Next */}
      <TouchableOpacity
        style={styles.controlButton}
        onPress={playNextVerse}
        {...getButtonA11yProps('Next verse', 'Play next verse', false)}
      >
        <Ionicons name="play-skip-forward" size={24} color={colors.text.primary} />
      </TouchableOpacity>
    </View>
  );

  const renderAdditionalControls = () => (
    <View style={styles.additionalControls}>
      {/* Speed Control */}
      <TouchableOpacity
        style={[styles.speedButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => {
          const speeds = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
          const currentIndex = speeds.indexOf(playbackSpeed);
          const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
          setSpeed(nextSpeed);
        }}
        {...getButtonA11yProps('Playback speed', `Current speed: ${playbackSpeed}x`, false)}
      >
        <Text style={[styles.speedText, { color: colors.text.primary }]}>
          {playbackSpeed}x
        </Text>
      </TouchableOpacity>

      {/* Repeat Mode */}
      <TouchableOpacity
        style={styles.controlButton}
        onPress={toggleRepeatMode}
        {...getButtonA11yProps('Repeat mode', `Current mode: ${repeatMode}`, false)}
      >
        <Ionicons 
          name={
            repeatMode === 'verse' ? 'repeat' : 
            repeatMode === 'surah' ? 'repeat' : 'repeat-outline'
          } 
          size={20} 
          color={repeatMode !== 'none' ? colors.primary : colors.text.secondary} 
        />
      </TouchableOpacity>

      {/* Reciter Selection */}
      <TouchableOpacity
        style={styles.controlButton}
        onPress={() => setShowReciterSelection(true)}
        {...getButtonA11yProps('Select reciter', `Current: ${currentReciter.name}`, false)}
      >
        <Ionicons name="person" size={20} color={colors.text.secondary} />
      </TouchableOpacity>

      {/* Sleep Timer */}
      <TouchableOpacity
        style={styles.controlButton}
        onPress={() => {
          if (sleepTimer) {
            setSleepTimer(null);
            setSleepTimeRemaining(null);
          } else {
            setSleepTimerMinutes(15); // Default 15 minutes
          }
        }}
        {...getButtonA11yProps(
          'Sleep timer', 
          sleepTimer ? `Timer set for ${sleepTimer} minutes` : 'Set sleep timer', 
          !!sleepTimer
        )}
      >
        <Ionicons 
          name={sleepTimer ? 'moon' : 'moon-outline'} 
          size={20} 
          color={sleepTimer ? colors.primary : colors.text.secondary} 
        />
      </TouchableOpacity>
    </View>
  );

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="chevron-down" size={24} color={colors.text.secondary} />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={[styles.title, { color: colors.text.primary }]}>
              {getSurahName(currentSurah)} {currentVerse}
            </Text>
            <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
              {currentReciter.name}
            </Text>
          </View>
          
          <TouchableOpacity onPress={() => setShowReciterSelection(true)}>
            <Ionicons name="person-circle" size={24} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Sleep Timer Display */}
          {sleepTimeRemaining && (
            <View style={[styles.sleepTimerDisplay, { backgroundColor: colors.surface }]}>
              <Ionicons name="moon" size={16} color={colors.primary} />
              <Text style={[styles.sleepTimerText, { color: colors.primary }]}>
                Sleep timer: {formatSleepTimer(sleepTimeRemaining)}
              </Text>
            </View>
          )}

          {/* Progress Bar */}
          {renderProgressBar()}

          {/* Main Controls */}
          {renderControls()}

          {/* Additional Controls */}
          {renderAdditionalControls()}

          {/* Repeat Mode Indicator */}
          {repeatMode !== 'none' && (
            <View style={[styles.repeatIndicator, { backgroundColor: colors.surface }]}>
              <Text style={[styles.repeatText, { color: colors.primary }]}>
                Repeat: {repeatMode === 'verse' ? 'Verse' : 'Surah'}
              </Text>
            </View>
          )}
        </View>

        {/* Reciter Selection Modal */}
        <ReciterSelection
          visible={showReciterSelection}
          onClose={() => setShowReciterSelection(false)}
          onSelect={(reciter) => updateQuranSettings({ defaultReciter: reciter.id })}
          currentReciter={currentReciter}
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  sleepTimerDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 20,
    marginBottom: 20,
    alignSelf: 'center',
  },
  sleepTimerText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
  },
  timeText: {
    fontSize: 14,
    minWidth: 50,
    textAlign: 'center',
  },
  progressTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  controlButton: {
    padding: 12,
    marginHorizontal: 8,
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 16,
  },
  additionalControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 20,
  },
  speedButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  speedText: {
    fontSize: 14,
    fontWeight: '500',
  },
  repeatIndicator: {
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  repeatText: {
    fontSize: 12,
    fontWeight: '500',
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
  reciterList: {
    padding: 16,
  },
  reciterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  reciterInfo: {
    flex: 1,
  },
  reciterName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  reciterDetails: {
    fontSize: 14,
  },
});

export default QuranAudioPlayer; 