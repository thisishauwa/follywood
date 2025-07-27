-- Comprehensive seed data for CinemaCraft universe
-- 15 actors, 10 scripts, 5 directors, awards, and production houses

-- First, let's add the awards system
INSERT INTO awards (id, name, category, prestige_level, ceremony_name) VALUES
  ('aurel-best-picture', 'Best Picture', 'Film', 5, 'The Aurels'),
  ('aurel-best-actor', 'Best Actor', 'Performance', 4, 'The Aurels'),
  ('aurel-best-actress', 'Best Actress', 'Performance', 4, 'The Aurels'),
  ('aurel-best-director', 'Best Director', 'Technical', 4, 'The Aurels'),
  ('aurel-best-screenplay', 'Best Screenplay', 'Writing', 3, 'The Aurels'),
  ('screencraft-gold-drama', 'Drama Excellence', 'Genre', 3, 'ScreenCraft Gold'),
  ('screencraft-gold-comedy', 'Comedy Excellence', 'Genre', 3, 'ScreenCraft Gold'),
  ('indie-spirit-breakthrough', 'Breakthrough Performance', 'Performance', 2, 'Indie Spirit Awards'),
  ('peoples-choice-favorite', 'Audience Favorite', 'Popular', 2, 'People\'s Choice'),
  ('critics-circle-rising', 'Rising Star', 'Recognition', 1, 'Critics Circle')
ON CONFLICT (id) DO NOTHING;

-- Add production houses and agencies
INSERT INTO production_houses (id, name, type, reputation_level, specialty_genres, founded_year) VALUES
  ('apex-studios', 'Apex Studios', 'studio', 'Industry Leader', ARRAY['Action', 'Sci-Fi', 'Thriller'], 1995),
  ('moonlight-pictures', 'Moonlight Pictures', 'production_company', 'Boutique Excellence', ARRAY['Drama', 'Romance', 'Indie'], 2008),
  ('velocity-entertainment', 'Velocity Entertainment', 'agency', 'Top Tier', ARRAY['Action', 'Comedy', 'Horror'], 2001),
  ('sterling-talent', 'Sterling Talent Agency', 'agency', 'Established', ARRAY['Drama', 'Comedy', 'Romance'], 1987),
  ('rebel-films', 'Rebel Films', 'production_company', 'Cult Following', ARRAY['Horror', 'Thriller', 'Indie'], 2012)
ON CONFLICT (id) DO NOTHING;

-- Add 15 diverse actors to the default league
INSERT INTO talent (id, league_id, name, role, age, popularity_score, reputation_level, genre_affinity, star_power_rating, base_cost, personality_quirks, special_tags, availability_status, career_stage, box_office_track_record) VALUES

-- Established Legends (3)
('actor-rayan-gooseman', 'default-league-id', 'Rayan Gooseman', 'Actor', 44, 88, 'Industry Legend', ARRAY['Drama', 'Romance'], 92, 2800000, ARRAY['Mysterious', 'Method Actor'], ARRAY['Heartthrob', 'Critical Darling'], 'Available', 'legend', 'bankable'),
('actor-aisha-stone', 'default-league-id', 'Aisha Stone', 'Actor', 36, 91, 'Industry Legend', ARRAY['Comedy', 'Drama'], 95, 3200000, ARRAY['Perfectionist', 'Witty'], ARRAY['Oscar Winner', 'Box Office Queen'], 'Available', 'legend', 'bankable'),
('actor-marcus-steele', 'default-league-id', 'Marcus Steele', 'Actor', 52, 85, 'Industry Legend', ARRAY['Action', 'Thriller'], 89, 2500000, ARRAY['Intense', 'Physical'], ARRAY['Action Hero', 'Stunt Performer'], 'Available', 'veteran', 'reliable'),

-- Rising Stars (4)
('actor-luna-reyes', 'default-league-id', 'Luna Reyes', 'Actor', 28, 78, 'Rising Star', ARRAY['Drama', 'Indie'], 82, 1200000, ARRAY['Authentic', 'Vulnerable'], ARRAY['Critics\' Darling', 'Indie Queen'], 'Available', 'rising', 'mixed'),
('actor-javier-brohm', 'default-league-id', 'Javier Brohm', 'Actor', 31, 73, 'Rising Star', ARRAY['Comedy', 'Romance'], 76, 900000, ARRAY['Charming', 'Spontaneous'], ARRAY['Romantic Lead', 'Comedy Gold'], 'Available', 'rising', 'unproven'),
('actor-zara-chen', 'default-league-id', 'Zara Chen', 'Actor', 26, 82, 'Fan Favorite', ARRAY['Action', 'Sci-Fi'], 85, 1500000, ARRAY['Athletic', 'Tech Savvy'], ARRAY['Gen Z Icon', 'Martial Artist'], 'Available', 'rising', 'reliable'),
('actor-kai-morrison', 'default-league-id', 'Kai Morrison', 'Actor', 29, 69, 'Rising Star', ARRAY['Horror', 'Thriller'], 71, 800000, ARRAY['Intense', 'Brooding'], ARRAY['Scream King', 'Method Actor'], 'Available', 'rising', 'mixed'),

-- Established Veterans (4)
('actor-sofia-valdez', 'default-league-id', 'Sofia Valdez', 'Actor', 41, 79, 'Seasoned Pro', ARRAY['Drama', 'Biography'], 83, 1800000, ARRAY['Transformative', 'Dedicated'], ARRAY['Character Actor', 'Awards Magnet'], 'Available', 'established', 'reliable'),
('actor-devon-cross', 'default-league-id', 'Devon Cross', 'Actor', 38, 74, 'Seasoned Pro', ARRAY['Comedy', 'Action'], 78, 1600000, ARRAY['Versatile', 'Easy-going'], ARRAY['Crowd Pleaser', 'Franchise Star'], 'Available', 'established', 'reliable'),
('actor-elena-frost', 'default-league-id', 'Elena Frost', 'Actor', 45, 71, 'Seasoned Pro', ARRAY['Thriller', 'Drama'], 75, 1400000, ARRAY['Calculating', 'Precise'], ARRAY['Villain Specialist', 'Scene Stealer'], 'Available', 'established', 'mixed'),
('actor-river-blake', 'default-league-id', 'River Blake', 'Actor', 33, 77, 'Seasoned Pro', ARRAY['Indie', 'Drama'], 80, 1100000, ARRAY['Artistic', 'Unpredictable'], ARRAY['Indie Darling', 'Festival Favorite'], 'Available', 'established', 'mixed'),

-- Hit-or-Miss Veterans (2)
('actor-phoenix-wilde', 'default-league-id', 'Phoenix Wilde', 'Actor', 39, 65, 'Hit-or-Miss', ARRAY['Action', 'Comedy'], 68, 1000000, ARRAY['Unpredictable', 'Ego-driven'], ARRAY['Former A-Lister', 'Comeback Potential'], 'Available', 'established', 'poison'),
('actor-sage-winters', 'default-league-id', 'Sage Winters', 'Actor', 47, 62, 'Hit-or-Miss', ARRAY['Drama', 'Romance'], 64, 900000, ARRAY['Temperamental', 'Nostalgic'], ARRAY['90s Icon', 'Tabloid Magnet'], 'Available', 'veteran', 'poison'),

-- Fresh Newcomers (2)
('actor-nova-kim', 'default-league-id', 'Nova Kim', 'Actor', 23, 58, 'Fresh Face', ARRAY['Romance', 'Comedy'], 62, 400000, ARRAY['Eager', 'Social Media Native'], ARRAY['TikTok Famous', 'Gen Z Darling'], 'Available', 'newcomer', 'unproven'),
('actor-atlas-jones', 'default-league-id', 'Atlas Jones', 'Actor', 25, 55, 'Fresh Face', ARRAY['Action', 'Thriller'], 59, 350000, ARRAY['Athletic', 'Ambitious'], ARRAY['Stunt Background', 'Raw Talent'], 'Available', 'newcomer', 'unproven')

ON CONFLICT (id) DO NOTHING;

-- Add 5 diverse directors
INSERT INTO talent (id, league_id, name, role, age, popularity_score, reputation_level, genre_affinity, star_power_rating, base_cost, personality_quirks, special_tags, availability_status, career_stage, box_office_track_record) VALUES

('director-helena-voss', 'default-league-id', 'Helena Voss', 'Director', 48, 87, 'Visionary', ARRAY['Sci-Fi', 'Thriller'], 91, 4200000, ARRAY['Perfectionist', 'Innovative'], ARRAY['Mind-Bending', 'Visual Storyteller'], 'Available', 'established', 'bankable'),
('director-diego-santos', 'default-league-id', 'Diego Santos', 'Director', 41, 82, 'Critical Darling', ARRAY['Drama', 'Biography'], 85, 3500000, ARRAY['Character-Driven', 'Authentic'], ARRAY['Awards Magnet', 'Actor\'s Director'], 'Available', 'established', 'reliable'),
('director-maya-chen', 'default-league-id', 'Maya Chen', 'Director', 35, 79, 'Rising Auteur', ARRAY['Horror', 'Thriller'], 83, 2800000, ARRAY['Atmospheric', 'Detail-Oriented'], ARRAY['Genre Master', 'Cult Following'], 'Available', 'rising', 'reliable'),
('director-finn-cooper', 'default-league-id', 'Finn Cooper', 'Director', 52, 75, 'Seasoned Pro', ARRAY['Comedy', 'Family'], 78, 3000000, ARRAY['Fast Turnaround', 'Commercial'], ARRAY['Crowd Pleaser', 'Budget Conscious'], 'Available', 'veteran', 'reliable'),
('director-sage-rivers', 'default-league-id', 'Sage Rivers', 'Director', 29, 71, 'Indie Darling', ARRAY['Indie', 'Drama'], 76, 1500000, ARRAY['Artistic', 'Experimental'], ARRAY['Festival Favorite', 'Raw Vision'], 'Available', 'rising', 'mixed')

ON CONFLICT (id) DO NOTHING;

-- Add 10 diverse scripts to the marketplace
INSERT INTO scripts (id, title, genre, rating, logline, tags, base_cost, studio_level_required, is_user_generated, buzz_rating, quality_stars, original_author, market_appeal) VALUES

('script-neon-nights', 'Neon Nights', 'Sci-Fi', 4, 'In 2087, a rogue AI detective must solve murders in a city where memories can be stolen and sold.', ARRAY['cyberpunk', 'noir', 'ai', 'futuristic'], 850000, 2, false, 78, 4, 'Alex Quantum', 'blockbuster'),

('script-coffee-shop-chronicles', 'Coffee Shop Chronicles', 'Comedy', 3, 'A barista discovers that each coffee blend reveals the deepest secrets of their customers.', ARRAY['workplace comedy', 'ensemble', 'heartwarming'], 320000, 1, false, 65, 3, 'Jamie Brewster', 'mainstream'),

('script-the-last-lighthouse', 'The Last Lighthouse', 'Drama', 5, 'An aging lighthouse keeper faces eviction as automated systems replace human workers across the coast.', ARRAY['character study', 'environmental', 'aging', 'isolation'], 480000, 1, false, 82, 5, 'Marina Shores', 'arthouse'),

('script-heist-academy', 'Heist Academy', 'Action', 3, 'A group of misfit teenagers attend a secret school that trains the world\'s most elite thieves.', ARRAY['heist', 'teen', 'school', 'mentor'], 720000, 2, false, 71, 3, 'Danny Ocean Jr.', 'mainstream'),

('script-digital-ghosts', 'Digital Ghosts', 'Horror', 4, 'When a social media influencer buys a vintage camera, she discovers it captures the spirits of the dead.', ARRAY['supernatural', 'social media', 'technology', 'millennial'], 420000, 1, false, 69, 4, 'Pixel Haunter', 'mainstream'),

('script-the-food-truck-wars', 'The Food Truck Wars', 'Comedy', 2, 'Rival food truck owners must team up when a corporate chain threatens to destroy their neighborhood.', ARRAY['food', 'rivalry', 'community', 'underdog'], 280000, 1, false, 58, 2, 'Sal Pepper', 'niche'),

('script-quantum-hearts', 'Quantum Hearts', 'Romance', 4, 'A physicist discovers that love transcends parallel universes when she meets the same person across different realities.', ARRAY['parallel universe', 'science', 'destiny', 'multiverse'], 650000, 2, false, 74, 4, 'Dr. Love Particle', 'mainstream'),

('script-the-midnight-museum', 'The Midnight Museum', 'Thriller', 4, 'A night security guard at a natural history museum realizes the exhibits come alive to protect ancient secrets.', ARRAY['supernatural', 'museum', 'ancient mystery', 'night shift'], 520000, 1, false, 67, 4, 'Curator X', 'mainstream'),

('script-silicon-valley-moms', 'Silicon Valley Moms', 'Comedy', 3, 'Tech executive mothers compete in the ultimate startup: raising perfect children in the digital age.', ARRAY['parenting', 'tech culture', 'competition', 'satire'], 380000, 1, false, 63, 3, 'Beta Parent', 'niche'),

('script-the-time-travelers-diner', 'The Time Traveler\'s Diner', 'Sci-Fi', 5, 'A 24-hour diner serves as a waystation for time travelers, but when the timeline breaks, the waitress must fix history.', ARRAY['time travel', 'diner', 'ensemble', 'paradox'], 780000, 2, false, 85, 5, 'Chronos Cafe', 'blockbuster')

ON CONFLICT (id) DO NOTHING;

-- Add scripts to marketplace for the default league
INSERT INTO script_marketplace (script_id, league_id, buzz_rating, trending_score, available_until) VALUES
('script-neon-nights', 'default-league-id', 78, 15, NOW() + INTERVAL '3 months'),
('script-coffee-shop-chronicles', 'default-league-id', 65, 8, NOW() + INTERVAL '2 months'),
('script-the-last-lighthouse', 'default-league-id', 82, 20, NOW() + INTERVAL '4 months'),
('script-heist-academy', 'default-league-id', 71, 12, NOW() + INTERVAL '3 months'),
('script-digital-ghosts', 'default-league-id', 69, 10, NOW() + INTERVAL '2 months'),
('script-the-food-truck-wars', 'default-league-id', 58, 5, NOW() + INTERVAL '1 month'),
('script-quantum-hearts', 'default-league-id', 74, 14, NOW() + INTERVAL '3 months'),
('script-the-midnight-museum', 'default-league-id', 67, 9, NOW() + INTERVAL '2 months'),
('script-silicon-valley-moms', 'default-league-id', 63, 7, NOW() + INTERVAL '2 months'),
('script-the-time-travelers-diner', 'default-league-id', 85, 25, NOW() + INTERVAL '4 months')
ON CONFLICT (script_id, league_id) DO NOTHING;

-- Add some initial entertainment news
INSERT INTO entertainment_news (league_id, headline, content, news_type, related_talent_ids, publication_name, expires_at) VALUES
('default-league-id', 'Aisha Stone Signs Multi-Picture Deal with Apex Studios', 'Industry legend Aisha Stone has inked a lucrative three-picture deal with Apex Studios, sources confirm. The Oscar winner is set to star in and executive produce a new sci-fi franchise.', 'announcement', ARRAY['actor-aisha-stone'], 'ReelTalk Weekly', NOW() + INTERVAL '1 month'),
('default-league-id', 'Rising Star Luna Reyes Spotted at Indie Film Festival', 'Critics\' darling Luna Reyes made waves at the Sundance alternative festival, hinting at her next dramatic role. Industry insiders say she\'s the one to watch this season.', 'gossip', ARRAY['actor-luna-reyes'], 'IndieLeak', NOW() + INTERVAL '2 weeks'),
('default-league-id', 'Director Helena Voss Teases Mind-Bending New Project', 'Visionary filmmaker Helena Voss dropped cryptic hints about her next sci-fi thriller on social media. The project is rumored to have a budget exceeding $100 million.', 'announcement', ARRAY['director-helena-voss'], 'ReelTalk Weekly', NOW() + INTERVAL '3 weeks')
ON CONFLICT DO NOTHING;
