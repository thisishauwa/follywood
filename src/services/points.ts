import { supabase } from "./supabase";
import type { Goal } from "../types/Goal";

interface PointsCalculation {
  journalPoints: number;
  goalPoints: number;
  totalPoints: number;
}

// Points values based on requirements
const POINTS_CONFIG = {
  JOURNAL_ENTRY: 3,
  GOAL_EFFORT: {
    'Low': 2,
    'Medium': 4,
    'High': 6,
    'Extra High': 8,
  },
  SUCCESSFUL_REFERRAL: 30, // Points awarded when someone you refer completes their first action
};

export class PointsService {
  /**
   * Calculate total points for a user based on journal entries and completed goals
   */
  static async calculateUserPoints(userId: string): Promise<PointsCalculation> {
    try {
      // Get journal entries count
      const { data: journalEntries, error: journalError } = await supabase
        .from("journal_entries")
        .select("id")
        .eq("user_id", userId);

      if (journalError) {
        console.error("Error fetching journal entries for points:", journalError);
        throw journalError;
      }

      // Get completed goals with their effort scores
      const { data: goalsData, error: goalsError } = await supabase
        .from("goals")
        .select(`
          id,
          effort_score,
          goal_completions (id, completed_at)
        `)
        .eq("user_id", userId)
        .eq("status", "active")
        .eq("is_archived", false);

      if (goalsError) {
        console.error("Error fetching goals for points:", goalsError);
        throw goalsError;
      }

      // Calculate journal points
      const journalPoints = (journalEntries || []).length * POINTS_CONFIG.JOURNAL_ENTRY;

      // Calculate goal completion points
      let goalPoints = 0;
      if (goalsData) {
        for (const goal of goalsData) {
          const completionCount = goal.goal_completions?.length || 0;
          if (completionCount > 0) {
            const effortPoints = POINTS_CONFIG.GOAL_EFFORT[goal.effort_score as keyof typeof POINTS_CONFIG.GOAL_EFFORT] || 0;
            goalPoints += effortPoints * completionCount;
          }
        }
      }

      const totalPoints = journalPoints + goalPoints;

      return {
        journalPoints,
        goalPoints,
        totalPoints
      };
    } catch (error) {
      console.error("Error calculating user points:", error);
      return {
        journalPoints: 0,
        goalPoints: 0,
        totalPoints: 0
      };
    }
  }

  /**
   * Update user's points in the profiles table
   */
  static async updateUserPoints(userId: string): Promise<number> {
    try {
      const pointsCalculation = await this.calculateUserPoints(userId);
      
      // Update points in profiles table
      const { error } = await supabase
        .from("profiles")
        .update({ points: pointsCalculation.totalPoints })
        .eq("id", userId);

      if (error) {
        console.error("Error updating user points:", error);
        throw error;
      }

      return pointsCalculation.totalPoints;
    } catch (error) {
      console.error("Error updating user points:", error);
      return 0;
    }
  }

  /**
   * Get user's current points from the profiles table
   */
  static async getUserPoints(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("points")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching user points:", error);
        // If no points field exists, calculate and update
        return await this.updateUserPoints(userId);
      }

      // If points is null or undefined, calculate and update
      if (data.points === null || data.points === undefined) {
        return await this.updateUserPoints(userId);
      }

      return data.points;
    } catch (error) {
      console.error("Error getting user points:", error);
      return 0;
    }
  }

  /**
   * Add points for goal completion
   */
  static async addGoalCompletionPoints(userId: string, effortScore: string): Promise<void> {
    try {
      const pointsToAdd = POINTS_CONFIG.GOAL_EFFORT[effortScore as keyof typeof POINTS_CONFIG.GOAL_EFFORT] || 0;
      
      if (pointsToAdd > 0) {
        // Get current points
        const currentPoints = await this.getUserPoints(userId);
        const newPoints = currentPoints + pointsToAdd;

        // Update points in profiles table
        const { error } = await supabase
          .from("profiles")
          .update({ points: newPoints })
          .eq("id", userId);

        if (error) {
          console.error("Error adding goal completion points:", error);
          throw error;
        }

        // Check if this is the user's first action and award referral points if applicable
        await this.checkAndAwardReferralPoints(userId);
      }
    } catch (error) {
      console.error("Error adding goal completion points:", error);
    }
  }

  /**
   * Add points for journal entry
   */
  static async addJournalEntryPoints(userId: string): Promise<void> {
    try {
      // Get current points
      const currentPoints = await this.getUserPoints(userId);
      const newPoints = currentPoints + POINTS_CONFIG.JOURNAL_ENTRY;

      // Update points in profiles table
      const { error } = await supabase
        .from("profiles")
        .update({ points: newPoints })
        .eq("id", userId);

      if (error) {
        console.error("Error adding journal entry points:", error);
        throw error;
      }

      // Check if this is the user's first action and award referral points if applicable
      await this.checkAndAwardReferralPoints(userId);
    } catch (error) {
      console.error("Error adding journal entry points:", error);
    }
  }

  /**
   * Check if user was referred and this is their first action, then award referral points
   */
  static async checkAndAwardReferralPoints(userId: string): Promise<void> {
    try {
      // Check if user was referred and referral is still pending
      const { data: referral, error: referralError } = await supabase
        .from("referrals")
        .select("*")
        .eq("referred_id", userId)
        .eq("status", "pending")
        .single();

      if (referralError && referralError.code !== 'PGRST116') {
        console.error("Error checking referral status:", referralError);
        return;
      }

      if (referral) {
        // Check if this is the user's first significant action
        const isFirstAction = await this.isUserFirstAction(userId);
        
        if (isFirstAction) {
          // Award points to the referrer
          await this.awardReferralPoints(referral.referrer_id, referral.id);
        }
      }
    } catch (error) {
      console.error("Error checking and awarding referral points:", error);
    }
  }

  /**
   * Check if this is the user's first significant action (first goal completion or journal entry)
   */
  private static async isUserFirstAction(userId: string): Promise<boolean> {
    try {
      const pointsCalculation = await this.calculateUserPoints(userId);
      // Consider it first action if they have minimal points (3 for first journal or 2-8 for first goal)
      return pointsCalculation.totalPoints <= 8;
    } catch (error) {
      console.error("Error checking if first action:", error);
      return false;
    }
  }

  /**
   * Award referral points to the referrer
   */
  static async awardReferralPoints(referrerId: string, referralId: string): Promise<void> {
    try {
      // Get referrer's current points
      const currentPoints = await this.getUserPoints(referrerId);
      const newPoints = currentPoints + POINTS_CONFIG.SUCCESSFUL_REFERRAL;

      // Update referrer's points
      const { error: pointsError } = await supabase
        .from("profiles")
        .update({ points: newPoints })
        .eq("id", referrerId);

      if (pointsError) {
        console.error("Error updating referrer points:", pointsError);
        throw pointsError;
      }

      // Mark referral as completed
      const { error: referralError } = await supabase
        .from("referrals")
        .update({
          status: "completed",
          points_awarded: POINTS_CONFIG.SUCCESSFUL_REFERRAL,
          completed_at: new Date().toISOString()
        })
        .eq("id", referralId);

      if (referralError) {
        console.error("Error updating referral status:", referralError);
        throw referralError;
      }

      console.log(`Awarded ${POINTS_CONFIG.SUCCESSFUL_REFERRAL} referral points to user ${referrerId}`);
    } catch (error) {
      console.error("Error awarding referral points:", error);
    }
  }
} 