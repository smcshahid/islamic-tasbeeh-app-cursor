import { useAudioPlayer, useAudioRecorder, AudioSource, RecordingPresets } from 'expo-audio';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EventEmitter } from 'events';

export interface AudioTrack {
  id: string;
  title: string;
  artist: string;
  artwork?: string;
  source: AudioSource;
  duration?: number;
  genre?: string;
  album?: string;
  year?: number;
  localPath?: string;
  isFavorite?: boolean;
  playCount?: number;
  lastPlayed?: Date;
  tags?: string[];
  description?: string;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  artwork?: string;
  tracks: AudioTrack[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  totalDuration: number;
  playCount: number;
}

export interface AudioEffect {
  id: string;
  name: string;
  type: 'reverb' | 'echo' | 'equalizer' | 'pitch' | 'speed' | 'volume';
  enabled: boolean;
  settings: Record<string, number>;
}

export interface PlaybackState {
  isPlaying: boolean;
  isPaused: boolean;
  isLoading: boolean;
  currentTrack: AudioTrack | null;
  currentPlaylist: Playlist | null;
  position: number;
  duration: number;
  volume: number;
  playbackRate: number;
  repeatMode: 'none' | 'track' | 'playlist';
  shuffleEnabled: boolean;
  effects: AudioEffect[];
}

export interface RecordingSession {
  id: string;
  name: string;
  duration: number;
  filePath: string;
  createdAt: Date;
  quality: 'low' | 'high';
  format: string;
}

export class AdvancedAudioService extends EventEmitter {
  private static instance: AdvancedAudioService;
  private playbackState: PlaybackState;
  private playlists: Map<string, Playlist> = new Map();
  private audioHistory: AudioTrack[] = [];
  private downloadQueue: AudioTrack[] = [];
  private recordings: RecordingSession[] = [];
  private analytics: Map<string, any> = new Map();

  // Cache directories
  private readonly AUDIO_CACHE_DIR = `${FileSystem.documentDirectory}audio_cache/`;
  private readonly RECORDINGS_DIR = `${FileSystem.documentDirectory}recordings/`;
  private readonly PLAYLISTS_KEY = 'advanced_audio_playlists';
  private readonly ANALYTICS_KEY = 'advanced_audio_analytics';

  private constructor() {
    super();
    this.playbackState = {
      isPlaying: false,
      isPaused: false,
      isLoading: false,
      currentTrack: null,
      currentPlaylist: null,
      position: 0,
      duration: 0,
      volume: 1.0,
      playbackRate: 1.0,
      repeatMode: 'none',
      shuffleEnabled: false,
      effects: []
    };
    
    this.initializeService();
  }

  public static getInstance(): AdvancedAudioService {
    if (!AdvancedAudioService.instance) {
      AdvancedAudioService.instance = new AdvancedAudioService();
    }
    return AdvancedAudioService.instance;
  }

  private async initializeService() {
    try {
      await this.ensureDirectoriesExist();
      await this.loadPersistedData();
      console.log('[AdvancedAudioService] Service initialized successfully');
    } catch (error) {
      console.error('[AdvancedAudioService] Initialization error:', error);
    }
  }

  private async ensureDirectoriesExist() {
    const directories = [this.AUDIO_CACHE_DIR, this.RECORDINGS_DIR];
    for (const dir of directories) {
      const dirInfo = await FileSystem.getInfoAsync(dir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
      }
    }
  }

  private async loadPersistedData() {
    try {
      // Load playlists
      const playlistsData = await AsyncStorage.getItem(this.PLAYLISTS_KEY);
      if (playlistsData) {
        const playlists = JSON.parse(playlistsData);
        playlists.forEach((playlist: Playlist) => {
          this.playlists.set(playlist.id, playlist);
        });
      }

      // Load analytics
      const analyticsData = await AsyncStorage.getItem(this.ANALYTICS_KEY);
      if (analyticsData) {
        const analytics = JSON.parse(analyticsData);
        Object.entries(analytics).forEach(([key, value]) => {
          this.analytics.set(key, value);
        });
      }
    } catch (error) {
      console.error('[AdvancedAudioService] Error loading persisted data:', error);
    }
  }

  // Playback Controls
  async playTrack(track: AudioTrack, playlist?: Playlist) {
    try {
      this.playbackState.isLoading = true;
      this.playbackState.currentTrack = track;
      this.playbackState.currentPlaylist = playlist || null;
      
      this.emit('playbackStateChanged', this.playbackState);
      
      // Analytics
      this.trackAnalytics('play', track);
      
      // Add to history
      this.addToHistory(track);
      
      console.log(`[AdvancedAudioService] Playing track: ${track.title} by ${track.artist}`);
      
      this.playbackState.isPlaying = true;
      this.playbackState.isLoading = false;
      this.emit('playbackStateChanged', this.playbackState);
      
    } catch (error) {
      console.error('[AdvancedAudioService] Error playing track:', error);
      this.playbackState.isLoading = false;
      this.emit('playbackError', error);
    }
  }

  async pausePlayback() {
    this.playbackState.isPlaying = false;
    this.playbackState.isPaused = true;
    this.emit('playbackStateChanged', this.playbackState);
  }

  async resumePlayback() {
    this.playbackState.isPlaying = true;
    this.playbackState.isPaused = false;
    this.emit('playbackStateChanged', this.playbackState);
  }

  async stopPlayback() {
    this.playbackState.isPlaying = false;
    this.playbackState.isPaused = false;
    this.playbackState.position = 0;
    this.emit('playbackStateChanged', this.playbackState);
  }

  async seekTo(position: number) {
    this.playbackState.position = position;
    this.emit('playbackStateChanged', this.playbackState);
  }

  async setVolume(volume: number) {
    this.playbackState.volume = Math.max(0, Math.min(1, volume));
    this.emit('playbackStateChanged', this.playbackState);
  }

  async setPlaybackRate(rate: number) {
    this.playbackState.playbackRate = Math.max(0.5, Math.min(2.0, rate));
    this.emit('playbackStateChanged', this.playbackState);
  }

  async toggleRepeatMode() {
    const modes: ('none' | 'track' | 'playlist')[] = ['none', 'track', 'playlist'];
    const currentIndex = modes.indexOf(this.playbackState.repeatMode);
    this.playbackState.repeatMode = modes[(currentIndex + 1) % modes.length];
    this.emit('playbackStateChanged', this.playbackState);
  }

  async toggleShuffle() {
    this.playbackState.shuffleEnabled = !this.playbackState.shuffleEnabled;
    this.emit('playbackStateChanged', this.playbackState);
  }

  async playNext() {
    if (!this.playbackState.currentPlaylist) return;
    
    const currentIndex = this.playbackState.currentPlaylist.tracks.findIndex(
      track => track.id === this.playbackState.currentTrack?.id
    );
    
    if (currentIndex === -1) return;
    
    let nextIndex = currentIndex + 1;
    if (this.playbackState.shuffleEnabled) {
      nextIndex = Math.floor(Math.random() * this.playbackState.currentPlaylist.tracks.length);
    } else if (nextIndex >= this.playbackState.currentPlaylist.tracks.length) {
      nextIndex = 0;
    }
    
    const nextTrack = this.playbackState.currentPlaylist.tracks[nextIndex];
    if (nextTrack) {
      await this.playTrack(nextTrack, this.playbackState.currentPlaylist);
    }
  }

  async playPrevious() {
    if (!this.playbackState.currentPlaylist) return;
    
    const currentIndex = this.playbackState.currentPlaylist.tracks.findIndex(
      track => track.id === this.playbackState.currentTrack?.id
    );
    
    if (currentIndex === -1) return;
    
    let prevIndex = currentIndex - 1;
    if (prevIndex < 0) {
      prevIndex = this.playbackState.currentPlaylist.tracks.length - 1;
    }
    
    const prevTrack = this.playbackState.currentPlaylist.tracks[prevIndex];
    if (prevTrack) {
      await this.playTrack(prevTrack, this.playbackState.currentPlaylist);
    }
  }

  // Playlist Management
  async createPlaylist(name: string, description?: string): Promise<Playlist> {
    const playlist: Playlist = {
      id: `playlist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      tracks: [],
      isPublic: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      totalDuration: 0,
      playCount: 0
    };
    
    this.playlists.set(playlist.id, playlist);
    await this.savePlaylistsToStorage();
    this.emit('playlistCreated', playlist);
    
    return playlist;
  }

  async addTrackToPlaylist(playlistId: string, track: AudioTrack) {
    const playlist = this.playlists.get(playlistId);
    if (!playlist) return;
    
    playlist.tracks.push(track);
    playlist.totalDuration += track.duration || 0;
    playlist.updatedAt = new Date();
    
    await this.savePlaylistsToStorage();
    this.emit('playlistUpdated', playlist);
  }

  async removeTrackFromPlaylist(playlistId: string, trackId: string) {
    const playlist = this.playlists.get(playlistId);
    if (!playlist) return;
    
    const trackIndex = playlist.tracks.findIndex(track => track.id === trackId);
    if (trackIndex !== -1) {
      const removedTrack = playlist.tracks.splice(trackIndex, 1)[0];
      playlist.totalDuration -= removedTrack.duration || 0;
      playlist.updatedAt = new Date();
      
      await this.savePlaylistsToStorage();
      this.emit('playlistUpdated', playlist);
    }
  }

  async deletePlaylist(playlistId: string) {
    this.playlists.delete(playlistId);
    await this.savePlaylistsToStorage();
    this.emit('playlistDeleted', playlistId);
  }

  getPlaylists(): Playlist[] {
    return Array.from(this.playlists.values());
  }

  getPlaylist(id: string): Playlist | undefined {
    return this.playlists.get(id);
  }

  // Audio Effects
  async addEffect(effect: AudioEffect) {
    this.playbackState.effects.push(effect);
    this.emit('effectsChanged', this.playbackState.effects);
  }

  async removeEffect(effectId: string) {
    this.playbackState.effects = this.playbackState.effects.filter(e => e.id !== effectId);
    this.emit('effectsChanged', this.playbackState.effects);
  }

  async toggleEffect(effectId: string) {
    const effect = this.playbackState.effects.find(e => e.id === effectId);
    if (effect) {
      effect.enabled = !effect.enabled;
      this.emit('effectsChanged', this.playbackState.effects);
    }
  }

  async updateEffectSettings(effectId: string, settings: Record<string, number>) {
    const effect = this.playbackState.effects.find(e => e.id === effectId);
    if (effect) {
      effect.settings = { ...effect.settings, ...settings };
      this.emit('effectsChanged', this.playbackState.effects);
    }
  }

  // Audio Caching
  async downloadTrack(track: AudioTrack): Promise<string | null> {
    try {
      if (track.source && typeof track.source === 'object' && 'uri' in track.source && track.source.uri) {
        const filename = `${track.id}.mp3`;
        const localPath = `${this.AUDIO_CACHE_DIR}${filename}`;
        
        const downloadResult = await FileSystem.downloadAsync(
          track.source.uri,
          localPath
        );
        
        if (downloadResult.status === 200) {
          track.localPath = localPath;
          this.emit('trackDownloaded', track);
          return localPath;
        }
      }
    } catch (error) {
      console.error('[AdvancedAudioService] Download error:', error);
      this.emit('downloadError', { track, error });
    }
    return null;
  }

  async getCachedTracks(): Promise<AudioTrack[]> {
    const cachedTracks: AudioTrack[] = [];
    // Implementation to scan cache directory and return cached tracks
    return cachedTracks;
  }

  // Recording
  async startRecording(name: string, quality: 'low' | 'high' = 'high'): Promise<RecordingSession> {
    const recordingId = `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const filename = `${recordingId}.m4a`;
    const filePath = `${this.RECORDINGS_DIR}${filename}`;
    
    const session: RecordingSession = {
      id: recordingId,
      name,
      duration: 0,
      filePath,
      createdAt: new Date(),
      quality,
      format: 'm4a'
    };
    
    this.recordings.push(session);
    this.emit('recordingStarted', session);
    
    return session;
  }

  async stopRecording(sessionId: string): Promise<RecordingSession | null> {
    const session = this.recordings.find(r => r.id === sessionId);
    if (session) {
      this.emit('recordingStopped', session);
      return session;
    }
    return null;
  }

  getRecordings(): RecordingSession[] {
    return this.recordings;
  }

  // Analytics
  private trackAnalytics(event: string, track: AudioTrack) {
    const key = `${event}_${track.id}`;
    const existing = this.analytics.get(key) || 0;
    this.analytics.set(key, existing + 1);
    
    // Update track play count
    if (event === 'play') {
      track.playCount = (track.playCount || 0) + 1;
      track.lastPlayed = new Date();
    }
    
    this.saveAnalyticsToStorage();
  }

  getAnalytics() {
    return Object.fromEntries(this.analytics);
  }

  // Favorites
  async toggleFavorite(track: AudioTrack) {
    track.isFavorite = !track.isFavorite;
    this.trackAnalytics(track.isFavorite ? 'favorite' : 'unfavorite', track);
    this.emit('trackFavoriteChanged', track);
  }

  getFavorites(): AudioTrack[] {
    return this.audioHistory.filter(track => track.isFavorite);
  }

  // History
  private addToHistory(track: AudioTrack) {
    // Remove existing entry if it exists
    this.audioHistory = this.audioHistory.filter(t => t.id !== track.id);
    
    // Add to beginning
    this.audioHistory.unshift(track);
    
    // Keep only last 100 items
    if (this.audioHistory.length > 100) {
      this.audioHistory = this.audioHistory.slice(0, 100);
    }
    
    this.emit('historyUpdated', this.audioHistory);
  }

  getHistory(): AudioTrack[] {
    return this.audioHistory;
  }

  clearHistory() {
    this.audioHistory = [];
    this.emit('historyUpdated', this.audioHistory);
  }

  // State Management
  getPlaybackState(): PlaybackState {
    return { ...this.playbackState };
  }

  // Persistence
  private async savePlaylistsToStorage() {
    try {
      const playlistsArray = Array.from(this.playlists.values());
      await AsyncStorage.setItem(this.PLAYLISTS_KEY, JSON.stringify(playlistsArray));
    } catch (error) {
      console.error('[AdvancedAudioService] Error saving playlists:', error);
    }
  }

  private async saveAnalyticsToStorage() {
    try {
      const analyticsObject = Object.fromEntries(this.analytics);
      await AsyncStorage.setItem(this.ANALYTICS_KEY, JSON.stringify(analyticsObject));
    } catch (error) {
      console.error('[AdvancedAudioService] Error saving analytics:', error);
    }
  }

  // Search & Discovery
  searchTracks(query: string, tracks: AudioTrack[]): AudioTrack[] {
    const lowercaseQuery = query.toLowerCase();
    return tracks.filter(track => 
      track.title.toLowerCase().includes(lowercaseQuery) ||
      track.artist.toLowerCase().includes(lowercaseQuery) ||
      track.album?.toLowerCase().includes(lowercaseQuery) ||
      track.genre?.toLowerCase().includes(lowercaseQuery) ||
      track.tags?.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }

  getRecommendations(track: AudioTrack, allTracks: AudioTrack[]): AudioTrack[] {
    // Simple recommendation algorithm based on genre and artist
    return allTracks
      .filter(t => t.id !== track.id)
      .filter(t => t.genre === track.genre || t.artist === track.artist)
      .slice(0, 10);
  }
}

export default AdvancedAudioService.getInstance(); 