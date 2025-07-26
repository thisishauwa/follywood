import { supabase } from './supabase';

export interface AudioGuideProgress {
  id: string;
  user_id: string;
  audio_guide_id: string;
  last_position: number; // Progress in seconds
  completed: boolean;
  listen_count: number;
  first_listened_at: string;
  last_updated: string;
}

export class AudioProgressService {
  /**
   * Start tracking progress for an audio guide
   * Creates a new progress record or increments listen count
   */
  static async startListening(userId: string, audioGuideId: string): Promise<void> {
    try {
      // Check if progress record exists
      const { data: existingProgress, error: fetchError } = await supabase
        .from('audio_guide_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('audio_guide_id', audioGuideId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 is "no rows returned" - that's okay, we'll create new record
        throw fetchError;
      }

      if (existingProgress) {
        // Update existing record - increment listen count
        const { error: updateError } = await supabase
          .from('audio_guide_progress')
          .update({
            listen_count: existingProgress.listen_count + 1,
            last_updated: new Date().toISOString(),
          })
          .eq('id', existingProgress.id);

        if (updateError) throw updateError;
      } else {
        // Create new progress record
        const { error: insertError } = await supabase
          .from('audio_guide_progress')
          .insert({
            user_id: userId,
            audio_guide_id: audioGuideId,
            last_position: 0,
            completed: false,
            listen_count: 1,
            first_listened_at: new Date().toISOString(),
            last_updated: new Date().toISOString(),
          });

        if (insertError) throw insertError;
      }
    } catch (error) {
      console.error('Error starting audio tracking:', error);
    }
  }

  /**
   * Update progress position (called periodically during playback)
   */
  static async updateProgress(
    userId: string, 
    audioGuideId: string, 
    positionSeconds: number,
    durationSeconds?: number
  ): Promise<void> {
    try {
      // Determine if audio is completed (90% threshold)
      const isCompleted = durationSeconds ? 
        (positionSeconds / durationSeconds) >= 0.9 : false;

      const { error } = await supabase
        .from('audio_guide_progress')
        .upsert({
          user_id: userId,
          audio_guide_id: audioGuideId,
          last_position: Math.floor(positionSeconds),
          completed: isCompleted,
          last_updated: new Date().toISOString(),
        }, {
          onConflict: 'user_id,audio_guide_id'
        });

      if (error) {
        console.error('Error updating audio progress:', error);
        throw error;
      }
    } catch (error) {
      // Avoid re-throwing as this is a background task
      console.error('Failed to update audio progress for user:', userId);
    }
  }

  /**
   * Mark audio guide as completed
   */
  static async markCompleted(userId: string, audioGuideId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('audio_guide_progress')
        .upsert({
          user_id: userId,
          audio_guide_id: audioGuideId,
          completed: true,
          last_updated: new Date().toISOString(),
        }, {
          onConflict: 'user_id,audio_guide_id'
        });

      if (error) {
        console.error('Error marking audio as completed:', error);
        throw error;
      }
    } catch (error) {
       // Avoid re-throwing as this is a background task
      console.error('Failed to mark audio as completed for user:', userId);
    }
  }

  /**
   * Get progress for a specific audio guide
   */
  static async getProgress(userId: string, audioGuideId: string): Promise<AudioGuideProgress | null> {
    try {
      const { data, error } = await supabase
        .from('audio_guide_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('audio_guide_id', audioGuideId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data || null;
    } catch (error) {
      console.error('Error getting audio progress:', error);
      return null;
    }
  }

  /**
   * Get all progress for a user
   */
  static async getAllProgress(userId: string): Promise<AudioGuideProgress[]> {
    try {
      const { data, error } = await supabase
        .from('audio_guide_progress')
        .select('*')
        .eq('user_id', userId)
        .order('last_updated', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting all audio progress:', error);
      return [];
    }
  }

  /**
   * Get listening statistics for analytics
   */
  static async getListeningStats(userId: string): Promise<{
    totalListenTime: number;
    completedGuides: number;
    totalGuides: number;
    mostListenedGuide?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('audio_guide_progress')
        .select(`
          last_position,
          completed,
          listen_count,
          audio_guide_id,
          audio_guides!inner(title, duration)
        `)
        .eq('user_id', userId);

      if (error) throw error;

      const stats = {
        totalListenTime: 0,
        completedGuides: 0,
        totalGuides: data?.length || 0,
        mostListenedGuide: undefined as string | undefined,
      };

      if (data) {
        let maxListenCount = 0;
        
        data.forEach((progress: any) => {
          // Add up total listen time (last position for each guide)
          stats.totalListenTime += progress.last_position;
          
          // Count completed guides
          if (progress.completed) {
            stats.completedGuides++;
          }
          
          // Find most listened guide
          if (progress.listen_count > maxListenCount) {
            maxListenCount = progress.listen_count;
            stats.mostListenedGuide = progress.audio_guides?.title;
          }
        });
      }

      return stats;
    } catch (error) {
      console.error('Error getting listening stats:', error);
      return {
        totalListenTime: 0,
        completedGuides: 0,
        totalGuides: 0,
      };
    }
  }

  /**
   * Clean up old progress data (optional - for performance)
   */
  static async cleanupOldProgress(daysOld: number = 365): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const { error } = await supabase
        .from('audio_guide_progress')
        .delete()
        .lt('last_updated', cutoffDate.toISOString())
        .eq('completed', false)
        .eq('listen_count', 1); // Only cleanup single-listen, incomplete guides

      if (error) throw error;
    } catch (error) {
      console.error('Error cleaning up old progress:', error);
    }
  }
} 