import { fetchAugustReply } from './august';
import { supabase } from './supabase';

/**
 * Generates dynamic journal prompts using August AI based on user data
 */
export async function generateJournalPrompts(userId: string): Promise<string[]> {
  try {
    // Default prompts in case AI generation fails - diverse formats
    const defaultPrompts = [
      "Today I'm feeling...",
      "A memory that made me smile",
      "If I could change one thing...",
    ];

    if (!userId) {
      console.log('[Journal Prompts] No user ID provided, returning default prompts');
      return defaultPrompts;
    }

    // Get user profile data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('[Journal Prompts] Error fetching profile:', profileError);
    }

    // Get recent journal entries to understand user's journaling patterns
    const { data: recentEntries, error: journalError } = await supabase
      .from('journal_entries')
      .select('title, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(3);

    if (journalError) {
      console.error('[Journal Prompts] Error fetching journal entries:', journalError);
    }

    // Get recent chat history for context
    const { data: recentChats, error: chatError } = await supabase
      .from('chat_history')
      .select('message_text, is_user_message, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (chatError) {
      console.error('[Journal Prompts] Error fetching chat history:', chatError);
    }

    // Prepare context for August AI
    const userContext = {
      profile: profile || {},
      recentJournals: recentEntries || [],
      recentChats: recentChats ? recentChats.map(chat => ({
        content: chat.message_text,
        isUser: chat.is_user_message,
        timestamp: chat.created_at
      })) : [],
    };

    // Request to August AI for personalized prompts
    const promptRequest = `Based on this user data: ${JSON.stringify(userContext)}, 
    generate 3 diverse journal prompts that would be relevant for the user right now.
    Create a variety of prompt types:
    - Emotional prompts ("My biggest fear is...", "What brings me joy...")
    - Relationship prompts ("My partner and I...", "What I appreciate about...")
    - Goal-oriented prompts ("Steps I can take to...", "My vision for...")
    - Reflective prompts ("A lesson I learned...", "When I think about my past...")
    - Hypothetical scenarios ("If I could change one thing...", "In five years I hope...")
    
    Keep them concise (3-7 words) and make them feel personal to the user's situation.
    Format your response as a JSON array of strings, like this: ["Prompt 1", "Prompt 2", "Prompt 3"]`;

    const aiResponse = await fetchAugustReply(promptRequest, userId, []);
    
    try {
      // First, check if the response is wrapped in markdown code blocks
      const markdownMatch = aiResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      let jsonContent = aiResponse;
      
      if (markdownMatch && markdownMatch[1]) {
        // Extract the content from within the code block
        jsonContent = markdownMatch[1].trim();
      }
      
      // Try to parse the response as JSON
      const parsedPrompts = JSON.parse(jsonContent);
      
      if (Array.isArray(parsedPrompts) && parsedPrompts.length > 0) {
        return parsedPrompts.slice(0, 3); // Ensure we only return up to 3 prompts
      }
      
      // If the above fails, try to find any JSON array in the response
      const jsonMatch = aiResponse.match(/\[\s*".*"[\s\S]*?\]/);
      if (jsonMatch) {
        const extractedJson = JSON.parse(jsonMatch[0]);
        if (Array.isArray(extractedJson) && extractedJson.length > 0) {
          return extractedJson.slice(0, 3);
        }
      }
      
      throw new Error('Could not parse AI response as prompt array');
    } catch (parseError) {
      console.error('[Journal Prompts] Error parsing AI response:', parseError);
      console.log('[Journal Prompts] Raw AI response:', aiResponse);
      
      // If we couldn't parse the response, generate diverse prompt types based on time of day
      const hour = new Date().getHours();
      if (hour < 12) {
        return [
          "This morning I feel...",
          "My intention for today is...",
          "If today were perfect...",
        ];
      } else if (hour < 17) {
        return [
          "A challenge I'm facing",
          "Something unexpected today was...",
          "My energy right now is...",
        ];
      } else {
        return [
          "The best part of today",
          "Something I learned today",
          "If I could redo today...",
        ];
      }
    }
  } catch (error) {
    console.error('[Journal Prompts] Error generating prompts:', error);
    return [
      "My most honest thoughts",
      "A relationship that matters",
      "If I were braver...",
    ];
  }
}
