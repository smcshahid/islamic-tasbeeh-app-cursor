import React, { useEffect, useRef } from 'react';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { unifiedAudioService, AudioState, QuranAudioSource } from '../utils/unifiedAudioService';
import { AdhanAudio } from '../types';

interface UnifiedAudioPlayerComponentProps {
  // This component doesn't render anything, it just handles audio playback
}

// Global reference to get audio source
const getAudioSource = (audio: AdhanAudio | QuranAudioSource) => {
  // Handle local audio files
  if (audio.isLocal) {
    if ('id' in audio && audio.id === 'local_adhan') {
      return require('../../aladhan.mp3');
    }
    // Add test case for Quran with local file
    if ('id' in audio && audio.id.includes('test_local')) {
      console.log('[UnifiedAudioPlayerComponent] Using local adhan.mp3 for testing');
      return require('../../aladhan.mp3');
    }
  }
  
  // Handle remote URLs
  return { uri: audio.url };
};

export default function UnifiedAudioPlayerComponent({}: UnifiedAudioPlayerComponentProps) {
  // Use the audio player hook with no initial source
  const player = useAudioPlayer();
  const status = useAudioPlayerStatus(player);
  
  // Track completion handling and current audio
  const hasHandledCompletion = useRef(false);
  const currentAudioRef = useRef<AdhanAudio | QuranAudioSource | null>(null);
  const lastUpdateTime = useRef(0);
  
  // Component instance reference
  const componentMethods = {
    playAudio: async (
      audioSource: any, 
      audioMetadata: AdhanAudio | QuranAudioSource, 
      volume: number = 1.0
    ) => {
      try {
        console.log(`[UnifiedAudioPlayerComponent] Playing ${audioMetadata.name} at volume ${volume}`);
        
        // Reset completion tracking for new audio
        hasHandledCompletion.current = false;
        currentAudioRef.current = audioMetadata;
        
        // Update service state to show loading
        unifiedAudioService.updateStateFromPlayer({ 
          isLoading: true,
          currentAudio: audioMetadata,
          isPlaying: false
        });

        console.log(`[UnifiedAudioPlayerComponent] Audio source:`, audioSource);
        console.log(`[UnifiedAudioPlayerComponent] Audio metadata:`, {
          name: audioMetadata.name,
          url: audioMetadata.url,
          isLocal: audioMetadata.isLocal
        });
        
        // Load and play the audio using expo-audio best practices
        player.replace(audioSource);
        
        console.log(`[UnifiedAudioPlayerComponent] Calling player.play()`);
        player.play();
        
        // Try to set volume (skip if not supported)
        setTimeout(() => {
          try {
            if (player.isLoaded && typeof player.volume !== 'undefined') {
              player.volume = Math.max(0, Math.min(1, volume));
              console.log(`[UnifiedAudioPlayerComponent] Volume set to: ${volume}`);
            } else {
              console.warn('[UnifiedAudioPlayerComponent] Volume control not available yet');
            }
          } catch (volumeError) {
            console.warn('[UnifiedAudioPlayerComponent] Volume control not available:', volumeError);
          }
        }, 500);
        
        // Update state
        unifiedAudioService.updateStateFromPlayer({
          isPlaying: true,
          volume,
          isLoading: false,
          duration: (audioMetadata.duration || 30) * 1000,
        });
        
        console.log(`[UnifiedAudioPlayerComponent] Successfully started playback`);
        
      } catch (error) {
        console.error('[UnifiedAudioPlayerComponent] Failed to play audio:', error);
        console.error('[UnifiedAudioPlayerComponent] Error details:', {
          message: error.message,
          audioSource,
          audioMetadata: audioMetadata.name,
          url: audioMetadata.url,
        });
        
        unifiedAudioService.updateStateFromPlayer({ 
          isLoading: false, 
          isPlaying: false 
        });
        throw error;
      }
    },

    stopAudio: async () => {
      try {
        console.log('[UnifiedAudioPlayerComponent] Stopping audio');
        
        // Reset completion tracking when manually stopping
        hasHandledCompletion.current = false;
        currentAudioRef.current = null;
        
        if (player.isLoaded) {
          player.pause();
          // Reset playback position
          player.seekTo(0);
        }
        
        unifiedAudioService.updateStateFromPlayer({
          isPlaying: false,
          position: 0,
          currentAudio: undefined,
        });
      } catch (error) {
        console.error('[UnifiedAudioPlayerComponent] Failed to stop audio:', error);
      }
    },

    pauseAudio: async () => {
      try {
        console.log('[UnifiedAudioPlayerComponent] Pausing audio');
        if (player.isLoaded) {
          player.pause();
          unifiedAudioService.updateStateFromPlayer({ isPlaying: false });
        }
      } catch (error) {
        console.error('[UnifiedAudioPlayerComponent] Failed to pause audio:', error);
      }
    },

    resumeAudio: async () => {
      try {
        console.log('[UnifiedAudioPlayerComponent] Resuming audio');
        if (player.isLoaded) {
          player.play();
          unifiedAudioService.updateStateFromPlayer({ isPlaying: true });
        }
      } catch (error) {
        console.error('[UnifiedAudioPlayerComponent] Failed to resume audio:', error);
      }
    },

    setVolume: async (volume: number) => {
      try {
        const clampedVolume = Math.max(0, Math.min(1, volume));
        console.log(`[UnifiedAudioPlayerComponent] Setting volume to ${clampedVolume}`);
        
        // Only try to set volume if player is loaded and volume control is available
        if (player.isLoaded && typeof player.volume !== 'undefined') {
          player.volume = clampedVolume;
          unifiedAudioService.updateStateFromPlayer({ volume: clampedVolume });
        } else {
          console.warn('[UnifiedAudioPlayerComponent] Volume control not available yet, storing for later');
          unifiedAudioService.updateStateFromPlayer({ volume: clampedVolume });
        }
      } catch (error) {
        console.warn('[UnifiedAudioPlayerComponent] Volume control not supported:', error);
        // Still update the state even if we can't set the volume
        unifiedAudioService.updateStateFromPlayer({ volume: Math.max(0, Math.min(1, volume)) });
      }
    },

    seekTo: async (seconds: number) => {
      try {
        console.log(`[UnifiedAudioPlayerComponent] Seeking to ${seconds}s`);
        if (player.isLoaded) {
          player.seekTo(seconds);
          unifiedAudioService.updateStateFromPlayer({ position: seconds * 1000 });
        }
      } catch (error) {
        console.error('[UnifiedAudioPlayerComponent] Failed to seek:', error);
      }
    },

    // Add method to get current player status
    getPlayerStatus: () => {
      return {
        isLoaded: player.isLoaded,
        isPlaying: status?.playing || false,
        currentTime: status?.currentTime || 0,
        duration: status?.duration || 0,
        hasVolume: typeof player.volume !== 'undefined'
      };
    }
  };

  // Register this component with the audio service
  useEffect(() => {
    unifiedAudioService.setPlayerComponent(componentMethods);
    console.log('[UnifiedAudioPlayerComponent] Registered with unified audio service');
    
    return () => {
      unifiedAudioService.setPlayerComponent(null);
    };
  }, []);

  // Listen to player status changes with throttling to prevent excessive updates
  useEffect(() => {
    if (status) {
      const now = Date.now();
      const timeSinceLastUpdate = now - lastUpdateTime.current;
      
      // Throttle updates to every 250ms for position updates, but allow immediate updates for state changes
      const shouldUpdate = timeSinceLastUpdate > 250 || 
                          status.playing !== (unifiedAudioService.getState().isPlaying) ||
                          status.didJustFinish ||
                          status.isLoaded !== (unifiedAudioService.getState().duration > 0);
      
      if (shouldUpdate) {
        lastUpdateTime.current = now;
        
        // Update audio service state based on player status
        unifiedAudioService.updateStateFromPlayer({
          isPlaying: status.playing || false,
          position: (status.currentTime || 0) * 1000, // Convert to milliseconds
          duration: (status.duration || 0) * 1000,
          isLoading: !status.isLoaded,
          isBuffering: status.isBuffering || false,
        });

        // Handle playback completion - only once per audio session
        if (status.didJustFinish && !hasHandledCompletion.current) {
          console.log('[UnifiedAudioPlayerComponent] Playback completed');
          hasHandledCompletion.current = true; // Mark as handled
          
          unifiedAudioService.updateStateFromPlayer({
            isPlaying: false,
            position: 0,
          });
          
          // Note: Don't clear currentAudio here as the parent components may need it for repeat functionality
        }
      }
    }
  }, [status]);

  // Handle audio interruptions and app state changes
  useEffect(() => {
    // Listen for app state changes to handle background/foreground transitions
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'background') {
        console.log('[UnifiedAudioPlayerComponent] App backgrounded, audio continues...');
      } else if (nextAppState === 'active') {
        console.log('[UnifiedAudioPlayerComponent] App foregrounded');
        // Sync state in case something changed while backgrounded
        if (status && player.isLoaded) {
          unifiedAudioService.updateStateFromPlayer({
            isPlaying: status.playing || false,
            position: (status.currentTime || 0) * 1000,
            duration: (status.duration || 0) * 1000,
          });
        }
      }
    };

    // Note: In a real app, you'd use AppState.addEventListener here
    // For now, we'll just handle the visible state changes through the status

    return () => {
      // Cleanup listeners
    };
  }, [status, player]);

  // This component doesn't render anything
  return null;
} 