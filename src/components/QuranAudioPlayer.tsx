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
import Slider from '@react-native-community/slider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useAppTheme } from '../utils/theme';
import { useQuranContext } from '../contexts/QuranContext';
import { QuranReciter } from '../types';
import { accessibilityManager, getButtonA11yProps } from '../utils/accessibility';
import { hapticFeedback } from '../utils/haptics';
import { secureLogger } from '../utils/secureLogger';
import { quranApi, getSurahName, AVAILABLE_RECITERS, SURAH_METADATA } from '../utils/quranApi';
import { 
  unifiedAudioService, 
  playQuranVerse, 
  pauseAudio, 
  resumeAudio, 
  stopAudio, 
  setAudioStateListener,
  AudioState 
} from '../utils/unifiedAudioService';

const { width } = Dimensions.get('window');

interface QuranAudioPlayerProps {
  visible: boolean;
  onClose: () => void;
  surahNumber?: number;
  verseNumber?: number;
  autoPlay?: boolean;
  playlistMode?: boolean;
}

interface ReciterSelectionProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (reciter: QuranReciter) => void;
  currentReciter: QuranReciter;
}

interface PlaylistItem {
  surah: number;
  verse: number;
  title: string;
  arabicTitle: string;
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
        hapticFeedback.light();
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
  playlistMode = false,
}) => {
  const { colors } = useAppTheme();
  const { settings, updateQuranSettings } = useQuranContext();

  // Local state
  const [currentSurah, setCurrentSurah] = useState(surahNumber);
  const [currentVerse, setCurrentVerse] = useState(verseNumber);
  const [showReciterSelection, setShowReciterSelection] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(settings.audioPlaybackSpeed || 1.0);
  const [repeatMode, setRepeatMode] = useState<'none' | 'verse' | 'surah' | 'playlist'>(settings.repeatMode || 'none');
  const [sleepTimer, setSleepTimer] = useState<number | null>(null);
  const [sleepTimeRemaining, setSleepTimeRemaining] = useState<number | null>(null);
  const [showSpeedSelector, setShowSpeedSelector] = useState(false);
  const [showSleepTimerSelector, setShowSleepTimerSelector] = useState(false);

  // Playlist functionality
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const [currentPlaylistIndex, setCurrentPlaylistIndex] = useState(0);
  const [shuffleMode, setShuffleMode] = useState(false);

  // Audio state from unified service
  const [audioState, setAudioState] = useState<AudioState>(unifiedAudioService.getState());
  
  // Refs
  const sleepTimerInterval = useRef<NodeJS.Timeout | null>(null);

  // Current reciter
  const currentReciter = AVAILABLE_RECITERS.find(r => r.id === settings.defaultReciter) || AVAILABLE_RECITERS[0];

  // Derived state
  const isPlaying = audioState.isPlaying && audioState.audioType === 'quran';
  const isLoading = audioState.isLoading && audioState.audioType === 'quran';
  const position = audioState.position;
  const duration = audioState.duration;

  // Initialize playlist
  useEffect(() => {
    if (playlistMode && visible) {
      generatePlaylist();
    }
  }, [playlistMode, visible, currentSurah]);

  // Generate playlist based on current surah
  const generatePlaylist = useCallback(() => {
    const surahMetadata = SURAH_METADATA.find(s => s.id === currentSurah);
    if (!surahMetadata) return;

    const items: PlaylistItem[] = [];
    for (let verse = 1; verse <= surahMetadata.totalVerses; verse++) {
      items.push({
        surah: currentSurah,
        verse,
        title: `Verse ${verse}`,
        arabicTitle: surahMetadata.name,
      });
    }
    
    setPlaylist(items);
    setCurrentPlaylistIndex(Math.max(0, currentVerse - 1));
  }, [currentSurah, currentVerse]);

  // Listen to audio state changes
  useEffect(() => {
    const unsubscribe = setAudioStateListener((state) => {
      setAudioState(state);
      
      // Handle audio completion in playlist mode
      if (playlistMode && state.audioType === 'quran' && !state.isPlaying && state.position >= state.duration * 0.95) {
        handlePlaylistNext();
      }
    });
    
    return unsubscribe;
  }, [playlistMode]);

  // Auto-play if requested
  useEffect(() => {
    if (visible && autoPlay) {
      const timer = setTimeout(() => {
        playAudio();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [visible, autoPlay]);

  // Update current surah/verse when props change
  useEffect(() => {
    setCurrentSurah(surahNumber);
    setCurrentVerse(verseNumber);
  }, [surahNumber, verseNumber]);

  // Sleep timer countdown
  useEffect(() => {
    if (sleepTimeRemaining && sleepTimeRemaining > 0) {
      sleepTimerInterval.current = setTimeout(() => {
        setSleepTimeRemaining(prev => prev ? prev - 1 : null);
      }, 1000);
    } else if (sleepTimeRemaining === 0) {
      handlePause();
      setSleepTimer(null);
      setSleepTimeRemaining(null);
      hapticFeedback.success();
    }

    return () => {
      if (sleepTimerInterval.current) {
        clearTimeout(sleepTimerInterval.current);
      }
    };
  }, [sleepTimeRemaining]);

  const playAudio = async () => {
    try {
      hapticFeedback.light();
      console.log(`[QuranAudioPlayer] Playing Quran verse ${currentSurah}:${currentVerse}`);
      
      await playQuranVerse(currentSurah, currentVerse, currentReciter.id, audioState.volume);
      
      secureLogger.info('Quran audio playback started', { 
        surah: currentSurah, 
        verse: currentVerse,
        reciter: currentReciter.id,
        playlistMode 
      });
    } catch (error) {
      secureLogger.error('Error playing Quran audio', error);
      Alert.alert('Audio Error', 'Unable to play audio. Please check your internet connection and try again.');
    }
  };

  const handlePause = async () => {
    try {
      hapticFeedback.light();
      await pauseAudio();
      secureLogger.info('Quran audio paused');
    } catch (error) {
      secureLogger.error('Error pausing Quran audio', error);
    }
  };

  const handleResume = async () => {
    try {
      hapticFeedback.light();
      await resumeAudio();
      secureLogger.info('Quran audio resumed');
    } catch (error) {
      secureLogger.error('Error resuming Quran audio', error);
    }
  };

  const handleStop = async () => {
    try {
      hapticFeedback.light();
      await stopAudio();
      secureLogger.info('Quran audio stopped');
    } catch (error) {
      secureLogger.error('Error stopping Quran audio', error);
    }
  };

  const seekTo = async (positionSeconds: number) => {
    try {
      await unifiedAudioService.seekTo(positionSeconds);
      secureLogger.info('Audio seek completed', { position: positionSeconds });
    } catch (error) {
      secureLogger.error('Error seeking audio', error);
    }
  };

  const handlePlaylistNext = async () => {
    if (!playlistMode || playlist.length === 0) return;

    let nextIndex = currentPlaylistIndex + 1;
    
    if (shuffleMode) {
      nextIndex = Math.floor(Math.random() * playlist.length);
    } else if (nextIndex >= playlist.length) {
      if (repeatMode === 'playlist') {
        nextIndex = 0;
      } else {
        return; // End of playlist
      }
    }

    const nextItem = playlist[nextIndex];
    setCurrentPlaylistIndex(nextIndex);
    setCurrentSurah(nextItem.surah);
    setCurrentVerse(nextItem.verse);
    
    // Auto-play next item
    setTimeout(() => {
      playAudio();
    }, 500);
  };

  const handlePlaylistPrevious = async () => {
    if (!playlistMode || playlist.length === 0) return;

    let prevIndex = currentPlaylistIndex - 1;
    
    if (shuffleMode) {
      prevIndex = Math.floor(Math.random() * playlist.length);
    } else if (prevIndex < 0) {
      prevIndex = playlist.length - 1;
    }

    const prevItem = playlist[prevIndex];
    setCurrentPlaylistIndex(prevIndex);
    setCurrentSurah(prevItem.surah);
    setCurrentVerse(prevItem.verse);
    
    // Auto-play previous item
    setTimeout(() => {
      playAudio();
    }, 500);
  };

  const playNextVerse = async () => {
    if (playlistMode) {
      handlePlaylistNext();
      return;
    }

    const surahMetadata = SURAH_METADATA.find(s => s.id === currentSurah);
    if (!surahMetadata) return;

    let newVerse = currentVerse + 1;
    let newSurah = currentSurah;

    // If we've reached the end of the surah
    if (newVerse > surahMetadata.totalVerses) {
      if (repeatMode === 'surah') {
        newVerse = 1; // Restart surah
      } else {
        // Move to next surah
        newSurah = currentSurah + 1;
        newVerse = 1;
        
        if (newSurah > 114) {
          if (repeatMode === 'playlist') {
            newSurah = 1; // Restart from beginning
          } else {
            return; // End of Quran
          }
        }
      }
    }

    setCurrentSurah(newSurah);
    setCurrentVerse(newVerse);
    secureLogger.info('Moving to next verse', { newSurah, newVerse });
    
    // Auto-play next verse
    setTimeout(() => {
      playAudio();
    }, 500);
  };

  const playPreviousVerse = async () => {
    if (playlistMode) {
      handlePlaylistPrevious();
      return;
    }

    let newVerse = currentVerse - 1;
    let newSurah = currentSurah;

    // If we've reached the beginning of the surah
    if (newVerse < 1) {
      // Move to previous surah
      newSurah = currentSurah - 1;
      
      if (newSurah < 1) {
        newSurah = 114; // Wrap to last surah
      }
      
      const prevSurahMetadata = SURAH_METADATA.find(s => s.id === newSurah);
      newVerse = prevSurahMetadata?.totalVerses || 1;
    }

    setCurrentSurah(newSurah);
    setCurrentVerse(newVerse);
    secureLogger.info('Moving to previous verse', { newSurah, newVerse });
    
    // Auto-play previous verse
    setTimeout(() => {
      playAudio();
    }, 500);
  };

  const toggleRepeatMode = async () => {
    const modes: Array<'none' | 'verse' | 'surah' | 'playlist'> = playlistMode 
      ? ['none', 'verse', 'playlist'] 
      : ['none', 'verse', 'surah'];
    const currentIndex = modes.indexOf(repeatMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    
    setRepeatMode(nextMode);
    await updateQuranSettings({ repeatMode: nextMode });
    hapticFeedback.light();
  };

  const toggleShuffleMode = () => {
    setShuffleMode(!shuffleMode);
    hapticFeedback.light();
  };

  const changePlaybackSpeed = async (speed: number) => {
    setPlaybackSpeed(speed);
    await updateQuranSettings({ audioPlaybackSpeed: speed });
    // Note: expo-audio doesn't currently support playback speed, but we'll store it for future use
    hapticFeedback.light();
  };

  const setSleepTimerMinutes = (minutes: number) => {
    setSleepTimer(minutes);
    setSleepTimeRemaining(minutes * 60);
    setShowSleepTimerSelector(false);
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
        
        <View style={styles.progressBarContainer}>
          <Slider
            style={styles.progressSlider}
            minimumValue={0}
            maximumValue={duration}
            value={position}
            onValueChange={(value) => seekTo(value / 1000)}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.border}
            thumbStyle={{ backgroundColor: colors.primary }}
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
        {...getButtonA11yProps('Previous verse', 'Play previous verse', false)}
      >
        <Ionicons 
          name="play-skip-back" 
          size={24} 
          color={colors.text.primary} 
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
        onPress={isPlaying ? handlePause : (audioState.audioType === 'quran' ? handleResume : playAudio)}
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
      <View style={styles.controlRow}>
        {/* Stop Button */}
        <TouchableOpacity
          style={styles.controlButton}
          onPress={handleStop}
          {...getButtonA11yProps('Stop audio', 'Stop audio playback', false)}
        >
          <Ionicons name="stop" size={20} color={colors.text.primary} />
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
              repeatMode === 'surah' || repeatMode === 'playlist' ? 'repeat' : 'repeat-outline'
            } 
            size={20} 
            color={repeatMode !== 'none' ? colors.primary : colors.text.secondary} 
          />
        </TouchableOpacity>

        {/* Shuffle Mode (only in playlist mode) */}
        {playlistMode && (
          <TouchableOpacity
            style={styles.controlButton}
            onPress={toggleShuffleMode}
            {...getButtonA11yProps('Shuffle mode', shuffleMode ? 'Shuffle enabled' : 'Shuffle disabled', shuffleMode)}
          >
            <Ionicons 
              name="shuffle" 
              size={20} 
              color={shuffleMode ? colors.primary : colors.text.secondary} 
            />
          </TouchableOpacity>
        )}

        {/* Playback Speed */}
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => setShowSpeedSelector(true)}
          {...getButtonA11yProps('Playback speed', `Current speed: ${playbackSpeed}x`, false)}
        >
          <MaterialIcons name="speed" size={20} color={colors.text.secondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.controlRow}>
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
          onPress={() => setShowSleepTimerSelector(true)}
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
    </View>
  );

  const testLocalAudio = async () => {
    try {
      console.log('[QuranAudioPlayer] Testing with local audio file...');
      
      // Use the existing local adhan from the prayer times system
      const localAdhanAudio: AdhanAudio = {
        id: 'local_adhan',
        name: 'Local Adhan (Test)',
        reciter: 'Local Audio',
        url: './aladhan.mp3',
        duration: 180,
        isLocal: true,
      };
      
      await unifiedAudioService.playPrayerAudio(localAdhanAudio, audioState.volume);
      secureLogger.info('Local audio test initiated');
    } catch (error) {
      console.error('[QuranAudioPlayer] Local audio test failed:', error);
      secureLogger.error('Error testing local audio', error);
    }
  };

  const testAudioUrl = async () => {
    try {
      console.log('[QuranAudioPlayer] Testing current audio URL...');
      await playAudio();
      secureLogger.info('Test audio playback initiated');
    } catch (error) {
      console.error('[QuranAudioPlayer] Test audio failed:', error);
      secureLogger.error('Error testing audio URL', error);
    }
  };

  const renderSpeedSelector = () => {
    const speeds = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];
    
    return (
      <Modal
        visible={showSpeedSelector}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSpeedSelector(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
              Playback Speed
            </Text>
            <TouchableOpacity onPress={() => setShowSpeedSelector(false)}>
              <Ionicons name="close" size={24} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.speedContainer}>
            {speeds.map((speed) => (
              <TouchableOpacity
                key={speed}
                style={[
                  styles.speedItem,
                  {
                    backgroundColor: speed === playbackSpeed ? colors.primary + '20' : colors.surface,
                    borderColor: speed === playbackSpeed ? colors.primary : colors.border,
                  }
                ]}
                onPress={() => {
                  changePlaybackSpeed(speed);
                  setShowSpeedSelector(false);
                }}
                {...getButtonA11yProps(`${speed}x speed`, `Set playback speed to ${speed}x`, speed === playbackSpeed)}
              >
                <Text style={[
                  styles.speedText, 
                  { 
                    color: speed === playbackSpeed ? colors.primary : colors.text.primary,
                    fontWeight: speed === playbackSpeed ? 'bold' : 'normal'
                  }
                ]}>
                  {speed}x
                </Text>
                {speed === playbackSpeed && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </SafeAreaView>
      </Modal>
    );
  };

  const renderSleepTimerSelector = () => {
    const timers = [
      { label: 'Off', minutes: 0 },
      { label: '5 min', minutes: 5 },
      { label: '10 min', minutes: 10 },
      { label: '15 min', minutes: 15 },
      { label: '30 min', minutes: 30 },
      { label: '45 min', minutes: 45 },
      { label: '1 hour', minutes: 60 },
      { label: '90 min', minutes: 90 },
      { label: '2 hours', minutes: 120 },
    ];
    
    return (
      <Modal
        visible={showSleepTimerSelector}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSleepTimerSelector(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
              Sleep Timer
            </Text>
            <TouchableOpacity onPress={() => setShowSleepTimerSelector(false)}>
              <Ionicons name="close" size={24} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.timerContainer}>
            {timers.map((timer) => (
              <TouchableOpacity
                key={timer.minutes}
                style={[
                  styles.timerItem,
                  {
                    backgroundColor: (sleepTimer === timer.minutes || (!sleepTimer && timer.minutes === 0)) 
                      ? colors.primary + '20' : colors.surface,
                    borderColor: (sleepTimer === timer.minutes || (!sleepTimer && timer.minutes === 0)) 
                      ? colors.primary : colors.border,
                  }
                ]}
                onPress={() => {
                  if (timer.minutes === 0) {
                    setSleepTimer(null);
                    setSleepTimeRemaining(null);
                  } else {
                    setSleepTimerMinutes(timer.minutes);
                  }
                }}
                {...getButtonA11yProps(
                  timer.label, 
                  timer.minutes === 0 ? 'Turn off sleep timer' : `Set sleep timer to ${timer.label}`, 
                  sleepTimer === timer.minutes
                )}
              >
                <Text style={[
                  styles.timerText, 
                  { 
                    color: (sleepTimer === timer.minutes || (!sleepTimer && timer.minutes === 0)) 
                      ? colors.primary : colors.text.primary,
                    fontWeight: (sleepTimer === timer.minutes || (!sleepTimer && timer.minutes === 0)) 
                      ? 'bold' : 'normal'
                  }
                ]}>
                  {timer.label}
                </Text>
                {(sleepTimer === timer.minutes || (!sleepTimer && timer.minutes === 0)) && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </SafeAreaView>
      </Modal>
    );
  };

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
            {playlistMode && (
              <Text style={[styles.playlistInfo, { color: colors.text.tertiary }]}>
                Playlist Mode • {currentPlaylistIndex + 1} of {playlist.length}
                {shuffleMode && ' • Shuffle'}
              </Text>
            )}
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

          {/* Debug URL Test Button */}
          <View style={[styles.debugContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.debugInfo}>
              <Text style={[styles.debugText, { color: colors.text.secondary }]}>
                Debug: Audio Type {audioState.audioType || 'none'} | Playing: {isPlaying ? 'Yes' : 'No'}
              </Text>
              <Text style={[styles.debugText, { color: colors.text.secondary }]}>
                Loading: {isLoading ? 'Yes' : 'No'} | Duration: {Math.floor(duration / 1000)}s
              </Text>
              <Text style={[styles.debugUrlText, { color: colors.text.tertiary }]} numberOfLines={2}>
                URL: https://www.everyayah.com/data/Mishary_Rashid_Alafasy_128kbps/{currentSurah.toString().padStart(3, '0')}{currentVerse.toString().padStart(3, '0')}.mp3
              </Text>
            </View>
            <View style={styles.testButtons}>
              <TouchableOpacity
                style={[styles.testButton, { backgroundColor: colors.secondary, marginRight: 8 }]}
                onPress={testAudioUrl}
              >
                <Text style={[styles.testButtonText, { color: 'white' }]}>
                  Test URL
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.testButton, { backgroundColor: colors.primary }]}
                onPress={testLocalAudio}
              >
                <Text style={[styles.testButtonText, { color: 'white' }]}>
                  Test Local
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Repeat Mode Indicator */}
          {repeatMode !== 'none' && (
            <View style={[styles.repeatIndicator, { backgroundColor: colors.surface }]}>
              <Text style={[styles.repeatText, { color: colors.primary }]}>
                Repeat: {repeatMode === 'verse' ? 'Verse' : repeatMode === 'surah' ? 'Surah' : 'Playlist'}
              </Text>
            </View>
          )}

          {/* Playback Speed Indicator */}
          {playbackSpeed !== 1.0 && (
            <View style={[styles.speedIndicator, { backgroundColor: colors.surface }]}>
              <Text style={[styles.speedIndicatorText, { color: colors.secondary }]}>
                Speed: {playbackSpeed}x
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

        {/* Speed Selection Modal */}
        {renderSpeedSelector()}

        {/* Sleep Timer Selection Modal */}
        {renderSleepTimerSelector()}
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
    paddingHorizontal: 20,
    paddingVertical: 16,
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
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  playlistInfo: {
    fontSize: 12,
    marginTop: 2,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  sleepTimerDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  sleepTimerText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '500',
    minWidth: 40,
    textAlign: 'center',
  },
  progressBarContainer: {
    flex: 1,
    marginHorizontal: 12,
  },
  progressSlider: {
    width: '100%',
    height: 40,
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  controlButton: {
    padding: 12,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  additionalControls: {
    marginBottom: 20,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 16,
  },
  repeatIndicator: {
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 8,
  },
  repeatText: {
    fontSize: 12,
    fontWeight: '500',
  },
  speedIndicator: {
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  speedIndicatorText: {
    fontSize: 12,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  reciterList: {
    padding: 20,
  },
  reciterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  reciterInfo: {
    flex: 1,
  },
  reciterName: {
    fontSize: 16,
    fontWeight: '600',
  },
  reciterDetails: {
    fontSize: 14,
    marginTop: 4,
  },
  speedContainer: {
    padding: 20,
  },
  speedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  speedText: {
    fontSize: 16,
    fontWeight: '600',
  },
  timerContainer: {
    padding: 20,
  },
  timerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  timerText: {
    fontSize: 16,
    fontWeight: '600',
  },
  debugContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    marginBottom: 16,
  },
  debugInfo: {
    flex: 1,
    marginRight: 12,
  },
  debugText: {
    fontSize: 12,
    marginBottom: 2,
  },
  debugUrlText: {
    fontSize: 10,
    fontFamily: 'monospace',
  },
  testButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  testButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  testButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default QuranAudioPlayer; 