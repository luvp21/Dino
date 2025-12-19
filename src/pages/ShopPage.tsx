import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useGameStore } from '@/store/gameStore';
import { useAuth } from '@/hooks/useAuth';
import { PixelCard, PixelCardHeader, PixelCardTitle } from '@/components/ui/PixelCard';
import { PixelButton } from '@/components/ui/PixelButton';
import { toast } from 'sonner';
import { Coins, Star, Snowflake, Sparkles, Crown, Lock, Check, LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isGuestProfile, type SkinType, GAME_CONFIG } from '@/types/game';
import { DinoGameRenderer } from '@/game/DinoGameRenderer';
import { getSkinConfig } from '@/game/sprites/SkinConfig';

interface Skin {
  id: string;
  name: string;
  skin_key: string;
  description: string;
  price: number;
  is_premium: boolean;
  is_seasonal: boolean;
  season_name: string | null;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  available_from: string | null;
  available_until: string | null;
}

export default function ShopPage() {
  const { profile, profileId, setSkin, currentSkin, getCurrency, purchaseSkin, getOwnedSkins } = useGameStore();
  const { isAuthenticated } = useAuth();
  const [skins, setSkins] = useState<Skin[]>([]);
  const [ownedSkins, setOwnedSkins] = useState<string[]>([]);
  const [coins, setCoins] = useState(0);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  // Check if user is guest
  const isGuest = profile ? isGuestProfile(profile) : true;

  const loadShopData = useCallback(async () => {
    setLoading(true);
    try {
      // Load all skins
      const { data: skinsData } = await supabase
        .from('skins')
        .select('*')
        .order('price', { ascending: true });

      if (skinsData) {
        setSkins(skinsData as Skin[]);
      }

      // Only load owned skins and currency for authenticated users
      if (!isGuest && profileId && isAuthenticated) {
        // Fetch owned skins from backend
        const owned = await getOwnedSkins();
        setOwnedSkins(owned);

        // Fetch currency from backend (NEVER trust client-side values)
        const currency = await getCurrency();
        setCoins(currency);
      } else {
        // Guests have no currency or owned skins
        setOwnedSkins([]);
        setCoins(0);
      }
    } catch (error) {
      console.error('Error loading shop data:', error);
    }
    setLoading(false);
  }, [profileId, isAuthenticated, isGuest, getCurrency, getOwnedSkins]);

  useEffect(() => {
    loadShopData();
  }, [loadShopData]);

  const handlePurchase = async (skin: Skin) => {
    // Guard: Only authenticated users can purchase
    if (isGuest || !isAuthenticated) {
      toast.error('Please login to purchase skins');
      return;
    }

    if (!profileId) {
      toast.error('Please create a profile first');
      return;
    }

    setPurchasing(skin.id);
    try {
      // Use store method which guards against guest usage
      const success = await purchaseSkin(skin.id);

      if (success) {
        toast.success(`Purchased ${skin.name}!`);
        // Reload data from backend
        await loadShopData();
      } else {
        toast.error('Purchase failed - check your coins');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Purchase failed';
      toast.error(message);
    }
    setPurchasing(null);
  };

  const handleEquip = (skinKey: string) => {
    // Both guests and users can equip skins (visual only)
    setSkin(skinKey);
    toast.success(`Equipped ${skinKey.toUpperCase()}`);
  };

  const isOwned = (skinId: string) => ownedSkins.includes(skinId);
  const isEquipped = (skinKey: string) => currentSkin === skinKey;

  const isAvailable = (skin: Skin) => {
    if (!skin.is_seasonal || !skin.available_from || !skin.available_until) return true;
    const now = new Date();
    return now >= new Date(skin.available_from) && now <= new Date(skin.available_until);
  };

  const regularSkins = skins.filter(s => !s.is_seasonal);
  const seasonalSkins = skins.filter(s => s.is_seasonal);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-xl font-pixel animate-pulse">LOADING SHOP...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Guest Warning Banner */}
      {isGuest && (
        <PixelCard className="border-yellow-500 bg-yellow-500/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LogIn className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-[12px] font-pixel text-yellow-500">LOGIN TO EARN COINS AND UNLOCK SKINS</p>
                <p className="text-[8px] text-muted-foreground">
                  Guest players cannot earn or spend currency. Login to save progress and unlock skins!
                </p>
              </div>
            </div>
            <Link to="/auth">
              <PixelButton variant="primary" size="sm">
                LOGIN
              </PixelButton>
            </Link>
          </div>
        </PixelCard>
      )}

      {/* Header with Coins */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-[16px] md:text-[20px]">SKIN SHOP</h1>
          <p className="text-[8px] text-muted-foreground">
            {isGuest
              ? 'LOGIN TO EARN COINS BY PLAYING • 1 COIN PER 100 DISTANCE'
              : 'EARN COINS BY PLAYING • 1 COIN PER 100 DISTANCE'
            }
          </p>
        </div>
        <div className={cn(
          "flex items-center gap-2 px-4 py-2 bg-card border-2",
          isGuest ? "border-muted-foreground opacity-50" : "border-primary"
        )}>
          <Coins className="w-5 h-5 text-yellow-500" />
          <span className="text-[16px] font-pixel text-primary">
            {isGuest ? '0' : coins}
          </span>
          {isGuest && (
            <span className="text-[6px] text-muted-foreground">(GUEST)</span>
          )}
        </div>
      </div>

      {/* Seasonal Skins Section */}
      {seasonalSkins.length > 0 && (
        <PixelCard className="border-purple-500">
          <PixelCardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <PixelCardTitle>LIMITED EDITION</PixelCardTitle>
            </div>
          </PixelCardHeader>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {seasonalSkins.map((skin) => (
              <SkinCard
                key={skin.id}
                skin={skin}
                isOwned={isOwned(skin.id)}
                isEquipped={isEquipped(skin.skin_key)}
                isAvailable={isAvailable(skin)}
                canAfford={!isGuest && coins >= skin.price}
                isGuest={isGuest}
                purchasing={purchasing === skin.id}
                onPurchase={() => handlePurchase(skin)}
                onEquip={() => handleEquip(skin.skin_key)}
              />
            ))}
          </div>
        </PixelCard>
      )}

      {/* Regular Skins Section */}
      <PixelCard>
        <PixelCardHeader>
          <PixelCardTitle>ALL SKINS</PixelCardTitle>
        </PixelCardHeader>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {regularSkins.map((skin) => (
            <SkinCard
              key={skin.id}
              skin={skin}
              isOwned={isOwned(skin.id) || skin.price === 0}
              isEquipped={isEquipped(skin.skin_key)}
              isAvailable={true}
              canAfford={!isGuest && coins >= skin.price}
              isGuest={isGuest}
              purchasing={purchasing === skin.id}
              onPurchase={() => handlePurchase(skin)}
              onEquip={() => handleEquip(skin.skin_key)}
            />
          ))}
        </div>
      </PixelCard>

      {/* How to Earn */}
      <PixelCard className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Coins className="w-4 h-4 text-yellow-500" />
          <span className="text-[10px] font-pixel">HOW TO EARN COINS</span>
        </div>
        <p className="text-[8px] text-muted-foreground">
          {isGuest
            ? 'LOGIN TO EARN COINS! PLAY GAMES TO EARN 1 COIN FOR EVERY 100 DISTANCE TRAVELED. THE HIGHER YOUR SCORE, THE MORE COINS YOU EARN!'
            : 'PLAY GAMES TO EARN COINS! YOU GET 1 COIN FOR EVERY 100 DISTANCE TRAVELED. THE HIGHER YOUR SCORE, THE MORE COINS YOU EARN!'
          }
        </p>
      </PixelCard>
    </div>
  );
}

// Skin Preview Component - uses preview image if available, otherwise renders canvas
const SkinPreview: React.FC<{ skinKey: string }> = ({ skinKey }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<DinoGameRenderer | null>(null);
  const skin = skinKey as SkinType;
  const config = getSkinConfig(skin);

  // Always call hooks in the same order
  useEffect(() => {
    // Only render canvas if no preview image is provided
    if (config.previewImage || !canvasRef.current) return;

    if (!rendererRef.current) {
      rendererRef.current = new DinoGameRenderer(canvasRef.current, skin);
    } else {
      rendererRef.current.setSkin(skin);
    }

    rendererRef.current.renderStartScreen(skin);
  }, [skinKey, skin, config.previewImage]);

  // If preview image is provided, use it instead of canvas rendering
  if (config.previewImage) {
    return (
      <img
        src={config.previewImage}
        alt={`${skinKey} skin preview`}
        className="w-full h-full object-contain"
        style={{
          aspectRatio: `${GAME_CONFIG.CANVAS_WIDTH}/${GAME_CONFIG.CANVAS_HEIGHT}`,
          imageRendering: 'pixelated',
        }}
      />
    );
  }

  // Otherwise, render using the game renderer
  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{
        aspectRatio: `${GAME_CONFIG.CANVAS_WIDTH}/${GAME_CONFIG.CANVAS_HEIGHT}`,
        height: "auto",
        imageRendering: 'pixelated',
      }}
    />
  );
};

function SkinCard({
  skin,
  isOwned,
  isEquipped,
  isAvailable,
  canAfford,
  isGuest,
  purchasing,
  onPurchase,
  onEquip,
}: {
  skin: Skin;
  isOwned: boolean;
  isEquipped: boolean;
  isAvailable: boolean;
  canAfford: boolean;
  isGuest: boolean;
  purchasing: boolean;
  onPurchase: () => void;
  onEquip: () => void;
}) {
  return (
    <div
      className={cn(
        'relative p-3 border-2 transition-all',
        RARITY_COLORS[skin.rarity],
        RARITY_GLOW[skin.rarity],
        isEquipped && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
        !isAvailable && 'opacity-50',
        isGuest && skin.price > 0 && !isOwned && 'opacity-60'
      )}
    >
      {/* Rarity Badge */}
      <div className="absolute top-1 right-1">
        {skin.rarity === 'legendary' && <Crown className="w-4 h-4 text-yellow-500" />}
        {skin.rarity === 'epic' && <Star className="w-4 h-4 text-purple-500" />}
        {skin.is_seasonal && <Snowflake className="w-4 h-4 text-blue-400" />}
      </div>

      {/* Guest Lock Overlay */}
      {isGuest && skin.price > 0 && !isOwned && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
          <div className="text-center">
            <Lock className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-[8px] text-muted-foreground">LOGIN REQUIRED</p>
          </div>
        </div>
      )}

      {/* Skin Preview */}
      <div className="w-full aspect-video mb-3 rounded overflow-hidden border-2 border-border bg-background">
        <SkinPreview skinKey={skin.skin_key} />
      </div>

      {/* Skin Info */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-pixel">{skin.name.toUpperCase()}</span>
          {skin.price > 0 && !isOwned && (
            <div className="flex items-center gap-1">
              <Coins className="w-3 h-3 text-yellow-500" />
              <span className="text-[8px]">{skin.price}</span>
            </div>
          )}
        </div>

        <p className="text-[6px] text-muted-foreground line-clamp-2">
          {skin.description}
        </p>

        {skin.season_name && (
          <span className="inline-block text-[6px] px-1 py-0.5 bg-purple-500/20 text-purple-400 rounded">
            {skin.season_name}
          </span>
        )}

        {/* Action Button */}
        <div className="pt-2">
          {!isAvailable ? (
            <PixelButton size="sm" variant="outline" disabled className="w-full">
              <Lock className="w-3 h-3 mr-1" />
              UNAVAILABLE
            </PixelButton>
          ) : isEquipped ? (
            <PixelButton size="sm" variant="outline" disabled className="w-full">
              <Check className="w-3 h-3 mr-1" />
              EQUIPPED
            </PixelButton>
          ) : isOwned ? (
            <PixelButton size="sm" variant="primary" onClick={onEquip} className="w-full">
              EQUIP
            </PixelButton>
          ) : isGuest ? (
            <PixelButton size="sm" variant="outline" disabled className="w-full">
              <Lock className="w-3 h-3 mr-1" />
              LOGIN TO BUY
            </PixelButton>
          ) : (
            <PixelButton
              size="sm"
              variant={canAfford ? 'primary' : 'outline'}
              onClick={onPurchase}
              disabled={!canAfford || purchasing}
              className="w-full"
            >
              {purchasing ? 'BUYING...' : canAfford ? 'BUY' : 'NOT ENOUGH'}
            </PixelButton>
          )}
        </div>
      </div>
    </div>
  );
}

const RARITY_COLORS = {
  common: 'border-muted-foreground',
  rare: 'border-blue-500',
  epic: 'border-purple-500',
  legendary: 'border-yellow-500',
};

const RARITY_GLOW = {
  common: '',
  rare: 'shadow-blue-500/20',
  epic: 'shadow-purple-500/30',
  legendary: 'shadow-yellow-500/40 animate-pulse',
};
