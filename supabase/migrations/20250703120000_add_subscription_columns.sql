-- Add missing subscription tracking columns
-- These are essential for proper subscription management

DO $$ 
BEGIN
    -- Add current_period_start column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'subscriptions' AND column_name = 'current_period_start') THEN
        ALTER TABLE public.subscriptions ADD COLUMN current_period_start TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Add current_period_end column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'subscriptions' AND column_name = 'current_period_end') THEN
        ALTER TABLE public.subscriptions ADD COLUMN current_period_end TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Add cancelled_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'subscriptions' AND column_name = 'cancelled_at') THEN
        ALTER TABLE public.subscriptions ADD COLUMN cancelled_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Add paystack_plan_code column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'subscriptions' AND column_name = 'paystack_plan_code') THEN
        ALTER TABLE public.subscriptions ADD COLUMN paystack_plan_code TEXT;
    END IF;
    
    -- Add trial_start column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'subscriptions' AND column_name = 'trial_start') THEN
        ALTER TABLE public.subscriptions ADD COLUMN trial_start TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Add trial_end column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'subscriptions' AND column_name = 'trial_end') THEN
        ALTER TABLE public.subscriptions ADD COLUMN trial_end TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Create indexes for better performance on subscription queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_current_period ON subscriptions(current_period_start, current_period_end);
CREATE INDEX IF NOT EXISTS idx_subscriptions_paystack_plan ON subscriptions(paystack_plan_code);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_payment ON subscriptions(next_payment_date); 