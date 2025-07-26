-- Update annual subscription plan price to N15,000
-- This migration updates the existing annual plan to the new pricing

UPDATE public.subscription_plans 
SET 
  amount = 1500000, -- 15,000 NGN in kobo (15,000 * 100)
  description = 'Full access to all features with yearly billing (save 37%)'
WHERE plan_code = 'PLN_c54lr7g99c0c8xl' 
  AND interval = 'yearly';

-- Verify the update was successful
DO $$
DECLARE
    updated_plan RECORD;
BEGIN
    SELECT * INTO updated_plan 
    FROM public.subscription_plans 
    WHERE plan_code = 'PLN_c54lr7g99c0c8xl';
    
    IF updated_plan.amount = 1500000 THEN
        RAISE NOTICE 'Annual plan price successfully updated to N15,000 (1500000 kobo)';
    ELSE
        RAISE EXCEPTION 'Failed to update annual plan price. Current amount: %', updated_plan.amount;
    END IF;
END $$;
