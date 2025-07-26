import { AudioProgressService } from './audioProgress';
import { supabase } from './supabase';

/**
 * Background audio progress tracker
 * This service tracks audio progress without interfering with playback
 */
export class AudioProgressTracker {
  private static userId: string | null = null;
  private static currentTrackId: string | null = null;
  private static progressInterval: NodeJS.Timeout | null = null;
  private static isEnabled: boolean = true;
  private static hasReached70Percent = new Set<string>(); // Track which tracks have reached 70%

  /**
   * Initialize tracking for a user
   */
  static setUser(userId: string | null) {
    this.userId = userId;
  }

  /**
   * Start tracking a new audio guide (non-blocking)
   */
  static startTracking(trackId: string, userId?: string) {
    if (!this.isEnabled) {
      console.log('📵 Audio progress tracking is disabled');
      return;
    }
    
    const userIdToUse = userId || this.userId;
    if (!userIdToUse) {
      console.log('❌ No user ID available for audio progress tracking');
      console.log('  - Provided userId:', userId);
      console.log('  - Static userId:', this.userId);
      return;
    }

    // Stop any existing tracking first
    this.stopPeriodicUpdates();

    console.log('🎯 Starting tracking for audio guide:', trackId, 'user:', userIdToUse);
    
    this.currentTrackId = trackId;
    this.userId = userIdToUse;

    // Clear the 70% flag for this track when starting fresh
    const trackKey = `${userIdToUse}-${trackId}`;
    this.hasReached70Percent.delete(trackKey);

    // Don't increment listen count here - wait for 70% completion
    
    // Start tracking in background - don't await or throw errors
    AudioProgressService.startListening(userIdToUse, trackId).catch(error => {
      console.log('⚠️ Audio progress tracking unavailable:', error.message);
      // Optionally disable tracking if database is not available
      if (error.message?.includes('relation') || error.message?.includes('column')) {
        this.isEnabled = false;
        console.log('🚫 Disabling audio progress tracking until database is migrated');
      }
    });
  }

  /**
   * Increment listen count for an audio guide (non-blocking)
   */
  static async incrementListenCount(audioGuideId: string): Promise<void> {
    try {
      console.log('=== LISTEN COUNT TRACKING ===');
      console.log('Audio Guide ID:', audioGuideId);
      console.log('User ID:', this.userId);
      console.log('Current Track ID:', this.currentTrackId);
      console.log('Attempting to increment listen count...');
      
      // First try the database function
      const { error } = await supabase.rpc('increment_audio_guide_listens', {
        guide_id: audioGuideId
      });

      if (error) {
        console.log('Function call failed, trying direct update:', error);
        
        // Fallback: Get current count and increment
        const { data: currentData, error: selectError } = await supabase
          .from('audio_guides')
          .select('total_listens, title')
          .eq('id', audioGuideId)
          .single();

        if (!selectError && currentData) {
          console.log('Found audio guide:', currentData.title, 'current count:', currentData.total_listens);
          const currentCount = currentData.total_listens || 0;
          const { error: updateError } = await supabase
            .from('audio_guides')
            .update({ total_listens: currentCount + 1 })
            .eq('id', audioGuideId);

          if (updateError) {
            console.log('Direct update failed:', updateError);
          } else {
            console.log('✅ Successfully incremented listen count for:', currentData.title, 'new count:', currentCount + 1);
          }
        } else {
          console.log('Could not read current listen count:', selectError);
          console.log('Listen count tracking: Column may not exist yet, will be tracked once migration is applied');
        }
      } else {
        console.log('✅ Successfully incremented listen count via function for audio guide:', audioGuideId);
      }
      console.log('=== END LISTEN COUNT TRACKING ===');
    } catch (error) {
      console.log('Error incrementing audio guide listens:', error);
    }
  }

  /**
   * Update progress periodically (non-blocking)
   */
  static updateProgress(positionMs: number, durationMs?: number) {
    if (!this.isEnabled || !this.userId || !this.currentTrackId) {
      console.log('⏸️ Progress update skipped:', {
        enabled: this.isEnabled,
        hasUserId: !!this.userId,
        hasTrackId: !!this.currentTrackId,
        positionMs,
        durationMs
      });
      return;
    }

    const positionSeconds = Math.floor(positionMs / 1000);
    const durationSeconds = durationMs ? Math.floor(durationMs / 1000) : undefined;

    console.log(`⏱️ Updating progress: ${positionSeconds}s / ${durationSeconds}s for track ${this.currentTrackId}`);

    // Check for 70% completion
    if (durationMs && positionMs > 0) {
      const progressPercent = (positionMs / durationMs) * 100;
      const trackKey = `${this.userId}-${this.currentTrackId}`;
      
      if (progressPercent >= 70 && !this.hasReached70Percent.has(trackKey)) {
        console.log('🎯 Audio reached 70% completion, incrementing listen count');
        this.hasReached70Percent.add(trackKey);
        this.incrementListenCount(this.currentTrackId).catch(error => {
          console.log('Listen count tracking failed:', error.message);
        });
      }
    }

    AudioProgressService.updateProgress(
      this.userId,
      this.currentTrackId,
      positionSeconds,
      durationSeconds
    ).catch(error => {
      console.log('Audio progress update failed:', error.message);
      // Don't disable on update failures - might be temporary network issues
    });
  }

  /**
   * Mark audio as completed (non-blocking)
   */
  static markCompleted() {
    if (!this.isEnabled || !this.userId || !this.currentTrackId) return;

    // If audio completed, it definitely reached 70%, so increment if not already done
    const trackKey = `${this.userId}-${this.currentTrackId}`;
    if (!this.hasReached70Percent.has(trackKey)) {
      console.log('🎯 Audio completed (100%), incrementing listen count');
      this.hasReached70Percent.add(trackKey);
      this.incrementListenCount(this.currentTrackId).catch(error => {
        console.log('Listen count tracking failed:', error.message);
      });
    }

    AudioProgressService.markCompleted(this.userId, this.currentTrackId).catch(error => {
      console.log('Audio completion tracking failed:', error.message);
    });
  }

  /**
   * Start periodic progress updates
   */
  static startPeriodicUpdates(getPlaybackStatus: () => { positionMillis?: number; durationMillis?: number } | null) {
    // Clear any existing interval
    this.stopPeriodicUpdates();

    if (!this.isEnabled) {
      console.log('📵 Periodic updates not started - tracking disabled');
      return;
    }

    console.log('⏰ Starting periodic progress updates (every 10 seconds)');

    this.progressInterval = setInterval(() => {
      const status = getPlaybackStatus();
      console.log('📊 Periodic update - status:', status);
      if (status?.positionMillis) {
        this.updateProgress(status.positionMillis, status.durationMillis);
      } else {
        console.log('📊 Periodic update - no position data available');
      }
    }, 10000); // Update every 10 seconds
  }

  /**
   * Stop periodic progress updates
   */
  static stopPeriodicUpdates() {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  /**
   * Save final progress and cleanup
   */
  static stopTracking(finalPositionMs?: number, durationMs?: number) {
    // Save final progress if available
    if (finalPositionMs) {
      this.updateProgress(finalPositionMs, durationMs);
    }

    // Stop periodic updates
    this.stopPeriodicUpdates();

    // Clear current track
    this.currentTrackId = null;
  }

  /**
   * Enable or disable tracking
   */
  static setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    if (!enabled) {
      this.stopPeriodicUpdates();
    }
  }

  /**
   * Check if tracking is enabled and ready
   */
  static isTrackingReady(): boolean {
    return this.isEnabled && !!this.userId;
  }

  /**
   * Reset 70% completion tracking (for when audio is restarted)
   */
  static resetCompletionTracking() {
    if (!this.userId || !this.currentTrackId) return;
    
    const trackKey = `${this.userId}-${this.currentTrackId}`;
    this.hasReached70Percent.delete(trackKey);
    console.log('🔄 Reset 70% completion tracking for audio restart');
  }
}

export const audioProgressTracker = new AudioProgressTracker(); 