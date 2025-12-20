import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PixelCard } from '@/components/ui/PixelCard';
import { PixelButton } from '@/components/ui/PixelButton';

export const SkinsSection: React.FC = () => {
  const navigate = useNavigate();

  // Placeholder skin cards
  const skins = [
    { id: 'classic', name: 'Classic', color: 'bg-foreground' },
    { id: 'red', name: 'Red Dino', color: 'bg-red-500' },
    { id: 'blue', name: 'Blue Dino', color: 'bg-blue-500' },
    { id: 'inverted', name: 'Inverted', color: 'bg-muted border-2 border-foreground' },
  ];

  return (
    <section className="py-12 md:py-16 bg-muted/30">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-[14px] md:text-[18px] font-pixel font-bold mb-4">
            Skins System
          </h2>
          <p className="text-[8px] md:text-[9px] text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Customize your dino with unique pixel art skins. Unlock new skins by
            playing games, earning coins, and reaching milestones. Each skin offers
            a fresh visual experience while maintaining the classic gameplay.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {skins.map((skin) => (
            <PixelCard
              key={skin.id}
              className="border border-border shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 cursor-pointer"
            >
              <div className="space-y-3">
                <div className={`w-full h-20 ${skin.color} border border-border flex items-center justify-center`}>
                  <span className="text-[20px]">🦕</span>
                </div>
                <div className="text-center">
                  <h3 className="text-[8px] md:text-[9px] font-pixel font-semibold">
                    {skin.name}
                  </h3>
                </div>
              </div>
            </PixelCard>
          ))}
        </div>

        <div className="text-center">
          <PixelButton
            variant="outline"
            size="md"
            onClick={() => navigate('/shop')}
          >
            VIEW ALL SKINS
          </PixelButton>
        </div>
      </div>
    </section>
  );
};

