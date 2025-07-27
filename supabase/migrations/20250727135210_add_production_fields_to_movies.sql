-- Add production workflow fields to movies table
-- These fields support the film production creation flow

ALTER TABLE movies 
ADD COLUMN IF NOT EXISTS script_cost DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS cast_cost DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS director_cost DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS production_timeline INTEGER DEFAULT 12, -- weeks
ADD COLUMN IF NOT EXISTS total_budget DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS selected_actors TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS selected_director TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS estimated_completion TIMESTAMP WITH TIME ZONE;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_movies_production_stage ON movies(production_stage);
CREATE INDEX IF NOT EXISTS idx_movies_studio_id ON movies(studio_id);

-- Update existing movies to have default values for new fields
UPDATE movies 
SET 
  script_cost = 0,
  cast_cost = 0,
  director_cost = 0,
  production_timeline = 12,
  total_budget = production_budget + marketing_budget,
  selected_actors = '{}',
  selected_director = '',
  estimated_completion = created_at + INTERVAL '12 weeks'
WHERE script_cost IS NULL;
