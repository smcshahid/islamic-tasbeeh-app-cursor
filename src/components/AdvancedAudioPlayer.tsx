import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  Image,
  Modal,
  Animated,
} from 'react-native';
import { useAudioPlayer } from 'expo-audio';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Slider from '@react-native-community/slider';
import advancedAudioService, { AudioTrack, Playlist, PlaybackState, AudioEffect } from '../services/AdvancedAudioService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface AdvancedAudioPlayerProps {
  initialTrack?: AudioTrack;
  playlist?: Playlist;
  onClose?: () => void;
  isVisible: boolean;
}

export default function AdvancedAudioPlayer({
  initialTrack,
  playlist,
  onClose,
  isVisible,
}: AdvancedAudioPlayerProps) {
  const [playbackState, setPlaybackState] = useState<PlaybackState>(advancedAudioService.getPlaybackState());
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [showEffects, setShowEffects] = useState(false);
  const [seekValue, setSeekValue] = useState(0);
  const [isSeekingUser, setIsSeekingUser] = useState(false);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [currentVisualization, setCurrentVisualization] = useState<'waveform' | 'spectrum' | 'circle'>('waveform');
  
  const player = useAudioPlayer();
  const rotationValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;

  // Initialize player with track
  useEffect(() => {
    if (initialTrack && isVisible) {
      advancedAudioService.playTrack(initialTrack, playlist);
    }
  }, [initialTrack, playlist, isVisible]);

  // Subscribe to service events
  useEffect(() => {
    const handlePlaybackStateChanged = (state: PlaybackState) => {
      setPlaybackState(state);
      if (!isSeekingUser) {
        setSeekValue(state.position);
      }
      
      // Update actual player
      if (state.currentTrack && state.isPlaying) {
        player.replace(state.currentTrack.source);
        player.play();
        if (player.volume !== undefined) {
          player.volume = state.volume;
        }
      }
    };

    advancedAudioService.on('playbackStateChanged', handlePlaybackStateChanged);
    
    return () => {
      advancedAudioService.off('playbackStateChanged', handlePlaybackStateChanged);
    };
  }, [isSeekingUser, player]);

  // Animation effects
  useEffect(() => {
    if (playbackState.isPlaying) {
      // Rotation animation for artwork
      Animated.loop(
        Animated.timing(rotationValue, {
          toValue: 1,
          duration: 10000,
          useNativeDriver: true,
        })
      ).start();

      // Pulse animation for play button
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseValue, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseValue, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      rotationValue.stopAnimation();
      pulseValue.stopAnimation();
    }
  }, [playbackState.isPlaying]);

  // Generate mock waveform data
  useEffect(() => {
    const generateWaveform = () => {
      const data = Array.from({ length: 100 }, () => Math.random() * 100);
      setWaveformData(data);
    };
    generateWaveform();
  }, [playbackState.currentTrack]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeekStart = () => {
    setIsSeekingUser(true);
  };

  const handleSeekComplete = (value: number) => {
    setIsSeekingUser(false);
    advancedAudioService.seekTo(value);
    player.seekTo(value);
  };

  const handlePlayPause = () => {
    if (playbackState.isPlaying) {
      advancedAudioService.pausePlayback();
      player.pause();
    } else {
      advancedAudioService.resumePlayback();
      player.play();
    }
  };

  const handleNext = () => {
    advancedAudioService.playNext();
  };

  const handlePrevious = () => {
    advancedAudioService.playPrevious();
  };

  const handleShuffle = () => {
    advancedAudioService.toggleShuffle();
  };

  const handleRepeat = () => {
    advancedAudioService.toggleRepeatMode();
  };

  const handleVolumeChange = (volume: number) => {
    advancedAudioService.setVolume(volume);
    if (player.volume !== undefined) {
      player.volume = volume;
    }
  };

  const handleSpeedChange = (speed: number) => {
    advancedAudioService.setPlaybackRate(speed);
  };

  const handleFavorite = () => {
    if (playbackState.currentTrack) {
      advancedAudioService.toggleFavorite(playbackState.currentTrack);
    }
  };

  const renderWaveform = () => {
    return (
      <View style={styles.waveformContainer}>
        {waveformData.map((height, index) => (
          <Animated.View
            key={index}
            style={[
              styles.waveformBar,
              {
                height: height * 0.8,
                backgroundColor: index < (seekValue / playbackState.duration) * 100 ? '#FF6B35' : '#333',
              },
            ]}
          />
        ))}
      </View>
    );
  };

  const renderSpectrum = () => {
    return (
      <View style={styles.spectrumContainer}>
        {Array.from({ length: 20 }, (_, index) => (
          <Animated.View
            key={index}
            style={[
              styles.spectrumBar,
              {
                height: Math.random() * 100 + 20,
                backgroundColor: playbackState.isPlaying ? '#FF6B35' : '#333',
              },
            ]}
          />
        ))}
      </View>
    );
  };

  const renderCircleVisualizer = () => {
    const rotation = rotationValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    return (
      <View style={styles.circleContainer}>
        <Animated.View
          style={[
            styles.outerCircle,
            { transform: [{ rotate: rotation }] },
          ]}
        >
          {Array.from({ length: 12 }, (_, index) => (
            <Animated.View
              key={index}
              style={[
                styles.circleBar,
                {
                  transform: [
                    { rotate: `${index * 30}deg` },
                    { translateY: -50 },
                  ],
                  height: playbackState.isPlaying ? Math.random() * 30 + 10 : 5,
                },
              ]}
            />
          ))}
        </Animated.View>
      </View>
    );
  };

  const renderVisualization = () => {
    switch (currentVisualization) {
      case 'waveform':
        return renderWaveform();
      case 'spectrum':
        return renderSpectrum();
      case 'circle':
        return renderCircleVisualizer();
      default:
        return renderWaveform();
    }
  };

  const renderPlaylistModal = () => (
    <Modal visible={showPlaylist} animationType="slide" transparent>
      <BlurView intensity={80} style={styles.modalContainer}>
        <View style={styles.playlistModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Current Playlist</Text>
            <TouchableOpacity onPress={() => setShowPlaylist(false)}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.playlistContent}>
            {playbackState.currentPlaylist?.tracks.map((track) => (
              <TouchableOpacity
                key={track.id}
                style={[
                  styles.playlistItem,
                  track.id === playbackState.currentTrack?.id && styles.currentTrackItem,
                ]}
                onPress={() => advancedAudioService.playTrack(track, playbackState.currentPlaylist || undefined)}
              >
                <Image source={{ uri: track.artwork }} style={styles.playlistItemArtwork} />
                <View style={styles.playlistItemInfo}>
                  <Text style={styles.playlistItemTitle}>{track.title}</Text>
                  <Text style={styles.playlistItemArtist}>{track.artist}</Text>
                </View>
                <Text style={styles.playlistItemDuration}>
                  {formatDuration(track.duration || 0)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </BlurView>
    </Modal>
  );

  const renderEffectsModal = () => (
    <Modal visible={showEffects} animationType="slide" transparent>
      <BlurView intensity={80} style={styles.modalContainer}>
        <View style={styles.effectsModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Audio Effects</Text>
            <TouchableOpacity onPress={() => setShowEffects(false)}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.effectsContent}>
            {/* Equalizer */}
            <View style={styles.effectSection}>
              <Text style={styles.effectTitle}>Equalizer</Text>
              <View style={styles.equalizerContainer}>
                {['60Hz', '170Hz', '310Hz', '600Hz', '1kHz', '3kHz', '6kHz', '12kHz', '14kHz', '16kHz'].map((freq, index) => (
                  <View key={freq} style={styles.equalizerBand}>
                    <Text style={styles.equalizerLabel}>{freq}</Text>
                    <Slider
                      style={styles.equalizerSlider}
                      minimumValue={-12}
                      maximumValue={12}
                      value={0}
                      minimumTrackTintColor="#FF6B35"
                      maximumTrackTintColor="#333"
                    />
                  </View>
                ))}
              </View>
            </View>

            {/* Speed Control */}
            <View style={styles.effectSection}>
              <Text style={styles.effectTitle}>Playback Speed</Text>
              <View style={styles.speedControls}>
                {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((speed) => (
                  <TouchableOpacity
                    key={speed}
                    style={[
                      styles.speedButton,
                      playbackState.playbackRate === speed && styles.speedButtonActive,
                    ]}
                    onPress={() => handleSpeedChange(speed)}
                  >
                    <Text style={styles.speedButtonText}>{speed}x</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Audio Effects */}
            <View style={styles.effectSection}>
              <Text style={styles.effectTitle}>Effects</Text>
              {playbackState.effects.map((effect) => (
                <View key={effect.id} style={styles.effectItem}>
                  <Text style={styles.effectName}>{effect.name}</Text>
                  <TouchableOpacity
                    style={[
                      styles.effectToggle,
                      effect.enabled && styles.effectToggleActive,
                    ]}
                    onPress={() => advancedAudioService.toggleEffect(effect.id)}
                  >
                    <Text style={styles.effectToggleText}>
                      {effect.enabled ? 'ON' : 'OFF'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </BlurView>
    </Modal>
  );

  if (!isVisible) return null;

  return (
    <Modal visible={isVisible} animationType="slide">
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Ionicons name="chevron-down" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Now Playing</Text>
          <TouchableOpacity onPress={() => setShowPlaylist(true)} style={styles.headerButton}>
            <Ionicons name="list" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Artwork */}
          <View style={styles.artworkContainer}>
            <Animated.View
              style={[
                styles.artworkWrapper,
                {
                  transform: [
                    { rotate: rotationValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    }) },
                    { scale: pulseValue },
                  ],
                },
              ]}
            >
              <Image
                source={{ uri: playbackState.currentTrack?.artwork || 'https://via.placeholder.com/300' }}
                style={styles.artwork}
              />
            </Animated.View>
          </View>

          {/* Track Info */}
          <View style={styles.trackInfo}>
            <Text style={styles.trackTitle}>{playbackState.currentTrack?.title || 'Unknown Track'}</Text>
            <Text style={styles.trackArtist}>{playbackState.currentTrack?.artist || 'Unknown Artist'}</Text>
            <Text style={styles.trackAlbum}>{playbackState.currentTrack?.album || ''}</Text>
          </View>

          {/* Visualization Toggle */}
          <View style={styles.visualizationToggle}>
            {(['waveform', 'spectrum', 'circle'] as const).map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.visualizationButton,
                  currentVisualization === type && styles.visualizationButtonActive,
                ]}
                onPress={() => setCurrentVisualization(type)}
              >
                <Text style={styles.visualizationButtonText}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Visualization */}
          <View style={styles.visualizationContainer}>
            {renderVisualization()}
          </View>

          {/* Progress */}
          <View style={styles.progressContainer}>
            <Text style={styles.progressTime}>{formatDuration(seekValue)}</Text>
            <Slider
              style={styles.progressSlider}
              minimumValue={0}
              maximumValue={playbackState.duration}
              value={seekValue}
              onValueChange={setSeekValue}
              onSlidingStart={handleSeekStart}
              onSlidingComplete={handleSeekComplete}
              minimumTrackTintColor="#FF6B35"
              maximumTrackTintColor="#333"
            />
            <Text style={styles.progressTime}>{formatDuration(playbackState.duration)}</Text>
          </View>

          {/* Main Controls */}
          <View style={styles.mainControls}>
            <TouchableOpacity
              onPress={handleShuffle}
              style={[styles.controlButton, playbackState.shuffleEnabled && styles.controlButtonActive]}
            >
              <Ionicons name="shuffle" size={24} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity onPress={handlePrevious} style={styles.controlButton}>
              <Ionicons name="play-skip-back" size={28} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity onPress={handlePlayPause} style={styles.playButton}>
              <Ionicons
                name={playbackState.isPlaying ? "pause" : "play"}
                size={36}
                color="#fff"
              />
            </TouchableOpacity>

            <TouchableOpacity onPress={handleNext} style={styles.controlButton}>
              <Ionicons name="play-skip-forward" size={28} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleRepeat}
              style={[styles.controlButton, playbackState.repeatMode !== 'none' && styles.controlButtonActive]}
            >
              <Ionicons 
                name={playbackState.repeatMode === 'track' ? "repeat" : "repeat"} 
                size={24} 
                color="#fff" 
              />
            </TouchableOpacity>
          </View>

          {/* Secondary Controls */}
          <View style={styles.secondaryControls}>
            <TouchableOpacity onPress={handleFavorite} style={styles.secondaryButton}>
              <Ionicons
                name={playbackState.currentTrack?.isFavorite ? "heart" : "heart-outline"}
                size={24}
                color={playbackState.currentTrack?.isFavorite ? "#FF6B35" : "#fff"}
              />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setShowEffects(true)} style={styles.secondaryButton}>
              <MaterialIcons name="equalizer" size={24} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton}>
              <Ionicons name="share-outline" size={24} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton}>
              <Ionicons name="download-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Volume Control */}
          <View style={styles.volumeContainer}>
            <Ionicons name="volume-low" size={20} color="#fff" />
            <Slider
              style={styles.volumeSlider}
              minimumValue={0}
              maximumValue={1}
              value={playbackState.volume}
              onValueChange={handleVolumeChange}
              minimumTrackTintColor="#FF6B35"
              maximumTrackTintColor="#333"
            />
            <Ionicons name="volume-high" size={20} color="#fff" />
          </View>
        </ScrollView>

        {renderPlaylistModal()}
        {renderEffectsModal()}
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerButton: {
    padding: 10,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  artworkContainer: {
    alignItems: 'center',
    marginVertical: 30,
  },
  artworkWrapper: {
    width: 280,
    height: 280,
    borderRadius: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  artwork: {
    width: '100%',
    height: '100%',
    borderRadius: 140,
  },
  trackInfo: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  trackTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  trackArtist: {
    color: '#ccc',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 4,
  },
  trackAlbum: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
  },
  visualizationToggle: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  visualizationButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 5,
  },
  visualizationButtonActive: {
    backgroundColor: '#FF6B35',
  },
  visualizationButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  visualizationContainer: {
    height: 120,
    marginHorizontal: 20,
    marginBottom: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  waveformBar: {
    width: 3,
    marginHorizontal: 1,
    borderRadius: 2,
    minHeight: 4,
  },
  spectrumContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: '100%',
  },
  spectrumBar: {
    width: 8,
    marginHorizontal: 2,
    borderRadius: 4,
    minHeight: 10,
  },
  circleContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  outerCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    position: 'relative',
  },
  circleBar: {
    width: 4,
    backgroundColor: '#FF6B35',
    position: 'absolute',
    borderRadius: 2,
    left: '50%',
    marginLeft: -2,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  progressTime: {
    color: '#ccc',
    fontSize: 14,
    minWidth: 40,
  },
  progressSlider: {
    flex: 1,
    height: 40,
    marginHorizontal: 10,
  },
  mainControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  controlButton: {
    padding: 15,
    marginHorizontal: 10,
  },
  controlButtonActive: {
    backgroundColor: 'rgba(255, 107, 53, 0.3)',
    borderRadius: 25,
  },
  playButton: {
    backgroundColor: '#FF6B35',
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
  },
  secondaryControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  secondaryButton: {
    padding: 15,
    marginHorizontal: 15,
  },
  volumeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  volumeSlider: {
    flex: 1,
    height: 40,
    marginHorizontal: 15,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  playlistModal: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: screenHeight * 0.8,
  },
  effectsModal: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: screenHeight * 0.8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  playlistContent: {
    flex: 1,
  },
  playlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  currentTrackItem: {
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
  },
  playlistItemArtwork: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 15,
  },
  playlistItemInfo: {
    flex: 1,
  },
  playlistItemTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  playlistItemArtist: {
    color: '#ccc',
    fontSize: 14,
    marginTop: 2,
  },
  playlistItemDuration: {
    color: '#999',
    fontSize: 14,
  },
  effectsContent: {
    flex: 1,
    padding: 20,
  },
  effectSection: {
    marginBottom: 30,
  },
  effectTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  equalizerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 150,
  },
  equalizerBand: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 2,
  },
  equalizerLabel: {
    color: '#ccc',
    fontSize: 10,
    marginBottom: 5,
  },
  equalizerSlider: {
    width: 20,
    height: 120,
  },
  speedControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  speedButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
  },
  speedButtonActive: {
    backgroundColor: '#FF6B35',
  },
  speedButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  effectItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  effectName: {
    color: '#fff',
    fontSize: 16,
  },
  effectToggle: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
  },
  effectToggleActive: {
    backgroundColor: '#FF6B35',
  },
  effectToggleText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
}); 