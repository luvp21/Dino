-- Migration: Remove restrictive skin CHECK constraint
-- This allows any skin key from the skins table to be used in profiles
-- Unknown skins will fall back to 'classic' in the application code

-- Remove the old CHECK constraint that limited skins to a hardcoded list
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS valid_skin;

-- The skin column is now just TEXT with no constraints
-- The application will validate skins exist in the skins table
-- and fall back to 'classic' for unknown skins

