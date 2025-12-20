import React from 'react';
import { PixelCard, PixelCardHeader, PixelCardTitle } from '@/components/ui/PixelCard';

export const Why: React.FC = () => {
  const features = [
    {
      title: 'Classic Gameplay',
      description: 'Experience the nostalgic Chrome Dino game with enhanced multiplayer features',
    },
    {
      title: 'Compete Globally',
      description: 'Race against players worldwide in real-time multiplayer matches',
    },
    {
      title: 'Customizable Skins',
      description: 'Unlock and collect unique pixel art skins to personalize your dino',
    },
    {
      title: 'Leaderboard Rankings',
      description: 'Track your progress and compete for the top spots on global leaderboards',
    },
    {
      title: 'Free to Play',
      description: 'No pay-to-win mechanics. Skill and practice determine your success',
    },
    {
      title: 'Cross-Platform',
      description: 'Play seamlessly across desktop devices with responsive design',
    },
  ];



  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="relative w-fit mx-auto mb-12">
          {/* floating label */}


          <h2 className="text-center font-pixel text-[22px] md:text-4xl font-bold">
            Features of DinoSprint
          </h2>
        </div>


        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {features.map((feature, index) => (
            <PixelCard
              key={index}
              className=" "
            >
              <div className="space-y-2">
                <h3 className="text-[10px] md:text-[16px] font-pixel font-semibold">
                  {feature.title}
                </h3>
                <p className="text-[7px] md:text-[10px] text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </PixelCard>
          ))}
        </div>
      </div>
    </section>
  );
};

