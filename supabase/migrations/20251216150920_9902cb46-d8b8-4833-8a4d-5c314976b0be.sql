-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- PROFILES TABLE - Persistent player data
-- =============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  skin TEXT NOT NULL DEFAULT 'classic',
  total_matches INTEGER NOT NULL DEFAULT 0,
  best_distance INTEGER NOT NULL DEFAULT 0,
  average_distance INTEGER NOT NULL DEFAULT 0,
  total_playtime INTEGER NOT NULL DEFAULT 0,
  is_guest BOOLEAN NOT NULL DEFAULT false,
  session_id TEXT, -- For guest identification
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_skin CHECK (skin IN ('classic', 'inverted', 'phosphor', 'amber', 'crt'))
);

-- Create index for faster lookups
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_session_id ON public.profiles(session_id);
CREATE UNIQUE INDEX idx_profiles_username ON public.profiles(LOWER(username));

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (
    auth.uid() = user_id OR 
    (is_guest = true AND session_id IS NOT NULL)
  );

CREATE POLICY "Anyone can create a profile"
  ON public.profiles FOR INSERT
  WITH CHECK (true);

-- =============================================
-- LOBBIES TABLE - Game rooms
-- =============================================
CREATE TABLE public.lobbies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'waiting',
  seed BIGINT NOT NULL DEFAULT floor(random() * 2147483647)::bigint,
  max_players INTEGER NOT NULL DEFAULT 4,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  finished_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT valid_status CHECK (status IN ('waiting', 'starting', 'in-game', 'finished')),
  CONSTRAINT valid_max_players CHECK (max_players >= 2 AND max_players <= 8)
);

-- Create index for active lobbies
CREATE INDEX idx_lobbies_status ON public.lobbies(status) WHERE status IN ('waiting', 'in-game');

-- Enable RLS
ALTER TABLE public.lobbies ENABLE ROW LEVEL SECURITY;

-- Policies for lobbies
CREATE POLICY "Lobbies are viewable by everyone"
  ON public.lobbies FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create a lobby"
  ON public.lobbies FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Host can update their lobby"
  ON public.lobbies FOR UPDATE
  USING (true);

CREATE POLICY "Host can delete their lobby"
  ON public.lobbies FOR DELETE
  USING (true);

-- =============================================
-- LOBBY_PLAYERS TABLE - Players in lobbies
-- =============================================
CREATE TABLE public.lobby_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lobby_id UUID NOT NULL REFERENCES public.lobbies(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_ready BOOLEAN NOT NULL DEFAULT false,
  is_host BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(lobby_id, profile_id)
);

-- Indexes
CREATE INDEX idx_lobby_players_lobby ON public.lobby_players(lobby_id);
CREATE INDEX idx_lobby_players_profile ON public.lobby_players(profile_id);

-- Enable RLS
ALTER TABLE public.lobby_players ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Lobby players viewable by everyone"
  ON public.lobby_players FOR SELECT
  USING (true);

CREATE POLICY "Anyone can join a lobby"
  ON public.lobby_players FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Players can update their ready status"
  ON public.lobby_players FOR UPDATE
  USING (true);

CREATE POLICY "Players can leave lobbies"
  ON public.lobby_players FOR DELETE
  USING (true);

-- =============================================
-- GAME_RESULTS TABLE - Match outcomes
-- =============================================
CREATE TABLE public.game_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lobby_id UUID REFERENCES public.lobbies(id) ON DELETE SET NULL,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  distance INTEGER NOT NULL DEFAULT 0,
  score INTEGER NOT NULL DEFAULT 0,
  placement INTEGER NOT NULL DEFAULT 1,
  seed BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for leaderboard queries
CREATE INDEX idx_game_results_profile ON public.game_results(profile_id);
CREATE INDEX idx_game_results_distance ON public.game_results(distance DESC);
CREATE INDEX idx_game_results_created ON public.game_results(created_at DESC);

-- Enable RLS
ALTER TABLE public.game_results ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Game results viewable by everyone"
  ON public.game_results FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert game results"
  ON public.game_results FOR INSERT
  WITH CHECK (true);

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to update profile stats
CREATE OR REPLACE FUNCTION public.update_profile_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET 
    total_matches = total_matches + 1,
    best_distance = GREATEST(best_distance, NEW.distance),
    average_distance = (
      SELECT COALESCE(AVG(distance)::integer, 0)
      FROM public.game_results
      WHERE profile_id = NEW.profile_id
    ),
    updated_at = now()
  WHERE id = NEW.profile_id;
  
  RETURN NEW;
END;
$$;

-- Trigger to update profile stats when game result is inserted
CREATE TRIGGER on_game_result_insert
  AFTER INSERT ON public.game_results
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profile_stats();

-- Function to get leaderboard
CREATE OR REPLACE FUNCTION public.get_leaderboard(
  limit_count INTEGER DEFAULT 10,
  time_filter TEXT DEFAULT 'all-time'
)
RETURNS TABLE (
  rank BIGINT,
  profile_id UUID,
  username TEXT,
  skin TEXT,
  best_distance INTEGER,
  total_matches INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ROW_NUMBER() OVER (ORDER BY p.best_distance DESC) as rank,
    p.id as profile_id,
    p.username,
    p.skin,
    p.best_distance,
    p.total_matches
  FROM public.profiles p
  WHERE p.best_distance > 0
    AND (
      time_filter = 'all-time' OR
      (time_filter = 'weekly' AND p.updated_at > now() - INTERVAL '7 days')
    )
  ORDER BY p.best_distance DESC
  LIMIT limit_count;
END;
$$;

-- Function to find or create profile by session
CREATE OR REPLACE FUNCTION public.find_or_create_guest_profile(
  p_session_id TEXT,
  p_username TEXT,
  p_skin TEXT DEFAULT 'classic'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_id UUID;
BEGIN
  -- Try to find existing profile
  SELECT id INTO v_profile_id
  FROM public.profiles
  WHERE session_id = p_session_id AND is_guest = true;
  
  -- If not found, create new profile
  IF v_profile_id IS NULL THEN
    INSERT INTO public.profiles (username, skin, is_guest, session_id)
    VALUES (p_username, p_skin, true, p_session_id)
    RETURNING id INTO v_profile_id;
  END IF;
  
  RETURN v_profile_id;
END;
$$;

-- =============================================
-- ENABLE REALTIME
-- =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.lobbies;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lobby_players;