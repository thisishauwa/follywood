import { supabase } from '../services/supabase';

export const generateNickname = async (firstName: string): Promise<string> => {
  const fallbackNicknames = ['Champ', 'Ace', 'Superstar', 'Rockstar', 'Chief', 'Boss', 'Tiger', 'Sport'];
  const getFallback = () => fallbackNicknames[Math.floor(Math.random() * fallbackNicknames.length)];

  try {
    console.log('[generateNickname] Starting for first name:', firstName);

    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;

    if (!accessToken) {
      console.error('[generateNickname] No access token found. Using fallback.');
      return getFallback();
    }

    const endpoint = 'https://emlbypkvbcclndgshbxb.supabase.co/functions/v1/rapid-api';
    console.log('[generateNickname] Calling Supabase Edge Function:', endpoint);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ firstName }),
    });

    console.log(`[generateNickname] Response status: ${response.status}`);

    const responseText = await response.text();
    console.log('[generateNickname] Raw response body:', responseText);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}, body: ${responseText}`);
    }

    const data = JSON.parse(responseText);

    if (data.nickname) {
      console.log('[generateNickname] Successfully received nickname:', data.nickname);
      return data.nickname;
    } else {
      console.error('[generateNickname] No nickname in response data. Using fallback.');
      return getFallback();
    }
  } catch (error) {
    console.error('[generateNickname] Catch block error:', error);
    return getFallback();
  }
};

export const extractFirstName = (fullName: string): string => {
  return fullName.trim().split(' ')[0];
};
