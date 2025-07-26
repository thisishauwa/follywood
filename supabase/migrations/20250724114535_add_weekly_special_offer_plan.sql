-- Add weekly special offer plan for new users
-- This plan costs N500 for 1 week and is designed as a trial offer

-- Insert the new weekly special offer plan and regular weekly plan
INSERT INTO public.subscription_plans (
  plan_code, 
  name, 
  description, 
  amount, 
  currency, 
  interval,
  is_active
) VALUES 
  (
    'PLN_u95oh7sg982z9yi',
    'Weekly Special Offer',
    'Special introductory offer - N500 for 1 week access, then auto-renews to selected plan',
    50000, -- 500 NGN in kobo (500 * 100)
    'NGN',
    'weekly',
    true
  ),
  (
    'PLN_weekly_regular',
    'Weekly Premium',
    'Full access to all features with weekly billing',
    74975, -- ~750 NGN in kobo (monthly/4)
    'NGN',
    'weekly',
    true
  )
ON CONFLICT (plan_code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  amount = EXCLUDED.amount,
  currency = EXCLUDED.currency,
  interval = EXCLUDED.interval,
  is_active = EXCLUDED.is_active;

-- Add columns to subscriptions table to support special offer tracking
DO $$ 
BEGIN
    -- Add is_special_offer column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'subscriptions' AND column_name = 'is_special_offer') THEN
        ALTER TABLE public.subscriptions ADD COLUMN is_special_offer BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add original_plan_id column to track what plan user will upgrade to after trial
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'subscriptions' AND column_name = 'original_plan_id') THEN
        ALTER TABLE public.subscriptions ADD COLUMN original_plan_id UUID REFERENCES public.subscription_plans(id);
    END IF;
    
    -- Add offer_type column to track different types of offers
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'subscriptions' AND column_name = 'offer_type') THEN
        ALTER TABLE public.subscriptions ADD COLUMN offer_type TEXT;
    END IF;
END $$;

-- Create index for special offer queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_special_offer ON public.subscriptions(is_special_offer, offer_type);

-- Add comment to document the special offer flow
COMMENT ON COLUMN public.subscriptions.is_special_offer IS 'Indicates if this subscription started with a special offer (e.g., weekly trial)';
COMMENT ON COLUMN public.subscriptions.original_plan_id IS 'The plan ID that the user will be upgraded to after the special offer period ends';
COMMENT ON COLUMN public.subscriptions.offer_type IS 'Type of special offer (e.g., weekly_trial, student_discount, etc.)';
