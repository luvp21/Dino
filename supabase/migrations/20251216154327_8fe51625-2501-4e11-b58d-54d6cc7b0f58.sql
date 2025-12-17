-- Add coins to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS coins INTEGER NOT NULL DEFAULT 0;

-- Create skins table for purchasable skins
CREATE TABLE public.skins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  skin_key TEXT NOT NULL UNIQUE,
  description TEXT,
  price INTEGER NOT NULL DEFAULT 0,
  is_premium BOOLEAN NOT NULL DEFAULT false,
  is_seasonal BOOLEAN NOT NULL DEFAULT false,
  season_name TEXT,
  available_from TIMESTAMP WITH TIME ZONE,
  available_until TIMESTAMP WITH TIME ZONE,
  rarity TEXT NOT NULL DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_skins table for purchased skins
CREATE TABLE public.user_skins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skin_id UUID NOT NULL REFERENCES public.skins(id) ON DELETE CASCADE,
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(profile_id, skin_id)
);

-- Enable RLS
ALTER TABLE public.skins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skins ENABLE ROW LEVEL SECURITY;

-- RLS policies for skins (everyone can view)
CREATE POLICY "Skins are viewable by everyone" ON public.skins FOR SELECT USING (true);

-- RLS policies for user_skins
CREATE POLICY "Users can view their own skins" ON public.user_skins FOR SELECT USING (true);
CREATE POLICY "Users can purchase skins" ON public.user_skins FOR INSERT WITH CHECK (true);

-- Insert default/free skins
INSERT INTO public.skins (name, skin_key, description, price, is_premium, rarity) VALUES
  ('Classic', 'classic', 'The original chrome dino look', 0, false, 'common'),
  ('Inverted', 'inverted', 'Dark mode dino', 0, false, 'common'),
  ('Phosphor', 'phosphor', 'Glowing green terminal vibes', 100, true, 'rare'),
  ('Amber', 'amber', 'Warm vintage amber display', 100, true, 'rare'),
  ('CRT', 'crt', 'Retro CRT monitor aesthetic', 150, true, 'rare');

-- Insert seasonal skins
INSERT INTO public.skins (name, skin_key, description, price, is_premium, is_seasonal, season_name, rarity, available_from, available_until) VALUES
  ('Winter Frost', 'winter', 'Icy blue winter wonderland', 250, true, true, 'Winter 2024', 'epic', '2024-12-01', '2025-02-28'),
  ('Neon Cyber', 'neon', 'Cyberpunk neon glow', 300, true, true, 'Cyber Season', 'epic', '2024-11-01', '2025-01-31'),
  ('Golden Legend', 'golden', 'Legendary golden dino', 500, true, true, 'Special Edition', 'legendary', NULL, NULL);

-- Function to purchase a skin
CREATE OR REPLACE FUNCTION public.purchase_skin(p_profile_id UUID, p_skin_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_skin RECORD;
  v_profile RECORD;
  v_now TIMESTAMP WITH TIME ZONE := now();
BEGIN
  -- Get skin info
  SELECT * INTO v_skin FROM public.skins WHERE id = p_skin_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Skin not found');
  END IF;
  
  -- Check if seasonal and available
  IF v_skin.is_seasonal AND v_skin.available_from IS NOT NULL AND v_skin.available_until IS NOT NULL THEN
    IF v_now < v_skin.available_from OR v_now > v_skin.available_until THEN
      RETURN jsonb_build_object('success', false, 'error', 'This seasonal skin is not currently available');
    END IF;
  END IF;
  
  -- Get profile info
  SELECT * INTO v_profile FROM public.profiles WHERE id = p_profile_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Profile not found');
  END IF;
  
  -- Check if already owned
  IF EXISTS (SELECT 1 FROM public.user_skins WHERE profile_id = p_profile_id AND skin_id = p_skin_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'You already own this skin');
  END IF;
  
  -- Check if enough coins
  IF v_profile.coins < v_skin.price THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not enough coins');
  END IF;
  
  -- Deduct coins
  UPDATE public.profiles SET coins = coins - v_skin.price WHERE id = p_profile_id;
  
  -- Add skin to user
  INSERT INTO public.user_skins (profile_id, skin_id) VALUES (p_profile_id, p_skin_id);
  
  RETURN jsonb_build_object('success', true, 'remaining_coins', v_profile.coins - v_skin.price);
END;
$$;

-- Function to award coins after a game
CREATE OR REPLACE FUNCTION public.award_coins(p_profile_id UUID, p_distance INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_coins_earned INTEGER;
BEGIN
  -- Calculate coins: 1 coin per 100 distance, minimum 1
  v_coins_earned := GREATEST(1, p_distance / 100);
  
  -- Update profile
  UPDATE public.profiles 
  SET coins = coins + v_coins_earned 
  WHERE id = p_profile_id;
  
  RETURN v_coins_earned;
END;
$$;