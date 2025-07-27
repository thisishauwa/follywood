import { supabase } from '../lib/supabase';

export interface Actor {
  id: string;
  name: string;
  age: number;
  reputation_level: string;
  genre_affinity: string[];
  star_power_rating: number;
  base_cost: number;
  personality_quirks: string[];
  special_tags: string[];
  availability_status: string;
  career_stage: string;
  box_office_track_record: string;
  popularity_score: number;
  awards_won: number;
  last_major_role_date?: string;
}

export interface Director {
  id: string;
  name: string;
  age: number;
  reputation_level: string;
  genre_affinity: string[];
  star_power_rating: number;
  base_cost: number;
  personality_quirks: string[];
  special_tags: string[];
  availability_status: string;
  career_stage: string;
  popularity_score: number;
}

export interface Script {
  id: string;
  title: string;
  genre: string;
  rating: number;
  logline: string;
  tags: string[];
  base_cost: number;
  buzz_rating: number;
  quality_stars: number;
  original_author: string;
  market_appeal: string;
  times_adapted: number;
}

export interface MarketplaceScript extends Script {
  marketplace_id: string;
  trending_score: number;
  available_until: string;
  times_used: number;
  last_used_at?: string;
}

export interface EntertainmentNews {
  id: string;
  headline: string;
  content: string;
  news_type: string;
  related_talent_ids: string[];
  publication_name: string;
  published_at: string;
  expires_at: string;
}

export interface LifecycleEvent {
  id: string;
  talent_id: string;
  event_type: string;
  event_date: string;
  description: string;
  impact_on_popularity: number;
  impact_on_cost: number;
}

export interface Award {
  id: string;
  name: string;
  category: string;
  prestige_level: number;
  ceremony_name: string;
}

export interface UserStudio {
  id: string;
  user_id: string;
  profile_id: string;
  league_id: string;
  studio_name: string;
  studio_type: string;
  reputation_level: string;
  specialty_genres: string[];
  total_films_produced: number;
  total_box_office: number;
  awards_won: number;
  founded_date: string;
  bio: string;
  avatar_url?: string;
  is_active: boolean;
  last_active: string;
}

export interface StudioRelationship {
  id: string;
  studio_a_id: string;
  studio_b_id: string;
  relationship_type: 'ally' | 'rival' | 'neutral' | 'blocked';
  relationship_strength: number;
  created_at: string;
  updated_at: string;
}

export interface StudioActivityFeed {
  id: string;
  studio_id: string;
  league_id: string;
  activity_type: string;
  activity_data: any;
  visibility: string;
  created_at: string;
}

export interface MovieReview {
  id: string;
  movie_id: string;
  reviewer_studio_id: string;
  rating: number;
  review_text: string;
  is_public: boolean;
  helpful_votes: number;
  created_at: string;
  reviewer_studio?: UserStudio;
}

class CinemaContentService {
  // Generate new content using AI
  async generateActors(leagueId: string, count: number = 3): Promise<Actor[]> {
    const { data, error } = await supabase.functions.invoke('generate-cinema-content', {
      body: {
        type: 'actors',
        league_id: leagueId,
        count
      }
    });

    if (error) {
      throw new Error(`Failed to generate actors: ${error.message}`);
    }

    return data.data;
  }

  async generateDirectors(leagueId: string, count: number = 2): Promise<Director[]> {
    const { data, error } = await supabase.functions.invoke('generate-cinema-content', {
      body: {
        type: 'directors',
        league_id: leagueId,
        count
      }
    });

    if (error) {
      throw new Error(`Failed to generate directors: ${error.message}`);
    }

    return data.data;
  }

  async generateScripts(leagueId: string, count: number = 5): Promise<Script[]> {
    const { data, error } = await supabase.functions.invoke('generate-cinema-content', {
      body: {
        type: 'scripts',
        league_id: leagueId,
        count
      }
    });

    if (error) {
      throw new Error(`Failed to generate scripts: ${error.message}`);
    }

    return data.data;
  }

  async generateLifecycleEvent(talentId: string, eventType: string): Promise<LifecycleEvent> {
    const { data, error } = await supabase.functions.invoke('generate-cinema-content', {
      body: {
        type: 'lifecycle_event',
        target_talent_id: talentId,
        event_type: eventType
      }
    });

    if (error) {
      throw new Error(`Failed to generate lifecycle event: ${error.message}`);
    }

    return data.data;
  }

  async generateEntertainmentNews(leagueId: string): Promise<EntertainmentNews[]> {
    const { data, error } = await supabase.functions.invoke('generate-cinema-content', {
      body: {
        type: 'entertainment_news',
        league_id: leagueId
      }
    });

    if (error) {
      throw new Error(`Failed to generate entertainment news: ${error.message}`);
    }

    return data.data;
  }

  // Lifecycle management
  async ageTalent(leagueId: string) {
    const { data, error } = await supabase.functions.invoke('manage-talent-lifecycle', {
      body: {
        league_id: leagueId,
        action: 'age_talent'
      }
    });

    if (error) {
      throw new Error(`Failed to age talent: ${error.message}`);
    }

    return data.data;
  }

  async checkRetirements(leagueId: string) {
    const { data, error } = await supabase.functions.invoke('manage-talent-lifecycle', {
      body: {
        league_id: leagueId,
        action: 'check_retirements'
      }
    });

    if (error) {
      throw new Error(`Failed to check retirements: ${error.message}`);
    }

    return data.data;
  }

  async generateComebacks(leagueId: string) {
    const { data, error } = await supabase.functions.invoke('manage-talent-lifecycle', {
      body: {
        league_id: leagueId,
        action: 'generate_comebacks'
      }
    });

    if (error) {
      throw new Error(`Failed to generate comebacks: ${error.message}`);
    }

    return data.data;
  }

  async refreshMarketplace(leagueId: string) {
    const { data, error } = await supabase.functions.invoke('manage-talent-lifecycle', {
      body: {
        league_id: leagueId,
        action: 'refresh_marketplace'
      }
    });

    if (error) {
      throw new Error(`Failed to refresh marketplace: ${error.message}`);
    }

    return data.data;
  }

  // Data fetching methods
  async getAvailableActors(leagueId: string): Promise<Actor[]> {
    const { data, error } = await supabase
      .from('talent')
      .select('*')
      .eq('league_id', leagueId)
      .eq('role', 'Actor')
      .eq('availability_status', 'Available')
      .is('death_date', null)
      .is('retirement_date', null)
      .order('popularity_score', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch actors: ${error.message}`);
    }

    return data;
  }

  async getAvailableDirectors(leagueId: string): Promise<Director[]> {
    const { data, error } = await supabase
      .from('talent')
      .select('*')
      .eq('league_id', leagueId)
      .eq('role', 'Director')
      .eq('availability_status', 'Available')
      .is('death_date', null)
      .is('retirement_date', null)
      .order('popularity_score', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch directors: ${error.message}`);
    }

    return data;
  }

  async getMarketplaceScripts(leagueId: string): Promise<MarketplaceScript[]> {
    const { data, error } = await supabase
      .from('script_marketplace')
      .select(`
        id,
        buzz_rating,
        trending_score,
        available_until,
        times_used,
        last_used_at,
        scripts (
          id,
          title,
          genre,
          rating,
          logline,
          tags,
          base_cost,
          buzz_rating,
          quality_stars,
          original_author,
          market_appeal,
          times_adapted
        )
      `)
      .eq('league_id', leagueId)
      .gt('available_until', new Date().toISOString())
      .order('trending_score', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch marketplace scripts: ${error.message}`);
    }

    return data.map(item => ({
      ...item.scripts,
      marketplace_id: item.id,
      trending_score: item.trending_score,
      available_until: item.available_until,
      times_used: item.times_used,
      last_used_at: item.last_used_at
    }));
  }

  async getEntertainmentNews(leagueId: string): Promise<EntertainmentNews[]> {
    const { data, error } = await supabase
      .from('entertainment_news')
      .select('*')
      .eq('league_id', leagueId)
      .gt('expires_at', new Date().toISOString())
      .order('published_at', { ascending: false })
      .limit(10);

    if (error) {
      throw new Error(`Failed to fetch entertainment news: ${error.message}`);
    }

    return data;
  }

  async getTalentLifecycleEvents(talentId: string): Promise<LifecycleEvent[]> {
    const { data, error } = await supabase
      .from('talent_lifecycle_events')
      .select('*')
      .eq('talent_id', talentId)
      .order('event_date', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch lifecycle events: ${error.message}`);
    }

    return data;
  }

  async getAwards(): Promise<Award[]> {
    const { data, error } = await supabase
      .from('awards')
      .select('*')
      .order('prestige_level', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch awards: ${error.message}`);
    }

    return data;
  }

  // Social Studio Features
  async getUserStudiosInLeague(leagueId: string): Promise<UserStudio[]> {
    const { data, error } = await supabase
      .from('user_studios')
      .select('*')
      .eq('league_id', leagueId)
      .eq('is_active', true)
      .order('total_box_office', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch user studios: ${error.message}`);
    }

    return data;
  }

  async getStudioRelationships(studioId: string): Promise<StudioRelationship[]> {
    const { data, error } = await supabase
      .from('studio_relationships')
      .select('*')
      .or(`studio_a_id.eq.${studioId},studio_b_id.eq.${studioId}`);

    if (error) {
      throw new Error(`Failed to fetch studio relationships: ${error.message}`);
    }

    return data;
  }

  async getStudioActivityFeed(leagueId: string, limit: number = 20): Promise<StudioActivityFeed[]> {
    const { data, error } = await supabase
      .from('studio_activity_feed')
      .select(`
        *,
        user_studios!studio_id (
          studio_name,
          avatar_url,
          reputation_level
        )
      `)
      .eq('league_id', leagueId)
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch activity feed: ${error.message}`);
    }

    return data;
  }

  async getMovieReviews(movieId: string): Promise<MovieReview[]> {
    const { data, error } = await supabase
      .from('movie_reviews')
      .select(`
        *,
        user_studios!reviewer_studio_id (
          studio_name,
          avatar_url,
          reputation_level
        )
      `)
      .eq('movie_id', movieId)
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch movie reviews: ${error.message}`);
    }

    return data.map(review => ({
      ...review,
      reviewer_studio: review.user_studios
    }));
  }

  async getStudioLeaderboard(leagueId: string, category: string = 'overall', season: number = 1): Promise<any[]> {
    const { data, error } = await supabase
      .from('studio_leaderboards')
      .select(`
        *,
        user_studios!studio_id (
          studio_name,
          avatar_url,
          reputation_level,
          specialty_genres
        )
      `)
      .eq('league_id', leagueId)
      .eq('category', category)
      .eq('season', season)
      .order('rank', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch leaderboard: ${error.message}`);
    }

    return data;
  }

  // Social Interactions
  async likeNews(newsId: string, studioId: string): Promise<void> {
    const { error } = await supabase
      .from('news_interactions')
      .upsert({
        news_id: newsId,
        studio_id: studioId,
        interaction_type: 'like'
      });

    if (error) {
      throw new Error(`Failed to like news: ${error.message}`);
    }

    // Update the likes count
    await supabase.rpc('increment_news_likes', { news_id: newsId });
  }

  async submitMovieReview(movieId: string, reviewerStudioId: string, rating: number, reviewText: string): Promise<void> {
    const { error } = await supabase
      .from('movie_reviews')
      .upsert({
        movie_id: movieId,
        reviewer_studio_id: reviewerStudioId,
        rating,
        review_text: reviewText,
        is_public: true
      });

    if (error) {
      throw new Error(`Failed to submit review: ${error.message}`);
    }
  }

  async updateStudioRelationship(studioAId: string, studioBId: string, relationshipType: string, strength: number): Promise<void> {
    const { error } = await supabase
      .from('studio_relationships')
      .upsert({
        studio_a_id: studioAId,
        studio_b_id: studioBId,
        relationship_type: relationshipType,
        relationship_strength: strength,
        updated_at: new Date().toISOString()
      });

    if (error) {
      throw new Error(`Failed to update studio relationship: ${error.message}`);
    }
  }

  async createStudioActivity(studioId: string, leagueId: string, activityType: string, activityData: any, visibility: string = 'public'): Promise<void> {
    const { error } = await supabase
      .from('studio_activity_feed')
      .insert({
        studio_id: studioId,
        league_id: leagueId,
        activity_type: activityType,
        activity_data: activityData,
        visibility
      });

    if (error) {
      throw new Error(`Failed to create studio activity: ${error.message}`);
    }
  }

  // Search and filter methods
  async searchTalent(leagueId: string, query: string, role?: 'Actor' | 'Director'): Promise<(Actor | Director)[]> {
    let queryBuilder = supabase
      .from('talent')
      .select('*')
      .eq('league_id', leagueId)
      .eq('availability_status', 'Available')
      .is('death_date', null)
      .is('retirement_date', null);

    if (role) {
      queryBuilder = queryBuilder.eq('role', role);
    }

    const { data, error } = await queryBuilder
      .or(`name.ilike.%${query}%,special_tags.cs.{${query}},genre_affinity.cs.{${query}}`)
      .order('popularity_score', { ascending: false });

    if (error) {
      throw new Error(`Failed to search talent: ${error.message}`);
    }

    return data;
  }

  async filterTalentByGenre(leagueId: string, genre: string, role?: 'Actor' | 'Director'): Promise<(Actor | Director)[]> {
    let queryBuilder = supabase
      .from('talent')
      .select('*')
      .eq('league_id', leagueId)
      .eq('availability_status', 'Available')
      .is('death_date', null)
      .is('retirement_date', null)
      .contains('genre_affinity', [genre]);

    if (role) {
      queryBuilder = queryBuilder.eq('role', role);
    }

    const { data, error } = await queryBuilder
      .order('popularity_score', { ascending: false });

    if (error) {
      throw new Error(`Failed to filter talent by genre: ${error.message}`);
    }

    return data;
  }

  async filterScriptsByGenre(leagueId: string, genre: string): Promise<MarketplaceScript[]> {
    const { data, error } = await supabase
      .from('script_marketplace')
      .select(`
        id,
        buzz_rating,
        trending_score,
        available_until,
        times_used,
        last_used_at,
        scripts!inner (
          id,
          title,
          genre,
          rating,
          logline,
          tags,
          base_cost,
          buzz_rating,
          quality_stars,
          original_author,
          market_appeal,
          times_adapted
        )
      `)
      .eq('league_id', leagueId)
      .eq('scripts.genre', genre)
      .gt('available_until', new Date().toISOString())
      .order('trending_score', { ascending: false });

    if (error) {
      throw new Error(`Failed to filter scripts by genre: ${error.message}`);
    }

    return data.map(item => ({
      ...item.scripts,
      marketplace_id: item.id,
      trending_score: item.trending_score,
      available_until: item.available_until,
      times_used: item.times_used,
      last_used_at: item.last_used_at
    }));
  }

  // Mark script as used when selected for production
  async markScriptAsUsed(marketplaceId: string): Promise<void> {
    const { error } = await supabase
      .from('script_marketplace')
      .update({
        times_used: supabase.sql`times_used + 1`,
        last_used_at: new Date().toISOString()
      })
      .eq('id', marketplaceId);

    if (error) {
      throw new Error(`Failed to mark script as used: ${error.message}`);
    }
  }
}

export const cinemaContentService = new CinemaContentService();
