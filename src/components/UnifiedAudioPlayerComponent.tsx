import React, { useEffect, useRef } from 'react';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { unifiedAudioService, AudioState, QuranAudioSource } from '../utils/unifiedAudioService';
import { AdhanAudio } from '../types';

interface UnifiedAudioPlayerComponentProps {
  // This component doesn't render anything, it just handles audio playback
}

export default function UnifiedAudioPlayerComponent({}: UnifiedAudioPlayerComponentProps) {
  // Use the audio player hook with no initial source (best practice)
  const player = useAudioPlayer();
  const status = useAudioPlayerStatus(player);
  
  // Track completion to prevent infinite loops
  const hasHandledCompletion = useRef(false);
  const currentAudioRef = useRef<AdhanAudio | QuranAudioSource | null>(null);
  
  // Component methods that will be registered with the service
  const componentMethods = useRef({
    playAudio: async (
      audioSource: any, 
      audioMetadata: AdhanAudio | QuranAudioSource, 
      volume: number = 1.0
    ) => {
      try {
        console.log(`[UnifiedAudioPlayerComponent] Playing audio: ${audioMetadata.name}`);
        console.log(`[UnifiedAudioPlayerComponent] Audio source:`, audioSource);
        
        // Test URL accessibility for remote sources
        if (audioSource && typeof audioSource === 'object' && audioSource.uri) {
          console.log(`[UnifiedAudioPlayerComponent] Testing URL accessibility: ${audioSource.uri}`);
          
          try {
            // Simple URL validation
            const url = new URL(audioSource.uri);
            console.log(`[UnifiedAudioPlayerComponent] URL validation passed: ${url.href}`);
          } catch (urlError) {
            console.error(`[UnifiedAudioPlayerComponent] Invalid URL format:`, urlError);
            throw new Error(`Invalid audio URL format: ${audioSource.uri}`);
          }
        }
        
        // Reset completion tracking for new audio
        hasHandledCompletion.current = false;
        currentAudioRef.current = audioMetadata;
        
        // Update service state
        unifiedAudioService.updateStateFromPlayer({ 
          isLoading: true,
          currentAudio: audioMetadata 
        });

        console.log(`[UnifiedAudioPlayerComponent] Calling player.replace() with:`, audioSource);
        
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
          player.seekTo(0);
        }
        
        unifiedAudioService.updateStateFromPlayer({
          isPlaying: false,
          position: 0,
          currentAudio: undefined,
          audioType: null,
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
        }
        
        unifiedAudioService.updateStateFromPlayer({ isPlaying: false });
      } catch (error) {
        console.error('[UnifiedAudioPlayerComponent] Failed to pause audio:', error);
      }
    },

    resumeAudio: async () => {
      try {
        console.log('[UnifiedAudioPlayerComponent] Resuming audio');
        
        if (player.isLoaded) {
          player.play();
        }
        
        unifiedAudioService.updateStateFromPlayer({ isPlaying: true });
      } catch (error) {
        console.error('[UnifiedAudioPlayerComponent] Failed to resume audio:', error);
      }
    },

    setVolume: async (volume: number) => {
      try {
        console.log(`[UnifiedAudioPlayerComponent] Setting volume to ${volume}`);
        
        if (player.isLoaded && typeof player.volume !== 'undefined') {
          player.volume = Math.max(0, Math.min(1, volume));
        }
        
        unifiedAudioService.updateStateFromPlayer({ volume });
      } catch (error) {
        console.warn('[UnifiedAudioPlayerComponent] Volume control not supported:', error);
      }
    },

    seekTo: async (seconds: number) => {
      try {
        console.log(`[UnifiedAudioPlayerComponent] Seeking to ${seconds}s`);
        
        if (player.isLoaded) {
          player.seekTo(seconds);
        }
        
        unifiedAudioService.updateStateFromPlayer({ 
          position: seconds * 1000 
        });
      } catch (error) {
        console.error('[UnifiedAudioPlayerComponent] Failed to seek:', error);
      }
    },

    // Additional methods for enhanced functionality
    getPlayerInfo: () => {
      return {
        isLoaded: player.isLoaded || false,
        currentAudio: currentAudioRef.current,
        hasActivePlayer: !!player,
      };
    },
  });

  // Register this component with the unified audio service
  useEffect(() => {
    unifiedAudioService.setPlayerComponent(componentMethods.current);
    console.log('[UnifiedAudioPlayerComponent] Registered with unified audio service');
    
    return () => {
      // Clean up on unmount
      unifiedAudioService.setPlayerComponent(null);
      console.log('[UnifiedAudioPlayerComponent] Unregistered from service');
    };
  }, []);

  // Listen to player status changes and update service
  useEffect(() => {
    if (status) {
      console.log('[UnifiedAudioPlayerComponent] Player status update:', {
        playing: status.playing,
        duration: status.duration,
        currentTime: status.currentTime,
        didJustFinish: status.didJustFinish,
        isLoaded: status.isLoaded,
        isBuffering: status.isBuffering,
      });

      // Update audio service state based on player status
      unifiedAudioService.updateStateFromPlayer({
        isPlaying: status.playing || false,
        position: (status.currentTime || 0) * 1000,
        duration: (status.duration || 0) * 1000,
        isLoading: !status.isLoaded,
        isBuffering: status.isBuffering || false,
      });

      // Handle playback completion - only once per audio session
      if (status.didJustFinish && !hasHandledCompletion.current) {
        console.log('[UnifiedAudioPlayerComponent] Playback completed');
        hasHandledCompletion.current = true;
        
        // Notify service of completion
        unifiedAudioService.updateStateFromPlayer({
          isPlaying: false,
          position: 0,
        });

        // Reset current audio reference
        currentAudioRef.current = null;
      }
    }
  }, [status]);

  // This component doesn't render anything - it's a service component
  return null;
} 