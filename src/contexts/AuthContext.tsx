import AsyncStorage from '@react-native-async-storage/async-storage'
import { User } from '@supabase/supabase-js'
import React, { createContext, useContext, useEffect, useState } from 'react'
import { AuthResponse, AuthService } from '../services/auth'
import { supabase } from '../services/supabase'

export const navigationRef = React.createRef<any>();

export interface Profile {
  id: string
  username?: string
  email?: string
  full_name?: string
  age_range?: '16-20' | '21-25' | '26-30'
  gender?: string
  sexuality?: string
  relationship_status?: 'single' | 'dating' | 'married' | 'other'
  onboarding_completed?: boolean
  studio_name: string | null;
  genre: string | null;
  selected_genres: string[] | null;
  cash: number | null;
  fans: number | null;
  film_count: number | null;
  referral_code?: string
  referred_by?: string
  points?: number
  updated_at?: string
}

interface Subscription {
  id: string;
  status: 'active' | 'pending' | 'cancelled' | 'incomplete' | 'past_due';
  plan_id: string;
  end_date?: string;
  next_payment_date?: string;
}

export interface AuthUser extends User {
  profile: Profile | null
  subscription: Subscription | null
}

interface AuthContextType {
  user: AuthUser | null
  isSubscribed: boolean
  loading: boolean
  signInWithOtp: (email: string) => Promise<AuthResponse>
  verifyOtp: (email: string, token: string) => Promise<AuthResponse>
  signInWithGoogle: () => Promise<AuthResponse>
  signInWithApple: () => Promise<AuthResponse>
  signOut: () => Promise<AuthResponse>
  refreshSubscriptionStatus: () => Promise<void>
  refreshProfile: () => Promise<void>
  completeStudioCreation: (studioName: string, genre: string) => Promise<{ success: boolean; error?: any; }>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  // Listen for auth state changes
  useEffect(() => {
    console.log('AuthProvider: Setting up onAuthStateChange listener');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log(`AuthProvider: onAuthStateChange event: ${event}`);

        if (event === 'PASSWORD_RECOVERY') {
            console.log('AuthProvider: PASSWORD_RECOVERY event detected. Navigating to ResetPassword.');
            if (navigationRef.current) {
                navigationRef.current.navigate('ResetPassword');
            }
        }
        
        // Existing logic to handle user sessions
        const currentUser = session?.user ?? null;
        if (currentUser?.id && (!user || currentUser.id !== user.id)) {
          try {
            // Fetch profile and subscription in parallel
            const [profileResult, subscriptionResult] = await Promise.all([
              supabase.from('profiles').select('*').eq('id', currentUser.id).single(),
              supabase
                .from('subscriptions')
                .select('*')
                .eq('user_id', currentUser.id)
                .in('status', ['active', 'cancelled'])
                .order('created_at', { ascending: false })
                .limit(1)
                .single()
            ]);

            const { data: profile, error: profileError } = profileResult;
            const { data: subscription, error: subscriptionError } = subscriptionResult;
            
            let userProfile = profile;

            // If profile doesn't exist, create one. This ensures every user has a profile record.
            if (profileError && profileError.code === 'PGRST116') {
              console.log(`No profile found for user ${currentUser.id}. Creating one.`);
              console.log('User data:', { id: currentUser.id, email: currentUser.email });
              
              try {
                const { data: newProfile, error: insertError } = await supabase
                  .from('profiles')
                  .insert({
                    id: currentUser.id,
                    email: currentUser.email,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  })
                  .select()
                  .single();

                if (insertError) {
                  console.error('Error creating profile:', insertError);
                  console.error('Insert error details:', {
                    message: insertError.message,
                    code: insertError.code,
                    details: insertError.details,
                    hint: insertError.hint
                  });
                  
                  // Try a different approach - upsert instead of insert
                  console.log('Trying upsert instead...');
                  const { data: upsertProfile, error: upsertError } = await supabase
                    .from('profiles')
                    .upsert({
                      id: currentUser.id,
                      email: currentUser.email,
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                    })
                    .select()
                    .single();
                    
                  if (upsertError) {
                    console.error('Upsert also failed:', upsertError);
                  } else {
                    console.log('Profile created via upsert:', upsertProfile);
                    userProfile = upsertProfile;
                  }
                } else {
                  console.log(`Profile created successfully for user ${currentUser.id}:`, newProfile);
                  userProfile = newProfile; // Use the newly created profile
                }
              } catch (error) {
                console.error('Unexpected error during profile creation:', error);
              }
            } else if (profileError) {
              console.error('Error fetching profile on auth change:', profileError.message);
              console.error('Profile error details:', profileError);
            }

            if (subscriptionError && subscriptionError.code !== 'PGRST116') {
              console.error('Error fetching subscription on auth change:', subscriptionError.message);
            }

            // If we successfully got or created a profile, cache it
            if (userProfile) {
              try {
                await AsyncStorage.setItem(`profile_${currentUser.id}`, JSON.stringify(userProfile))
              } catch (cacheError) {
                console.error('Error caching profile:', cacheError)
              }
            }

            setUser({ ...currentUser, profile: userProfile || null, subscription: subscription || null });

          } catch (e) {
            console.error('An unexpected error occurred while fetching user data:', e)
            setUser({ ...currentUser, profile: null, subscription: null })
          }
        } else {
          setUser(null)
        }
        setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Listen for profile and subscription changes in realtime
  useEffect(() => {
    if (!user?.id) return

    // Profile listener
    const profileChannel = supabase
      .channel(`public:profiles:id=eq.${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        async (payload) => {
          console.log('Profile change received!', payload)
          const newProfile = payload.new as Profile

          // Cache the updated profile
          if (newProfile) {
            try {
              await AsyncStorage.setItem(`profile_${user.id}`, JSON.stringify(newProfile))
            } catch (cacheError) {
              console.error('Error caching updated profile:', cacheError)
            }
          }

          setUser(currentUser => (currentUser ? { ...currentUser, profile: newProfile } : null))
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Subscribed to profile changes for user: ${user.id}`)
        }
        if (err) {
          // Only log realtime errors in development mode to avoid production noise
          if (__DEV__) {
            console.warn(`Realtime profile subscription failed (non-critical):`, err.message || err)
          }
        }
      });

    // Subscription listener
    const subscriptionChannel = supabase
      .channel(`public:subscriptions:user_id=eq.${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscriptions',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Subscription change received!', payload)
          const newSubscription = payload.new as Subscription;

          // We only care about active or cancelled subscriptions in the context
          if (newSubscription && ['active', 'cancelled'].includes(newSubscription.status)) {
            setUser(currentUser => (currentUser ? { ...currentUser, subscription: newSubscription } : null));
          } else {
            // If the status is no longer 'active' or 'cancelled', remove it from context
            setUser(currentUser => (currentUser ? { ...currentUser, subscription: null } : null));
          }
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Subscribed to subscription changes for user: ${user.id}`)
        }
        if (err) {
          // Only log realtime errors in development mode to avoid production noise
          if (__DEV__) {
            console.warn(`Realtime subscription subscription failed (non-critical):`, err.message || err)
          }
        }
      });

    return () => {
      supabase.removeChannel(profileChannel);
      supabase.removeChannel(subscriptionChannel);
    }
  }, [user?.id])

  const signInWithOtp = async (email: string): Promise<AuthResponse> => {
    return await AuthService.signInWithOtp(email)
  }

  const verifyOtp = async (email: string, token: string): Promise<AuthResponse> => {
    return await AuthService.verifyOtp({ email, token })
  }

  const signInWithGoogle = async (): Promise<AuthResponse> => {
    return await AuthService.signInWithGoogle()
  }

  const signInWithApple = async (): Promise<AuthResponse> => {
    return await AuthService.signInWithApple()
  }

  const signOut = async (): Promise<AuthResponse> => {
    const response = await AuthService.signOut()

    // Clear cached profile data on sign out
    if (user?.id) {
      try {
        await AsyncStorage.removeItem(`profile_${user.id}`)
      } catch (cacheError) {
        console.error('Error clearing cached profile on sign out:', cacheError)
      }
    }

    // The onAuthStateChange listener will handle setting user to null
    return response
  }

  const completeStudioCreation = async (studioName: string, genre: string): Promise<{ success: boolean; error?: any; }> => {
    if (!user?.id) {
      return { success: false, error: { message: 'No user is currently signed in.' } };
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          studio_name: studioName,
          genre: genre,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating profile for studio creation:', error);
        return { success: false, error };
      }

      // Manually trigger a refresh of the user object to reflect the change immediately
      const { data: profile, error: profileError } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (profile) {
        setUser(currentUser => (currentUser ? { ...currentUser, profile } : null));
      }

      return { success: true };
    } catch (e) {
      console.error('Unexpected error during studio creation:', e);
      return { success: false, error: e };
    }
  };



  const refreshSubscriptionStatus = async (): Promise<void> => {
    if (!user?.id) return;

    try {
      const { data: subscription, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['active', 'cancelled'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error refreshing subscription:', error.message);
        return;
      }

      setUser(currentUser =>
        currentUser ? { ...currentUser, subscription: subscription || null } : null
      );
    } catch (e) {
      console.error('Unexpected error refreshing subscription:', e);
    }
  };

  const refreshProfile = async () => {
    if (!user?.id) return;
    
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (error) {
        console.error('Error refreshing profile:', error);
        return;
      }
      
      if (profile) {
        console.log('Profile refreshed:', profile);
        setUser(currentUser => 
          currentUser ? { ...currentUser, profile } : null
        );
        
        // Cache the updated profile
        try {
          await AsyncStorage.setItem(`profile_${user.id}`, JSON.stringify(profile));
        } catch (cacheError) {
          console.error('Error caching refreshed profile:', cacheError);
        }
      }
    } catch (error) {
      console.error('Unexpected error refreshing profile:', error);
    }
  };

  const isSubscribed = (() => {
    if (!user?.subscription) return false;

    const subscription = user.subscription;

    if (subscription.status === 'active') return true;

    if (subscription.status === 'cancelled') {
      const endDate = subscription.end_date || subscription.next_payment_date;
      if (!endDate) return false;

      const now = new Date();
      const subscriptionEndDate = new Date(endDate);

      return now < subscriptionEndDate;
    }

    return false;
  })();

  const value = {
    user,
    isSubscribed,
    loading,
    signInWithOtp,
    verifyOtp,
    signInWithGoogle,
    signInWithApple,
    signOut,
    refreshSubscriptionStatus,
    refreshProfile,
    completeStudioCreation,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}