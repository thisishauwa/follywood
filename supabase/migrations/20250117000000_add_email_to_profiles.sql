-- Add email column to profiles table
-- Migration: 20250117000000_add_email_to_profiles.sql

-- Add email column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Update existing profiles with email from auth.users
UPDATE public.profiles 
SET email = auth_users.email 
FROM auth.users AS auth_users 
WHERE public.profiles.id = auth_users.id 
AND public.profiles.email IS NULL;

-- Update the handle_new_user function to include email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'username',
    new.email
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions for the updated function
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, anon, authenticated, service_role; 