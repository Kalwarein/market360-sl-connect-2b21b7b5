-- Add comprehensive personal information fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS gender TEXT,
ADD COLUMN IF NOT EXISTS street_address TEXT,
ADD COLUMN IF NOT EXISTS school_name TEXT,
ADD COLUMN IF NOT EXISTS university_name TEXT,
ADD COLUMN IF NOT EXISTS occupation TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS interests TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Add comment describing the purpose of new fields
COMMENT ON COLUMN public.profiles.full_name IS 'User complete full name';
COMMENT ON COLUMN public.profiles.date_of_birth IS 'User date of birth';
COMMENT ON COLUMN public.profiles.gender IS 'User gender';
COMMENT ON COLUMN public.profiles.street_address IS 'Detailed street address';
COMMENT ON COLUMN public.profiles.school_name IS 'School(s) attended';
COMMENT ON COLUMN public.profiles.university_name IS 'University/College attended';
COMMENT ON COLUMN public.profiles.occupation IS 'Current occupation/profession';
COMMENT ON COLUMN public.profiles.bio IS 'Personal bio/about me section';
COMMENT ON COLUMN public.profiles.interests IS 'Array of user interests/hobbies';
COMMENT ON COLUMN public.profiles.onboarding_completed IS 'Whether user has completed onboarding flow';