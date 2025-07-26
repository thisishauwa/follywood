-- Fix subscriptions table schema
-- Add missing columns if they don't exist

-- First, let's check if the table exists and add missing columns
DO $$ 
BEGIN
    -- Add amount column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'subscriptions' AND column_name = 'amount') THEN
        ALTER TABLE public.subscriptions ADD COLUMN amount INTEGER NOT NULL DEFAULT 0;
    END IF;
    
    -- Add currency column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'subscriptions' AND column_name = 'currency') THEN
        ALTER TABLE public.subscriptions ADD COLUMN currency TEXT NOT NULL DEFAULT 'NGN';
    END IF;
    
    -- Add start_date column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'subscriptions' AND column_name = 'start_date') THEN
        ALTER TABLE public.subscriptions ADD COLUMN start_date TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Add end_date column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'subscriptions' AND column_name = 'end_date') THEN
        ALTER TABLE public.subscriptions ADD COLUMN end_date TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Add next_payment_date column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'subscriptions' AND column_name = 'next_payment_date') THEN
        ALTER TABLE public.subscriptions ADD COLUMN next_payment_date TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'subscriptions' AND column_name = 'updated_at') THEN
        ALTER TABLE public.subscriptions ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- Remove the default constraint from amount since we want real amounts
ALTER TABLE public.subscriptions ALTER COLUMN amount DROP DEFAULT;

-- Make sure the table has the correct constraints
ALTER TABLE public.subscriptions 
DROP CONSTRAINT IF EXISTS subscriptions_status_check;

ALTER TABLE public.subscriptions 
ADD CONSTRAINT subscriptions_status_check 
CHECK (status IN ('active', 'cancelled', 'paused', 'expired', 'pending'));
