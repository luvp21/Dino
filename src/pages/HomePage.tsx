import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameCanvas } from '@/components/game/GameCanvas';
import { PixelButton } from '@/components/ui/PixelButton';
import { PixelCard, PixelCardHeader, PixelCardTitle } from '@/components/ui/PixelCard';
import { useGameStore } from '@/store/gameStore';
import { submitGameResult } from '@/services/lobbyService';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { profile, profileId, updateProfile, syncProfile } = useGameStore();
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [isNewHighScore, setIsNewHighScore] = useState(false);

  // Sync profile on mount
  useEffect(() => {
    syncProfile();
  }, []);

  const handleGameOver = async (score: number) => {
    setLastScore(score);
    
    if (profile) {
      const newBestDistance = Math.max(profile.bestDistance, score);
      const newTotalMatches = profile.totalMatches + 1;
      const newAverageDistance = Math.floor(
        ((profile.averageDistance * profile.totalMatches) + score) / newTotalMatches
      );
      
      setIsNewHighScore(score > profile.bestDistance);
      
      updateProfile({
        bestDistance: newBestDistance,
        totalMatches: newTotalMatches,
        averageDistance: newAverageDistance,
      });
      
      // Submit to database
      if (profileId) {
        await submitGameResult(
          profileId,
          null, // No lobby for single player
          score,
          score,
          1,
          Date.now()
        );
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <h1 className="text-[16px] md:text-[24px] font-pixel">PIXEL DINO</h1>
        <p className="text-[8px] md:text-[10px] text-muted-foreground max-w-md mx-auto">
          THE CLASSIC CHROME OFFLINE GAME, NOW WITH MULTIPLAYER.
          COMPETE AGAINST PLAYERS WORLDWIDE.
        </p>
      </div>

      {/* Game Canvas */}
      <div className="flex justify-center px-4">
        <GameCanvas onGameOver={handleGameOver} className="w-full" />
      </div>

      {/* Score Display */}
      {lastScore !== null && (
        <div className="text-center space-y-2">
          <div className="text-[12px]">
            {isNewHighScore ? (
              <span className="animate-pulse-pixel">NEW HIGH SCORE!</span>
            ) : (
              <span>SCORE: {lastScore}</span>
            )}
          </div>
          {profile && (
            <div className="text-[8px] text-muted-foreground">
              BEST: {profile.bestDistance} | GAMES: {profile.totalMatches}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-4">
        <PixelButton
          size="lg"
          onClick={() => navigate('/lobby')}
        >
          MULTIPLAYER
        </PixelButton>
        <PixelButton
          variant="outline"
          size="lg"
          onClick={() => navigate('/leaderboard')}
        >
          LEADERBOARD
        </PixelButton>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
        <PixelCard className="text-center">
          <div className="text-[20px] mb-2">{profile?.bestDistance || 0}</div>
          <div className="text-[8px] text-muted-foreground">BEST DISTANCE</div>
        </PixelCard>
        <PixelCard className="text-center">
          <div className="text-[20px] mb-2">{profile?.totalMatches || 0}</div>
          <div className="text-[8px] text-muted-foreground">GAMES PLAYED</div>
        </PixelCard>
        <PixelCard className="text-center">
          <div className="text-[20px] mb-2">{profile?.averageDistance || 0}</div>
          <div className="text-[8px] text-muted-foreground">AVG DISTANCE</div>
        </PixelCard>
      </div>

      {/* Multiplayer Info */}
      <PixelCard className="max-w-md mx-auto text-center">
        <PixelCardHeader>
          <PixelCardTitle>MULTIPLAYER MODE</PixelCardTitle>
        </PixelCardHeader>
        <p className="text-[8px] text-muted-foreground mb-4">
          COMPETE HEAD-TO-HEAD WITH OTHER PLAYERS IN REAL-TIME.
          SAME OBSTACLES. SAME SPEED. PURE SKILL.
        </p>
        <div className="flex justify-center gap-2">
          <PixelButton onClick={() => navigate('/lobby')}>
            FIND GAME
          </PixelButton>
          <PixelButton variant="outline" onClick={() => navigate('/skins')}>
            SKINS
          </PixelButton>
        </div>
      </PixelCard>
    </div>
  );
};

export default HomePage;
