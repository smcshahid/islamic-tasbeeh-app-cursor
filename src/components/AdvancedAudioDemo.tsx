import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AdvancedAudioPlayer from './AdvancedAudioPlayer';
import AudioRecordingStudio from './AudioRecordingStudio';
import AudioPlaylistManager from './AudioPlaylistManager';
import advancedAudioService, { AudioTrack, Playlist, PlaybackState } from '../services/AdvancedAudioService';

const { width: screenWidth } = Dimensions.get('window');

interface AdvancedAudioDemoProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function AdvancedAudioDemo({ isVisible, onClose }: AdvancedAudioDemoProps) {
  const [showPlayer, setShowPlayer] = useState(false);
  const [showRecordingStudio, setShowRecordingStudio] = useState(false);
  const [showPlaylistManager, setShowPlaylistManager] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(null);
  const [currentPlaylist, setCurrentPlaylist] = useState<Playlist | null>(null);
  const [playbackState, setPlaybackState] = useState<PlaybackState>(advancedAudioService.getPlaybackState());
  const [analytics, setAnalytics] = useState<any>({});
  const [favorites, setFavorites] = useState<AudioTrack[]>([]);
  const [history, setHistory] = useState<AudioTrack[]>([]);

  // Sample tracks for demonstration
  const sampleTracks: AudioTrack[] = [
    {
      id: 'sample1',
      title: 'Islamic Nasheed',
      artist: 'Nasheed Artist',
      source: require('../../aladhan.mp3'),
      duration: 213,
      genre: 'Islamic',
      album: 'Spiritual Collection',
      artwork: 'https://via.placeholder.com/300x300/4CAF50/white?text=Islamic',
      tags: ['nasheed', 'spiritual', 'vocals'],
      description: 'Beautiful Islamic nasheed for spiritual reflection',
    },
    {
      id: 'sample2',
      title: 'Quran Recitation',
      artist: 'Qari Reciter',
      source: require('../../aladhan.mp3'),
      duration: 180,
      genre: 'Quran',
      album: 'Holy Quran',
      artwork: 'https://via.placeholder.com/300x300/2196F3/white?text=Quran',
      tags: ['quran', 'recitation', 'arabic'],
      description: 'Beautiful Quran recitation with tajweed',
    },
    {
      id: 'sample3',
      title: 'Dhikr Meditation',
      artist: 'Spiritual Guide',
      source: require('../../aladhan.mp3'),
      duration: 300,
      genre: 'Meditation',
      album: 'Peace Collection',
      artwork: 'https://via.placeholder.com/300x300/FF9800/white?text=Dhikr',
      tags: ['dhikr', 'meditation', 'peace'],
      description: 'Guided dhikr session for inner peace',
    },
    {
      id: 'sample4',
      title: 'Prayer Time Call',
      artist: 'Muezzin Voice',
      source: require('../../aladhan.mp3'),
      duration: 90,
      genre: 'Adhan',
      album: 'Prayer Collection',
      artwork: 'https://via.placeholder.com/300x300/9C27B0/white?text=Adhan',
      tags: ['adhan', 'prayer', 'call'],
      description: 'Beautiful call to prayer with traditional melody',
    },
  ];

  useEffect(() => {
    if (isVisible) {
      initializeDemoData();
      loadData();
    }

    // Subscribe to service events
    const handlePlaybackStateChanged = (state: PlaybackState) => {
      setPlaybackState(state);
    };

    const handleHistoryUpdated = (newHistory: AudioTrack[]) => {
      setHistory(newHistory);
    };

    advancedAudioService.on('playbackStateChanged', handlePlaybackStateChanged);
    advancedAudioService.on('historyUpdated', handleHistoryUpdated);

    return () => {
      advancedAudioService.off('playbackStateChanged', handlePlaybackStateChanged);
      advancedAudioService.off('historyUpdated', handleHistoryUpdated);
    };
  }, [isVisible]);

  const initializeDemoData = async () => {
    try {
      // Create sample playlists if they don't exist
      const existingPlaylists = advancedAudioService.getPlaylists();
      
      if (existingPlaylists.length === 0) {
        const islamicPlaylist = await advancedAudioService.createPlaylist(
          'Islamic Collection',
          'Beautiful collection of Islamic audio content'
        );

        const spiritualPlaylist = await advancedAudioService.createPlaylist(
          'Spiritual Journey',
          'Peaceful tracks for meditation and reflection'
        );

        // Add tracks to playlists
        await advancedAudioService.addTrackToPlaylist(islamicPlaylist.id, sampleTracks[0]);
        await advancedAudioService.addTrackToPlaylist(islamicPlaylist.id, sampleTracks[1]);
        await advancedAudioService.addTrackToPlaylist(islamicPlaylist.id, sampleTracks[3]);

        await advancedAudioService.addTrackToPlaylist(spiritualPlaylist.id, sampleTracks[2]);
        await advancedAudioService.addTrackToPlaylist(spiritualPlaylist.id, sampleTracks[0]);

        console.log('[AdvancedAudioDemo] Sample playlists created');
      }

      // Add sample effects
      const sampleEffects = [
        {
          id: 'reverb1',
          name: 'Cathedral Reverb',
          type: 'reverb' as const,
          enabled: false,
          settings: { wetness: 0.3, roomSize: 0.8, decay: 0.6 },
        },
        {
          id: 'eq1',
          name: 'Vocal Enhancer',
          type: 'equalizer' as const,
          enabled: false,
          settings: { low: 0, mid: 2, high: 1 },
        },
      ];

      for (const effect of sampleEffects) {
        await advancedAudioService.addEffect(effect as any);
      }

    } catch (error) {
      console.error('[AdvancedAudioDemo] Error initializing demo data:', error);
    }
  };

  const loadData = () => {
    const analyticsData = advancedAudioService.getAnalytics();
    const favoriteTracks = advancedAudioService.getFavorites();
    const playHistory = advancedAudioService.getHistory();

    setAnalytics(analyticsData);
    setFavorites(favoriteTracks);
    setHistory(playHistory);
  };

  const handlePlayTrack = (track: AudioTrack, playlist?: Playlist) => {
    setCurrentTrack(track);
    setCurrentPlaylist(playlist || null);
    setShowPlayer(true);
  };

  const handlePlayPlaylist = (playlist: Playlist) => {
    if (playlist.tracks.length > 0) {
      setCurrentTrack(playlist.tracks[0]);
      setCurrentPlaylist(playlist);
      setShowPlayer(true);
    } else {
      Alert.alert('Empty Playlist', 'This playlist has no tracks to play');
    }
  };

  const renderFeatureCard = (
    title: string,
    description: string,
    icon: string,
    iconType: 'Ionicons' | 'MaterialIcons',
    onPress: () => void,
    gradient: [string, string, ...string[]]
  ) => (
    <TouchableOpacity style={styles.featureCard} onPress={onPress}>
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.featureGradient}
      >
        <View style={styles.featureIcon}>
          {iconType === 'Ionicons' ? (
            <Ionicons name={icon as any} size={32} color="#fff" />
          ) : (
            <MaterialIcons name={icon as any} size={32} color="#fff" />
          )}
        </View>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderTrackItem = (track: AudioTrack, showPlayCount = false) => (
    <TouchableOpacity
      key={track.id}
      style={styles.trackItem}
      onPress={() => handlePlayTrack(track)}
    >
      <View style={styles.trackArtwork}>
        <Text style={styles.trackArtworkText}>{track.title.charAt(0)}</Text>
      </View>
      <View style={styles.trackInfo}>
        <Text style={styles.trackTitle}>{track.title}</Text>
        <Text style={styles.trackArtist}>{track.artist}</Text>
        {showPlayCount && track.playCount && (
          <Text style={styles.trackPlayCount}>
            Played {track.playCount} time{track.playCount !== 1 ? 's' : ''}
          </Text>
        )}
      </View>
      <View style={styles.trackActions}>
        <TouchableOpacity onPress={() => advancedAudioService.toggleFavorite(track)}>
          <Ionicons
            name={track.isFavorite ? "heart" : "heart-outline"}
            size={20}
            color={track.isFavorite ? "#FF6B35" : "#666"}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (!isVisible) return null;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Advanced Audio System</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
          {/* Current Playback Status */}
          {playbackState.currentTrack && (
            <View style={styles.nowPlayingCard}>
              <Text style={styles.nowPlayingTitle}>Now Playing</Text>
              <Text style={styles.nowPlayingTrack}>
                {playbackState.currentTrack.title} - {playbackState.currentTrack.artist}
              </Text>
              <View style={styles.nowPlayingControls}>
                <Text style={styles.nowPlayingStatus}>
                  {playbackState.isPlaying ? '▶️ Playing' : '⏸️ Paused'}
                </Text>
                <TouchableOpacity onPress={() => setShowPlayer(true)}>
                  <Text style={styles.openPlayerText}>Open Player</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Feature Cards */}
          <Text style={styles.sectionTitle}>Features</Text>
          <View style={styles.featuresGrid}>
            {renderFeatureCard(
              'Audio Player',
              'Advanced player with visualizations, effects, and controls',
              'play-circle',
              'Ionicons',
              () => {
                if (sampleTracks.length > 0) {
                  handlePlayTrack(sampleTracks[0]);
                }
              },
              ['#FF6B35', '#F7931E']
            )}

            {renderFeatureCard(
              'Recording Studio',
              'Professional recording with real-time visualization',
              'mic',
              'Ionicons',
              () => setShowRecordingStudio(true),
              ['#9C27B0', '#673AB7']
            )}

            {renderFeatureCard(
              'Playlist Manager',
              'Create, organize, and share your audio collections',
              'list',
              'Ionicons',
              () => setShowPlaylistManager(true),
              ['#2196F3', '#3F51B5']
            )}

            {renderFeatureCard(
              'Audio Analytics',
              'Track your listening habits and preferences',
              'analytics',
              'Ionicons',
              () => Alert.alert('Analytics', `Total plays: ${Object.keys(analytics).length}`),
              ['#4CAF50', '#8BC34A']
            )}
          </View>

          {/* Sample Tracks */}
          <Text style={styles.sectionTitle}>Sample Audio Content</Text>
          <View style={styles.tracksContainer}>
            {sampleTracks.map(track => renderTrackItem(track))}
          </View>

          {/* Recently Played */}
          {history.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Recently Played</Text>
              <View style={styles.tracksContainer}>
                {history.slice(0, 3).map(track => renderTrackItem(track, true))}
              </View>
            </>
          )}

          {/* Favorites */}
          {favorites.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Favorites</Text>
              <View style={styles.tracksContainer}>
                {favorites.slice(0, 3).map(track => renderTrackItem(track))}
              </View>
            </>
          )}

          {/* Quick Actions */}
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => advancedAudioService.clearHistory()}
            >
              <Ionicons name="trash-outline" size={20} color="#fff" />
              <Text style={styles.quickActionText}>Clear History</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => {
                const playlists = advancedAudioService.getPlaylists();
                Alert.alert('Playlists', `You have ${playlists.length} playlist${playlists.length !== 1 ? 's' : ''}`);
              }}
            >
              <Ionicons name="folder-outline" size={20} color="#fff" />
              <Text style={styles.quickActionText}>Show Stats</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => Alert.alert('Demo', 'This is a comprehensive audio system demo!')}
            >
              <Ionicons name="information-circle-outline" size={20} color="#fff" />
              <Text style={styles.quickActionText}>About Demo</Text>
            </TouchableOpacity>
          </View>

          {/* Audio System Info */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>System Features</Text>
            <Text style={styles.infoText}>
              • 🎵 Advanced audio playback with expo-audio
              {'\n'}• 🎤 Professional recording capabilities
              {'\n'}• 📊 Real-time waveform visualization
              {'\n'}• 🎛️ Audio effects and equalizer
              {'\n'}• 📋 Playlist management system
              {'\n'}• ❤️ Favorites and history tracking
              {'\n'}• 📈 Audio analytics and insights
              {'\n'}• 🔄 Shuffle and repeat modes
              {'\n'}• ⚡ Background playback support
              {'\n'}• 📱 Modern SoundCloud-inspired UI
            </Text>
          </View>
        </ScrollView>

        {/* Modals */}
        <AdvancedAudioPlayer
          isVisible={showPlayer}
          initialTrack={currentTrack || undefined}
          playlist={currentPlaylist || undefined}
          onClose={() => setShowPlayer(false)}
        />

        <AudioRecordingStudio
          isVisible={showRecordingStudio}
          onClose={() => setShowRecordingStudio(false)}
        />

        <AudioPlaylistManager
          isVisible={showPlaylistManager}
          onClose={() => setShowPlaylistManager(false)}
          onPlaylistSelect={handlePlayPlaylist}
        />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 10,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  nowPlayingCard: {
    backgroundColor: 'rgba(255, 107, 53, 0.2)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.3)',
  },
  nowPlayingTitle: {
    color: '#FF6B35',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 5,
  },
  nowPlayingTrack: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  nowPlayingControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nowPlayingStatus: {
    color: '#ccc',
    fontSize: 14,
  },
  openPlayerText: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    marginTop: 10,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  featureCard: {
    width: (screenWidth - 50) / 2,
    marginBottom: 15,
    borderRadius: 15,
    overflow: 'hidden',
  },
  featureGradient: {
    padding: 20,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
  },
  featureIcon: {
    marginBottom: 10,
  },
  featureTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 5,
  },
  featureDescription: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14,
  },
  tracksContainer: {
    marginBottom: 25,
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  trackArtwork: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  trackArtworkText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  trackInfo: {
    flex: 1,
  },
  trackTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  trackArtist: {
    color: '#ccc',
    fontSize: 14,
  },
  trackPlayCount: {
    color: '#999',
    fontSize: 12,
    marginTop: 2,
  },
  trackActions: {
    padding: 10,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 25,
  },
  quickActionButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 15,
    minWidth: 80,
  },
  quickActionText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  infoTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  infoText: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 20,
  },
}); 