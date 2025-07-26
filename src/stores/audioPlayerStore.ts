import { create } from 'zustand';
import { Audio } from 'expo-av';
import { AudioGuide } from '../services/supabase';
import { AudioProgressTracker } from '../services/audioProgressTracker';

interface PlaybackStatus {
  isLoaded: boolean;
  durationMillis?: number;
  positionMillis?: number;
  isPlaying?: boolean;
  didJustFinish?: boolean;
}

interface AudioPlayerState {
  sound: Audio.Sound | null;
  isPlaying: boolean;
  isLoading: boolean;
  playbackStatus: PlaybackStatus | null;
  currentTrack: AudioGuide | null;
  loadSound: (track: AudioGuide, lastPosition?: number, userId?: string) => Promise<void>;
  handlePlayPause: () => Promise<void>;
  seek: (position: number) => Promise<void>;
  closePlayer: () => Promise<void>;
}

// Configure audio mode for background playback
const configureAudioSession = async () => {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      interruptionModeIOS: 1, // DoNotMix
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      interruptionModeAndroid: 1, // DoNotMix
      playThroughEarpieceAndroid: false,
    });
  } catch (error) {
    console.warn('Failed to configure audio session:', error);
  }
};

const useAudioPlayerStore = create<AudioPlayerState>((set, get) => ({
  sound: null,
  isPlaying: false,
  isLoading: false,
  playbackStatus: null,
  currentTrack: null,

  loadSound: async (track, lastPosition = 0, userId) => {
    const { sound: currentSound, currentTrack } = get();

    // Configure audio session for background playback
    await configureAudioSession();

    // If the same track is loaded and sound exists, don't reload
    if (currentTrack?.id === track.id && currentSound) {
      return;
    }

    if (currentSound) {
      await currentSound.unloadAsync();
    }

    set({ isLoading: true, currentTrack: track, isPlaying: false });

    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: track.file_path! },
        { 
          shouldPlay: true, 
          progressUpdateIntervalMillis: 500, 
          positionMillis: lastPosition * 1000,
          // Enable background playback
          isLooping: false,
        },
      );
      
      sound.setOnPlaybackStatusUpdate((status: PlaybackStatus) => {
        if (status.isLoaded) {
          set({ playbackStatus: status, isPlaying: status.isPlaying });
          if (status.didJustFinish) {
            // Track completion in background
            AudioProgressTracker.markCompleted();
            // Don't close the player, just stop playing so user can restart
            set({ isPlaying: false });
          }
        }
      });

      // Set user ID and start background progress tracking (non-blocking)
      if (userId) {
        console.log('🔧 Setting user for audio progress tracking:', userId);
        AudioProgressTracker.setUser(userId);
      }
      console.log('🎵 Starting tracking for audio guide:', track.id);
      AudioProgressTracker.startTracking(track.id);
      AudioProgressTracker.startPeriodicUpdates(() => get().playbackStatus);

      set({ sound, isLoading: false, isPlaying: true });
    } catch (error) {
      console.error("Error loading sound:", error);
      set({ isLoading: false, currentTrack: null });
    }
  },

  handlePlayPause: async () => {
    const { sound, isPlaying, playbackStatus } = get();
    if (!sound) return;

    // Ensure audio session is configured
    await configureAudioSession();

    // If audio finished, restart from beginning
    if (playbackStatus?.didJustFinish) {
      AudioProgressTracker.resetCompletionTracking();
      await sound.setPositionAsync(0);
      await sound.playAsync();
    } else if (isPlaying) {
      await sound.pauseAsync();
    } else {
      await sound.playAsync();
    }
  },

  seek: async (value) => { // value is 0 to 1
    const { sound, playbackStatus } = get();
    if (sound && playbackStatus?.durationMillis) {
      const newPosition = value * playbackStatus.durationMillis;
      await sound.setPositionAsync(newPosition);
    }
  },

  closePlayer: async () => {
    const { sound, playbackStatus } = get();
    
    // Save final progress in background
    AudioProgressTracker.stopTracking(
      playbackStatus?.positionMillis, 
      playbackStatus?.durationMillis
    );
    
    if (sound) {
      await sound.unloadAsync();
      set({ sound: null, isPlaying: false, playbackStatus: null, currentTrack: null });
    }
  },
}));

export default useAudioPlayerStore;
