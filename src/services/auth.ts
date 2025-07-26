import { supabase } from "./supabase"
import type { Session, User } from "@supabase/supabase-js"

// Optional imports for Apple Authentication (only available on iOS)
let AppleAuthentication: any = null
let Crypto: any = null

try {
  AppleAuthentication = require('expo-apple-authentication')
  Crypto = require('expo-crypto')
} catch (error) {
  console.warn('Apple Authentication modules not available:', error)
}

// Google Sign-In import
// Dynamic import for Google Sign-In to handle module availability
let GoogleSignin: any = null;
try {
  GoogleSignin = require('@react-native-google-signin/google-signin').GoogleSignin;
} catch (error) {
  console.warn('Google Sign-In module not available:', error);
}

export interface AuthError {
  message: string
  code: string
}

export interface AuthResponse {
  success: boolean
  user?: any
  error?: AuthError
}

export interface VerifyOtpData {
  email: string
  token: string
}

export class AuthService {
  /**
   * Sign in with OTP code. This will send a 6-digit code to the user's email.
   * If the user does not exist, Supabase will create them automatically.
   */
  static async signInWithOtp(email: string): Promise<AuthResponse> {
    try {
      // When emailRedirectTo is omitted, Supabase sends an OTP code instead of a magic link
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          // This will create a new user if they don't exist.
          shouldCreateUser: true,
          // Do NOT include emailRedirectTo to get OTP codes instead of magic links
          data: {
            username: email.split('@')[0], // Create default username from email
          },
        },
      })

      if (error) {
        return {
          success: false,
          error: {
            message: error.message,
            code: error.message,
          },
        }
      }

      return { success: true }
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.message || 'An unexpected error occurred',
          code: 'unexpected_error',
        },
      }
    }
  }

  /**
   * Verify the OTP token sent to the user's email to complete sign-in.
   */
  static async verifyOtp({ email, token }: VerifyOtpData): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email', // This specifies we are verifying an email-based OTP
      })

      if (error) {
        return {
          success: false,
          error: {
            message: error.message,
            code: error.message,
          },
        }
      }

      return {
        success: true,
        user: data.user,
      }
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.message || 'An unexpected error occurred',
          code: 'unexpected_error',
        },
      }
    }
  }

  /**
   * Sign in with Google using Supabase Auth.
   */
  static async signInWithGoogle(): Promise<AuthResponse> {
    try {
      // Check if Google Sign-In module is available
      if (!GoogleSignin) {
        return {
          success: false,
          error: { message: 'Google Sign-In is not available on this platform', code: 'module_unavailable' }
        }
      }

      // Configure Google Sign-In
      const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
      const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
      
      console.log('Google Sign-In Config:', {
        webClientId: webClientId ? `${webClientId.substring(0, 20)}...` : 'NOT SET',
        iosClientId: iosClientId ? `${iosClientId.substring(0, 20)}...` : 'NOT SET',
        platform: require('react-native').Platform.OS,
        isTestFlight: __DEV__ ? 'Development' : 'Production/TestFlight'
      });
      
      if (!webClientId) {
        console.error('Google Sign-In: Missing web client ID');
        return {
          success: false,
          error: { message: 'Google Web Client ID not configured. Please add EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID to your environment variables.', code: 'missing_config' }
        }
      }
      
      const config = {
        webClientId: webClientId, // Web client ID for server validation
        iosClientId: iosClientId, // iOS client ID (optional)
        offlineAccess: true,
        forceCodeForRefreshToken: true, // Ensure refresh token is available
      };
      
      console.log('Configuring Google Sign-In with:', {
        ...config,
        webClientId: webClientId ? `${webClientId.substring(0, 20)}...` : 'NOT SET',
        iosClientId: iosClientId ? `${iosClientId.substring(0, 20)}...` : 'NOT SET'
      });
      
      await GoogleSignin.configure(config);

      // Check if Google Play Services are available (Android only)
      try {
        const hasPlayServices = await GoogleSignin.hasPlayServices();
        console.log('Google Play Services available:', hasPlayServices);
      } catch (playServicesError: any) {
        // On iOS, this might throw an error, so we ignore it
        console.log('Play Services check (expected on iOS):', playServicesError?.message || playServicesError);
        
        // On Android, if Play Services are not available, return error
        if (require('react-native').Platform.OS === 'android') {
          return {
            success: false,
            error: { message: 'Google Play Services not available', code: 'play_services_unavailable' }
          };
        }
      }

      // Sign in with Google
      console.log('Attempting Google Sign-In...');
      const userInfo = await GoogleSignin.signIn();
      
      console.log('Google Sign-In response:', {
        hasData: !!userInfo.data,
        hasIdToken: !!userInfo.data?.idToken,
        hasUser: !!userInfo.data?.user,
        userEmail: userInfo.data?.user?.email || 'No email'
      });
      
      if (!userInfo.data?.idToken) {
        console.error('Google Sign-In: No ID token received');
        return {
          success: false,
          error: { message: 'No ID token received from Google', code: 'no_id_token' }
        }
      }

      // Sign in with Supabase using the Google ID token
      console.log('Signing in with Supabase using Google ID token...');
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: userInfo.data.idToken,
      });

      if (error) {
        console.error('Supabase Google Sign-In error:', error);
        return {
          success: false,
          error: { message: error.message, code: 'supabase_error' }
        }
      }
      
      console.log('Google Sign-In successful:', {
        userId: data.user?.id,
        email: data.user?.email
      });

      return {
        success: true,
        user: data.user
      }
    } catch (error: any) {
      console.error('Google Sign-In error:', {
        code: error.code,
        message: error.message,
        stack: error.stack,
        error: error
      });
      
      // Handle specific Google Sign-In errors
      if (error.code === 'SIGN_IN_CANCELLED' || error.code === '-5') {
        return {
          success: false,
          error: { code: 'user_cancelled', message: 'User cancelled Google Sign-In' }
        }
      }
      
      if (error.code === 'IN_PROGRESS') {
        return {
          success: false,
          error: { message: 'Google Sign-In already in progress', code: 'in_progress' }
        }
      }
      
      if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
        return {
          success: false,
          error: { message: 'Google Play Services not available', code: 'play_services_unavailable' }
        }
      }
      
      // Handle network or configuration errors
      if (error.code === 'NETWORK_ERROR' || error.message?.includes('network')) {
        return {
          success: false,
          error: { message: 'Network error during Google Sign-In. Please check your internet connection.', code: 'network_error' }
        }
      }
      
      // Handle configuration errors
      if (error.message?.includes('CLIENT_ID') || error.message?.includes('configuration')) {
        return {
          success: false,
          error: { message: 'Google Sign-In configuration error. Please contact support.', code: 'config_error' }
        }
      }

      return {
        success: false,
        error: { 
          message: error.message || 'Google Sign-In failed. Please try again or use OTP sign-in.', 
          code: error.code || 'google_signin_error' 
        }
      }
    }
  }

  /**
   * Sign in with Apple using Supabase Auth.
   */
  static async signInWithApple(): Promise<AuthResponse> {
    try {
      // Check if Apple Authentication modules are loaded
      if (!AppleAuthentication || !Crypto) {
        return {
          success: false,
          error: {
            message: 'Apple Sign-In is not available on this platform',
            code: 'apple_signin_unavailable',
          },
        }
      }

      // Check if Apple Authentication is available
      const isAvailable = await AppleAuthentication.isAvailableAsync()
      if (!isAvailable) {
        return {
          success: false,
          error: {
            message: 'Apple Sign-In is not available on this device',
            code: 'apple_signin_unavailable',
          },
        }
      }

      // Generate a random nonce for security
      const nonce = Math.random().toString(36).substring(2, 10)
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        nonce,
        { encoding: Crypto.CryptoEncoding.HEX }
      )

      // Request Apple authentication
      const appleCredential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      })

      // Sign in with Supabase using the Apple credential
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: appleCredential.identityToken!,
        nonce,
      })

      if (error) {
        return {
          success: false,
          error: {
            message: error.message,
            code: error.message,
          },
        }
      }

      return {
        success: true,
        user: data.user,
      }
    } catch (error: any) {
      // Handle user cancellation
      if (error.code === 'ERR_REQUEST_CANCELED') {
        return {
          success: false,
          error: {
            message: 'Apple Sign-In was cancelled',
            code: 'user_cancelled',
          },
        }
      }

      return {
        success: false,
        error: {
          message: error.message || 'Apple Sign-In failed',
          code: 'apple_signin_error',
        },
      }
    }
  }

  /**
   * Sign out current user
   */
  static async signOut(): Promise<AuthResponse> {
    try {
      const { error } = await supabase.auth.signOut()

      if (error) {
        return {
          success: false,
          error: {
            message: error.message,
            code: error.message,
          },
        }
      }

      return { success: true }
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.message || 'An unexpected error occurred',
          code: 'unexpected_error',
        },
      }
    }
  }

  /**
   * Get current authenticated user
   */
  static async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()

      if (error) {
        return null
      }

      return user
    } catch (error) {
      return null
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(updates: {
    age_range?: "16-20" | "21-25" | "26-30"
    gender?: string
    sexuality?: string
    relationship_status?: "single" | "dating" | "married" | "other"
  }): Promise<AuthResponse> {
    try {
      const { error } = await supabase.auth.updateUser({
        data: updates,
      })

      if (error) {
        return {
          success: false,
          error: {
            message: error.message,
            code: error.message,
          },
        }
      }

      return { success: true }
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.message || 'An unexpected error occurred',
          code: 'unexpected_error',
        },
      }
    }
  }

  /**
   * Get current session
   */
  static async getCurrentSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) {
        console.error('Error getting session:', error)
        return null
      }
      return session
    } catch (error) {
      console.error('Error getting session:', error)
      return null
    }
  }

  /**
   * Listen to auth state changes
   */
  static onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback)
  }
}

// Default export for convenience
export default AuthService
