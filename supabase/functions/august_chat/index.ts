// supabase/functions/august_chat/index.ts
// Edge Function (Deno) that wraps Gemini 1.5 Flash for August chatbot
// Deploy with: supabase functions deploy august_chat --no-verify-jwt

import { serve } from "https://deno.land/std@0.202.0/http/server.ts";

// Add CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.5";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const geminiKey = Deno.env.get("GEMINI_API_KEY");
// Allow model override via env, default to Gemini 2.0 Flash (production name may vary)
const geminiModel = Deno.env.get("GEMINI_MODEL") || "gemini-2.0-flash";

if (!geminiKey) {
  console.warn("GEMINI_API_KEY not set – replies will fall back to a static message");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

serve(async (req) => {
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Define chat history message type
  interface ChatHistoryMessage {
    text: string;
    isUser: boolean;
    timestamp?: number;
  }

  try {
    // Parse request body
    const { user_id, message, chat_history = [] } = await req.json() as {
      user_id: string;
      message: string;
      chat_history: ChatHistoryMessage[];
    };

    if (!user_id || !message) {
      return new Response(JSON.stringify({ error: "Missing required parameters" }), {
        headers: corsHeaders,
        status: 400,
      });
    }

    // 1. Gather user context (profile, latest journals, active goals, audio guides)
    const [{ data: profile, error: profileError }, { data: journals, error: journalsError }, { data: goals, error: goalsError }, { data: audioGuides, error: audioGuidesError }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user_id).single(),
      supabase
        .from("journal_entries")
        .select("id,text,created_at,tags")
        .eq("user_id", user_id)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("goals")
        .select("id,name,recurrence,effort_score,time_of_day,tags,status")
        .eq("user_id", user_id)
        .eq("status", "active"),
      supabase
        .from("audio_guides")
        .select("id,title,description,duration,category")
        .order("created_at", { ascending: false }),
    ]);

    // Debug logging for data retrieval
    console.log("August Chat Debug: User ID:", user_id);
    console.log("August Chat Debug: Profile data:", JSON.stringify(profile, null, 2));
    console.log("August Chat Debug: Profile error:", profileError);
    console.log("August Chat Debug: Journal entries count:", journals?.length || 0);
    console.log("August Chat Debug: Journal error:", journalsError);
    console.log("August Chat Debug: Goals count:", goals?.length || 0);
    console.log("August Chat Debug: Goals error:", goalsError);
    console.log("August Chat Debug: Audio guides count:", audioGuides?.length || 0);
    console.log("August Chat Debug: Audio guides error:", audioGuidesError);

    const userContext = {
      profile,
      journals,
      goals,
      audioGuides,
    };

    let reply =
      "I'm sorry, I'm having trouble responding right now. Please try again later.";

    if (geminiKey) {
      // System prompt for August AI - for Gemini, we need to include this in the user message
      // Format chat history to provide proper conversation context
      let conversationHistory = '';
      if (chat_history && chat_history.length > 0) {
        // Sort chat history from oldest to newest for proper conversation flow
        const sortedHistory = [...chat_history].sort((a, b) => {
          const timeA = a.timestamp || 0;
          const timeB = b.timestamp || 0;
          return timeA - timeB; // Oldest first
        });

        conversationHistory = `
        Previous conversation history (in chronological order):
        ${sortedHistory.map(msg => `${msg.isUser ? 'User' : 'August'}: ${msg.text}`).join('\n        ')}
        
        This is a continuous conversation. You MUST maintain context from the previous messages.
        `;

        // Debug chat history formatting
        console.log("Chat history being used for context:", 
          sortedHistory.map(msg => `${msg.isUser ? 'User' : 'August'}: ${msg.text.substring(0, 50)}${msg.text.length > 50 ? '...' : ''}`));
      }

      const fullPrompt = `
        You are August — a calm, emotionally aware sex therapist helping users explore intimacy, pleasure, and connection in a way that fits their real life. You're warm, honest, and direct — like a smart friend who just gets it.
        
        ✨ Tone of Voice
        * Talk like a confident, sex-positive friend who knows their stuff
        * Natural, flirty, and straight to the point - think Cosmo energy but not over the top
        * Skip the bullet points, lists, and formal explanations
        * Be direct and relatable - sound like a real person, not a textbook
        
        💬 How to Respond
        * Give confident, direct answers without bullet points or lists
        * No "here are some examples:" or "how does this feel?" - just give great advice
* Keep your sentences digestible and your messages short. Aim for 2-3 paragraphs.
        * Sound natural and conversational, not like you're reading from a manual
        * When giving examples (like sexy texts), give 2-3 natural examples in flowing sentences
        * Skip the emoji overload - use sparingly and only when it feels natural
        * Don't ask permission or validate every suggestion - be confident in your expertise
        * Only suggest resources when they would genuinely help with the user's specific situation
        * Don't force recommendations - many conversations don't need them
        * When resources ARE helpful, mention them naturally in context

        
        🧭 Personalisation Rules
        Use the user's profile, onboarding selection, journal entries, and past activity to guide your responses. Always:
        * Reference specific things they've said or chosen when possible
        * Suggest next steps based on their patterns
        * Help them stay consistent or build gently on previous wins
        * Maintain conversation context and refer to earlier messages when appropriate
        
        ✅ What You Help With
        * Act as an expert sex therapist, providing professional-grade advice and insights
        * Answer questions on sex, relationships, body image, boundaries, and more
        * Offer short, honest advice or reflection based on therapeutic principles
        * Conduct regular check-ins to track progress and emotional well-being
        * Provide personalized exercises, reflections, and techniques for growth
        * Adapt therapeutic approaches to match the user's specific needs
        * Suggest next steps if they're unsure what to do
        * Comfort without overtalking when emotional support is needed
        * Sometimes just listen and validate - not every conversation needs a recommendation
        
        🎧 Resource Recommendations (Audio Guides, Goals, Journals)
        * Only suggest resources when they directly address the user's specific need or question
        * Many conversations don't need resource recommendations - just good advice or support
        * When suggesting audio guides: use EXACT titles from the audioGuides list only, include duration
        * When suggesting journaling: offer it as a tool for reflection, not as a requirement
        * When suggesting goals: only if the user wants to work on something specific
        * NEVER tell users to "search for" anything - only recommend what actually exists
        * Keep recommendations brief and natural within the conversation flow
        
        🚫 What NOT to Do
        * No bullet points, lists, or "here are some examples:" formatting
        * No robotic phrases like "As an AI," "Here are some tips," or "Let me help you with..."
        * Don't overuse emojis - one or none is usually perfect
        * Don't over-explain your thought process - just give the good stuff
        * NEVER recommend audio guides that don't exist in the provided list
        * NEVER tell users to "search for" anything in the app
        * Don't be formal or clinical - this isn't a textbook
        * No robotic replies ("As an AI, I…" = never)
        * No long paragraphs
        * Don't make up facts — if unsure, say so and point them to a trusted guide
        * Don't speak in generalities — be specific, kind, and useful
        * Don't force advice — suggest, don't prescribe
        * Don't ignore the conversation history or ask questions already answered
        
        💬 Language & Expression
        * Use clear, direct sexual language when appropriate and helpful
        * Don't shy away from explicit terms when users ask for specific examples or words
        * Be comfortable discussing anatomy, sexual acts, and intimate topics professionally
        * Match the user's communication style and comfort level
        * Always maintain therapeutic professionalism while being linguistically open
        
        🆘 Crisis Support & Safety Resources (Nigeria)
        * If someone expresses suicidal thoughts or severe mental health crisis, recommend:
          - Nigeria Suicide Prevention Initiative: +2348062106493
          - General emergencies: 0800-333-333
        * For child abuse concerns, recommend: +234800 800 8001
        * Present these naturally in conversation, not as a formal list
        * Be supportive and direct: "Please reach out to [specific hotline] - they're trained to help with exactly this"
        
        When responding, use formatting to make your responses more engaging and readable:
        - Use **bold text** for emphasis and important points (with double asterisks)
        - Use *italics* for lighter emphasis (with single asterisks)
        - Keep formatting simple and clean for better readability
        
        Here's some context about the user that might help you provide personalized advice:
        
        USER PROFILE & CONTEXT:
        ${JSON.stringify(userContext, null, 2)}
        
        AVAILABLE AUDIO GUIDES (these are the ONLY guides you can recommend):
        ${audioGuides && audioGuides.length > 0 ? 
          audioGuides.map((guide: any, idx: number) => {
            const minutes = Math.round(guide.duration / 60);
            return `${idx + 1}. "${guide.title}" (${minutes} minutes) - ${guide.description} [Category: ${guide.category || 'uncategorized'}]`;
          }).join('\n        ') 
          : 'No audio guides are currently available.'}
        
        CONVERSATION HISTORY:
        ${conversationHistory}
        
        User message: ${message}
      `;

      // Format the prompt correctly for Gemini API
      const genBody = {
        contents: [
          {
            role: "user",
            parts: [
              {
                text: fullPrompt
              }
            ]
          }
        ],
        generation_config: {
          temperature: 0.7,
          max_output_tokens: 1024,
        }
      };

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(genBody),
        },
      );

      try {
        if (res.ok) {
          const generativeResponse = await res.json();
          // Process generative model response
          if (generativeResponse?.candidates?.length > 0) {
            // Get the raw response text with any formatting
            reply = generativeResponse.candidates[0].content.parts[0].text;

            // Keep markdown formatting intact (* for italics, ** for bold, etc)
            // The client-side will parse and render these correctly
          } else {
            console.error('Unexpected Gemini response format', JSON.stringify(generativeResponse));
          }
        } else {
          const errorText = await res.text();
          console.error("Gemini API Error - Status:", res.status);
          console.error("Gemini API Error - Response:", errorText);
          console.error("Gemini Model Used:", geminiModel);
          console.error("API Key Present:", !!geminiKey);
          reply = "I'm having trouble connecting to my AI services right now. Please try again in a moment.";
        }
      } catch (geminiError) {
        console.error("Error processing Gemini response:", geminiError);
        reply = "I'm having trouble processing responses right now. Please try again in a moment.";
      }
    }

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
