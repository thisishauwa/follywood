import Constants from 'expo-constants';
import { supabase } from './supabase';

/**
 * Calls a backend Edge Function that wraps Gemini Flash. Avoids exposing API keys in the client.
 * Expects an environment variable `EXPO_PUBLIC_AUGUST_ENDPOINT` like
 * https://xyz-company.supabase.co/functions/v1/august-ai
 */
export async function fetchAugustReply(message: string, userId: string, chatHistory: any[] = []): Promise<string> {
  try {
    // Get the endpoint from config
    const endpoint = Constants?.expoConfig?.extra?.AUGUST_ENDPOINT as string;

    console.log('[August Service] Raw endpoint from config:', endpoint);
    console.log('[August Service] Environment variables available:', JSON.stringify(Constants?.expoConfig?.extra));

    // Force the correct endpoint regardless of what's in the config
    const baseUrl = 'https://vejkcysxjhuotptwjtjs.supabase.co/functions/v1/august_chat';
    const correctedEndpoint = baseUrl;
    
    console.log('[August Service] Using FORCED endpoint:', correctedEndpoint);

    if (!correctedEndpoint) {
      console.error('[August Service] AUGUST_ENDPOINT is not set in app.config.js extra section or .env file.');
      return "Sorry, I'm not available right now. (Configuration Error)";
    }

    // Get the current session for authentication
    const { data: { session } } = await supabase.auth.getSession();
    
    // Ensure chat history is sorted chronologically (oldest first)
    const sortedChatHistory = [...chatHistory].sort((a, b) => {
      const timeA = a.timestamp || 0;
      const timeB = b.timestamp || 0;
      return timeA - timeB;
    });
    
    console.log('[August Service] Sending message with chat history:', sortedChatHistory.length, 'messages');
    
    const res = await fetch(correctedEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token || ''}`,
      },
      body: JSON.stringify({
        user_id: userId,
        message,
        chat_history: sortedChatHistory // Use sorted chat history
      }),
    });

    console.log(`[August Service] Response status: ${res.status}`);

    if (!res.ok) {
      const errorBody = await res.text();
      console.error('[August Service] API Error:', errorBody);
      return 'Hmm, I had trouble responding. Please check the logs.';
    }

    try {
      // Clone the response to allow reading the text first
      const resClone = res.clone();
      const rawText = await resClone.text();
      console.log('[August Service] Raw response:', rawText);
      
      // Try parsing as JSON first
      try {
        const data = JSON.parse(rawText);
        console.log('[August Service] Parsed JSON reply:', data.reply);
        return data.reply ?? 'I seem to be speechless right now.';
      } catch (jsonError) {
        // If not valid JSON, use the raw text as the reply
        console.log('[August Service] Using raw text as reply');
        return rawText || 'I seem to be speechless right now.';
      }
    } catch (error) {
      console.error(`August API fetch failed [${error}]`);
      return "Sorry, I couldn't understand the response from my backend. Please try again later.";
    }
  } catch (err) {
    console.error('August API fetch failed', err);
    return 'Something went wrong – please try later.';
  }
}
