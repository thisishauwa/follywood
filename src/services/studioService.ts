import { supabase } from './supabase';

export interface Studio {
  id: string;
  user_id: string;
  league_id: string;
  studio_name: string;
  genre_focus: string;
  budget: number;
  reputation_points: number;
  studio_level: number;
  logo_url?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Get or create a studio for the current user
 * For now, we'll create a default studio if none exists
 */
export const getOrCreateUserStudio = async (userId: string, studioName: string): Promise<Studio | null> => {
  try {
    // First, try to find existing studio for this user
    const { data: existingStudio, error: fetchError } = await supabase
      .from('studios')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existingStudio && !fetchError) {
      return existingStudio;
    }

    // If no studio exists, create a default one
    // For now, we'll use a placeholder league_id - in a real app, this would be proper league assignment
    const defaultStudio = {
      user_id: userId,
      league_id: 'default-league-id', // This should be a real league ID
      studio_name: studioName || 'My Studio',
      genre_focus: 'Comedy', // Default genre focus
      budget: 1000000.00, // Starting budget $1M
      reputation_points: 0,
      studio_level: 1,
    };

    const { data: newStudio, error: createError } = await supabase
      .from('studios')
      .insert([defaultStudio])
      .select()
      .single();

    if (createError) {
      console.error('Error creating studio:', createError);
      return null;
    }

    return newStudio;
  } catch (error) {
    console.error('Unexpected error in getOrCreateUserStudio:', error);
    return null;
  }
};

/**
 * Get user's studio by user ID
 */
export const getUserStudio = async (userId: string): Promise<Studio | null> => {
  try {
    const { data, error } = await supabase
      .from('studios')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching user studio:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error fetching studio:', error);
    return null;
  }
};

/**
 * Update studio budget after a transaction
 */
export const updateStudioBudget = async (studioId: string, newBudget: number): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('studios')
      .update({ 
        budget: newBudget,
        updated_at: new Date().toISOString()
      })
      .eq('id', studioId);

    if (error) {
      console.error('Error updating studio budget:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Unexpected error updating studio budget:', error);
    return false;
  }
};
