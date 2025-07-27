// supabase/functions/generate-nickname/index.ts
// Edge Function (Deno) that wraps Gemini for nickname generation
// Deploy with: supabase functions deploy generate-nickname --no-verify-jwt

import { serve } from "https://deno.land/std@0.202.0/http/server.ts";

// Add CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const geminiKey = Deno.env.get("GEMINI_API_KEY");
const geminiModel = Deno.env.get("GEMINI_MODEL") || "gemini-2.0-flash";

if (!geminiKey) {
  console.warn("GEMINI_API_KEY not set – replies will fall back to static nicknames");
}

serve(async (req) => {
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    // Parse request body
    const { firstName } = await req.json() as {
      firstName: string;
    };

    if (!firstName) {
      return new Response(JSON.stringify({ error: 'firstName is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let nickname = '';

    // Fallback nicknames if API fails
    const fallbackNicknames = ['Champ', 'Ace', 'Superstar', 'Rockstar', 'Chief', 'Boss', 'Tiger', 'Sport'];

    if (geminiKey) {
      const prompt = `You are a Hollywood executive meeting someone for the first time. Create a single, fun, friendly nickname for someone whose first name is "${firstName}". The nickname should:
      - Be casual and warm, like something an exec would call someone they're taking under their wing
      - Be 1-2 words maximum
      - Sound natural and not forced
      - Be appropriate for a professional but friendly Hollywood setting
      - Can be based on their name "${firstName}" or be a general executive-style nickname
      
      Examples of good nicknames: "Champ", "Ace", "Superstar", "Rockstar", "Chief", "Boss", "Tiger", "Sport", or name-based like "Johnny" for John, "Sammy" for Sam, etc.
      
      Return ONLY the nickname, nothing else.`;

      // Format the prompt correctly for Gemini API
      const genBody = {
        contents: [
          {
            role: "user",
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generation_config: {
          temperature: 0.8,
          max_output_tokens: 50,
        }
      };

      try {
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

        if (res.ok) {
          const generativeResponse = await res.json();
          if (generativeResponse?.candidates?.length > 0) {
            const generatedNickname = generativeResponse.candidates[0].content.parts[0].text.trim();
            
            // Basic validation - ensure it's reasonable length and doesn't contain weird characters
            if (generatedNickname && generatedNickname.length <= 15 && /^[a-zA-Z\s]+$/.test(generatedNickname)) {
              nickname = generatedNickname;
            } else {
              console.log('Generated nickname failed validation, using fallback');
              nickname = fallbackNicknames[Math.floor(Math.random() * fallbackNicknames.length)];
            }
          } else {
            console.error('Unexpected Gemini response format', JSON.stringify(generativeResponse));
            nickname = fallbackNicknames[Math.floor(Math.random() * fallbackNicknames.length)];
          }
        } else {
          const errorText = await res.text();
          console.error("Gemini API Error - Status:", res.status);
          console.error("Gemini API Error - Response:", errorText);
          nickname = fallbackNicknames[Math.floor(Math.random() * fallbackNicknames.length)];
        }
      } catch (geminiError) {
        console.error("Error calling Gemini API:", geminiError);
        nickname = fallbackNicknames[Math.floor(Math.random() * fallbackNicknames.length)];
      }
    } else {
      // No API key, use fallback
      nickname = fallbackNicknames[Math.floor(Math.random() * fallbackNicknames.length)];
    }

    return new Response(JSON.stringify({ nickname }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Nickname generation error:', err);
    // Return a fallback nickname even on error
    const fallbackNicknames = ['Champ', 'Ace', 'Superstar', 'Rockstar', 'Chief', 'Boss', 'Tiger', 'Sport'];
    const nickname = fallbackNicknames[Math.floor(Math.random() * fallbackNicknames.length)];
    
    return new Response(JSON.stringify({ nickname }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
