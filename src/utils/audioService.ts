import AsyncStorage from '@react-native-async-storage/async-storage';
import { AdhanAudio, PrayerName } from '../types';

// Audio state management
export interface AudioState {
  isPlaying: boolean;
  currentAudio?: AdhanAudio;
  volume: number;
  position: number;
  duration: number;
  isLoading: boolean;
  isBuffering: boolean;
}

// Global audio state management (will be controlled by the AudioPlayerComponent)
class AudioService {
  private static instance: AudioService;
  private audioState: AudioState = {
    isPlaying: false,
    volume: 1.0,
    position: 0,
    duration: 0,
    isLoading: false,
    isBuffering: false,
  };
  private onStateChange?: (state: AudioState) => void;

  // Reference to the audio player component instance
  private playerComponent: any = null;

  private constructor() {
    console.log('[AudioService] Audio service initialized with expo-audio integration');
  }

  public static getInstance(): AudioService {
    if (!AudioService.instance) {
      AudioService.instance = new AudioService();
    }
    return AudioService.instance;
  }

  /**
   * Set the player component reference
   */
  public setPlayerComponent(component: any): void {
    this.playerComponent = component;
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
   * Play Adhan audio
   */
  public async playAdhan(
    audio: AdhanAudio | undefined,
    volume: number = 1.0,
    fadeInDuration: number = 3
  ): Promise<void> {
    try {
      if (!audio) {
        console.warn('[AudioService] No audio provided to play');
        return;
      }

      console.log(`[AudioService] Playing ${audio.name} at volume ${volume}`);
      
      this.updateState({ 
        isLoading: true,
        currentAudio: audio 
      });

      // If we have a player component, use it
      if (this.playerComponent) {
        await this.playerComponent.playAudio(audio, volume);
      } else {
        // Fallback simulation for when component isn't available
        this.simulatePlayback(audio, volume, fadeInDuration);
      }

    } catch (error) {
      console.error('[AudioService] Failed to play Adhan:', error);
      this.updateState({ isLoading: false, isPlaying: false });
      throw error;
    }
  }

  /**
   * Stop audio playback
   */
  public async stopAudio(fadeOutDuration: number = 0): Promise<void> {
    try {
      console.log('[AudioService] Stopping audio');
      
      if (this.playerComponent) {
        await this.playerComponent.stopAudio();
      }

      this.updateState({
        isPlaying: false,
        currentAudio: undefined,
        position: 0,
      });

    } catch (error) {
      console.error('[AudioService] Failed to stop audio:', error);
    }
  }

  /**
   * Pause audio playback
   */
  public async pauseAudio(): Promise<void> {
    try {
      console.log('[AudioService] Pausing audio');
      
      if (this.playerComponent) {
        await this.playerComponent.pauseAudio();
      }
      
      this.updateState({ isPlaying: false });
    } catch (error) {
      console.error('[AudioService] Failed to pause audio:', error);
    }
  }

  /**
   * Resume audio playback
   */
  public async resumeAudio(): Promise<void> {
    try {
      console.log('[AudioService] Resuming audio');
      
      if (this.playerComponent) {
        await this.playerComponent.resumeAudio();
      }
      
      this.updateState({ isPlaying: true });
    } catch (error) {
      console.error('[AudioService] Failed to resume audio:', error);
    }
  }

  /**
   * Set volume
   */
  public async setVolume(volume: number): Promise<void> {
    try {
      console.log(`[AudioService] Setting volume to ${volume}`);
      this.updateState({ volume });
      
      if (this.playerComponent) {
        await this.playerComponent.setVolume(volume);
      }
    } catch (error) {
      console.error('[AudioService] Failed to set volume:', error);
    }
  }

  /**
   * Seek to position
   */
  public async seekTo(positionMillis: number): Promise<void> {
    try {
      console.log(`[AudioService] Seeking to ${positionMillis}ms`);
      this.updateState({ position: positionMillis });
      
      if (this.playerComponent) {
        await this.playerComponent.seekTo(positionMillis / 1000);
      }
    } catch (error) {
      console.error('[AudioService] Failed to seek audio:', error);
    }
  }

  /**
   * Preview audio (with limited duration)
   */
  public async previewAudio(audio: AdhanAudio, duration: number = 10000): Promise<void> {
    try {
      console.log(`[AudioService] Previewing ${audio.name} for ${duration}ms`);
      await this.playAdhan(audio, 0.7, 1);
      
      // Stop after preview duration
      setTimeout(async () => {
        await this.stopAudio();
      }, Math.min(duration, 8000)); // Max 8 seconds for preview
    } catch (error) {
      console.error('[AudioService] Failed to preview audio:', error);
      throw error;
    }
  }

  /**
   * Fallback simulation for when no player component is available
   */
  private simulatePlayback(audio: AdhanAudio, volume: number, fadeInDuration: number): void {
    // Simulate loading time
    setTimeout(() => {
      this.updateState({
        isPlaying: true,
        volume,
        isLoading: false,
        duration: audio.duration * 1000,
      });

      // For the local adhan file, play longer duration
      const playDuration = audio.id === 'local_adhan' ? 30000 : 8000; // 30s for local, 8s for others
      
      // Simulate playback completion
      setTimeout(() => {
        this.updateState({
          isPlaying: false,
          position: 0,
          currentAudio: undefined,
        });
      }, playDuration);
    }, 800);
  }

  /**
   * Update state from player component
   */
  public updateStateFromPlayer(updates: Partial<AudioState>): void {
    this.updateState(updates);
  }

  /**
   * Check if audio is downloaded
   */
  public async isAudioDownloaded(audio: AdhanAudio): Promise<boolean> {
    // Local audio is always available
    if (audio.id === 'local_adhan') {
      return true;
    }
    
    try {
      const downloadedAudios = await AsyncStorage.getItem('downloaded_audios');
      if (downloadedAudios) {
        const parsed = JSON.parse(downloadedAudios);
        return parsed.includes(audio.id);
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Get downloaded audios list
   */
  public async getDownloadedAudios(): Promise<AdhanAudio[]> {
    try {
      const downloadedIds = await AsyncStorage.getItem('downloaded_audios');
      if (downloadedIds) {
        const parsed = JSON.parse(downloadedIds);
        return parsed.map((id: string) => ({ id })); // Simplified for now
      }
      return [];
    } catch (error) {
      console.error('[AudioService] Failed to get downloaded audios:', error);
      return [];
    }
  }

  /**
   * Download audio for offline use
   */
  public async downloadAudio(
    audio: AdhanAudio,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    try {
      console.log(`[AudioService] Downloading ${audio.name}`);
      
      // Simulate download progress
      for (let i = 0; i <= 100; i += 10) {
        onProgress?.(i / 100);
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      // Save to downloaded list
      const downloadedAudios = await AsyncStorage.getItem('downloaded_audios') || '[]';
      const parsed = JSON.parse(downloadedAudios);
      if (!parsed.includes(audio.id)) {
        parsed.push(audio.id);
        await AsyncStorage.setItem('downloaded_audios', JSON.stringify(parsed));
      }
      
      return `downloaded_${audio.id}`;
    } catch (error) {
      console.error('[AudioService] Failed to download audio:', error);
      throw error;
    }
  }

  /**
   * Get download progress
   */
  public getDownloadProgress(audioId: string): number {
    return 0; // No active downloads in this implementation
  }

  /**
   * Delete downloaded audio
   */
  public async deleteDownloadedAudio(audioId: string): Promise<void> {
    try {
      const downloadedAudios = await AsyncStorage.getItem('downloaded_audios') || '[]';
      const parsed = JSON.parse(downloadedAudios);
      const filtered = parsed.filter((id: string) => id !== audioId);
      await AsyncStorage.setItem('downloaded_audios', JSON.stringify(filtered));
      console.log(`[AudioService] Deleted audio ${audioId}`);
    } catch (error) {
      console.error('[AudioService] Failed to delete audio:', error);
    }
  }

  /**
   * Clear all cached audio
   */
  public async clearAudioCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem('downloaded_audios');
      console.log('[AudioService] Audio cache cleared');
    } catch (error) {
      console.error('[AudioService] Failed to clear cache:', error);
    }
  }

  /**
   * Get cache size (estimated)
   */
  public async getCacheSize(): Promise<number> {
    try {
      const downloadedAudios = await AsyncStorage.getItem('downloaded_audios');
      if (downloadedAudios) {
        const parsed = JSON.parse(downloadedAudios);
        // Estimate 5MB per audio file
        return parsed.length * 5 * 1024 * 1024;
      }
      return 0;
    } catch {
      return 0;
    }
  }

  /**
   * Format bytes to human readable string
   */
  public formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Update audio state and notify listeners
   */
  private updateState(updates: Partial<AudioState>): void {
    this.audioState = { ...this.audioState, ...updates };
    this.onStateChange?.(this.audioState);
  }
}

// Create singleton instance
const audioService = AudioService.getInstance();

// Export wrapper functions for easy use
export const playAdhan = async (
  audio?: AdhanAudio,
  volume: number = 1.0,
  fadeInDuration: number = 3
): Promise<void> => {
  return audioService.playAdhan(audio, volume, fadeInDuration);
};

export const stopAdhan = async (fadeOutDuration: number = 0): Promise<void> => {
  return audioService.stopAudio(fadeOutDuration);
};

export const previewAudio = async (audio: AdhanAudio): Promise<void> => {
  return audioService.previewAudio(audio);
};

export const pauseAudio = async (): Promise<void> => {
  return audioService.pauseAudio();
};

export const resumeAudio = async (): Promise<void> => {
  return audioService.resumeAudio();
};

export const setVolume = async (volume: number): Promise<void> => {
  return audioService.setVolume(volume);
};

export const isAudioDownloaded = async (audio: AdhanAudio): Promise<boolean> => {
  return audioService.isAudioDownloaded(audio);
};

export const downloadAudio = async (
  audio: AdhanAudio,
  onProgress?: (progress: number) => void
): Promise<string> => {
  return audioService.downloadAudio(audio, onProgress);
};

// Export the service instance as well
export { audioService }; 