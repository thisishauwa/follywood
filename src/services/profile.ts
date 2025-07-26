import { supabase } from "./supabase"

export interface OnboardingData {
  goal_preference?: 'teach_me' | 'improve_sex' | 'enhance_sex';
  age_range?: '16-20' | '21-25' | '26-30' | '31-35' | '36-45' | '45+';
  gender?: string;
  sexuality?: string;
  relationship_status?: 'single' | 'dating' | 'married' | 'other';
  username?: string;
  onboarding_completed?: boolean;
}

class ProfileService {
  async updateOnboardingData(userId: string, data: OnboardingData & { username?: string }): Promise<void> {
    console.log('🔧 ProfileService: Starting updateOnboardingData');
    console.log('🔧 ProfileService: userId:', userId);
    console.log('🔧 ProfileService: data:', data);
    
    if (!userId) {
      throw new Error("User ID is required to update onboarding data.")
    }

    const { goal_preference, ...profileData } = data
    console.log('🔧 ProfileService: goal_preference:', goal_preference);
    console.log('🔧 ProfileService: profileData:', profileData);

    // Upsert the profiles table only if there is profile data to save.
    if (Object.keys(profileData).length > 0) {
      console.log('🔧 ProfileService: Upserting profiles table...');
      const dataToUpsert = { id: userId, ...profileData };
      console.log('🔧 ProfileService: Exact data being upserted:', dataToUpsert);
      
      try {
        // Add timeout to prevent infinite hanging
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Profiles table upsert timeout')), 10000)
        );
        
        const upsertPromise = supabase
          .from('profiles')
          .upsert(dataToUpsert, { onConflict: 'id' });
        
        const { error: profileError } = await Promise.race([upsertPromise, timeoutPromise]) as any;
        
        if (profileError) {
          console.error('🔧 ProfileService: Error upserting profile:', profileError);
          console.error('🔧 ProfileService: Error details:', JSON.stringify(profileError, null, 2));
          throw profileError;
        }
        console.log('🔧 ProfileService: Profiles table upsert completed');
      } catch (error: any) {
        console.error('🔧 ProfileService: Profiles upsert failed or timed out:', error);
        throw error;
      }
    }

    // If a goal_preference is provided, upsert it into the separate selections table.
    if (goal_preference) {
      console.log('🔧 ProfileService: Upserting onboarding_selections table...');
      const { error: onboardingError } = await supabase
        .from('onboarding_selections')
        .upsert({ user_id: userId, goal_preference: goal_preference }, { onConflict: 'user_id' })

      if (onboardingError) {
        console.error('🔧 ProfileService: Error upserting onboarding selection:', onboardingError)
        throw onboardingError
      }
      console.log('🔧 ProfileService: Onboarding selections table upsert completed');
    }
    
    console.log('🔧 ProfileService: updateOnboardingData completed successfully');
  }
}

export const profileService = new ProfileService()
