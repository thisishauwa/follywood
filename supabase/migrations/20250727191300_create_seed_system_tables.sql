-- Create comprehensive seed system for CinemaCraft
-- This migration adds tables and fields needed for AI-powered talent and script generation

-- Create talent lifecycle tracking table
CREATE TABLE IF NOT EXISTS talent_lifecycle_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  talent_id UUID REFERENCES talent(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('debut', 'breakthrough', 'scandal', 'hiatus', 'comeback', 'retirement', 'death')),
  event_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  description TEXT,
  impact_on_popularity INTEGER DEFAULT 0, -- can be negative
  impact_on_cost INTEGER DEFAULT 0, -- can be negative
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create script marketplace table for rotating scripts
CREATE TABLE IF NOT EXISTS script_marketplace (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  script_id UUID REFERENCES scripts(id) ON DELETE CASCADE,
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  buzz_rating INTEGER DEFAULT 0 CHECK (buzz_rating >= 0 AND buzz_rating <= 100),
  trending_score INTEGER DEFAULT 0,
  available_until TIMESTAMP WITH TIME ZONE,
  times_used INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(script_id, league_id)
);

-- Create entertainment news/gossip system
CREATE TABLE IF NOT EXISTS entertainment_news (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  headline TEXT NOT NULL,
  content TEXT,
  news_type TEXT CHECK (news_type IN ('gossip', 'announcement', 'scandal', 'award', 'death', 'retirement', 'comeback')),
  related_talent_ids UUID[],
  related_movie_ids UUID[],
  publication_name TEXT DEFAULT 'ReelTalk Weekly',
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  impact_on_buzz INTEGER DEFAULT 0
);

-- Create awards system
CREATE TABLE IF NOT EXISTS awards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  prestige_level INTEGER DEFAULT 1 CHECK (prestige_level >= 1 AND prestige_level <= 5),
  ceremony_name TEXT DEFAULT 'The Aurels',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create award winners tracking
CREATE TABLE IF NOT EXISTS award_winners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  award_id UUID REFERENCES awards(id) ON DELETE CASCADE,
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  movie_id UUID REFERENCES movies(id) ON DELETE CASCADE,
  talent_id UUID REFERENCES talent(id) ON DELETE SET NULL,
  year INTEGER NOT NULL,
  season INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create production houses/agencies
CREATE TABLE IF NOT EXISTS production_houses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('studio', 'agency', 'production_company')),
  reputation_level TEXT DEFAULT 'Unknown',
  specialty_genres TEXT[],
  talent_roster UUID[], -- references to talent IDs
  founded_year INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add additional fields to existing talent table
ALTER TABLE talent 
ADD COLUMN IF NOT EXISTS career_stage TEXT DEFAULT 'newcomer' CHECK (career_stage IN ('newcomer', 'rising', 'established', 'veteran', 'legend', 'retired')),
ADD COLUMN IF NOT EXISTS scandal_history TEXT[],
ADD COLUMN IF NOT EXISTS awards_won INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS box_office_track_record TEXT DEFAULT 'unproven' CHECK (box_office_track_record IN ('unproven', 'mixed', 'reliable', 'bankable', 'poison')),
ADD COLUMN IF NOT EXISTS last_major_role_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS retirement_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS death_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS comeback_potential INTEGER DEFAULT 0 CHECK (comeback_potential >= 0 AND comeback_potential <= 100);

-- Add additional fields to scripts table
ALTER TABLE scripts 
ADD COLUMN IF NOT EXISTS buzz_rating INTEGER DEFAULT 0 CHECK (buzz_rating >= 0 AND buzz_rating <= 100),
ADD COLUMN IF NOT EXISTS quality_stars INTEGER DEFAULT 3 CHECK (quality_stars >= 1 AND quality_stars <= 5),
ADD COLUMN IF NOT EXISTS times_adapted INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS original_author TEXT,
ADD COLUMN IF NOT EXISTS trending_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rewrite_history JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS market_appeal TEXT DEFAULT 'niche' CHECK (market_appeal IN ('niche', 'mainstream', 'blockbuster', 'arthouse'));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_talent_lifecycle_events_talent_id ON talent_lifecycle_events(talent_id);
CREATE INDEX IF NOT EXISTS idx_talent_lifecycle_events_date ON talent_lifecycle_events(event_date);
CREATE INDEX IF NOT EXISTS idx_script_marketplace_league_id ON script_marketplace(league_id);
CREATE INDEX IF NOT EXISTS idx_script_marketplace_buzz ON script_marketplace(buzz_rating DESC);
CREATE INDEX IF NOT EXISTS idx_entertainment_news_league_id ON entertainment_news(league_id);
CREATE INDEX IF NOT EXISTS idx_entertainment_news_published ON entertainment_news(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_award_winners_league_year ON award_winners(league_id, year, season);
CREATE INDEX IF NOT EXISTS idx_talent_career_stage ON talent(career_stage);
CREATE INDEX IF NOT EXISTS idx_scripts_buzz_rating ON scripts(buzz_rating DESC);

-- Enable RLS on new tables
ALTER TABLE talent_lifecycle_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE script_marketplace ENABLE ROW LEVEL SECURITY;
ALTER TABLE entertainment_news ENABLE ROW LEVEL SECURITY;
ALTER TABLE awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE award_winners ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_houses ENABLE ROW LEVEL SECURITY;

-- RLS Policies (users can only see data from their league)
CREATE POLICY "Users can view talent lifecycle events from their league" ON talent_lifecycle_events
  FOR SELECT USING (
    talent_id IN (
      SELECT t.id FROM talent t 
      JOIN leagues l ON t.league_id = l.id 
      WHERE l.id IN (SELECT league_id FROM studio_league_memberships WHERE studio_id IN (SELECT id FROM studios WHERE user_id = auth.uid()))
    )
  );

CREATE POLICY "Users can view script marketplace from their league" ON script_marketplace
  FOR SELECT USING (
    league_id IN (SELECT league_id FROM studio_league_memberships WHERE studio_id IN (SELECT id FROM studios WHERE user_id = auth.uid()))
  );

CREATE POLICY "Users can view entertainment news from their league" ON entertainment_news
  FOR SELECT USING (
    league_id IN (SELECT league_id FROM studio_league_memberships WHERE studio_id IN (SELECT id FROM studios WHERE user_id = auth.uid()))
  );

CREATE POLICY "Users can view awards" ON awards FOR SELECT USING (true);

CREATE POLICY "Users can view award winners from their league" ON award_winners
  FOR SELECT USING (
    league_id IN (SELECT league_id FROM studio_league_memberships WHERE studio_id IN (SELECT id FROM studios WHERE user_id = auth.uid()))
  );

CREATE POLICY "Users can view production houses" ON production_houses FOR SELECT USING (true);
