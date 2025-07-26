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
  age_range?: '16-20' | '21-25' | '26-30'
  gender?: string
  sexuality?: string
  relationship_status?: 'single' | 'dating' | 'married' | 'other'
  onboarding_completed?: boolean
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

            if (profileError && profileError.code !== 'PGRST116') {
              console.error('Error fetching profile on auth change:', profileError.message);
            }
            if (subscriptionError && subscriptionError.code !== 'PGRST116') {
              console.error('Error fetching subscription on auth change:', subscriptionError.message);
            }

            // If we successfully got a profile, cache it
            if (profile) {
              try {
                await AsyncStorage.setItem(`profile_${currentUser.id}`, JSON.stringify(profile))
              } catch (cacheError) {
                console.error('Error caching profile:', cacheError)
              }
            }

            setUser({ ...currentUser, profile: profile || null, subscription: subscription || null });

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
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}