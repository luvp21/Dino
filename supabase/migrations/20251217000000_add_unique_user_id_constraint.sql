-- Migration: Add unique constraint on user_id to prevent duplicate profiles
--
-- This ensures that only ONE profile can exist per authenticated user.
-- The constraint prevents race conditions and duplicate profile creation.
--
-- Note: This constraint only applies to authenticated users (user_id IS NOT NULL).
-- Guest profiles (user_id IS NULL) are not affected by this constraint.

-- First, remove any duplicate profiles (keep the oldest one for each user_id)
-- This is a safety measure in case duplicates already exist
DO $$
DECLARE
  duplicate_record RECORD;
BEGIN
  FOR duplicate_record IN
    SELECT user_id, array_agg(id ORDER BY created_at) as profile_ids
    FROM public.profiles
    WHERE user_id IS NOT NULL
    GROUP BY user_id
    HAVING COUNT(*) > 1
  LOOP
    -- Delete all but the first (oldest) profile for this user
    DELETE FROM public.profiles
    WHERE user_id = duplicate_record.user_id
      AND id != duplicate_record.profile_ids[1];

    RAISE NOTICE 'Removed duplicate profiles for user_id: %', duplicate_record.user_id;
  END LOOP;
END $$;

-- Create unique index on user_id (only for non-null values)
-- This prevents multiple profiles for the same authenticated user
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_user_id_unique
ON public.profiles(user_id)
WHERE user_id IS NOT NULL;

-- Add a comment explaining the constraint
COMMENT ON INDEX idx_profiles_user_id_unique IS
'Ensures only one profile per authenticated user. Guest profiles (user_id IS NULL) are not constrained.';






