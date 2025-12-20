import React from 'react';
import { PixelCard } from '@/components/ui/PixelCard';

export const HowToPlay: React.FC = () => {
  const instructions = [
    {
      step: '01',
      title: 'Start the Game',
      description: 'Click PLAY to begin your endless runner adventure',
    },
    {
      step: '02',
      title: 'Jump Over Obstacles',
      description: 'Press SPACE or UP arrow to jump over cacti and pterodactyls',
    },
    {
      step: '03',
      title: 'Duck Under Obstacles',
      description: 'Press DOWN arrow to duck under low-flying obstacles',
    },
    {
      step: '04',
      title: 'Build Your Score',
      description: 'Survive longer to increase your distance and score',
    },
    {
      step: '05',
      title: 'Compete in Multiplayer',
      description: 'Join MULTI mode to race against other players in real-time',
    },
    {
      step: '06',
      title: 'Unlock Achievements',
      description: 'Earn coins and unlock new skins as you progress',
    },
  ];

  return (
    <section className="py-12 md:py-16 bg-muted/30">
      <div className="container mx-auto px-4 max-w-4xl">
        <h2 className="text-[14px] md:text-[18px] font-pixel font-bold text-center mb-8 md:mb-12">
          How to Play
        </h2>

        <div className="space-y-4">
          {instructions.map((instruction, index) => (
            <PixelCard
              key={index}
              className="border border-border shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center border border-border bg-background">
                  <span className="text-[8px] font-pixel font-bold">{instruction.step}</span>
                </div>
                <div className="flex-1 space-y-1">
                  <h3 className="text-[10px] md:text-[11px] font-pixel font-semibold">
                    {instruction.title}
                  </h3>
                  <p className="text-[7px] md:text-[8px] text-muted-foreground leading-relaxed">
                    {instruction.description}
                  </p>
                </div>
              </div>
            </PixelCard>
          ))}
        </div>
      </div>
    </section>
  );
};

