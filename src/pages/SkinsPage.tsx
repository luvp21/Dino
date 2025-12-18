import React, { useRef, useEffect } from 'react';
import { PixelCard, PixelCardHeader, PixelCardTitle } from '@/components/ui/PixelCard';
import { PixelButton } from '@/components/ui/PixelButton';
import { useGameStore } from '@/store/gameStore';
import { DinoGameRenderer } from '@/game/DinoGameRenderer';
import { GAME_CONFIG, type SkinType } from '@/types/game';

interface SkinOption {
  id: SkinType;
  name: string;
  description: string;
  unlocked: boolean;
  requirement?: string;
}

const SKINS: SkinOption[] = [
  {
    id: 'classic',
    name: 'CLASSIC',
    description: 'THE ORIGINAL CHROME OFFLINE LOOK',
    unlocked: true,
  },
  {
    id: 'inverted',
    name: 'INVERTED',
    description: 'DARK MODE FOR NIGHT RUNNERS',
    unlocked: true,
  },
  {
    id: 'winter',
    name: 'WINTER',
    description: 'SNOWY THEME WITH SCARF & SNOWFLAKES',
    unlocked: true,
  },
  {
    id: 'phosphor',
    name: 'PHOSPHOR',
    description: 'GREEN TERMINAL AESTHETIC',
    unlocked: true,
    requirement: 'REACH 1000 DISTANCE',
  },
  {
    id: 'amber',
    name: 'AMBER',
    description: 'VINTAGE MONITOR VIBES',
    unlocked: true,
    requirement: 'PLAY 10 GAMES',
  },
  {
    id: 'crt',
    name: 'CRT',
    description: 'OLD SCHOOL SCANLINES',
    unlocked: true,
    requirement: 'REACH 5000 DISTANCE',
  },
  {
    id: 'neon',
    name: 'NEON',
    description: 'CYBERPUNK GLOW EFFECTS',
    unlocked: true,
  },
  {
    id: 'golden',
    name: 'GOLDEN',
    description: 'LUXURIOUS GOLD FINISH',
    unlocked: true,
  },
];

const SkinPreview: React.FC<{ skin: SkinType; isActive: boolean }> = ({ skin, isActive }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<DinoGameRenderer | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    if (!rendererRef.current) {
      rendererRef.current = new DinoGameRenderer(canvasRef.current, skin);
    } else {
      rendererRef.current.setSkin(skin);
    }

    rendererRef.current.renderStartScreen(skin);
  }, [skin]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-auto ${isActive ? 'ring-4 ring-foreground' : ''}`}
      style={{ 
        aspectRatio: '800/200',
        imageRendering: 'pixelated',
      }}
    />
  );
};

const SkinsPage: React.FC = () => {
  const { profile, currentSkin, setSkin } = useGameStore();

  const handleSelectSkin = (skinId: SkinType) => {
    setSkin(skinId);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-[16px] md:text-[20px]">SKINS</h1>
        <p className="text-[8px] text-muted-foreground">
          CUSTOMIZE YOUR DINO EXPERIENCE
        </p>
        <p className="text-[6px] text-muted-foreground">
          SKINS ARE PURELY VISUAL - NO GAMEPLAY ADVANTAGE
        </p>
      </div>

      {/* Current Skin Preview */}
      <PixelCard>
        <PixelCardHeader>
          <PixelCardTitle>CURRENT SKIN: {currentSkin.toUpperCase()}</PixelCardTitle>
        </PixelCardHeader>
        <SkinPreview skin={currentSkin} isActive={true} />
      </PixelCard>

      {/* Skin Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SKINS.map((skinOption) => {
          const isActive = currentSkin === skinOption.id;
          const isUnlocked = skinOption.unlocked;

          return (
            <PixelCard
              key={skinOption.id}
              className={`${isActive ? 'ring-2 ring-foreground' : ''} ${
                !isUnlocked ? 'opacity-50' : ''
              }`}
            >
              <PixelCardHeader>
                <div className="flex items-center justify-between">
                  <PixelCardTitle>{skinOption.name}</PixelCardTitle>
                  {isActive && (
                    <span className="text-[8px] px-2 py-1 bg-primary text-primary-foreground">
                      ACTIVE
                    </span>
                  )}
                </div>
              </PixelCardHeader>

              <div className="space-y-3">
                <p className="text-[8px] text-muted-foreground">
                  {skinOption.description}
                </p>

                <div className="border-2 border-border overflow-hidden">
                  <SkinPreview skin={skinOption.id} isActive={isActive} />
                </div>

                {isUnlocked ? (
                  <PixelButton
                    variant={isActive ? 'primary' : 'outline'}
                    size="sm"
                    className="w-full"
                    onClick={() => handleSelectSkin(skinOption.id)}
                    disabled={isActive}
                  >
                    {isActive ? 'EQUIPPED' : 'SELECT'}
                  </PixelButton>
                ) : (
                  <div className="text-center">
                    <span className="text-[8px] text-muted-foreground">
                      LOCKED: {skinOption.requirement}
                    </span>
                  </div>
                )}
              </div>
            </PixelCard>
          );
        })}
      </div>

      {/* SaaS Teaser */}
      <PixelCard className="text-center">
        <PixelCardHeader>
          <PixelCardTitle>MORE SKINS COMING</PixelCardTitle>
        </PixelCardHeader>
        <p className="text-[8px] text-muted-foreground mb-4">
          SEASONAL THEMES, LIMITED EDITIONS, AND MORE.
          SUPPORT THE GAME TO UNLOCK PREMIUM SKINS.
        </p>
        <div className="flex justify-center gap-4 text-[20px] text-muted-foreground">
          <span title="Coming Soon">◇</span>
          <span title="Coming Soon">◈</span>
          <span title="Coming Soon">◎</span>
          <span title="Coming Soon">◐</span>
        </div>
      </PixelCard>
    </div>
  );
};

export default SkinsPage;
