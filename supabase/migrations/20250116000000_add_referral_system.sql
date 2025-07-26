-- Add referral system to Talk to August
-- Migration: 20250116000000_add_referral_system.sql

-- Add referral columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Create referrals table to track referral relationships and status
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed')) DEFAULT 'pending',
  points_awarded INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(referrer_id, referred_id)
);

-- Enable RLS for referrals table
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for referrals table
DROP POLICY IF EXISTS "Users can view their own referrals" ON public.referrals;
CREATE POLICY "Users can view their own referrals" ON public.referrals
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

DROP POLICY IF EXISTS "Users can insert their own referrals" ON public.referrals;
CREATE POLICY "Users can insert their own referrals" ON public.referrals
  FOR INSERT WITH CHECK (auth.uid() = referrer_id OR auth.uid() = referred_id);

DROP POLICY IF EXISTS "Users can update their own referrals" ON public.referrals;
CREATE POLICY "Users can update their own referrals" ON public.referrals
  FOR UPDATE USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- Function to generate unique referral codes
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a 6-character alphanumeric code
    code := upper(substring(encode(gen_random_bytes(4), 'base64') from 1 for 6));
    -- Remove characters that might be confusing (0, O, I, 1)
    code := translate(code, '0OI1+/=', 'ABCDEFGH');
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE referral_code = code) INTO exists;
    
    -- If code doesn't exist, we can use it
    IF NOT exists THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to automatically generate referral code for existing users
CREATE OR REPLACE FUNCTION ensure_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  -- If referral_code is null, generate one
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := generate_referral_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically generate referral codes
DROP TRIGGER IF EXISTS ensure_referral_code_trigger ON public.profiles;
CREATE TRIGGER ensure_referral_code_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION ensure_referral_code();

-- Update existing users to have referral codes
UPDATE public.profiles 
SET referral_code = generate_referral_code() 
WHERE referral_code IS NULL;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION generate_referral_code() TO postgres, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION ensure_referral_code() TO postgres, anon, authenticated, service_role; 