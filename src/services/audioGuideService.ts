import { supabase } from './supabase';
import { AudioGuide } from './supabase';

/**
 * Fetches an audio guide by its ID from the Supabase database
 * @param guideId The ID of the audio guide to fetch
 * @returns The audio guide object or null if not found
 */
export const getAudioGuideById = async (guideId: string): Promise<AudioGuide | null> => {
  try {
    const { data, error } = await supabase
      .from('audio_guides')
      .select('*')
      .eq('id', guideId)
      .single();

    if (error) {
      console.error('Error fetching audio guide:', error);
      return null;
    }

    return data as AudioGuide;
  } catch (error) {
    console.error('Exception fetching audio guide:', error);
    return null;
  }
};

/**
 * Fetches all audio guides from the Supabase database
 * @returns Array of audio guides or empty array if none found
 */
export const getAllAudioGuides = async (): Promise<AudioGuide[]> => {
  try {
    const { data, error } = await supabase
      .from('audio_guides')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching audio guides:', error);
      return [];
    }

    return data as AudioGuide[];
  } catch (error) {
    console.error('Exception fetching audio guides:', error);
    return [];
  }
};

/**
 * Fetches audio guides by category from the Supabase database
 * @param category The category to filter by
 * @returns Array of audio guides in the specified category or empty array if none found
 */
export const getAudioGuidesByCategory = async (category: string): Promise<AudioGuide[]> => {
  try {
    const { data, error } = await supabase
      .from('audio_guides')
      .select('*')
      .eq('category', category)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching audio guides by category:', error);
      return [];
    }

    return data as AudioGuide[];
  } catch (error) {
    console.error('Exception fetching audio guides by category:', error);
    return [];
  }
};
