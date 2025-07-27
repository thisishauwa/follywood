import { supabase } from './supabase';

export interface Script {
  id: string;
  title: string;
  genre: string;
  rating: number;
  logline?: string;
  tags?: string[];
  base_cost: number;
  studio_level_required: number;
  is_user_generated: boolean;
  created_by_user_id?: string;
  created_at: string;
}

/**
 * Get or create a default script for the film production
 * For now, we'll create a generic script if none exists
 */
export const getOrCreateDefaultScript = async (title: string, genre: string = 'Comedy'): Promise<Script | null> => {
  try {
    // First, try to find an existing script with this title
    const { data: existingScript, error: fetchError } = await supabase
      .from('scripts')
      .select('*')
      .eq('title', title)
      .eq('genre', genre)
      .single();

    if (existingScript && !fetchError) {
      return existingScript;
    }

    // If no script exists, create a default one
    const defaultScript = {
      title: title,
      genre: genre,
      rating: 3, // Default 3-star rating
      logline: `A ${genre.toLowerCase()} film about the adventures in Follywood.`,
      tags: [genre.toLowerCase(), 'original'],
      base_cost: 50000, // Default script cost $50k
      studio_level_required: 1,
      is_user_generated: true, // Mark as user-generated for our production flow
    };

    const { data: newScript, error: createError } = await supabase
      .from('scripts')
      .insert([defaultScript])
      .select()
      .single();

    if (createError) {
      console.error('Error creating script:', createError);
      return null;
    }

    return newScript;
  } catch (error) {
    console.error('Unexpected error in getOrCreateDefaultScript:', error);
    return null;
  }
};

/**
 * Get available scripts from the marketplace
 */
export const getMarketplaceScripts = async (limit: number = 10): Promise<Script[]> => {
  try {
    const { data, error } = await supabase
      .from('scripts')
      .select('*')
      .eq('is_user_generated', false)
      .order('rating', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching marketplace scripts:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Unexpected error fetching scripts:', error);
    return [];
  }
};

/**
 * Get user's custom scripts
 */
export const getUserScripts = async (userId: string): Promise<Script[]> => {
  try {
    const { data, error } = await supabase
      .from('scripts')
      .select('*')
      .eq('created_by_user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user scripts:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Unexpected error fetching user scripts:', error);
    return [];
  }
};
