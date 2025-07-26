import { supabase } from "./supabase";

export interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  referral_code: string;
  status: 'pending' | 'completed';
  points_awarded: number;
  completed_at?: string;
  created_at: string;
}

export interface ReferralStats {
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  totalPointsEarned: number;
}

export class ReferralService {
  /**
   * Get user's referral code from their profile
   */
  static async getUserReferralCode(userId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("referral_code")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching user referral code:", error);
        return null;
      }

      return data.referral_code;
    } catch (error) {
      console.error("Error getting user referral code:", error);
      return null;
    }
  }

  /**
   * Create a referral relationship when a user signs up with a referral code
   */
  static async createReferral(referralCode: string, newUserId: string): Promise<boolean> {
    try {
      // Find the referrer by their referral code
      const { data: referrer, error: referrerError } = await supabase
        .from("profiles")
        .select("id")
        .eq("referral_code", referralCode)
        .single();

      if (referrerError || !referrer) {
        console.log("Invalid referral code:", referralCode);
        return false;
      }

      // Don't allow self-referrals
      if (referrer.id === newUserId) {
        console.log("Self-referral attempt blocked");
        return false;
      }

      // Update the new user's profile to show who referred them
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ referred_by: referrer.id })
        .eq("id", newUserId);

      if (profileError) {
        console.error("Error updating referred_by field:", profileError);
        return false;
      }

      // Create a referral record
      const { error: referralError } = await supabase
        .from("referrals")
        .insert({
          referrer_id: referrer.id,
          referred_id: newUserId,
          referral_code: referralCode,
          status: "pending"
        });

      if (referralError) {
        console.error("Error creating referral record:", referralError);
        return false;
      }

      console.log(`Referral created: ${referrer.id} referred ${newUserId} with code ${referralCode}`);
      return true;
    } catch (error) {
      console.error("Error creating referral:", error);
      return false;
    }
  }

  /**
   * Get user's referral statistics
   */
  static async getReferralStats(userId: string): Promise<ReferralStats> {
    try {
      const { data: referrals, error } = await supabase
        .from("referrals")
        .select("*")
        .eq("referrer_id", userId);

      if (error) {
        console.error("Error fetching referral stats:", error);
        return {
          totalReferrals: 0,
          completedReferrals: 0,
          pendingReferrals: 0,
          totalPointsEarned: 0
        };
      }

      const totalReferrals = referrals?.length || 0;
      const completedReferrals = referrals?.filter(r => r.status === 'completed').length || 0;
      const pendingReferrals = referrals?.filter(r => r.status === 'pending').length || 0;
      const totalPointsEarned = referrals?.reduce((sum, r) => sum + (r.points_awarded || 0), 0) || 0;

      return {
        totalReferrals,
        completedReferrals,
        pendingReferrals,
        totalPointsEarned
      };
    } catch (error) {
      console.error("Error getting referral stats:", error);
      return {
        totalReferrals: 0,
        completedReferrals: 0,
        pendingReferrals: 0,
        totalPointsEarned: 0
      };
    }
  }

  /**
   * Get list of users referred by this user
   */
  static async getUserReferrals(userId: string): Promise<Referral[]> {
    try {
      const { data, error } = await supabase
        .from("referrals")
        .select(`
          *,
          profiles!referrals_referred_id_fkey (username)
        `)
        .eq("referrer_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching user referrals:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Error getting user referrals:", error);
      return [];
    }
  }

  /**
   * Check if referral code is valid
   */
  static async validateReferralCode(referralCode: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("referral_code", referralCode)
        .single();

      return !error && !!data;
    } catch (error) {
      console.error("Error validating referral code:", error);
      return false;
    }
  }

  /**
   * Generate a shareable referral link/message
   */
  static generateReferralMessage(referralCode: string, appName: string = "Talk to August"): string {
    return `Hey! I've been using ${appName} to improve my sexual wellness and happiness. Join me with my referral code: ${referralCode} and we both get rewards! 💖`;
  }
} 