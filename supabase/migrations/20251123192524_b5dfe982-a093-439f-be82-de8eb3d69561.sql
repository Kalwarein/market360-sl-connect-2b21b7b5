-- Add onboarding tour completion tracking to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS onboarding_tour_completed BOOLEAN DEFAULT FALSE;