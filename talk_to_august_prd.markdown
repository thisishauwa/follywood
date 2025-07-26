# PRD: Talk to August — A Personal Sexual Wellness Guide in Your Pocket

## 1. Product Vision

Build a safe, intelligent, mobile-first space where users can explore their sexual wellness on their own terms. The app empowers people to track their sexual goals, reflect through journaling, listen to expert audio guides, and chat with August AI — a warm, affirming, intelligent companion who responds with empathy, clarity, and contextual insights. Through small, consistent actions like journaling, checking in, checking in, and goal-setting, users steadily build up their Sexual Happiness Score — a personalized reflection of how fulfilled they feel.

## 2. User Personas & Core User Stories

### Persona

* **Target Audience**: Women aged 16–30, especially in conservative settings, who want to understand their bodies and improve their sexual wellness without shame or overwhelm.
* **Behavior**: Curious but cautious, they crave trustworthy information, private space, and support that’s respectful, warm, and nonjudgmental.

### Key User Stories

* As a new user, I want onboarding that helps me feel seen and safe, so I trust the app enough to keep going.
* As a user, I want to journal regularly, so I can reflect on how I feel and notice patterns over time.
* As a user, I want to set sexual wellness goals, so I can grow in a focused, intentional way.
* As a user, I want to track how I’m doing, so I can feel encouraged and in control of my sexual happiness.
* As a user, I want daily check-ins that are quick and private, so I can stay aware of how I’m feeling.
* As a user, I want to access warm, honest audio guides, so I can learn in a way that feels natural and personal.
* As a user, I want to chat with August AI about how I feel or what I want to know, so I don’t have to search the internet or talk to someone else.
* As a user, I want to edit my profile and relationship details, so August can give better support.

## 3. Core Features

### 3.1. Authentication

* **Signup / Signin** via email & password using NextAuth.js.
* **Forgot Password** with reset link sent via email.
* **User Info Stored in Supabase**: email, UUID, profile details (age range, gender, relationship status, sexuality), created_at.

### 3.2. Onboarding

* **3 Slides** that explain the purpose, values, and benefits of Talk to August.
* **Getting Started 1**: Choose what you want from the app (“Teach me about sex”, “I know sex; help me make it better”, “Sex is fine; make it explosive”).
* **Getting Started 2**: Capture age range, gender, sexuality, and relationship status.
* **Save all onboarding selections in Supabase** and use them to personalize August AI and user prompts.

### 3.3. Home Screen

* **Sexual Happiness Score**: Updated based on completed goals, journal entries, and self-ratings.
* **Daily Prompt**: “How do you feel about your sex life today?” with emoji scale. Updates `sexual_wellness_rating` in Supabase.
* **Preview Cards**: Journals and Goals previews.
* **Quick Access** to August AI, Journal, Goals, and Audio Guides (bottom navbar).

### 3.4. Journals

* **List View** of past journal entries.
* **Create New Entry** with optional prompt (e.g., “What’s one thing you want to feel more of?”).
* **Stored in Supabase**: text, timestamp, tags (optional), and linked to user UUID.
* **Scored**: Journaling adds to Sexual Happiness Score.
* **Zustand** used to manage unsaved draft state.
* **React Hook Form** handles input/validation.

### 3.5. Goals

* **Set Up to 3 Goals at a Time** across categories (intimacy, exploration, relationship, health).
* **Mark as Complete** with tap interaction.
* **Stored in Supabase**: goal text, status, category, completion date.
* **Completion contributes to Sexual Happiness Score**.

### 3.6. Audio Guides

* **List View** with short descriptions.
* **Player Screen** with title, duration, playback controls.
* **Guides streamed** from Supabase Storage or Firebase, no download required.
* **Listening progress stored per user**.
* **Accessible** for users who don’t like reading or are audio learners.

### 3.7. August AI Chat

* **Chat UI** with thread-style interface.
* **Personality**: Warm, smart, direct, nonjudgmental.
* **Context-aware**: Uses info from journals, goals, profile, and check-ins to personalize responses.
* **Intent Parsing**:
  * “I feel low” → comfort and journaling suggestion
  * “Help me make sex better” → show goals or guides
  * “Why don’t I like sex?” → contextual conversation
* **Powered by Gemini 2.0**, API key server-side.
* **Chat history stored** in Supabase per user.

### 3.8. Profile Management

* **Editable**: Email, age range, gender, sexuality, relationship status.
* **Stored in Supabase**, used by August AI and daily prompts.

## 4. Technical Stack

* **Authentication**: NextAuth.js
* **Backend & Database**: Supabase (auth, storage, tables)
* **Frontend**: React Native (Cursor)
* **State Management**: Zustand
* **Forms & Validation**: React Hook Form
* **Data Fetching & Caching**: React Query
* **Styling**: Native `StyleSheet` API
* **AI**: Gemini 2.0 Flash (via secured API)

## 5. User Flow

1. **Onboarding** → Users swipe through values and enter profile info.
2. **Account Creation** → Sign up via email and password.
3. **Home Screen** → View score, log daily rating, access other tabs.
4. **Journals** → List view, new entry, emotional prompts.
5. **Goals** → Set, view, and complete goals.
6. **Guides** → Learn through short audio files.
7. **August AI** → Ask questions, receive personalized answers.
8. **Profile** → Edit info, manage account.

## 6. MVP Checklist

* [ ] Auth via NextAuth.js and Supabase (email/password).
* [ ] Onboarding with 2 Getting Started steps.
* [ ] Home with Sexual Happiness Score and daily rating prompt.
* [ ] Journal system (write, list, auto-score).
* [ ] Goals system (set, complete, track).
* [ ] Audio guide player (list, listen, track progress).
* [ ] August AI chat with contextual awareness.
* [ ] Zustand + React Query integration.
* [ ] Profile screen with editable info.
* [ ] Mobile-first UI with Native StyleSheet.

## 7. Monetization (Planned)

* **Freemium Model** (Phase 2+):
  * Free: Journals, Goals, Daily Check-In, Audio Guides (limited), August AI (limited context).
  * Premium: Full Audio Library, Deeper AI Support (longer chats + full context), Premium Goals, Sexual Happiness Reports.
* **Pricing**:
  * NGN 2,000/month or NGN 18,000/year
  * USD $5/month or $45/year
* **Payment**: Stripe or Paystack Mobile SDK (to be scoped).
* **In-App Purchase** integration planned post-launch.

## 8. Competitive Positioning

| Feature              | Talk to August                          | Other Wellness Apps    |
| -------------------- | --------------------------------------- | ---------------------- |
| AI Therapy Chat      | Context-aware, sexuality-focused        | Often generic or vague |
| Audio Resources      | Real, warm guides, not just meditations | Meditation-heavy       |
| Journals & Goals     | Personalized & scored                   | Journals often generic |
| Cultural Sensitivity | Designed for young, conservative users  | Often Western-centered |
| Score Tracking       | Sexual Happiness Score = growth metric  | No tracking or scoring |

## 9. Supabase Database Schema

Below is the SQL for the Supabase tables to support the Talk to August app.

```sql
-- Users table to store user authentication and profile details
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  age_range TEXT CHECK (age_range IN ('16-20', '21-25', '26-30')),
  gender TEXT,
  sexuality TEXT,
  relationship_status TEXT CHECK (relationship_status IN ('single', 'dating', 'married', 'other')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Onboarding selections table to store user preferences
CREATE TABLE onboarding_selections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  goal_preference TEXT CHECK (goal_preference IN ('teach_me', 'improve_sex', 'enhance_sex')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Journal entries table to store user journal entries
CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Goals table to store user goals
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  category TEXT CHECK (category IN ('intimacy', 'exploration', 'relationship', 'health')),
  status TEXT CHECK (status IN ('active', 'completed')) DEFAULT 'active',
  completion_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Daily wellness ratings table to store daily check-ins
CREATE TABLE daily_wellness_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  sexual_wellness_rating INTEGER CHECK (sexual_wellness_rating BETWEEN 1 AND 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, created_at::DATE)
);

-- Audio guides table to store guide metadata
CREATE TABLE audio_guides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  duration INTEGER NOT NULL CHECK (duration > 0), -- Duration in seconds
  file_path TEXT NOT NULL, -- Path in Supabase Storage
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Audio guide progress table to track user listening progress
CREATE TABLE audio_guide_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  audio_guide_id UUID REFERENCES audio_guides(id) ON DELETE CASCADE,
  progress INTEGER NOT NULL CHECK (progress >= 0), -- Progress in seconds
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, audio_guide_id)
);

-- Chat history table to store August AI conversations
CREATE TABLE chat_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  is_user_message BOOLEAN NOT NULL, -- True for user, False for AI
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sexual Happiness Score table to store user scores
CREATE TABLE sexual_happiness_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security (RLS) for all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_wellness_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_guide_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE sexual_happiness_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies to ensure users only access their own data
CREATE POLICY user_isolation ON users
  USING (id = auth.uid());

CREATE POLICY user_isolation ON onboarding_selections
  USING (user_id = auth.uid());

CREATE POLICY user_isolation ON journal_entries
  USING (user_id = auth.uid());

CREATE POLICY user_isolation ON goals
  USING (user_id = auth.uid());

CREATE POLICY user_isolation ON daily_wellness_ratings
  USING (user_id = auth.uid());

CREATE POLICY read_audio_guides ON audio_guides
  USING (true); -- All users can read audio guides

CREATE POLICY user_isolation ON audio_guide_progress
  USING (user_id = auth.uid());

CREATE POLICY user_isolation ON chat_history
  USING (user_id = auth.uid());

CREATE POLICY user_isolation ON sexual_happiness_scores
  USING (user_id = auth.uid());
```