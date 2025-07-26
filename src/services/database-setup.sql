-- Talk to August Database Schema
-- Run this SQL in your Supabase SQL Editor to set up all tables and policies

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- For a complete reset, you can uncomment and run these DROP statements manually in the Supabase SQL editor.
-- DROP TABLE IF EXISTS public.onboarding_selections CASCADE;
-- DROP TABLE IF EXISTS public.profiles CASCADE;
-- DROP TABLE IF EXISTS public.journal_entries CASCADE;
-- DROP TABLE IF EXISTS public.goals CASCADE;
-- DROP TABLE IF EXISTS public.daily_wellness_ratings CASCADE;
-- DROP TABLE IF EXISTS public.chat_history CASCADE;
-- DROP TABLE IF EXISTS public.sexual_happiness_scores CASCADE;
-- DROP TABLE IF EXISTS public.audio_guides CASCADE;
-- DROP FUNCTION IF EXISTS public.handle_new_user();

-- Drop the erroneous 'public.users' table if it exists. It conflicts with auth.users and causes FK issues.
DROP TABLE IF EXISTS public.users CASCADE;

-- 1. Profiles table to store public user information
-- This table is linked to the auth.users table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
    age_range TEXT,
  gender TEXT,
  sexuality TEXT,
  relationship_status TEXT CHECK (relationship_status IN ('single', 'dating', 'married', 'other')),
  onboarding_completed BOOLEAN DEFAULT FALSE,
  points INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Function to create a new profile for a new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (new.id, new.raw_user_meta_data->>'username');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function when a new user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant permissions for the new trigger
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, anon, authenticated, service_role;

-- 2. Onboarding selections table to store user preferences
CREATE TABLE IF NOT EXISTS public.onboarding_selections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  goal_preference TEXT CHECK (goal_preference IN ('teach_me', 'improve_sex', 'enhance_sex')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- Explicitly define the foreign key constraint to ensure it points to the correct table
ALTER TABLE public.onboarding_selections DROP CONSTRAINT IF EXISTS onboarding_selections_user_id_fkey;
ALTER TABLE public.onboarding_selections ADD CONSTRAINT onboarding_selections_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 3. Journal entries table to store user journal entries
CREATE TABLE IF NOT EXISTS public.journal_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Goals table to store user goals
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  recurrence TEXT,
  effort_score TEXT,
  time_of_day TEXT,
  tags TEXT[],
  status TEXT CHECK (status IN ('active', 'completed')) DEFAULT 'active',
  completion_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Daily wellness ratings table to store daily check-ins
CREATE TABLE IF NOT EXISTS public.daily_wellness_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  sexual_wellness_rating INTEGER CHECK (sexual_wellness_rating BETWEEN 1 AND 5),
  rating_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, rating_date)
);

-- 6. Audio guides table to store guide metadata
CREATE TABLE IF NOT EXISTS public.audio_guides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  duration INTEGER NOT NULL CHECK (duration > 0), -- Duration in seconds
  file_path TEXT NOT NULL, -- Path in Supabase Storage
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Audio guide progress table to track user listening progress
CREATE TABLE IF NOT EXISTS public.audio_guide_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  audio_guide_id UUID REFERENCES audio_guides(id) ON DELETE CASCADE,
  progress INTEGER NOT NULL CHECK (progress >= 0), -- Progress in seconds
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, audio_guide_id)
);

-- 8. Chat history table to store August AI conversations
CREATE TABLE IF NOT EXISTS public.chat_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  is_user_message BOOLEAN NOT NULL, -- True for user, False for AI
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Goal completions table to track individual goal completions (for recurring goals)
CREATE TABLE IF NOT EXISTS public.goal_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  goal_id UUID REFERENCES public.goals(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add constraints separately for easier modification
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_age_range_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_age_range_check CHECK (age_range IN ('16-20', '21-25', '26-30', '31-35', '36-45', '45+'));

-- 7. Row Level Security (RLS) Policies
-- Enable RLS for all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_wellness_ratings ENABLE ROW LEVEL SECURITY;

-- Policies for profiles table
DROP POLICY IF EXISTS "Users can view their own profile." ON public.profiles;
CREATE POLICY "Users can view their own profile." ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
CREATE POLICY "Users can insert their own profile." ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
CREATE POLICY "Users can update their own profile." ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Policies for onboarding_selections table
DROP POLICY IF EXISTS "Users can manage their own onboarding selections." ON public.onboarding_selections;
CREATE POLICY "Users can manage their own onboarding selections." ON public.onboarding_selections
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Policies for journal_entries table
DROP POLICY IF EXISTS "Users can manage their own journal entries." ON public.journal_entries;
CREATE POLICY "Users can manage their own journal entries." ON public.journal_entries
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Policies for goals table
DROP POLICY IF EXISTS "Users can manage their own goals." ON public.goals;
CREATE POLICY "Users can manage their own goals." ON public.goals
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Policies for daily_wellness_ratings table
DROP POLICY IF EXISTS "Users can manage their own wellness ratings." ON public.daily_wellness_ratings;
CREATE POLICY "Users can manage their own wellness ratings." ON public.daily_wellness_ratings
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 10. Sexual Happiness Score table to store user scores
CREATE TABLE IF NOT EXISTS public.sexual_happiness_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. Subscription Plans table to store available subscription plans
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_code TEXT NOT NULL UNIQUE, -- Paystack plan code (e.g., PLN_ngi7zlmtuwfjd4e)
  name TEXT NOT NULL, -- e.g., "Monthly Premium", "Annual Premium"
  description TEXT,
  amount INTEGER NOT NULL, -- Amount in kobo (for NGN) or smallest currency unit
  currency TEXT NOT NULL DEFAULT 'NGN',
  interval TEXT NOT NULL CHECK (interval IN ('monthly', 'yearly', 'weekly', 'daily')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. Subscriptions table to store user subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.subscription_plans(id) ON DELETE RESTRICT,
  paystack_subscription_code TEXT UNIQUE, -- Paystack subscription code
  paystack_customer_code TEXT, -- Paystack customer code
  status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'paused', 'expired', 'pending')) DEFAULT 'pending',
  amount INTEGER NOT NULL, -- Amount paid in smallest currency unit
  currency TEXT NOT NULL DEFAULT 'NGN',
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  next_payment_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security (RLS) for all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_wellness_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audio_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audio_guide_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sexual_happiness_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Profiles
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Users can view their own profile." ON public.profiles;
CREATE POLICY "Users can view their own profile." ON public.profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
CREATE POLICY "Users can update their own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Onboarding Selections
DROP POLICY IF EXISTS "Users can manage their own onboarding selections." ON public.onboarding_selections;
CREATE POLICY "Users can manage their own onboarding selections." ON public.onboarding_selections FOR ALL USING (auth.uid() = user_id);

-- Journal Entries
DROP POLICY IF EXISTS "Users can manage their own journal entries." ON public.journal_entries;
CREATE POLICY "Users can manage their own journal entries." ON public.journal_entries FOR ALL USING (auth.uid() = user_id);

-- Goals
DROP POLICY IF EXISTS "Users can manage their own goals." ON public.goals;
CREATE POLICY "Users can manage their own goals." ON public.goals FOR ALL USING (auth.uid() = user_id);

-- Goal Completions
DROP POLICY IF EXISTS "Users can manage their own goal completions." ON public.goal_completions;
CREATE POLICY "Users can manage their own goal completions." ON public.goal_completions FOR ALL USING (auth.uid() = user_id);

-- Daily Wellness Ratings
DROP POLICY IF EXISTS "Users can manage their own wellness ratings." ON public.daily_wellness_ratings;
CREATE POLICY "Users can manage their own wellness ratings." ON public.daily_wellness_ratings FOR ALL USING (auth.uid() = user_id);

-- Audio Guides (assuming all authenticated users can read guides)
DROP POLICY IF EXISTS "Authenticated users can view audio guides." ON public.audio_guides;
CREATE POLICY "Authenticated users can view audio guides." ON public.audio_guides FOR SELECT TO authenticated USING (true);

-- Audio Guide Progress
DROP POLICY IF EXISTS "Users can manage their own audio guide progress." ON public.audio_guide_progress;
CREATE POLICY "Users can manage their own audio guide progress." ON public.audio_guide_progress FOR ALL USING (auth.uid() = user_id);

-- Chat History
DROP POLICY IF EXISTS "Users can manage their own chat history." ON public.chat_history;
CREATE POLICY "Users can manage their own chat history." ON public.chat_history FOR ALL USING (auth.uid() = user_id);

-- Sexual Happiness Scores
DROP POLICY IF EXISTS "Users can manage their own happiness scores." ON public.sexual_happiness_scores;
CREATE POLICY "Users can manage their own happiness scores." ON public.sexual_happiness_scores FOR ALL USING (auth.uid() = user_id);

-- Subscription Plans (all authenticated users can read plans)
DROP POLICY IF EXISTS "Authenticated users can view subscription plans." ON public.subscription_plans;
CREATE POLICY "Authenticated users can view subscription plans." ON public.subscription_plans FOR SELECT TO authenticated USING (is_active = true);

-- Subscriptions
DROP POLICY IF EXISTS "Users can manage their own subscriptions." ON public.subscriptions;
CREATE POLICY "Users can manage their own subscriptions." ON public.subscriptions FOR ALL USING (auth.uid() = user_id);

-- The policies below are more descriptive and cover all necessary access controls.
-- The generic 'user_isolation' policies that previously existed were redundant and have been removed.

-- Insert some sample audio guides for testing
INSERT INTO audio_guides (title, description, duration, file_path) VALUES
('Introduction to Sexual Wellness', 'A gentle introduction to understanding your body and sexual health.', 480, 'audio/intro_to_wellness.mp3'),
('Communication in Relationships', 'Learn how to talk openly about intimacy with your partner.', 720, 'audio/communication_guide.mp3'),
('Understanding Pleasure', 'Explore what brings you joy and satisfaction in intimate moments.', 600, 'audio/understanding_pleasure.mp3'),
('Building Confidence', 'Develop self-assurance in your sexual wellness journey.', 540, 'audio/building_confidence.mp3');

-- Insert subscription plans
INSERT INTO subscription_plans (plan_code, name, description, amount, currency, interval) VALUES
('PLN_ngi7zlmtuwfjd4e', 'Monthly Premium', 'Full access to all features with monthly billing', 299900, 'NGN', 'monthly'),
('PLN_c54lr7g99c0c8xl', 'Annual Premium', 'Full access to all features with yearly billing (save 37%)', 1500000, 'NGN', 'yearly');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_created ON journal_entries(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_goals_user_status ON goals(user_id, status);
CREATE INDEX IF NOT EXISTS idx_goal_completions_user_completed ON goal_completions(user_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_daily_ratings_user_date ON daily_wellness_ratings(user_id, rating_date DESC);
CREATE INDEX IF NOT EXISTS idx_chat_history_user_created ON chat_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_happiness_scores_user_created ON sexual_happiness_scores(user_id, created_at DESC); 
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_paystack_code ON subscriptions(paystack_subscription_code); 