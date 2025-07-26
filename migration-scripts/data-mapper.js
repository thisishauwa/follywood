/**
 * Custom data mapper for Talk to August Firebase to Supabase migration
 * Handles specific field mappings and data transformations
 */

const { v4: uuidv4 } = require('uuid');

class DataMapper {
  constructor() {
    this.userIdMap = new Map(); // Firebase UID -> Supabase UUID mapping
    this.documentIdMap = new Map(); // Firebase doc ID -> Supabase UUID mapping
  }

  /**
   * Convert Firebase Timestamp to PostgreSQL compatible format
   */
  convertTimestamp(firebaseTimestamp) {
    if (!firebaseTimestamp) return null;
    
    // Handle Firebase Timestamp object
    if (firebaseTimestamp._seconds) {
      return new Date(firebaseTimestamp._seconds * 1000).toISOString();
    }
    
    // Handle already converted date
    if (firebaseTimestamp instanceof Date) {
      return firebaseTimestamp.toISOString();
    }
    
    // Handle ISO string
    if (typeof firebaseTimestamp === 'string') {
      return new Date(firebaseTimestamp).toISOString();
    }
    
    return null;
  }

  /**
   * Map Firebase user to Supabase profile
   */
  mapUserToProfile(firebaseUser, userProfile = {}) {
    const supabaseId = firebaseUser.uid; // Keep original UID for auth compatibility
    this.userIdMap.set(firebaseUser.uid, supabaseId);

    return {
      id: supabaseId,
      username: userProfile.username || firebaseUser.displayName || firebaseUser.email?.split('@')[0],
      age_range: userProfile.age_range || userProfile.ageRange,
      gender: userProfile.gender?.toLowerCase(),
      sexuality: userProfile.sexuality?.toLowerCase(),
      relationship_status: userProfile.relationship_status || userProfile.relationshipStatus?.toLowerCase(),
      onboarding_completed: userProfile.onboarding_completed || userProfile.onboardingCompleted || false,
      points: userProfile.points || 0,
      updated_at: this.convertTimestamp(userProfile.updated_at || userProfile.updatedAt || new Date())
    };
  }

  /**
   * Map Firebase journal entry to Supabase journal entry
   */
  mapJournalEntry(firebaseEntry) {
    const id = uuidv4();
    const userId = this.userIdMap.get(firebaseEntry.userId || firebaseEntry.user_id);
    
    if (!userId) {
      throw new Error(`User ID not found for journal entry: ${firebaseEntry.userId || firebaseEntry.user_id}`);
    }

    return {
      id,
      user_id: userId,
      title: firebaseEntry.title || 'Untitled Entry',
      content: firebaseEntry.content || firebaseEntry.text || '',
      tags: Array.isArray(firebaseEntry.tags) ? firebaseEntry.tags : [],
      created_at: this.convertTimestamp(firebaseEntry.created_at || firebaseEntry.createdAt || firebaseEntry.timestamp)
    };
  }

  /**
   * Map Firebase goal to Supabase goal
   */
  mapGoal(firebaseGoal) {
    const id = uuidv4();
    const userId = this.userIdMap.get(firebaseGoal.userId || firebaseGoal.user_id);
    
    if (!userId) {
      throw new Error(`User ID not found for goal: ${firebaseGoal.userId || firebaseGoal.user_id}`);
    }

    this.documentIdMap.set(firebaseGoal.id || firebaseGoal._id, id);

    return {
      id,
      user_id: userId,
      name: firebaseGoal.name || firebaseGoal.title,
      recurrence: firebaseGoal.recurrence || firebaseGoal.frequency,
      effort_score: firebaseGoal.effort_score || firebaseGoal.effortScore,
      time_of_day: firebaseGoal.time_of_day || firebaseGoal.timeOfDay,
      tags: Array.isArray(firebaseGoal.tags) ? firebaseGoal.tags : [],
      status: firebaseGoal.status || 'active',
      completion_date: this.convertTimestamp(firebaseGoal.completion_date || firebaseGoal.completionDate),
      created_at: this.convertTimestamp(firebaseGoal.created_at || firebaseGoal.createdAt)
    };
  }

  /**
   * Map Firebase goal completion to Supabase goal completion
   */
  mapGoalCompletion(firebaseCompletion) {
    const id = uuidv4();
    const userId = this.userIdMap.get(firebaseCompletion.userId || firebaseCompletion.user_id);
    const goalId = this.documentIdMap.get(firebaseCompletion.goalId || firebaseCompletion.goal_id);
    
    if (!userId) {
      throw new Error(`User ID not found for goal completion: ${firebaseCompletion.userId || firebaseCompletion.user_id}`);
    }
    
    if (!goalId) {
      throw new Error(`Goal ID not found for completion: ${firebaseCompletion.goalId || firebaseCompletion.goal_id}`);
    }

    return {
      id,
      user_id: userId,
      goal_id: goalId,
      completed_at: this.convertTimestamp(firebaseCompletion.completed_at || firebaseCompletion.completedAt || firebaseCompletion.timestamp)
    };
  }

  /**
   * Map Firebase chat message to Supabase chat history
   */
  mapChatMessage(firebaseMessage) {
    const id = uuidv4();
    const userId = this.userIdMap.get(firebaseMessage.userId || firebaseMessage.user_id);
    
    if (!userId) {
      throw new Error(`User ID not found for chat message: ${firebaseMessage.userId || firebaseMessage.user_id}`);
    }

    return {
      id,
      user_id: userId,
      message_text: firebaseMessage.message_text || firebaseMessage.text || firebaseMessage.content,
      is_user_message: firebaseMessage.is_user_message || firebaseMessage.isUserMessage || firebaseMessage.role === 'user',
      created_at: this.convertTimestamp(firebaseMessage.created_at || firebaseMessage.createdAt || firebaseMessage.timestamp)
    };
  }

  /**
   * Map Firebase wellness rating to Supabase daily wellness rating
   */
  mapWellnessRating(firebaseRating) {
    const id = uuidv4();
    const userId = this.userIdMap.get(firebaseRating.userId || firebaseRating.user_id);
    
    if (!userId) {
      throw new Error(`User ID not found for wellness rating: ${firebaseRating.userId || firebaseRating.user_id}`);
    }

    const ratingDate = firebaseRating.rating_date || firebaseRating.date;
    const ratingDateFormatted = ratingDate instanceof Date ? 
      ratingDate.toISOString().split('T')[0] : 
      new Date(ratingDate).toISOString().split('T')[0];

    return {
      id,
      user_id: userId,
      sexual_wellness_rating: firebaseRating.sexual_wellness_rating || firebaseRating.rating || firebaseRating.score,
      rating_date: ratingDateFormatted,
      created_at: this.convertTimestamp(firebaseRating.created_at || firebaseRating.createdAt)
    };
  }

  /**
   * Map Firebase happiness score to Supabase sexual happiness score
   */
  mapHappinessScore(firebaseScore) {
    const id = uuidv4();
    const userId = this.userIdMap.get(firebaseScore.userId || firebaseScore.user_id);
    
    if (!userId) {
      throw new Error(`User ID not found for happiness score: ${firebaseScore.userId || firebaseScore.user_id}`);
    }

    return {
      id,
      user_id: userId,
      score: firebaseScore.score || firebaseScore.value,
      created_at: this.convertTimestamp(firebaseScore.created_at || firebaseScore.createdAt || firebaseScore.timestamp)
    };
  }

  /**
   * Map Firebase audio progress to Supabase audio guide progress
   */
  mapAudioProgress(firebaseProgress) {
    const id = uuidv4();
    const userId = this.userIdMap.get(firebaseProgress.userId || firebaseProgress.user_id);
    
    if (!userId) {
      throw new Error(`User ID not found for audio progress: ${firebaseProgress.userId || firebaseProgress.user_id}`);
    }

    return {
      id,
      user_id: userId,
      audio_guide_id: firebaseProgress.audio_guide_id || firebaseProgress.audioGuideId || firebaseProgress.guideId,
      progress: firebaseProgress.progress || firebaseProgress.position || 0,
      last_updated: this.convertTimestamp(firebaseProgress.last_updated || firebaseProgress.lastUpdated || firebaseProgress.timestamp)
    };
  }

  /**
   * Map Firebase onboarding selection to Supabase onboarding selection
   */
  mapOnboardingSelection(firebaseSelection) {
    const id = uuidv4();
    const userId = this.userIdMap.get(firebaseSelection.userId || firebaseSelection.user_id);
    
    if (!userId) {
      throw new Error(`User ID not found for onboarding selection: ${firebaseSelection.userId || firebaseSelection.user_id}`);
    }

    return {
      id,
      user_id: userId,
      goal_preference: firebaseSelection.goal_preference || firebaseSelection.goalPreference,
      created_at: this.convertTimestamp(firebaseSelection.created_at || firebaseSelection.createdAt)
    };
  }

  /**
   * Map Firebase subscription to Supabase subscription
   */
  mapSubscription(firebaseSubscription) {
    const id = uuidv4();
    const userId = this.userIdMap.get(firebaseSubscription.userId || firebaseSubscription.user_id);
    
    if (!userId) {
      throw new Error(`User ID not found for subscription: ${firebaseSubscription.userId || firebaseSubscription.user_id}`);
    }

    return {
      id,
      user_id: userId,
      plan_id: null, // Will need to be mapped to existing Supabase plan
      paystack_subscription_code: firebaseSubscription.paystack_subscription_code || firebaseSubscription.subscriptionCode,
      paystack_customer_code: firebaseSubscription.paystack_customer_code || firebaseSubscription.customerCode,
      status: firebaseSubscription.status || 'pending',
      amount: firebaseSubscription.amount || 0,
      currency: firebaseSubscription.currency || 'NGN',
      start_date: this.convertTimestamp(firebaseSubscription.start_date || firebaseSubscription.startDate),
      end_date: this.convertTimestamp(firebaseSubscription.end_date || firebaseSubscription.endDate),
      next_payment_date: this.convertTimestamp(firebaseSubscription.next_payment_date || firebaseSubscription.nextPaymentDate),
      created_at: this.convertTimestamp(firebaseSubscription.created_at || firebaseSubscription.createdAt),
      updated_at: this.convertTimestamp(firebaseSubscription.updated_at || firebaseSubscription.updatedAt)
    };
  }

  /**
   * Get mapping statistics
   */
  getStats() {
    return {
      usersMaped: this.userIdMap.size,
      documentsMaped: this.documentIdMap.size
    };
  }
}

module.exports = DataMapper; 