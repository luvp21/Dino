-- Add short, shareable room codes for lobbies
ALTER TABLE public.lobbies
ADD COLUMN IF NOT EXISTS room_code text;

-- Backfill existing rows so current lobbies also get a 6-char code
UPDATE public.lobbies
SET room_code = upper(substring(id::text from 1 for 6))
WHERE room_code IS NULL;

-- Index for fast lookup when joining by code
CREATE INDEX IF NOT EXISTS idx_lobbies_room_code ON public.lobbies (room_code);
CREATE INDEX IF NOT EXISTS idx_lobbies_status_room_code ON public.lobbies (status, room_code);