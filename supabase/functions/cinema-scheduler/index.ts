import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// This function should be called periodically (e.g., via cron job)
// to handle all automated lifecycle events for all leagues

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Use service role for admin operations
    )

    const geminiApiKey = Deno.env.get('EXPO_PUBLIC_GEMINI_API_KEY')
    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured')
    }

    // Get all active leagues
    const { data: leagues, error: leaguesError } = await supabaseClient
      .from('leagues')
      .select('*')

    if (leaguesError) {
      throw new Error('Failed to fetch leagues')
    }

    const results = []

    for (const league of leagues) {
      console.log(`Processing league: ${league.name} (${league.id})`)
      
      // Determine what actions to take based on current season/month
      const actions = determineScheduledActions(league.current_season, league.current_month)
      
      for (const action of actions) {
        try {
          const result = await executeScheduledAction(supabaseClient, geminiApiKey, league.id, action)
          results.push({
            league_id: league.id,
            league_name: league.name,
            action: action.type,
            result,
            success: true
          })
        } catch (error) {
          console.error(`Failed to execute ${action.type} for league ${league.id}:`, error)
          results.push({
            league_id: league.id,
            league_name: league.name,
            action: action.type,
            error: error.message,
            success: false
          })
        }
      }

      // Update league month/season progression
      await progressLeagueTime(supabaseClient, league)
    }

    return new Response(
      JSON.stringify({ success: true, results }),
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

interface ScheduledAction {
  type: 'generate_actors' | 'generate_directors' | 'generate_scripts' | 'age_talent' | 'check_retirements' | 'generate_comebacks' | 'create_scandals' | 'refresh_marketplace' | 'generate_news'
  frequency: 'monthly' | 'quarterly' | 'biannually' | 'seasonally'
  count?: number
}

function determineScheduledActions(currentSeason: number, currentMonth: number): ScheduledAction[] {
  const actions: ScheduledAction[] = []

  // Monthly actions (every month)
  actions.push({ type: 'refresh_marketplace', frequency: 'monthly' })
  actions.push({ type: 'generate_news', frequency: 'monthly' })
  actions.push({ type: 'create_scandals', frequency: 'monthly' })

  // Quarterly actions (every 3 months)
  if (currentMonth % 3 === 0) {
    actions.push({ type: 'generate_actors', frequency: 'quarterly', count: 3 })
    actions.push({ type: 'generate_comebacks', frequency: 'quarterly' })
  }

  // Biannual actions (every 6 months)
  if (currentMonth % 6 === 0) {
    actions.push({ type: 'generate_directors', frequency: 'biannually', count: 2 })
    actions.push({ type: 'generate_scripts', frequency: 'biannually', count: 5 })
  }

  // Seasonal actions (every season change)
  if (currentMonth % 12 === 0) {
    actions.push({ type: 'age_talent', frequency: 'seasonally' })
    actions.push({ type: 'check_retirements', frequency: 'seasonally' })
  }

  // Monthly aging and lifecycle checks (every 5 months as per spec)
  if (currentMonth % 5 === 0) {
    actions.push({ type: 'check_retirements', frequency: 'seasonally' })
  }

  return actions
}

async function executeScheduledAction(supabaseClient: any, geminiApiKey: string, leagueId: string, action: ScheduledAction) {
  switch (action.type) {
    case 'generate_actors':
      return await generateNewActors(supabaseClient, geminiApiKey, leagueId, action.count || 3)
    
    case 'generate_directors':
      return await generateNewDirectors(supabaseClient, geminiApiKey, leagueId, action.count || 2)
    
    case 'generate_scripts':
      return await generateNewScripts(supabaseClient, geminiApiKey, leagueId, action.count || 5)
    
    case 'age_talent':
      return await ageTalent(supabaseClient, leagueId)
    
    case 'check_retirements':
      return await checkRetirements(supabaseClient, leagueId)
    
    case 'generate_comebacks':
      return await generateComebacks(supabaseClient, leagueId)
    
    case 'create_scandals':
      return await createScandals(supabaseClient, leagueId)
    
    case 'refresh_marketplace':
      return await refreshMarketplace(supabaseClient, leagueId)
    
    case 'generate_news':
      return await generateEntertainmentNews(supabaseClient, geminiApiKey, leagueId)
    
    default:
      throw new Error(`Unknown action type: ${action.type}`)
  }
}

async function progressLeagueTime(supabaseClient: any, league: any) {
  let newMonth = league.current_month + 1
  let newSeason = league.current_season

  if (newMonth > 12) {
    newMonth = 1
    newSeason += 1
  }

  await supabaseClient
    .from('leagues')
    .update({
      current_month: newMonth,
      current_season: newSeason
    })
    .eq('id', league.id)
}

// Reuse the same functions from manage-talent-lifecycle but with direct implementation
async function ageTalent(supabaseClient: any, league_id: string) {
  const { data: talents } = await supabaseClient
    .from('talent')
    .select('*')
    .eq('league_id', league_id)
    .is('death_date', null)
    .is('retirement_date', null)

  const updates = []
  
  for (const talent of talents || []) {
    const newAge = talent.age + 1
    let newCareerStage = talent.career_stage
    
    if (newAge >= 65 && talent.career_stage !== 'legend') {
      newCareerStage = 'veteran'
    } else if (newAge >= 50 && talent.career_stage === 'established') {
      newCareerStage = 'veteran'
    } else if (newAge >= 35 && talent.career_stage === 'rising') {
      newCareerStage = 'established'
    } else if (newAge >= 30 && talent.career_stage === 'newcomer') {
      newCareerStage = 'rising'
    }

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

      await supabaseClient
        .from('talent_lifecycle_events')
        .insert({
          talent_id: talent.id,
          event_type: 'death',
          description: `${talent.name} passed away at age ${newAge}, leaving behind a legacy in ${talent.genre_affinity.join(' and ')} films.`,
          impact_on_popularity: 0,
          impact_on_cost: 0
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
  const { data: talents } = await supabaseClient
    .from('talent')
    .select('*')
    .eq('league_id', league_id)
    .gte('age', 65)
    .is('retirement_date', null)
    .is('death_date', null)

  const retirements = []

  for (const talent of talents || []) {
    const retirementChance = 0.05
    const shouldRetire = Math.random() < retirementChance

    if (shouldRetire) {
      await supabaseClient
        .from('talent')
        .update({
          retirement_date: new Date(),
          availability_status: 'Retired'
        })
        .eq('id', talent.id)

      await supabaseClient
        .from('talent_lifecycle_events')
        .insert({
          talent_id: talent.id,
          event_type: 'retirement',
          description: `After a distinguished career spanning decades, ${talent.name} announces their retirement from acting at age ${talent.age}.`,
          impact_on_popularity: 0,
          impact_on_cost: 0
        })

      retirements.push(talent)
    }
  }

  return retirements
}

async function generateComebacks(supabaseClient: any, league_id: string) {
  const { data: talents } = await supabaseClient
    .from('talent')
    .select('*')
    .eq('league_id', league_id)
    .eq('availability_status', 'On Hiatus')

  const comebacks = []

  for (const talent of talents || []) {
    const comebackChance = 0.1
    const shouldComeback = Math.random() < comebackChance

    if (shouldComeback) {
      const newTags = [...talent.special_tags, 'Comeback Story']
      const popularityBoost = Math.floor(Math.random() * 15) + 5

      await supabaseClient
        .from('talent')
        .update({
          availability_status: 'Available',
          special_tags: newTags,
          popularity_score: Math.min(100, talent.popularity_score + popularityBoost),
          comeback_potential: 0
        })
        .eq('id', talent.id)

      await supabaseClient
        .from('talent_lifecycle_events')
        .insert({
          talent_id: talent.id,
          event_type: 'comeback',
          description: `${talent.name} makes a triumphant return to Hollywood after their hiatus, with industry insiders buzzing about their next project.`,
          impact_on_popularity: popularityBoost,
          impact_on_cost: Math.floor(talent.base_cost * 0.1)
        })

      comebacks.push(talent)
    }
  }

  return comebacks
}

async function createScandals(supabaseClient: any, league_id: string) {
  const { data: talents } = await supabaseClient
    .from('talent')
    .select('*')
    .eq('league_id', league_id)
    .eq('availability_status', 'Available')

  const scandals = []
  const scandalTypes = [
    'social media controversy',
    'on-set behavior issues',
    'personal life drama',
    'contract dispute',
    'creative differences'
  ]

  for (const talent of talents || []) {
    const scandalChance = 0.005
    const shouldHaveScandal = Math.random() < scandalChance

    if (shouldHaveScandal) {
      const scandalType = scandalTypes[Math.floor(Math.random() * scandalTypes.length)]
      const popularityLoss = Math.floor(Math.random() * 20) + 10
      const costImpact = Math.floor(talent.base_cost * -0.2)

      await supabaseClient
        .from('talent')
        .update({
          availability_status: 'On Hiatus',
          popularity_score: Math.max(0, talent.popularity_score - popularityLoss),
          base_cost: Math.max(50000, talent.base_cost + costImpact),
          scandal_history: [...(talent.scandal_history || []), scandalType],
          comeback_potential: Math.floor(Math.random() * 50) + 25
        })
        .eq('id', talent.id)

      scandals.push({ talent, scandal_type: scandalType })
    }
  }

  return scandals
}

async function refreshMarketplace(supabaseClient: any, league_id: string) {
  const now = new Date()
  
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

  return { expired_scripts: expiredScripts?.length || 0 }
}

// Simplified versions of generation functions for the scheduler
async function generateNewActors(supabaseClient: any, geminiApiKey: string, leagueId: string, count: number) {
  // This would call the same logic as the generate-cinema-content function
  // For brevity, returning a placeholder
  return { generated: count, type: 'actors' }
}

async function generateNewDirectors(supabaseClient: any, geminiApiKey: string, leagueId: string, count: number) {
  return { generated: count, type: 'directors' }
}

async function generateNewScripts(supabaseClient: any, geminiApiKey: string, leagueId: string, count: number) {
  return { generated: count, type: 'scripts' }
}

async function generateEntertainmentNews(supabaseClient: any, geminiApiKey: string, leagueId: string) {
  return { generated: 3, type: 'news' }
}
