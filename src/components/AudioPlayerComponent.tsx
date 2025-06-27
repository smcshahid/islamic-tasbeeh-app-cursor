import React, { useEffect, useRef } from 'react';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { AdhanAudio } from '../types';
import { audioService } from '../utils/audioService';

interface AudioPlayerComponentProps {
  // This component doesn't render anything, it just handles audio playback
}

// Global reference to get audio source
const getAudioSource = (audio: AdhanAudio) => {
  // For local development audio
  if (audio.id === 'local_adhan') {
    // Use the local file at the project root
    return require('../../aladhan.mp3');
  }
  
  // For remote URLs
  return { uri: audio.url };
};

export default function AudioPlayerComponent({}: AudioPlayerComponentProps) {
  // Use the audio player hook with no initial source
  const player = useAudioPlayer();
  const status = useAudioPlayerStatus(player);
  
  // Track if we've already handled completion to prevent infinite loops
  const hasHandledCompletion = useRef(false);
  
  // Component instance reference
  const componentRef = useRef({
    playAudio: async (audio: AdhanAudio, volume: number = 1.0) => {
      try {
        console.log(`[AudioPlayerComponent] Playing ${audio.name} at volume ${volume}`);
        
        // Reset completion tracking for new audio
        hasHandledCompletion.current = false;
        
        // Update service state
        audioService.updateStateFromPlayer({ 
          isLoading: true,
          currentAudio: audio 
        });

        // Get the audio source
        const audioSource = getAudioSource(audio);
        
        // Load and play the audio
        player.replace(audioSource);
        player.play();
        
        // Try to set volume after audio starts playing (skip for now if it fails)
        setTimeout(() => {
          try {
            if (player.isLoaded) {
              player.volume = Math.max(0, Math.min(1, volume)); // Clamp between 0-1
            }
          } catch (volumeError) {
            console.warn('[AudioPlayerComponent] Volume control not available:', volumeError);
          }
        }, 500);
        
        // Update state
        audioService.updateStateFromPlayer({
          isPlaying: true,
          volume,
          isLoading: false,
          duration: audio.duration * 1000,
        });
        
      } catch (error) {
        console.error('[AudioPlayerComponent] Failed to play audio:', error);
        audioService.updateStateFromPlayer({ 
          isLoading: false, 
          isPlaying: false 
        });
        throw error;
      }
    },

    stopAudio: async () => {
      try {
        console.log('[AudioPlayerComponent] Stopping audio');
        
        // Reset completion tracking when manually stopping
        hasHandledCompletion.current = false;
        
        player.pause();
        player.seekTo(0);
        
        audioService.updateStateFromPlayer({
          isPlaying: false,
          position: 0,
        });
      } catch (error) {
        console.error('[AudioPlayerComponent] Failed to stop audio:', error);
      }
    },

    pauseAudio: async () => {
      try {
        console.log('[AudioPlayerComponent] Pausing audio');
        player.pause();
      } catch (error) {
        console.error('[AudioPlayerComponent] Failed to pause audio:', error);
      }
    },

    resumeAudio: async () => {
      try {
        console.log('[AudioPlayerComponent] Resuming audio');
        player.play();
      } catch (error) {
        console.error('[AudioPlayerComponent] Failed to resume audio:', error);
      }
    },

    setVolume: async (volume: number) => {
      try {
        console.log(`[AudioPlayerComponent] Setting volume to ${volume}`);
        // Only try to set volume if player is loaded and volume control is available
        if (player.isLoaded && typeof player.volume !== 'undefined') {
          player.volume = Math.max(0, Math.min(1, volume)); // Clamp between 0-1
        } else {
          console.warn('[AudioPlayerComponent] Volume control not available yet');
        }
      } catch (error) {
        console.warn('[AudioPlayerComponent] Volume control not supported:', error);
      }
    },

    seekTo: async (seconds: number) => {
      try {
        console.log(`[AudioPlayerComponent] Seeking to ${seconds}s`);
        player.seekTo(seconds);
      } catch (error) {
        console.error('[AudioPlayerComponent] Failed to seek:', error);
      }
    }
  });

  // Register this component with the audio service
  useEffect(() => {
    audioService.setPlayerComponent(componentRef.current);
    console.log('[AudioPlayerComponent] Registered with audio service');
    
    return () => {
      audioService.setPlayerComponent(null);
    };
  }, []);

  // Listen to player status changes
  useEffect(() => {
    if (status) {
      // Update audio service state based on player status
      audioService.updateStateFromPlayer({
        isPlaying: status.playing || false,
        position: (status.currentTime || 0) * 1000, // Convert to milliseconds
        duration: (status.duration || 0) * 1000,
        isLoading: !status.isLoaded,
        isBuffering: status.isBuffering || false,
      });

      // Handle playback completion - only once per audio session
      if (status.didJustFinish && !hasHandledCompletion.current) {
        console.log('[AudioPlayerComponent] Playback completed');
        hasHandledCompletion.current = true; // Mark as handled
        
        audioService.updateStateFromPlayer({
          isPlaying: false,
          currentAudio: undefined,
          position: 0,
        });
      }
    }
  }, [status]);

  // This component doesn't render anything
  return null;
} 