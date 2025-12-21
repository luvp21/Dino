import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PixelCard } from '@/components/ui/PixelCard';
import { PixelButton } from '@/components/ui/PixelButton';
import { Trophy } from 'lucide-react';

export const LeaderboardPreview: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-[14px] md:text-[18px] font-pixel font-bold mb-4">
            Leaderboard & Competition
          </h2>
          <p className="text-[8px] md:text-[9px] text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Compete with players from around the world. Track your best scores,
            climb the rankings, and prove you're the ultimate DinoSprint champion.
            Weekly and all-time leaderboards available.
          </p>
        </div>

        <PixelCard className="border border-border shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 flex items-center justify-center border border-border bg-muted">
                <Trophy className="w-6 h-6 text-foreground" />
              </div>
              <div>
                <h3 className="text-[11px] md:text-[12px] font-pixel font-semibold mb-1">
                  Global Rankings
                </h3>
                <p className="text-[7px] md:text-[8px] text-muted-foreground">
                  See where you rank among the best players
                </p>
              </div>
            </div>
            <PixelButton
              variant="primary"
              size="md"
              onClick={() => navigate('/leaderboard')}
              className="w-full md:w-auto"
            >
              VIEW LEADERBOARD
            </PixelButton>
          </div>
        </PixelCard>
      </div>
    </section>
  );
};
