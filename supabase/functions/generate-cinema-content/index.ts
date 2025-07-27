import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GenerationRequest {
  type: 'actors' | 'directors' | 'scripts' | 'lifecycle_event' | 'entertainment_news'
  league_id: string
  count?: number
  target_talent_id?: string
  event_type?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { type, league_id, count = 1, target_talent_id, event_type }: GenerationRequest = await req.json()
    const geminiApiKey = Deno.env.get('EXPO_PUBLIC_GEMINI_API_KEY')

    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured')
    }

    let result;

    switch (type) {
      case 'actors':
        result = await generateActors(supabaseClient, geminiApiKey, league_id, count)
        break
      case 'directors':
        result = await generateDirectors(supabaseClient, geminiApiKey, league_id, count)
        break
      case 'scripts':
        result = await generateScripts(supabaseClient, geminiApiKey, league_id, count)
        break
      case 'lifecycle_event':
        result = await generateLifecycleEvent(supabaseClient, geminiApiKey, target_talent_id!, event_type!)
        break
      case 'entertainment_news':
        result = await generateEntertainmentNews(supabaseClient, geminiApiKey, league_id)
        break
      default:
        throw new Error('Invalid generation type')
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})

async function generateActors(supabaseClient: any, geminiApiKey: string, league_id: string, count: number) {
  const prompt = `You are a veteran casting executive creating new fictional actors for a film industry simulation game. Generate ${count} diverse actors with these requirements:

ACTOR TEMPLATE:
- Name: Realistic but fictional (mix of ethnicities and backgrounds)
- Age: Between 22-65
- Career Stage: newcomer, rising, established, veteran, or legend
- Genre Affinity: 1-3 genres from [Action, Comedy, Drama, Horror, Romance, Sci-Fi, Thriller, Indie, Biography]
- Reputation Level: Fresh Face, Rising Star, Fan Favorite, Seasoned Pro, Hit-or-Miss, Industry Legend, Critical Darling
- Box Office Track Record: unproven, mixed, reliable, bankable, poison
- Personality Quirks: 2-3 traits that affect their work style
- Special Tags: 2-3 career highlights or specialties
- Bio: 1-2 sentences about their career journey

Generate exactly ${count} actors in JSON format with these fields:
name, age, career_stage, genre_affinity (array), reputation_level, box_office_track_record, personality_quirks (array), special_tags (array), bio, popularity_score (1-100), star_power_rating (1-100), base_cost (50000-5000000)

Ensure diversity in age, background, career stage, and specialties. Make them feel like real people with interesting careers.`

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    })
  })

  const data = await response.json()
  const generatedText = data.candidates[0].content.parts[0].text

  // Extract JSON from the response
  const jsonMatch = generatedText.match(/\[[\s\S]*\]/)
  if (!jsonMatch) {
    throw new Error('Failed to parse generated actors JSON')
  }

  const actors = JSON.parse(jsonMatch[0])
  const insertedActors = []

  for (const actor of actors) {
    const { data: insertedActor, error } = await supabaseClient
      .from('talent')
      .insert({
        league_id,
        name: actor.name,
        role: 'Actor',
        age: actor.age,
        popularity_score: actor.popularity_score,
        reputation_level: actor.reputation_level,
        genre_affinity: actor.genre_affinity,
        star_power_rating: actor.star_power_rating,
        base_cost: actor.base_cost,
        personality_quirks: actor.personality_quirks,
        special_tags: actor.special_tags,
        availability_status: 'Available',
        career_stage: actor.career_stage,
        box_office_track_record: actor.box_office_track_record
      })
      .select()
      .single()

    if (error) {
      console.error('Error inserting actor:', error)
      continue
    }

    insertedActors.push(insertedActor)

    // Create debut lifecycle event
    await supabaseClient
      .from('talent_lifecycle_events')
      .insert({
        talent_id: insertedActor.id,
        event_type: 'debut',
        description: actor.bio,
        impact_on_popularity: 0,
        impact_on_cost: 0
      })
  }

  return insertedActors
}

async function generateDirectors(supabaseClient: any, geminiApiKey: string, league_id: string, count: number) {
  const prompt = `You are a veteran film executive creating new fictional directors for a film industry simulation game. Generate ${count} diverse directors with these requirements:

DIRECTOR TEMPLATE:
- Name: Realistic but fictional (mix of ethnicities and backgrounds)
- Age: Between 28-70
- Career Stage: rising, established, veteran, or legend
- Genre Focus: 1-3 genres they specialize in
- Style: Visual Storyteller, Performance-Driven, Spectacle Master, Minimalist, Experimental
- Reputation Level: Rising Auteur, Seasoned Pro, Visionary, Critical Darling, Commercial Success, Cult Following
- Known For: Their signature style or breakthrough project
- Special Tags: 2-3 career highlights or directing specialties

Generate exactly ${count} directors in JSON format with these fields:
name, age, career_stage, genre_affinity (array), reputation_level, style, known_for, special_tags (array), popularity_score (1-100), star_power_rating (1-100), base_cost (500000-8000000)

Make them feel like real filmmakers with distinct voices and career trajectories.`

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    })
  })

  const data = await response.json()
  const generatedText = data.candidates[0].content.parts[0].text

  const jsonMatch = generatedText.match(/\[[\s\S]*\]/)
  if (!jsonMatch) {
    throw new Error('Failed to parse generated directors JSON')
  }

  const directors = JSON.parse(jsonMatch[0])
  const insertedDirectors = []

  for (const director of directors) {
    const { data: insertedDirector, error } = await supabaseClient
      .from('talent')
      .insert({
        league_id,
        name: director.name,
        role: 'Director',
        age: director.age,
        popularity_score: director.popularity_score,
        reputation_level: director.reputation_level,
        genre_affinity: director.genre_affinity,
        star_power_rating: director.star_power_rating,
        base_cost: director.base_cost,
        personality_quirks: [director.style],
        special_tags: director.special_tags,
        availability_status: 'Available',
        career_stage: director.career_stage,
        box_office_track_record: 'reliable'
      })
      .select()
      .single()

    if (error) {
      console.error('Error inserting director:', error)
      continue
    }

    insertedDirectors.push(insertedDirector)

    // Create debut lifecycle event
    await supabaseClient
      .from('talent_lifecycle_events')
      .insert({
        talent_id: insertedDirector.id,
        event_type: 'debut',
        description: director.known_for,
        impact_on_popularity: 0,
        impact_on_cost: 0
      })
  }

  return insertedDirectors
}

async function generateScripts(supabaseClient: any, geminiApiKey: string, league_id: string, count: number) {
  const prompt = `You are a veteran script development executive creating new fictional scripts for a film industry simulation game. Generate ${count} diverse scripts with these requirements:

SCRIPT TEMPLATE:
- Title: Catchy, memorable film title
- Genre: One primary genre from [Action, Comedy, Drama, Horror, Romance, Sci-Fi, Thriller, Indie, Biography]
- Quality Stars: 1-5 stars based on script quality
- Buzz Rating: 0-100 based on industry excitement
- Logline: 1-2 sentence compelling summary
- Market Appeal: niche, mainstream, blockbuster, or arthouse
- Tags: 3-4 descriptive tags about themes, style, or elements
- Original Author: Fictional screenwriter name

Generate exactly ${count} scripts in JSON format with these fields:
title, genre, quality_stars, buzz_rating, logline, market_appeal, tags (array), original_author, base_cost (200000-1500000)

Create diverse, interesting concepts that feel like real Hollywood projects.`

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    })
  })

  const data = await response.json()
  const generatedText = data.candidates[0].content.parts[0].text

  const jsonMatch = generatedText.match(/\[[\s\S]*\]/)
  if (!jsonMatch) {
    throw new Error('Failed to parse generated scripts JSON')
  }

  const scripts = JSON.parse(jsonMatch[0])
  const insertedScripts = []

  for (const script of scripts) {
    const { data: insertedScript, error } = await supabaseClient
      .from('scripts')
      .insert({
        title: script.title,
        genre: script.genre,
        rating: script.quality_stars,
        logline: script.logline,
        tags: script.tags,
        base_cost: script.base_cost,
        studio_level_required: 1,
        is_user_generated: false,
        buzz_rating: script.buzz_rating,
        quality_stars: script.quality_stars,
        original_author: script.original_author,
        market_appeal: script.market_appeal
      })
      .select()
      .single()

    if (error) {
      console.error('Error inserting script:', error)
      continue
    }

    // Add to marketplace
    await supabaseClient
      .from('script_marketplace')
      .insert({
        script_id: insertedScript.id,
        league_id,
        buzz_rating: script.buzz_rating,
        trending_score: Math.floor(script.buzz_rating * 0.3),
        available_until: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 3 months
      })

    insertedScripts.push(insertedScript)
  }

  return insertedScripts
}

async function generateLifecycleEvent(supabaseClient: any, geminiApiKey: string, talent_id: string, event_type: string) {
  // Get talent info first
  const { data: talent } = await supabaseClient
    .from('talent')
    .select('*')
    .eq('id', talent_id)
    .single()

  if (!talent) {
    throw new Error('Talent not found')
  }

  const prompt = `Generate a realistic ${event_type} event for ${talent.name}, a ${talent.age}-year-old ${talent.role.toLowerCase()} known for ${talent.genre_affinity.join(', ')} projects. 

Create a brief description (1-2 sentences) of what happened, and determine the impact on their popularity (-20 to +20) and cost (-500000 to +1000000).

Return JSON with: description, impact_on_popularity, impact_on_cost`

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    })
  })

  const data = await response.json()
  const generatedText = data.candidates[0].content.parts[0].text

  const jsonMatch = generatedText.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('Failed to parse generated event JSON')
  }

  const eventData = JSON.parse(jsonMatch[0])

  // Insert lifecycle event
  const { data: lifecycleEvent, error } = await supabaseClient
    .from('talent_lifecycle_events')
    .insert({
      talent_id,
      event_type,
      description: eventData.description,
      impact_on_popularity: eventData.impact_on_popularity,
      impact_on_cost: eventData.impact_on_cost
    })
    .select()
    .single()

  if (error) {
    throw new Error('Failed to insert lifecycle event')
  }

  // Update talent stats
  await supabaseClient
    .from('talent')
    .update({
      popularity_score: Math.max(0, Math.min(100, talent.popularity_score + eventData.impact_on_popularity)),
      base_cost: Math.max(50000, talent.base_cost + eventData.impact_on_cost)
    })
    .eq('id', talent_id)

  return lifecycleEvent
}

async function generateEntertainmentNews(supabaseClient: any, geminiApiKey: string, league_id: string) {
  // Get some random talent from the league
  const { data: talents } = await supabaseClient
    .from('talent')
    .select('*')
    .eq('league_id', league_id)
    .limit(5)

  const prompt = `Generate entertainment industry gossip/news headlines and content for a film industry simulation. Use these talent names: ${talents.map(t => t.name).join(', ')}.

Create 3 different news items with different types: gossip, announcement, or award.

Return JSON array with: headline, content (2-3 sentences), news_type, related_talent_name, publication_name (choose from: ReelTalk Weekly, IndieLeak, Hollywood Insider, Variety Clone)`

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    })
  })

  const data = await response.json()
  const generatedText = data.candidates[0].content.parts[0].text

  const jsonMatch = generatedText.match(/\[[\s\S]*\]/)
  if (!jsonMatch) {
    throw new Error('Failed to parse generated news JSON')
  }

  const newsItems = JSON.parse(jsonMatch[0])
  const insertedNews = []

  for (const news of newsItems) {
    // Find talent ID by name
    const relatedTalent = talents.find(t => t.name === news.related_talent_name)
    
    const { data: insertedNewsItem, error } = await supabaseClient
      .from('entertainment_news')
      .insert({
        league_id,
        headline: news.headline,
        content: news.content,
        news_type: news.news_type,
        related_talent_ids: relatedTalent ? [relatedTalent.id] : [],
        publication_name: news.publication_name,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 1 month
      })
      .select()
      .single()

    if (!error) {
      insertedNews.push(insertedNewsItem)
    }
  }

  return insertedNews
}
