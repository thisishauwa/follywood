import { supabase } from './supabase';

export interface SubscriptionPlan {
  id: string;
  plan_code: string;
  name: string;
  description: string;
  amount: number;
  currency: string;
  interval: string;
  is_active: boolean;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  paystack_subscription_code: string;
  paystack_customer_code?: string;
  status: 'active' | 'cancelled' | 'paused' | 'expired' | 'pending';
  amount: number;
  currency: string;
  start_date?: string;
  end_date?: string;
  next_payment_date?: string;
  created_at: string;
  updated_at: string;
  // Special offer fields
  is_special_offer?: boolean;
  original_plan_id?: string;
  offer_type?: string;
}

export class SubscriptionService {
  /**
   * Get all active subscription plans
   */
  static async getActivePlans(): Promise<SubscriptionPlan[]> {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('amount', { ascending: true });

    if (error) {
      console.error('Error fetching subscription plans:', error);
      throw new Error('Failed to fetch subscription plans');
    }

    return data || [];
  }

  /**
   * Get user's current subscription
   */
  static async getUserSubscription(userId: string): Promise<Subscription | null> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No subscription found
        return null;
      }
      console.error('Error fetching user subscription:', error);
      throw new Error('Failed to fetch user subscription');
    }

    return data;
  }

  /**
   * Create a new subscription record
   */
  static async createSubscription(subscriptionData: {
    user_id: string;
    plan_id: string;
    paystack_subscription_code: string;
    paystack_customer_code?: string;
    amount: number;
    currency: string;
    status?: 'active' | 'cancelled' | 'paused' | 'expired' | 'pending';
  }): Promise<Subscription> {
    const { data, error } = await supabase
      .from('subscriptions')
      .insert({
        ...subscriptionData,
        status: subscriptionData.status || 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating subscription:', error);
      throw new Error('Failed to create subscription');
    }

    return data;
  }

  /**
   * Update subscription status (usually called from webhook)
   */
  static async updateSubscriptionStatus(
    paystackSubscriptionCode: string,
    updates: {
      status?: 'active' | 'cancelled' | 'paused' | 'expired' | 'pending';
      start_date?: string;
      end_date?: string;
      next_payment_date?: string;
      paystack_customer_code?: string;
    }
  ): Promise<Subscription> {
    const { data, error } = await supabase
      .from('subscriptions')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('paystack_subscription_code', paystackSubscriptionCode)
      .select()
      .single();

    if (error) {
      console.error('Error updating subscription:', error);
      throw new Error('Failed to update subscription');
    }

    return data;
  }

  /**
   * Cancel a subscription
   */
  static async cancelSubscription(subscriptionId: string): Promise<void> {
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscriptionId);

    if (error) {
      console.error('Error cancelling subscription:', error);
      throw new Error('Failed to cancel subscription');
    }
  }

  /**
   * Check if user has an active subscription
   */
  static async hasActiveSubscription(userId: string): Promise<boolean> {
    const subscription = await this.getUserSubscription(userId);
    return subscription !== null && subscription.status === 'active';
  }

  /**
   * Get subscription plan by plan code
   */
  static async getPlanByCode(planCode: string): Promise<SubscriptionPlan | null> {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('plan_code', planCode)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No plan found
        return null;
      }
      console.error('Error fetching subscription plan:', error);
      throw new Error('Failed to fetch subscription plan');
    }

    return data;
  }

  /**
   * Get the weekly special offer plan
   */
  static async getWeeklySpecialOfferPlan(): Promise<SubscriptionPlan | null> {
    return this.getPlanByCode('PLN_u95oh7sg982z9yi');
  }

  /**
   * Get the regular weekly plan
   */
  static async getRegularWeeklyPlan(): Promise<SubscriptionPlan | null> {
    return this.getPlanByCode('PLN_weekly_regular');
  }

  /**
   * Check if user is eligible for special offer (hasn't subscribed before)
   */
  static async isEligibleForSpecialOffer(userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('id, status')
      .eq('user_id', userId)
      .limit(1);

    if (error) {
      console.error('Error checking special offer eligibility:', error);
      // On error, return false for safety
      return false;
    }

    // User is eligible ONLY if they have never had ANY subscription (including cancelled ones)
    const hasAnySubscription = data && data.length > 0;
    console.log(`[SubscriptionService] User ${userId} has existing subscriptions: ${hasAnySubscription}`);
    
    return !hasAnySubscription;
  }

  /**
   * Create a special offer subscription
   */
  static async createSpecialOfferSubscription(subscriptionData: {
    user_id: string;
    plan_id: string;
    paystack_subscription_code: string;
    paystack_customer_code?: string;
    amount: number;
    currency: string;
    original_plan_id: string; // The monthly plan they'll upgrade to
    status?: 'active' | 'cancelled' | 'paused' | 'expired' | 'pending';
  }): Promise<Subscription> {
    const { data, error } = await supabase
      .from('subscriptions')
      .insert({
        ...subscriptionData,
        status: subscriptionData.status || 'pending',
        is_special_offer: true,
        offer_type: 'weekly_trial',
        original_plan_id: subscriptionData.original_plan_id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating special offer subscription:', error);
      throw new Error('Failed to create special offer subscription');
    }

    return data;
  }

  /**
   * Upgrade special offer subscription to monthly plan
   * This is typically called from a webhook when the weekly trial ends
   */
  static async upgradeSpecialOfferToMonthly(
    subscriptionId: string,
    newPaystackSubscriptionCode: string
  ): Promise<Subscription> {
    // First get the current subscription to get the original plan ID
    const { data: currentSub, error: fetchError } = await supabase
      .from('subscriptions')
      .select('original_plan_id')
      .eq('id', subscriptionId)
      .eq('is_special_offer', true)
      .single();

    if (fetchError) {
      console.error('Error fetching subscription for upgrade:', fetchError);
      throw new Error('Failed to fetch subscription for upgrade');
    }

    if (!currentSub.original_plan_id) {
      throw new Error('No original plan ID found for special offer subscription');
    }

    // Get the monthly plan details
    const { data: monthlyPlan, error: planError } = await supabase
      .from('subscription_plans')
      .select('amount')
      .eq('id', currentSub.original_plan_id)
      .single();

    if (planError) {
      console.error('Error fetching monthly plan:', planError);
      throw new Error('Failed to fetch monthly plan details');
    }

    // Update the subscription to the monthly plan
    const { data, error } = await supabase
      .from('subscriptions')
      .update({
        plan_id: currentSub.original_plan_id,
        paystack_subscription_code: newPaystackSubscriptionCode,
        amount: monthlyPlan.amount,
        is_special_offer: false,
        offer_type: null,
        original_plan_id: null,
        status: 'active',
      })
      .eq('id', subscriptionId)
      .select()
      .single();

    if (error) {
      console.error('Error upgrading special offer subscription:', error);
      throw new Error('Failed to upgrade special offer subscription');
    }

    return data;
  }

  /**
   * Get subscriptions that are due for upgrade from special offer to monthly
   */
  static async getSpecialOffersReadyForUpgrade(): Promise<Subscription[]> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('is_special_offer', true)
      .eq('offer_type', 'weekly_trial')
      .eq('status', 'active')
      .lte('created_at', oneWeekAgo.toISOString());

    if (error) {
      console.error('Error fetching special offers ready for upgrade:', error);
      throw new Error('Failed to fetch special offers ready for upgrade');
    }

    return data || [];
  }
} 