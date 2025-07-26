import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai';

// Types
interface ChatHistory {
  id: string;
  user_id: string;
  text: string;
  isUser: boolean;
  created_at: string;
}

interface JournalEntry {
  id: string;
  user_id: string;
  content: string;
  tags: string[];
  created_at: string;
}

interface Goal {
  id: string;
  user_id: string;
  title: string;
  description: string;
  recurrence: string;
  start_date: string;
  status: string;
}

interface UserProfile {
  id: string;
  username: string;
  age?: number;
  relationship_status?: string;
  relationship_type?: string;
  sexual_orientation?: string;
  interests?: string[];
}

// Configuration
const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') as string;
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
const geminiApiKey = Deno.env.get('GEMINI_API_KEY') as string;
const geminiModel = Deno.env.get('GEMINI_MODEL') as string || 'gemini-1.5-flash';

serve(async (req: Request) => {
  // CORS headers for browser support
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    // Get request data
    const body = await req.json();
    const { user_id } = body;

    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const adminAuthClient = createClient(
      supabaseUrl,
      supabaseServiceRoleKey,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: geminiModel });

    // Get user profile
    const { data: profile, error: profileError } = await adminAuthClient
      .from('profiles')
      .select('*')
      .eq('id', user_id)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
    }

    // Get user goals
    const { data: goals, error: goalsError } = await adminAuthClient
      .from('goals')
      .select('*')
      .eq('user_id', user_id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(5);

    if (goalsError) {
      console.error('Error fetching goals:', goalsError);
    }

    // Get recent journal entries
    const { data: journalEntries, error: journalError } = await adminAuthClient
      .from('journal_entries')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(3);

    if (journalError) {
      console.error('Error fetching journal entries:', journalError);
    }

    // Get recent chat history
    const { data: chatHistory, error: chatError } = await adminAuthClient
      .from('chat_history')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (chatError) {
      console.error('Error fetching chat history:', chatError);
    }

    // Format user context for Gemini
    // Extract the most relevant information from the user data
    const userProfile = profile ? {
      username: profile.username,
      age: profile.age,
      relationshipStatus: profile.relationship_status,
      relationshipType: profile.relationship_type,
      sexualOrientation: profile.sexual_orientation,
      interests: profile.interests || []
    } : {};
    
    // Extract just the relevant goal information
    const activeGoals = goals ? goals.map(g => ({
      title: g.title,
      description: g.description,
      recurrence: g.recurrence
    })) : [];
    
    // Extract just the relevant journal content
    const recentJournals = journalEntries ? journalEntries.map(j => ({
      content: j.content,
      tags: j.tags,
      date: j.created_at
    })) : [];
    
    // Extract just the recent chat messages for context
    const recentChatMessages = chatHistory ? chatHistory.slice(0, 10).map(c => ({
      text: c.message_text,
      isUser: c.is_user_message,
      date: c.created_at
    })) : [];
    
    const userContext = {
      profile: userProfile,
      goals: activeGoals,
      journalEntries: recentJournals,
      recentChats: recentChatMessages,
    };

    // Generate system prompt for Gemini
    const systemPrompt = `
As August AI, a sex therapy assistant, create 5 personalized conversation starter suggestions
based on the user data provided. These suggestions will appear as "chips" on the home screen that
users can tap to immediately start a conversation with you.

The suggestions should:
1. Be personalized based on the user's profile, goals, journal entries, and previous conversations
2. Address different aspects of sexual wellness, relationships, and personal growth
3. Be phrased as questions or prompts (15-65 characters in length)
4. Sound natural and conversational, not clinical
5. Be diverse in topics to give users options
6. Not be explicit or graphic - focus on therapy, wellness, and education
7. Be contextually relevant to their recent activity and goals

Current user data:
${JSON.stringify(userContext, null, 2)}

Respond ONLY with a JSON array of 5 string suggestions. For example:
["How can I improve intimacy?", "What exercises help with anxiety?", "Can we discuss my relationship goals?", "How to communicate better?", "Tips for managing stress"]
`;

    // Generate suggestions with Gemini
    const genResult = await model.generateContent(systemPrompt);
    const response = await genResult.response;
    const responseText = response.text();
    
    // Parse the response to extract suggestions
    let suggestions: string[];
    try {
      // Try to parse the full response as JSON array
      suggestions = JSON.parse(responseText);
    } catch (e) {
      // If direct parsing fails, try to extract JSON array from the text
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          suggestions = JSON.parse(jsonMatch[0]);
        } catch (e2) {
          // Fallback suggestions if parsing fails
          suggestions = [
            "How can I improve intimacy?",
            "What exercises help with stress?", 
            "Can we discuss my relationship goals?", 
            "How to communicate better?",
            "Tips for better sleep habits?"
          ];
        }
      } else {
        // Fallback suggestions
        suggestions = [
          "How can I improve intimacy?",
          "What exercises help with stress?", 
          "Can we discuss my relationship goals?", 
          "How to communicate better?",
          "Tips for better sleep habits?"
        ];
      }
    }
    
    // If we got fewer than 3 suggestions, add some defaults
    if (!Array.isArray(suggestions) || suggestions.length < 3) {
      suggestions = [
        "How can I improve intimacy?",
        "What exercises help with stress?", 
        "Can we discuss my relationship goals?", 
        "How to communicate better?",
        "Tips for better sleep habits?"
      ];
    }

    // Return the suggestions
    return new Response(
      JSON.stringify({ suggestions }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        } 
      }
    );
  } catch (error) {
    console.error('Error generating suggestions:', error);
    
    // Return default suggestions on error
    return new Response(
      JSON.stringify({ 
        suggestions: [
          "How can I improve intimacy?",
          "What exercises help with stress?", 
          "Can we discuss my relationship goals?", 
          "How to communicate better?",
          "Tips for better sleep habits?"
        ],
        error: error.message 
      }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        } 
      }
    );
  }
});
