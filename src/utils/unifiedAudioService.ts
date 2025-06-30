import AsyncStorage from '@react-native-async-storage/async-storage';
import { AdhanAudio, PrayerName } from '../types';

// Unified Audio Types
export interface QuranAudioSource {
  id: string;
  name: string;
  reciter: string;
  surah: number;
  verse: number;
  url: string;
  duration?: number;
  isLocal?: boolean;
}

export interface AudioState {
  isPlaying: boolean;
  currentAudio?: AdhanAudio | QuranAudioSource;
  audioType: 'prayer' | 'quran' | null;
  volume: number;
  position: number;
  duration: number;
  isLoading: boolean;
  isBuffering: boolean;
  playbackSpeed: number;
  repeatMode: 'none' | 'verse' | 'surah';
}

// Unified Audio Service Class
class UnifiedAudioService {
  private static instance: UnifiedAudioService;
  
  private audioState: AudioState = {
    isPlaying: false,
    currentAudio: undefined,
    audioType: null,
    volume: 1.0,
    position: 0,
    duration: 0,
    isLoading: false,
    isBuffering: false,
    playbackSpeed: 1.0,
    repeatMode: 'none',
  };
  
  private onStateChange?: (state: AudioState) => void;
  private playerComponent: any = null;

  private constructor() {
    console.log('[UnifiedAudioService] Initialized with expo-audio integration');
  }

  public static getInstance(): UnifiedAudioService {
    if (!UnifiedAudioService.instance) {
      UnifiedAudioService.instance = new UnifiedAudioService();
    }
    return UnifiedAudioService.instance;
  }

  /**
   * Set the player component reference (AudioPlayerComponent)
   */
  public setPlayerComponent(component: any): void {
    this.playerComponent = component;
    console.log('[UnifiedAudioService] Player component registered');
  }

  /**
   * Set audio state change listener
   */
  public setOnStateChange(callback: (state: AudioState) => void): void {
    this.onStateChange = callback;
  }

  /**
   * Get current audio state
   */
  public getState(): AudioState {
    return { ...this.audioState };
  }

  /**
   * Resolve audio source for expo-audio
   */
  private resolveAudioSource(audio: AdhanAudio | QuranAudioSource): any {
    // Handle local files
    if (audio.isLocal) {
      if ('id' in audio && audio.id === 'local_adhan') {
        return require('../../aladhan.mp3');
      }
      // Add test case: use local adhan for Quran testing
      if ('id' in audio && audio.id.includes('test_local')) {
        console.log('[UnifiedAudioService] Using local adhan.mp3 for testing');
        return require('../../aladhan.mp3');
      }
      // Add other local file handling here
    }
    
    // Handle remote URLs
    return { uri: audio.url };
  }

  /**
   * Play Quran Audio (verse recitation)
   */
  public async playQuranAudio(
    surah: number,
    verse: number,
    reciterId: string = 'mishary_rashid_alafasy',
    volume: number = 1.0
  ): Promise<void> {
    try {
      // Generate multiple Quran audio URLs to try
      const paddedSurah = surah.toString().padStart(3, '0');
      const paddedVerse = verse.toString().padStart(3, '0');
      
      // Primary URL sources (in order of preference)
      const audioUrls = [
        // EveryAyah - Mishary Rashid Alafasy (High Quality)
        `https://www.everyayah.com/data/Mishary_Rashid_Alafasy_128kbps/${paddedSurah}${paddedVerse}.mp3`,
        
        // EveryAyah - Abdul Basit (Alternative)
        `https://www.everyayah.com/data/Abdul_Basit_Murattal_192kbps/${paddedSurah}${paddedVerse}.mp3`,
        
        // Quran.com API (Alternative source)
        `https://verses.quran.com/Mishary_Rashid_al_Afasy_128kbps/${paddedSurah}${paddedVerse}.mp3`,
        
        // Arabic Quran - Mishary (Alternative)
        `https://quran-1420.mp3quran.net/mishary-rashid-alafasy/${paddedSurah}.mp3`,
      ];
      
      // Test the first URL
      const primaryUrl = audioUrls[0];
      console.log(`[UnifiedAudioService] Testing primary URL: ${primaryUrl}`);
      
      const quranAudio: QuranAudioSource = {
        id: `${surah}_${verse}_${reciterId}`,
        name: `Surah ${surah}, Verse ${verse}`,
        reciter: 'Mishary Rashid Alafasy',
        surah,
        verse,
        url: primaryUrl,
        duration: 30, // Estimated
        isLocal: false,
      };

      console.log(`[UnifiedAudioService] Playing Quran audio: ${quranAudio.name}`);
      console.log(`[UnifiedAudioService] Audio URL: ${quranAudio.url}`);
      await this.playAudio(quranAudio, 'quran', volume);
      
    } catch (error) {
      console.error('[UnifiedAudioService] Failed to play Quran audio:', error);
      throw error;
    }
  }

  /**
   * Play Prayer Audio (Adhan)
   */
  public async playPrayerAudio(
    audio: AdhanAudio,
    volume: number = 1.0,
    fadeInDuration: number = 3
  ): Promise<void> {
    try {
      console.log(`[UnifiedAudioService] Playing prayer audio: ${audio.name}`);
      await this.playAudio(audio, 'prayer', volume);
      
    } catch (error) {
      console.error('[UnifiedAudioService] Failed to play prayer audio:', error);
      throw error;
    }
  }

  /**
   * Core audio playback method
   */
  private async playAudio(
    audio: AdhanAudio | QuranAudioSource,
    type: 'prayer' | 'quran',
    volume: number = 1.0
  ): Promise<void> {
    try {
      this.updateState({
        isLoading: true,
        currentAudio: audio,
        audioType: type,
        volume,
      });

      // Use player component if available
      if (this.playerComponent) {
        const audioSource = this.resolveAudioSource(audio);
        await this.playerComponent.playAudio(audioSource, audio, volume);
      } else {
        // Fallback simulation
        console.warn('[UnifiedAudioService] No player component, using simulation');
        this.simulatePlayback(audio, volume);
      }

    } catch (error) {
      console.error('[UnifiedAudioService] Audio playback failed:', error);
      this.updateState({ isLoading: false, isPlaying: false });
      throw error;
    }
  }

  /**
   * Stop audio playback
   */
  public async stopAudio(): Promise<void> {
    try {
      console.log('[UnifiedAudioService] Stopping audio');
      
      if (this.playerComponent) {
        await this.playerComponent.stopAudio();
      }

      this.updateState({
        isPlaying: false,
        currentAudio: undefined,
        audioType: null,
        position: 0,
      });

    } catch (error) {
      console.error('[UnifiedAudioService] Failed to stop audio:', error);
    }
  }

  /**
   * Pause audio playback
   */
  public async pauseAudio(): Promise<void> {
    try {
      if (this.playerComponent) {
        await this.playerComponent.pauseAudio();
      }
      this.updateState({ isPlaying: false });
    } catch (error) {
      console.error('[UnifiedAudioService] Failed to pause audio:', error);
    }
  }

  /**
   * Resume audio playback
   */
  public async resumeAudio(): Promise<void> {
    try {
      if (this.playerComponent) {
        await this.playerComponent.resumeAudio();
      }
      this.updateState({ isPlaying: true });
    } catch (error) {
      console.error('[UnifiedAudioService] Failed to resume audio:', error);
    }
  }

  /**
   * Seek to position
   */
  public async seekTo(positionSeconds: number): Promise<void> {
    try {
      if (this.playerComponent) {
        await this.playerComponent.seekTo(positionSeconds);
      }
      this.updateState({ position: positionSeconds * 1000 });
    } catch (error) {
      console.error('[UnifiedAudioService] Failed to seek:', error);
    }
  }

  /**
   * Set volume
   */
  public async setVolume(volume: number): Promise<void> {
    try {
      if (this.playerComponent) {
        await this.playerComponent.setVolume(volume);
      }
      this.updateState({ volume });
    } catch (error) {
      console.error('[UnifiedAudioService] Failed to set volume:', error);
    }
  }

  /**
   * Update state from player component
   */
  public updateStateFromPlayer(updates: Partial<AudioState>): void {
    this.updateState(updates);
  }

  /**
   * Fallback simulation for when no player component is available
   */
  private simulatePlayback(audio: AdhanAudio | QuranAudioSource, volume: number): void {
    setTimeout(() => {
      this.updateState({
        isPlaying: true,
        volume,
        isLoading: false,
        duration: (audio.duration || 30) * 1000,
      });

      // Simulate completion
      const playDuration = 'id' in audio && audio.id === 'local_adhan' ? 30000 : 8000;
      setTimeout(() => {
        this.updateState({
          isPlaying: false,
          position: 0,
          currentAudio: undefined,
          audioType: null,
        });
      }, playDuration);
    }, 800);
  }

  /**
   * Update audio state and notify listeners
   */
  private updateState(updates: Partial<AudioState>): void {
    this.audioState = { ...this.audioState, ...updates };
    this.onStateChange?.(this.audioState);
  }

  /**
   * Toggle playback
   */
  public async togglePlayback(): Promise<boolean> {
    if (this.audioState.isPlaying) {
      await this.pauseAudio();
      return false;
    } else {
      await this.resumeAudio();
      return true;
    }
  }

  /**
   * Check if audio is playing
   */
  public isPlaying(): boolean {
    return this.audioState.isPlaying;
  }

  /**
   * Get current audio type
   */
  public getCurrentAudioType(): 'prayer' | 'quran' | null {
    return this.audioState.audioType;
  }
}

// Export singleton instance
export const unifiedAudioService = UnifiedAudioService.getInstance();

// Export convenience functions
export const playQuranVerse = async (
  surah: number,
  verse: number,
  reciterId?: string,
  volume?: number
): Promise<void> => {
  return unifiedAudioService.playQuranAudio(surah, verse, reciterId, volume);
};

export const playAdhan = async (
  audio: AdhanAudio,
  volume?: number,
  fadeInDuration?: number
): Promise<void> => {
  return unifiedAudioService.playPrayerAudio(audio, volume, fadeInDuration);
};

export const stopAudio = (): Promise<void> => {
  return unifiedAudioService.stopAudio();
};

export const pauseAudio = (): Promise<void> => {
  return unifiedAudioService.pauseAudio();
};

export const resumeAudio = (): Promise<void> => {
  return unifiedAudioService.resumeAudio();
};

export const getAudioState = (): AudioState => {
  return unifiedAudioService.getState();
};

export const setAudioStateListener = (callback: (state: AudioState) => void): void => {
  unifiedAudioService.setOnStateChange(callback);
}; 