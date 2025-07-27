import { supabase } from './supabase';

export const getMovieById = async (movieId: string) => {
  const { data, error } = await supabase
    .from('movies')
    .select('*')
    .eq('id', movieId)
    .single();

  if (error) {
    console.error('Error fetching movie by ID:', error);
    throw error;
  }

  return data;
};

export const deleteMovie = async (movieId: string) => {
  const { error } = await supabase
    .from('movies')
    .delete()
    .eq('id', movieId);

  if (error) {
    console.error('Error deleting movie:', error);
    throw error;
  }

  return true;
};

export const updateMovie = async (movieId: string, updates: { [key: string]: any }) => {
  const { data, error } = await supabase
    .from('movies')
    .update(updates)
    .eq('id', movieId)
    .select()
    .single();

  if (error) {
    console.error('Error updating movie:', error);
    throw error;
  }

  return data;
};
