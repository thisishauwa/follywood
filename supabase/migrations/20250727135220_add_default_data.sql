-- Add default league and sample data for testing

-- Create a default league if it doesn't exist
INSERT INTO leagues (id, name, max_players, current_season, current_month)
VALUES ('default-league-id', 'Default League', 15, 1, 1)
ON CONFLICT (id) DO NOTHING;

-- Create some sample scripts if they don't exist
INSERT INTO scripts (id, title, genre, rating, logline, tags, base_cost, studio_level_required, is_user_generated)
VALUES 
  ('default-comedy-script', 'The Follywood Chronicles', 'Comedy', 4, 'A hilarious meta-comedy about TV show makers in the heart of Follywood.', ARRAY['comedy', 'meta', 'hollywood'], 75000, 1, false),
  ('default-action-script', 'Midnight Heist', 'Action', 3, 'A high-octane thriller about a team pulling off the ultimate heist.', ARRAY['action', 'thriller', 'heist'], 100000, 1, false),
  ('default-drama-script', 'Hearts & Dreams', 'Drama', 5, 'An emotional journey of love, loss, and redemption in modern times.', ARRAY['drama', 'romance', 'emotional'], 60000, 1, false)
ON CONFLICT (id) DO NOTHING;

-- Add some sample talent (actors and directors)
INSERT INTO talent (id, league_id, name, role, age, popularity_score, reputation_level, genre_affinity, star_power_rating, base_cost, personality_quirks, special_tags, availability_status)
VALUES 
  ('actor-1', 'default-league-id', 'Emma Stone', 'Actor', 35, 85, 'Industry Legend', ARRAY['Comedy', 'Drama'], 90, 2500000, ARRAY['Method Actor', 'Perfectionist'], ARRAY['Oscar Winner', 'Box Office Draw'], 'Available'),
  ('actor-2', 'default-league-id', 'Ryan Gosling', 'Actor', 43, 80, 'Industry Legend', ARRAY['Drama', 'Romance'], 85, 2000000, ARRAY['Mysterious', 'Dedicated'], ARRAY['Heartthrob', 'Critical Darling'], 'Available'),
  ('actor-3', 'default-league-id', 'Zendaya', 'Actor', 27, 95, 'Fan Favorite', ARRAY['Action', 'Drama'], 88, 1800000, ARRAY['Social Media Savvy', 'Versatile'], ARRAY['Rising Star', 'Gen Z Icon'], 'Available'),
  ('director-1', 'default-league-id', 'Christopher Nolan', 'Director', 54, 90, 'Industry Legend', ARRAY['Sci-fi', 'Thriller'], 95, 5000000, ARRAY['Perfectionist', 'Visionary'], ARRAY['Blockbuster King', 'Mind-Bending'], 'Available'),
  ('director-2', 'default-league-id', 'Greta Gerwig', 'Director', 40, 85, 'Critical Darling', ARRAY['Comedy', 'Drama'], 80, 3000000, ARRAY['Character-Driven', 'Authentic'], ARRAY['Indie Darling', 'Female Filmmaker'], 'Available')
ON CONFLICT (id) DO NOTHING;

-- Create award categories if they don't exist
INSERT INTO award_categories (id, name, category_type)
VALUES 
  ('best-picture', 'Best Picture', 'Overall'),
  ('best-actor', 'Best Actor', 'Performance'),
  ('best-actress', 'Best Actress', 'Performance'),
  ('best-director', 'Best Director', 'Technical'),
  ('best-screenplay', 'Best Screenplay', 'Technical')
ON CONFLICT (id) DO NOTHING;
