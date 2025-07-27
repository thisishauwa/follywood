import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LifecycleRequest {
  league_id: string
  action: 'age_talent' | 'check_retirements' | 'generate_comebacks' | 'create_scandals' | 'refresh_marketplace'
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

    const { league_id, action }: LifecycleRequest = await req.json()
    let result;

    switch (action) {
      case 'age_talent':
        result = await ageTalent(supabaseClient, league_id)
        break
      case 'check_retirements':
        result = await checkRetirements(supabaseClient, league_id)
        break
      case 'generate_comebacks':
        result = await generateComebacks(supabaseClient, league_id)
        break
      case 'create_scandals':
        result = await createScandals(supabaseClient, league_id)
        break
      case 'refresh_marketplace':
        result = await refreshMarketplace(supabaseClient, league_id)
        break
      default:
        throw new Error('Invalid lifecycle action')
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

async function ageTalent(supabaseClient: any, league_id: string) {
  // Age all talent by 1 year (this would be called periodically)
  const { data: talents, error } = await supabaseClient
    .from('talent')
    .select('*')
    .eq('league_id', league_id)
    .is('death_date', null)
    .is('retirement_date', null)

  if (error) {
    throw new Error('Failed to fetch talents')
  }

  const updates = []
  
  for (const talent of talents) {
    const newAge = talent.age + 1
    let newCareerStage = talent.career_stage
    
    // Update career stage based on age and experience
    if (newAge >= 65 && talent.career_stage !== 'legend') {
      newCareerStage = 'veteran'
    } else if (newAge >= 50 && talent.career_stage === 'established') {
      newCareerStage = 'veteran'
    } else if (newAge >= 35 && talent.career_stage === 'rising') {
      newCareerStage = 'established'
    } else if (newAge >= 30 && talent.career_stage === 'newcomer') {
      newCareerStage = 'rising'
    }

    // Small chance of death for very old talent (1% per year after 70)
    const deathChance = newAge > 70 ? 0.01 : 0
    const shouldDie = Math.random() < deathChance

    if (shouldDie) {
      await supabaseClient
        .from('talent')
        .update({
          age: newAge,
          career_stage: newCareerStage,
          death_date: new Date(),
          availability_status: 'Deceased'
        })
        .eq('id', talent.id)

      // Create death event
      await supabaseClient
        .from('talent_lifecycle_events')
        .insert({
          talent_id: talent.id,
          event_type: 'death',
          description: `${talent.name} passed away at age ${newAge}, leaving behind a legacy in ${talent.genre_affinity.join(' and ')} films.`,
          impact_on_popularity: 0,
          impact_on_cost: 0
        })

      // Create news item
      await supabaseClient
        .from('entertainment_news')
        .insert({
          league_id,
          headline: `Industry Mourns Loss of ${talent.name}`,
          content: `${talent.reputation_level} ${talent.name} has passed away at age ${newAge}. Known for their work in ${talent.genre_affinity.join(' and ')} films, they will be remembered as one of the industry's most talented performers.`,
          news_type: 'death',
          related_talent_ids: [talent.id],
          publication_name: 'ReelTalk Weekly',
          expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 2 months
        })

      updates.push({ id: talent.id, action: 'died', age: newAge })
    } else {
      await supabaseClient
        .from('talent')
        .update({
          age: newAge,
          career_stage: newCareerStage
        })
        .eq('id', talent.id)

      updates.push({ id: talent.id, action: 'aged', age: newAge, career_stage: newCareerStage })
    }
  }

  return updates
}

async function checkRetirements(supabaseClient: any, league_id: string) {
  // Check for talent ready to retire (65+ with 5% chance per check)
  const { data: talents, error } = await supabaseClient
    .from('talent')
    .select('*')
    .eq('league_id', league_id)
    .gte('age', 65)
    .is('retirement_date', null)
    .is('death_date', null)

  if (error) {
    throw new Error('Failed to fetch retirement candidates')
  }

  const retirements = []

  for (const talent of talents) {
    const retirementChance = 0.05 // 5% chance per check
    const shouldRetire = Math.random() < retirementChance

    if (shouldRetire) {
      await supabaseClient
        .from('talent')
        .update({
          retirement_date: new Date(),
          availability_status: 'Retired'
        })
        .eq('id', talent.id)

      // Create retirement event
      await supabaseClient
        .from('talent_lifecycle_events')
        .insert({
          talent_id: talent.id,
          event_type: 'retirement',
          description: `After a distinguished career spanning decades, ${talent.name} announces their retirement from acting at age ${talent.age}.`,
          impact_on_popularity: 0,
          impact_on_cost: 0
        })

      // Create news item
      await supabaseClient
        .from('entertainment_news')
        .insert({
          league_id,
          headline: `${talent.name} Announces Retirement`,
          content: `After a legendary career, ${talent.name} has announced their retirement from the film industry. The ${talent.age}-year-old ${talent.reputation_level} will be remembered for their iconic roles in ${talent.genre_affinity.join(' and ')} films.`,
          news_type: 'retirement',
          related_talent_ids: [talent.id],
          publication_name: 'Hollywood Insider',
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 1 month
        })

      retirements.push(talent)
    }
  }

  return retirements
}

async function generateComebacks(supabaseClient: any, league_id: string) {
  // Find talent who have been on hiatus and might make a comeback
  const { data: talents, error } = await supabaseClient
    .from('talent')
    .select('*')
    .eq('league_id', league_id)
    .eq('availability_status', 'On Hiatus')

  if (error) {
    throw new Error('Failed to fetch hiatus talents')
  }

  const comebacks = []

  for (const talent of talents) {
    const comebackChance = 0.1 // 10% chance per check
    const shouldComeback = Math.random() < comebackChance

    if (shouldComeback) {
      // Update their status and potentially their tags
      const newTags = [...talent.special_tags, 'Comeback Story']
      const popularityBoost = Math.floor(Math.random() * 15) + 5 // 5-20 boost

      await supabaseClient
        .from('talent')
        .update({
          availability_status: 'Available',
          special_tags: newTags,
          popularity_score: Math.min(100, talent.popularity_score + popularityBoost),
          comeback_potential: 0
        })
        .eq('id', talent.id)

      // Create comeback event
      await supabaseClient
        .from('talent_lifecycle_events')
        .insert({
          talent_id: talent.id,
          event_type: 'comeback',
          description: `${talent.name} makes a triumphant return to Hollywood after their hiatus, with industry insiders buzzing about their next project.`,
          impact_on_popularity: popularityBoost,
          impact_on_cost: Math.floor(talent.base_cost * 0.1)
        })

      // Create news item
      await supabaseClient
        .from('entertainment_news')
        .insert({
          league_id,
          headline: `${talent.name} Makes Highly Anticipated Comeback`,
          content: `After time away from the spotlight, ${talent.name} is officially back and ready to take on new challenges. Industry sources say multiple studios are already reaching out with offers.`,
          news_type: 'comeback',
          related_talent_ids: [talent.id],
          publication_name: 'IndieLeak',
          expires_at: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000) // 1.5 months
        })

      comebacks.push(talent)
    }
  }

  return comebacks
}

async function createScandals(supabaseClient: any, league_id: string) {
  // Randomly create scandals for some talent (very low chance)
  const { data: talents, error } = await supabaseClient
    .from('talent')
    .select('*')
    .eq('league_id', league_id)
    .eq('availability_status', 'Available')

  if (error) {
    throw new Error('Failed to fetch available talents')
  }

  const scandals = []
  const scandalTypes = [
    'social media controversy',
    'on-set behavior issues',
    'personal life drama',
    'contract dispute',
    'creative differences'
  ]

  for (const talent of talents) {
    const scandalChance = 0.005 // 0.5% chance per check
    const shouldHaveScandal = Math.random() < scandalChance

    if (shouldHaveScandal) {
      const scandalType = scandalTypes[Math.floor(Math.random() * scandalTypes.length)]
      const popularityLoss = Math.floor(Math.random() * 20) + 10 // 10-30 loss
      const costImpact = Math.floor(talent.base_cost * -0.2) // 20% cost reduction

      await supabaseClient
        .from('talent')
        .update({
          availability_status: 'On Hiatus',
          popularity_score: Math.max(0, talent.popularity_score - popularityLoss),
          base_cost: Math.max(50000, talent.base_cost + costImpact),
          scandal_history: [...(talent.scandal_history || []), scandalType],
          comeback_potential: Math.floor(Math.random() * 50) + 25 // 25-75% comeback potential
        })
        .eq('id', talent.id)

      // Create scandal event
      await supabaseClient
        .from('talent_lifecycle_events')
        .insert({
          talent_id: talent.id,
          event_type: 'scandal',
          description: `${talent.name} faces controversy due to ${scandalType}, leading to a temporary hiatus from public appearances.`,
          impact_on_popularity: -popularityLoss,
          impact_on_cost: costImpact
        })

      // Create news item
      await supabaseClient
        .from('entertainment_news')
        .insert({
          league_id,
          headline: `${talent.name} Takes Hiatus Amid Controversy`,
          content: `${talent.name} has stepped back from the public eye following recent ${scandalType}. Representatives say they are taking time to focus on personal matters.`,
          news_type: 'scandal',
          related_talent_ids: [talent.id],
          publication_name: 'ReelTalk Weekly',
          expires_at: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000) // 3 weeks
        })

      scandals.push({ talent, scandal_type: scandalType })
    }
  }

  return scandals
}

async function refreshMarketplace(supabaseClient: any, league_id: string) {
  // Remove expired scripts and add trending bonuses
  const now = new Date()
  
  // Remove expired scripts
  const { data: expiredScripts } = await supabaseClient
    .from('script_marketplace')
    .select('*')
    .eq('league_id', league_id)
    .lt('available_until', now.toISOString())

  if (expiredScripts && expiredScripts.length > 0) {
    await supabaseClient
      .from('script_marketplace')
      .delete()
      .eq('league_id', league_id)
      .lt('available_until', now.toISOString())
  }

  // Update trending scores based on usage
  const { data: marketplaceScripts } = await supabaseClient
    .from('script_marketplace')
    .select('*, scripts(*)')
    .eq('league_id', league_id)

  const updates = []

  for (const marketScript of marketplaceScripts || []) {
    // Decay trending score over time
    const newTrendingScore = Math.max(0, marketScript.trending_score - 1)
    
    // Boost buzz rating if script hasn't been used recently
    const daysSinceLastUse = marketScript.last_used_at 
      ? (Date.now() - new Date(marketScript.last_used_at).getTime()) / (1000 * 60 * 60 * 24)
      : 30

    let buzzBoost = 0
    if (daysSinceLastUse > 30) {
      buzzBoost = Math.floor(Math.random() * 10) + 5 // 5-15 boost for unused scripts
    }

    const newBuzzRating = Math.min(100, marketScript.buzz_rating + buzzBoost)

    await supabaseClient
      .from('script_marketplace')
      .update({
        trending_score: newTrendingScore,
        buzz_rating: newBuzzRating
      })
      .eq('id', marketScript.id)

    updates.push({
      script_id: marketScript.script_id,
      title: marketScript.scripts.title,
      old_buzz: marketScript.buzz_rating,
      new_buzz: newBuzzRating,
      trending_score: newTrendingScore
    })
  }

  return {
    expired_scripts: expiredScripts?.length || 0,
    updated_scripts: updates
  }
}
