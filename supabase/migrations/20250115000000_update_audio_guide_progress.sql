-- Migration: Update audio_guide_progress table for enhanced tracking
-- Date: 2025-01-15
-- Description: Add columns for completed status, listen count, first listened timestamp, and last position tracking

-- Add completed column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'audio_guide_progress' 
                   AND column_name = 'completed') THEN
        ALTER TABLE public.audio_guide_progress 
        ADD COLUMN completed BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Add listen_count column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'audio_guide_progress' 
                   AND column_name = 'listen_count') THEN
        ALTER TABLE public.audio_guide_progress 
        ADD COLUMN listen_count INTEGER DEFAULT 0 CHECK (listen_count >= 0);
    END IF;
END $$;

-- Add first_listened_at column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'audio_guide_progress' 
                   AND column_name = 'first_listened_at') THEN
        ALTER TABLE public.audio_guide_progress 
        ADD COLUMN first_listened_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Add last_position column if it doesn't exist (for resuming playback)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'audio_guide_progress' 
                   AND column_name = 'last_position') THEN
        ALTER TABLE public.audio_guide_progress 
        ADD COLUMN last_position INTEGER DEFAULT 0 CHECK (last_position >= 0);
    END IF;
END $$;

-- Migrate existing progress column to last_position if needed
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'audio_guide_progress' 
               AND column_name = 'progress') 
    AND EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'audio_guide_progress' 
                AND column_name = 'last_position') THEN
        -- Copy progress to last_position where last_position is 0
        UPDATE public.audio_guide_progress 
        SET last_position = progress 
        WHERE last_position = 0 AND progress > 0;
        
        -- Drop the old progress column
        ALTER TABLE public.audio_guide_progress DROP COLUMN IF EXISTS progress;
    END IF;
END $$;

-- Add category column to audio_guides if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'audio_guides' 
                   AND column_name = 'category') THEN
        ALTER TABLE public.audio_guides 
        ADD COLUMN category TEXT CHECK (category IN ('enhance_intimacy', 'explore_sexuality', 'improve_communication'));
    END IF;
END $$;

-- Add thumbnail_url column to audio_guides if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'audio_guides' 
                   AND column_name = 'thumbnail_url') THEN
        ALTER TABLE public.audio_guides 
        ADD COLUMN thumbnail_url TEXT;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_audio_guide_progress_user_guide 
ON public.audio_guide_progress(user_id, audio_guide_id);

CREATE INDEX IF NOT EXISTS idx_audio_guide_progress_last_updated 
ON public.audio_guide_progress(last_updated DESC);

CREATE INDEX IF NOT EXISTS idx_audio_guide_progress_completed 
ON public.audio_guide_progress(completed, user_id);

CREATE INDEX IF NOT EXISTS idx_audio_guide_progress_listen_count 
ON public.audio_guide_progress(listen_count DESC, user_id);

-- Update RLS policy to ensure users can only access their own progress
DROP POLICY IF EXISTS "Users can manage their own audio guide progress." ON public.audio_guide_progress;
CREATE POLICY "Users can manage their own audio guide progress." 
ON public.audio_guide_progress 
FOR ALL USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Add a function to automatically update last_updated timestamp
CREATE OR REPLACE FUNCTION update_audio_progress_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update timestamp
DROP TRIGGER IF EXISTS update_audio_progress_timestamp_trigger ON public.audio_guide_progress;
CREATE TRIGGER update_audio_progress_timestamp_trigger
    BEFORE UPDATE ON public.audio_guide_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_audio_progress_timestamp();

-- Update sample audio guides with categories if they don't have them
UPDATE public.audio_guides 
SET category = CASE 
    WHEN title ILIKE '%communication%' OR title ILIKE '%relationship%' THEN 'improve_communication'
    WHEN title ILIKE '%confidence%' OR title ILIKE '%building%' THEN 'enhance_intimacy'
    WHEN title ILIKE '%understanding%' OR title ILIKE '%explore%' OR title ILIKE '%pleasure%' THEN 'explore_sexuality'
    ELSE 'enhance_intimacy'
END 
WHERE category IS NULL;

-- Add listen count to audio_guides table
ALTER TABLE audio_guides 
ADD COLUMN IF NOT EXISTS total_listens INTEGER DEFAULT 0;

-- Create function to increment audio guide listen count
CREATE OR REPLACE FUNCTION increment_audio_guide_listens(guide_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE audio_guides 
  SET total_listens = COALESCE(total_listens, 0) + 1
  WHERE id = guide_id;
END;
$$; 