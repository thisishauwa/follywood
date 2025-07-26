-- Fantasy Film League Database Schema
-- This schema supports the complete game mechanics outlined in the PRD

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CORE USER & AUTHENTICATION TABLES
-- ============================================================================

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    username TEXT UNIQUE,
    email TEXT,
    full_name TEXT,
    studio_name TEXT,
    genre TEXT CHECK (genre IN ('Action', 'Comedy', 'Drama', 'Horror', 'Romance', 'Thriller', 'Biopics', 'Art House', 'Sci-fi', 'Fantasy', 'Animation', 'Docs')),
    selected_genres JSONB DEFAULT '[]'::jsonb,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- GAME WORLD TABLES
-- ============================================================================

-- Leagues/Divisions (10-15 players per league)
CREATE TABLE leagues (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    max_players INTEGER DEFAULT 15,
    current_season INTEGER DEFAULT 1,
    current_month INTEGER DEFAULT 1, -- 1-12 (Spring: 1-3, Summer: 4-6, Fall: 7-9, Awards: 10-12)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Player Studios (game state for each player)
CREATE TABLE studios (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) NOT NULL,
    league_id UUID REFERENCES leagues(id) NOT NULL,
    studio_name TEXT NOT NULL,
    genre_focus TEXT CHECK (genre_focus IN ('Horror', 'Comedy', 'Art House', 'Blockbuster')),
    budget DECIMAL(15,2) DEFAULT 1000000.00, -- Starting budget $1M
    reputation_points INTEGER DEFAULT 0,
    studio_level INTEGER DEFAULT 1,
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, league_id)
);

-- ============================================================================
-- TALENT & CREW TABLES
-- ============================================================================

-- Talent pool (actors, directors, crew) - scoped per league
CREATE TABLE talent (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    league_id UUID REFERENCES leagues(id) NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('Actor', 'Director', 'Cinematographer', 'Composer', 'Editor', 'Producer')),
    age INTEGER,
    birthday DATE,
    popularity_score INTEGER DEFAULT 50 CHECK (popularity_score >= 0 AND popularity_score <= 100),
    reputation_level TEXT DEFAULT 'Rising Star' CHECK (reputation_level IN ('Rising Star', 'Fan Favorite', 'Hit-or-Miss', 'Industry Legend', 'Box Office Poison')),
    genre_affinity TEXT[], -- Array of preferred genres
    star_power_rating INTEGER DEFAULT 50 CHECK (star_power_rating >= 0 AND star_power_rating <= 100),
    base_cost DECIMAL(10,2) NOT NULL,
    personality_quirks TEXT[],
    scandal_history TEXT[],
    special_tags TEXT[],
    availability_status TEXT DEFAULT 'Available' CHECK (availability_status IN ('Available', 'Busy', 'Retired', 'Deceased')),
    cooldown_until DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- SCRIPT & CONTENT TABLES
-- ============================================================================

-- Scripts available in marketplace
CREATE TABLE scripts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    genre TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5), -- 1-5 star rating
    logline TEXT,
    tags TEXT[],
    base_cost DECIMAL(10,2) NOT NULL,
    studio_level_required INTEGER DEFAULT 1,
    is_user_generated BOOLEAN DEFAULT FALSE,
    created_by_user_id UUID REFERENCES profiles(id), -- NULL for marketplace scripts
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- MOVIE PRODUCTION TABLES
-- ============================================================================

-- Movies in production or completed
CREATE TABLE movies (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    studio_id UUID REFERENCES studios(id) NOT NULL,
    script_id UUID REFERENCES scripts(id) NOT NULL,
    title TEXT NOT NULL,
    genre TEXT NOT NULL,
    production_stage TEXT DEFAULT 'In Development' CHECK (production_stage IN ('In Development', 'Pre-Production', 'In Production', 'Post-Production', 'Released', 'Legacy')),
    production_budget DECIMAL(12,2) NOT NULL,
    marketing_budget DECIMAL(12,2) NOT NULL,
    release_season TEXT CHECK (release_season IN ('Spring', 'Summer', 'Fall', 'Awards')),
    release_month INTEGER CHECK (release_month >= 1 AND release_month <= 12),
    box_office_earnings DECIMAL(15,2) DEFAULT 0,
    critical_score INTEGER CHECK (critical_score >= 0 AND critical_score <= 100),
    audience_score INTEGER CHECK (audience_score >= 0 AND audience_score <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cast and crew assignments for movies
CREATE TABLE movie_cast_crew (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    movie_id UUID REFERENCES movies(id) NOT NULL,
    talent_id UUID REFERENCES talent(id) NOT NULL,
    role TEXT NOT NULL, -- 'Lead Actor', 'Supporting Actor', 'Director', etc.
    salary DECIMAL(10,2) NOT NULL,
    performance_score INTEGER CHECK (performance_score >= 0 AND performance_score <= 100),
    performance_outcome TEXT CHECK (performance_outcome IN ('Breakout Star', 'Scene Stealer', 'Weak Link', 'Cult Favorite', 'Award Nominee')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(movie_id, talent_id)
);

-- ============================================================================
-- EVENTS & RANDOM OCCURRENCES
-- ============================================================================

-- Random industry events that affect productions
CREATE TABLE industry_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    movie_id UUID REFERENCES movies(id), -- NULL for league-wide events
    league_id UUID REFERENCES leagues(id) NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('Actor Exit', 'Scandal', 'Director MIA', 'Death', 'Drama', 'Reshoot', 'Breakout Hype')),
    description TEXT NOT NULL,
    impact_type TEXT CHECK (impact_type IN ('Budget', 'Reputation', 'Delay', 'Boost')),
    impact_value DECIMAL(10,2), -- Monetary impact or percentage
    occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- AWARDS & COMPETITIONS
-- ============================================================================

-- Award categories for each season
CREATE TABLE award_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL, -- 'Best Actor', 'Best Director', 'Best Picture', etc.
    category_type TEXT NOT NULL CHECK (category_type IN ('Performance', 'Technical', 'Overall'))
);

-- Award nominations and winners per league per season
CREATE TABLE award_nominations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    league_id UUID REFERENCES leagues(id) NOT NULL,
    season INTEGER NOT NULL,
    category_id UUID REFERENCES award_categories(id) NOT NULL,
    movie_id UUID REFERENCES movies(id),
    talent_id UUID REFERENCES talent(id), -- For individual awards
    studio_id UUID REFERENCES studios(id) NOT NULL,
    is_winner BOOLEAN DEFAULT FALSE,
    nomination_score DECIMAL(8,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(league_id, season, category_id, movie_id, talent_id) -- One nomination per entity per category
);

-- ============================================================================
-- SOCIAL & COLLABORATION TABLES
-- ============================================================================

-- Co-production partnerships between studios
CREATE TABLE co_productions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    movie_id UUID REFERENCES movies(id) NOT NULL,
    primary_studio_id UUID REFERENCES studios(id) NOT NULL,
    partner_studio_id UUID REFERENCES studios(id) NOT NULL,
    cost_split_percentage DECIMAL(5,2) NOT NULL, -- 0.00 to 100.00
    earnings_split_percentage DECIMAL(5,2) NOT NULL,
    status TEXT DEFAULT 'Proposed' CHECK (status IN ('Proposed', 'Accepted', 'Active', 'Completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Talent loaning between studios
CREATE TABLE talent_loans (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    talent_id UUID REFERENCES talent(id) NOT NULL,
    lender_studio_id UUID REFERENCES studios(id) NOT NULL,
    borrower_studio_id UUID REFERENCES studios(id) NOT NULL,
    movie_id UUID REFERENCES movies(id) NOT NULL,
    loan_fee DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'Proposed' CHECK (status IN ('Proposed', 'Accepted', 'Active', 'Completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Studio guilds/collectives
CREATE TABLE guilds (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    league_id UUID REFERENCES leagues(id) NOT NULL,
    max_members INTEGER DEFAULT 5,
    created_by_studio_id UUID REFERENCES studios(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Guild memberships
CREATE TABLE guild_memberships (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    guild_id UUID REFERENCES guilds(id) NOT NULL,
    studio_id UUID REFERENCES studios(id) NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(guild_id, studio_id)
);

-- ============================================================================
-- GAME ECONOMY & TRANSACTIONS
-- ============================================================================

-- Financial transactions for studios
CREATE TABLE transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    studio_id UUID REFERENCES studios(id) NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('Movie Production', 'Marketing', 'Talent Salary', 'Script Purchase', 'Box Office Revenue', 'Loan', 'Loan Payment', 'Rebranding', 'Guild Fee')),
    amount DECIMAL(15,2) NOT NULL, -- Positive for income, negative for expenses
    description TEXT,
    movie_id UUID REFERENCES movies(id), -- Associated movie if applicable
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Studio loans and debt
CREATE TABLE studio_loans (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    studio_id UUID REFERENCES studios(id) NOT NULL,
    principal_amount DECIMAL(15,2) NOT NULL,
    remaining_balance DECIMAL(15,2) NOT NULL,
    interest_rate DECIMAL(5,4) NOT NULL, -- Annual percentage as decimal (e.g., 0.0500 for 5%)
    monthly_payment DECIMAL(10,2) NOT NULL,
    next_payment_due DATE NOT NULL,
    status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Paid Off', 'Defaulted')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- GAME PROGRESSION & ACHIEVEMENTS
-- ============================================================================

-- Studio achievements and badges
CREATE TABLE achievements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    badge_icon_url TEXT,
    unlock_criteria JSONB NOT NULL -- Flexible criteria storage
);

-- Studio achievement unlocks
CREATE TABLE studio_achievements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    studio_id UUID REFERENCES studios(id) NOT NULL,
    achievement_id UUID REFERENCES achievements(id) NOT NULL,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(studio_id, achievement_id)
);

-- ============================================================================
-- ANALYTICS & REPORTING
-- ============================================================================

-- Box office tracking (daily breakdown)
CREATE TABLE box_office_daily (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    movie_id UUID REFERENCES movies(id) NOT NULL,
    day_number INTEGER NOT NULL, -- 1, 2, 3 (opening weekend, mid-run, final)
    earnings DECIMAL(15,2) NOT NULL,
    earnings_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(movie_id, day_number)
);

-- League leaderboards (updated seasonally)
CREATE TABLE leaderboards (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    league_id UUID REFERENCES leagues(id) NOT NULL,
    season INTEGER NOT NULL,
    studio_id UUID REFERENCES studios(id) NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Total Earnings', 'Reputation', 'Awards Won', 'Genre Specific')),
    genre_filter TEXT, -- For genre-specific leaderboards
    rank_position INTEGER NOT NULL,
    score DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(league_id, season, category, genre_filter, studio_id)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- User and studio lookups
CREATE INDEX idx_profiles_user_id ON profiles(id);
CREATE INDEX idx_studios_user_id ON studios(user_id);
CREATE INDEX idx_studios_league_id ON studios(league_id);

-- Movie and production queries
CREATE INDEX idx_movies_studio_id ON movies(studio_id);
CREATE INDEX idx_movies_stage ON movies(production_stage);
CREATE INDEX idx_movie_cast_crew_movie_id ON movie_cast_crew(movie_id);
CREATE INDEX idx_movie_cast_crew_talent_id ON movie_cast_crew(talent_id);

-- Talent availability and league scoping
CREATE INDEX idx_talent_league_id ON talent(league_id);
CREATE INDEX idx_talent_availability ON talent(availability_status);
CREATE INDEX idx_talent_role ON talent(role);

-- Financial and transaction queries
CREATE INDEX idx_transactions_studio_id ON transactions(studio_id);
CREATE INDEX idx_transactions_type ON transactions(transaction_type);
CREATE INDEX idx_box_office_movie_id ON box_office_daily(movie_id);

-- Leaderboard and competition queries
CREATE INDEX idx_leaderboards_league_season ON leaderboards(league_id, season);
CREATE INDEX idx_award_nominations_league_season ON award_nominations(league_id, season);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE studios ENABLE ROW LEVEL SECURITY;
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can only see/edit their own profile
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Studios: Users can only see/edit their own studios
CREATE POLICY "Users can view own studios" ON studios FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own studios" ON studios FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own studios" ON studios FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Movies: Users can see movies in their league, but only edit their own
CREATE POLICY "Users can view league movies" ON movies FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM studios s 
        WHERE s.id = movies.studio_id 
        AND s.league_id IN (
            SELECT league_id FROM studios WHERE user_id = auth.uid()
        )
    )
);
CREATE POLICY "Users can modify own movies" ON movies FOR ALL USING (
    EXISTS (
        SELECT 1 FROM studios s 
        WHERE s.id = movies.studio_id 
        AND s.user_id = auth.uid()
    )
);

-- Transactions: Users can only see their own studio transactions
CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM studios s 
        WHERE s.id = transactions.studio_id 
        AND s.user_id = auth.uid()
    )
);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Function to automatically create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (NEW.id, NEW.email, NOW(), NOW());
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the auth process
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function when a new user is created
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_studios_updated_at BEFORE UPDATE ON studios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_movies_updated_at BEFORE UPDATE ON movies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_talent_updated_at BEFORE UPDATE ON talent FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create a studio when a user completes onboarding
CREATE OR REPLACE FUNCTION create_studio_on_onboarding()
RETURNS TRIGGER AS $$
DECLARE
    mapped_genre_focus TEXT;
BEGIN
    -- Only create studio if onboarding was just completed
    IF OLD.onboarding_completed = FALSE AND NEW.onboarding_completed = TRUE THEN
        -- Map profile genre to studio genre_focus
        CASE NEW.genre
            WHEN 'Horror' THEN mapped_genre_focus := 'Horror';
            WHEN 'Comedy' THEN mapped_genre_focus := 'Comedy';
            WHEN 'Drama', 'Romance', 'Biopics' THEN mapped_genre_focus := 'Art House';
            ELSE mapped_genre_focus := 'Blockbuster';
        END CASE;
        
        -- Find or create a league with available spots
        INSERT INTO studios (user_id, league_id, studio_name, genre_focus)
        VALUES (
            NEW.id,
            (SELECT id FROM leagues WHERE 
                (SELECT COUNT(*) FROM studios WHERE league_id = leagues.id) < max_players 
                LIMIT 1),
            NEW.studio_name,
            mapped_genre_focus
        );
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER create_studio_trigger AFTER UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION create_studio_on_onboarding();

-- Grant necessary permissions for the profile creation trigger
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.profiles TO anon, authenticated;

-- ============================================================================
-- INITIAL DATA SEEDING
-- ============================================================================

-- Insert default award categories
INSERT INTO award_categories (name, category_type) VALUES
('Best Picture', 'Overall'),
('Best Director', 'Performance'),
('Best Actor', 'Performance'),
('Best Actress', 'Performance'),
('Best Supporting Actor', 'Performance'),
('Best Supporting Actress', 'Performance'),
('Best Cinematography', 'Technical'),
('Best Original Score', 'Technical'),
('Best Editing', 'Technical'),
('Best Visual Effects', 'Technical');

-- Insert sample achievements
INSERT INTO achievements (name, description, unlock_criteria) VALUES
('First Film', 'Complete your first movie production', '{"movies_completed": 1}'),
('Box Office Hit', 'Earn over $10M on a single film', '{"single_movie_earnings": 10000000}'),
('Award Winner', 'Win your first industry award', '{"awards_won": 1}'),
('Studio Mogul', 'Reach $50M total studio earnings', '{"total_earnings": 50000000}'),
('Genre Master', 'Release 5 films in your studio focus genre', '{"genre_films": 5}'),
('Collaboration King', 'Complete 3 co-productions', '{"co_productions": 3}'),
('Talent Scout', 'Discover a breakout star', '{"breakout_stars_discovered": 1}'),
('Reputation Builder', 'Reach 1000 reputation points', '{"reputation_points": 1000}');

-- Create initial league
INSERT INTO leagues (name) VALUES ('Inaugural League');

-- ============================================================================
-- COMMENTS AND DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE profiles IS 'Extended user profiles with studio information';
COMMENT ON TABLE leagues IS 'Game leagues/divisions containing 10-15 players each';
COMMENT ON TABLE studios IS 'Player studio entities with budget and reputation';
COMMENT ON TABLE talent IS 'Actors, directors, and crew available for hire (league-scoped)';
COMMENT ON TABLE scripts IS 'Available scripts in marketplace and user-generated content';
COMMENT ON TABLE movies IS 'Movies in various stages of production';
COMMENT ON TABLE movie_cast_crew IS 'Cast and crew assignments for specific movies';
COMMENT ON TABLE industry_events IS 'Random events affecting productions or leagues';
COMMENT ON TABLE award_nominations IS 'Seasonal award nominations and winners by league';
COMMENT ON TABLE co_productions IS 'Partnership agreements between studios';
COMMENT ON TABLE talent_loans IS 'Temporary talent sharing between studios';
COMMENT ON TABLE guilds IS 'Studio collectives/groups within leagues';
COMMENT ON TABLE transactions IS 'All financial transactions for studio accounting';
COMMENT ON TABLE studio_loans IS 'Debt and loan tracking for studios';
COMMENT ON TABLE achievements IS 'Available achievements and badges';
COMMENT ON TABLE box_office_daily IS 'Daily box office performance tracking';
COMMENT ON TABLE leaderboards IS 'Seasonal rankings and competition results';
