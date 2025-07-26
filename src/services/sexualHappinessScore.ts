import { supabase } from "./supabase";

interface ScoreFactors {
  reflectionScore: number;    // Journal consistency & frequency
  progressScore: number;      // Goal completion & effort
  learningScore: number;      // Audio guide engagement
  communicationScore: number; // Chat with August engagement
  consistencyBonus: number;   // Regular activity across time
}

interface SexualHappinessCalculation {
  totalScore: number;
  factors: ScoreFactors;
  breakdown: {
    reflection: string;
    progress: string;
    learning: string;
    communication: string;
    consistency: string;
  };
}

export class SexualHappinessService {
  /**
   * Calculate comprehensive sexual happiness score (0-100)
   * Based on research-backed factors that correlate with sexual wellness
   */
  static async calculateSexualHappinessScore(userId: string): Promise<SexualHappinessCalculation> {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Get user data for the last 30 days
      const [journalData, goalsData, audioData, chatData] = await Promise.all([
        this.getJournalData(userId, thirtyDaysAgo),
        this.getGoalsData(userId, thirtyDaysAgo),
        this.getAudioData(userId, thirtyDaysAgo),
        this.getChatData(userId, thirtyDaysAgo)
      ]);

      // Calculate individual scores
      const reflectionScore = this.calculateReflectionScore(journalData, sevenDaysAgo);
      const progressScore = this.calculateProgressScore(goalsData);
      const learningScore = this.calculateLearningScore(audioData);
      const communicationScore = this.calculateCommunicationScore(chatData);
      const consistencyBonus = this.calculateConsistencyBonus(journalData, goalsData, audioData, chatData);

      // Weighted total score
      const totalScore = Math.round(
        reflectionScore * 0.25 +      // 25% - Self-reflection through journaling
        progressScore * 0.30 +        // 30% - Goal achievement and growth
        learningScore * 0.20 +        // 20% - Educational engagement
        communicationScore * 0.15 +   // 15% - Communication comfort
        consistencyBonus * 0.10       // 10% - Consistency bonus
      );

      return {
        totalScore: Math.min(100, Math.max(0, totalScore)),
        factors: {
          reflectionScore,
          progressScore,
          learningScore,
          communicationScore,
          consistencyBonus
        },
        breakdown: {
          reflection: this.getReflectionFeedback(reflectionScore),
          progress: this.getProgressFeedback(progressScore),
          learning: this.getLearningFeedback(learningScore),
          communication: this.getCommunicationFeedback(communicationScore),
          consistency: this.getConsistencyFeedback(consistencyBonus)
        }
      };
    } catch (error) {
      console.error("Error calculating sexual happiness score:", error);
      return this.getDefaultScore();
    }
  }

  // Data fetching methods
  private static async getJournalData(userId: string, thirtyDaysAgo: Date) {
    const { data, error } = await supabase
      .from("journal_entries")
      .select("created_at, title, content")
      .eq("user_id", userId)
      .gte("created_at", thirtyDaysAgo.toISOString());
    
    return data || [];
  }

  private static async getGoalsData(userId: string, thirtyDaysAgo: Date) {
    const { data, error } = await supabase
      .from("goals")
      .select(`
        *,
        goal_completions!inner(completed_at)
      `)
      .eq("user_id", userId)
      .eq("status", "active")
      .eq("is_archived", false)
      .gte("goal_completions.completed_at", thirtyDaysAgo.toISOString());
    
    return data || [];
  }

  private static async getAudioData(userId: string, thirtyDaysAgo: Date) {
    const { data, error } = await supabase
      .from("audio_guide_progress")
      .select("*, audio_guides(*)")
      .eq("user_id", userId)
      .gte("last_updated", thirtyDaysAgo.toISOString());
    
    return data || [];
  }

  private static async getChatData(userId: string, thirtyDaysAgo: Date) {
    const { data, error } = await supabase
      .from("chat_history")
      .select("created_at, message_text, is_user_message")
      .eq("user_id", userId)
      .gte("created_at", thirtyDaysAgo.toISOString());
    
    return data || [];
  }

  // Score calculation methods
  private static calculateReflectionScore(journalData: any[], sevenDaysAgo: Date): number {
    if (journalData.length === 0) return 0;

    const recentEntries = journalData.filter(entry => 
      new Date(entry.created_at) >= sevenDaysAgo
    );
    
    // Base score for having entries
    let score = Math.min(40, journalData.length * 4); // Up to 40 points for 10+ entries
    
    // Bonus for recent activity (recency matters for reflection)
    score += Math.min(30, recentEntries.length * 10); // Up to 30 points for 3+ recent entries
    
    // Quality bonus for substantial entries
    const substantialEntries = journalData.filter(entry => 
      (entry.content?.length || 0) > 100
    );
    score += Math.min(30, substantialEntries.length * 3); // Up to 30 points for quality
    
    return Math.min(100, score);
  }

  private static calculateProgressScore(goalsData: any[]): number {
    if (goalsData.length === 0) return 0;

    let score = 0;
    const effortMultipliers = { 'Low': 1, 'Medium': 1.5, 'High': 2, 'Extra High': 2.5 };

    for (const goal of goalsData) {
      const completions = goal.goal_completions?.length || 0;
      const effortMultiplier = effortMultipliers[goal.effort_score as keyof typeof effortMultipliers] || 1;
      score += completions * 15 * effortMultiplier; // Base 15 points per completion, modified by effort
    }

    // Bonus for diverse goal types (variety indicates holistic growth)
    const effortTypes = new Set(goalsData.map(g => g.effort_score));
    score += (effortTypes.size - 1) * 10; // Bonus for variety

    return Math.min(100, score);
  }

  private static calculateLearningScore(audioData: any[]): number {
    if (audioData.length === 0) return 0;

    let score = 0;
    
    // Points for number of guides engaged with
    score += Math.min(40, audioData.length * 8); // Up to 40 points for 5+ guides
    
    // Points for completion percentage
    const completionRates = audioData.map(item => {
      const duration = item.audio_guides?.duration || 1;
      return Math.min(1, (item.progress || 0) / duration);
    });
    
    const avgCompletion = completionRates.reduce((a, b) => a + b, 0) / completionRates.length;
    score += avgCompletion * 60; // Up to 60 points for high completion rates
    
    return Math.min(100, score);
  }

  private static calculateCommunicationScore(chatData: any[]): number {
    if (chatData.length === 0) return 0;

    const userMessages = chatData.filter(msg => msg.is_user_message);
    
    // Base score for engagement
    let score = Math.min(50, userMessages.length * 2); // Up to 50 points for 25+ messages
    
    // Bonus for substantial conversations (longer messages indicate comfort)
    const substantialMessages = userMessages.filter(msg => 
      msg.message_text.length > 50
    );
    score += Math.min(50, substantialMessages.length * 4); // Up to 50 points for quality conversations
    
    return Math.min(100, score);
  }

  private static calculateConsistencyBonus(journalData: any[], goalsData: any[], audioData: any[], chatData: any[]): number {
    const now = new Date();
    const weeks = 4;
    let consistencyScore = 0;

    for (let week = 0; week < weeks; week++) {
      const weekStart = new Date(now.getTime() - (week + 1) * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(now.getTime() - week * 7 * 24 * 60 * 60 * 1000);

      const weekActivity = {
        journal: journalData.filter(item => {
          const date = new Date(item.created_at);
          return date >= weekStart && date < weekEnd;
        }).length > 0,
        goals: goalsData.some(goal => 
          goal.goal_completions?.some((completion: any) => {
            const date = new Date(completion.completed_at);
            return date >= weekStart && date < weekEnd;
          })
        ),
        audio: audioData.filter(item => {
          const date = new Date(item.last_updated);
          return date >= weekStart && date < weekEnd;
        }).length > 0,
        chat: chatData.filter(item => {
          const date = new Date(item.created_at);
          return date >= weekStart && date < weekEnd;
        }).length > 0
      };

      // Points for having any activity in the week
      const activeCategories = Object.values(weekActivity).filter(Boolean).length;
      consistencyScore += activeCategories * 5; // Up to 20 points per week

      // Bonus for diverse activity in the same week
      if (activeCategories >= 3) consistencyScore += 5;
    }

    return Math.min(100, consistencyScore);
  }

  // Feedback methods
  private static getReflectionFeedback(score: number): string {
    if (score >= 80) return "Excellent self-reflection habits! You're actively processing your experiences.";
    if (score >= 60) return "Good journaling consistency. Regular reflection supports sexual wellness.";
    if (score >= 40) return "Some reflection happening. Consider more frequent journaling for deeper insights.";
    return "Journaling can help you understand your desires and experiences better.";
  }

  private static getProgressFeedback(score: number): string {
    if (score >= 80) return "Outstanding progress on your sexual wellness goals!";
    if (score >= 60) return "Good momentum on your goals. You're making meaningful progress.";
    if (score >= 40) return "Some goal progress. Consider setting achievable targets for consistent wins.";
    return "Setting and completing goals can boost confidence and sexual satisfaction.";
  }

  private static getLearningFeedback(score: number): string {
    if (score >= 80) return "Fantastic learning engagement! Knowledge enhances sexual confidence.";
    if (score >= 60) return "Good learning habits. Education is key to sexual empowerment.";
    if (score >= 40) return "Some learning happening. Explore more audio guides for deeper insights.";
    return "Learning about sexuality can improve satisfaction and communication.";
  }

  private static getCommunicationFeedback(score: number): string {
    if (score >= 80) return "Great communication engagement! Talking openly supports sexual wellness.";
    if (score >= 60) return "Good conversation habits. Communication is vital for sexual happiness.";
    if (score >= 40) return "Some communication happening. Regular check-ins with August can help.";
    return "Open communication about sexuality builds confidence and satisfaction.";
  }

  private static getConsistencyFeedback(score: number): string {
    if (score >= 80) return "Excellent consistency across all wellness activities!";
    if (score >= 60) return "Good regular engagement. Consistency builds lasting positive changes.";
    if (score >= 40) return "Some consistent patterns. Try to engage regularly for better results.";
    return "Regular engagement with sexual wellness practices compounds benefits over time.";
  }

  private static getDefaultScore(): SexualHappinessCalculation {
    return {
      totalScore: 25, // Starting baseline
      factors: {
        reflectionScore: 0,
        progressScore: 0,
        learningScore: 0,
        communicationScore: 0,
        consistencyBonus: 0
      },
      breakdown: {
        reflection: "Start journaling to build self-awareness and sexual confidence.",
        progress: "Set some sexual wellness goals to track your growth.",
        learning: "Explore our audio guides to expand your knowledge.",
        communication: "Chat with August to discuss your experiences openly.",
        consistency: "Regular engagement with sexual wellness practices creates lasting change."
      }
    };
  }

  /**
   * Save the calculated score to the database
   */
  static async saveScore(userId: string, score: number): Promise<void> {
    try {
      const { error } = await supabase
        .from("sexual_happiness_scores")
        .insert({
          user_id: userId,
          score: score,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error("Error saving sexual happiness score:", error);
      }
    } catch (error) {
      console.error("Error saving sexual happiness score:", error);
    }
  }
} 