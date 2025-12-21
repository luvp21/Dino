import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GameCanvas } from '@/components/game/GameCanvas';
import { PixelButton } from '@/components/ui/PixelButton';
import { PixelCard } from '@/components/ui/PixelCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useGameStore } from '@/store/gameStore';
import { useAuth } from '@/hooks/useAuth';
import { submitGameResult } from '@/services/lobbyService';
import { isGuestProfile } from '@/types/game';
import { Trophy, LogIn, X } from 'lucide-react';
import { Why } from './Why';
import { FAQ } from './FAQ';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile, profileId, updateProfile, sessionStats, updateSessionStats, getSessionStats } = useGameStore();
  const { isAuthenticated } = useAuth();
  const [lastScore, setLastScore] = useState<number>(0);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const [showHighScoreDialog, setShowHighScoreDialog] = useState(false);
  const [sessionStatsDisplay, setSessionStatsDisplay] = useState(getSessionStats());

  // Load session stats on mount
  useEffect(() => {
    setSessionStatsDisplay(getSessionStats());
  }, []);

  // Check for pending score after authentication
  useEffect(() => {
    if (isAuthenticated && profile && !isGuestProfile(profile) && profileId) {
      if (typeof window !== 'undefined') {
        const pendingScoreData = sessionStorage.getItem('pixel-dino-pending-score');
        if (pendingScoreData) {
          try {
            const { score, timestamp } = JSON.parse(pendingScoreData);
            if (Date.now() - timestamp < 3600000) {
              submitGameResult(
                profileId,
                null,
                score,
                score,
                1,
                timestamp
              ).then(() => {
                sessionStorage.removeItem('pixel-dino-pending-score');
                const newBestDistance = Math.max(profile.bestDistance, score);
                const newTotalMatches = profile.totalMatches + 1;
                const newAverageDistance = Math.floor(
                  ((profile.averageDistance * profile.totalMatches) + score) / newTotalMatches
                );
                updateProfile({
                  bestDistance: newBestDistance,
                  totalMatches: newTotalMatches,
                  averageDistance: newAverageDistance,
                });
              });
            } else {
              sessionStorage.removeItem('pixel-dino-pending-score');
            }
          } catch (error) {
            console.error('Error processing pending score:', error);
            sessionStorage.removeItem('pixel-dino-pending-score');
          }
        }
      }
    }
  }, [isAuthenticated, profile, profileId, updateProfile]);

  const handleGameOver = async (score: number) => {
    setLastScore(score);

    if (profile) {
      const isGuest = isGuestProfile(profile);

      if (!isGuest) {
        const newBestDistance = Math.max(profile.bestDistance, score);
        const newTotalMatches = profile.totalMatches + 1;
        const newAverageDistance = Math.floor(
          ((profile.averageDistance * profile.totalMatches) + score) / newTotalMatches
        );

        const wasHighScore = score > profile.bestDistance;
        setIsNewHighScore(wasHighScore);

        updateProfile({
          bestDistance: newBestDistance,
          totalMatches: newTotalMatches,
          averageDistance: newAverageDistance,
        });

        if (profileId) {
          await submitGameResult(
            profileId,
            null,
            score,
            score,
            1,
            Date.now()
          );
        }
      } else {
        updateSessionStats(score);
        const updatedStats = getSessionStats();
        setSessionStatsDisplay(updatedStats);

        const wasHighScore = score > updatedStats.bestDistance;
        setIsNewHighScore(wasHighScore);

        if (wasHighScore && !isAuthenticated) {
          setShowHighScoreDialog(true);
        }
      }
    }
  };

  const handleSaveToLeaderboard = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('pixel-dino-pending-score', JSON.stringify({
        score: lastScore,
        timestamp: Date.now(),
      }));
    }
    setShowHighScoreDialog(false);
    navigate('/auth');
  };

  const displayStats = profile && !isGuestProfile(profile)
    ? {
      bestDistance: profile.bestDistance,
      totalMatches: profile.totalMatches,
      averageDistance: profile.averageDistance,
    }
    : {
      bestDistance: sessionStatsDisplay.bestDistance,
      totalMatches: sessionStatsDisplay.gamesPlayed,
      averageDistance: sessionStatsDisplay.averageDistance,
    };

  const isGuest = profile ? isGuestProfile(profile) : true;

  return (
    <div className="space-y-8">
      {/* Hero Section with Logo */}
      <section className="pu-8 md:pu-12 text-center">
        <div className="container mx-auto px-4">
          <h1 className="text-[20px] md:text-[28px] font-excon font-bold mb-2">
            Chrome Dino inspired endless runner
          </h1>
          <p className="text-[10px] md:text-[12px] text-muted-foreground max-w-2xl mx-auto">
            Race to the top of the leaderboard and unlock rare skins.            </p>
        </div>
      </section>

      {/* Main Game Viewport Container */}
      <section className="py-4 md:py-2">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Game Canvas - Hidden on mobile */}
          <div className="hidden md:flex justify-center mb-2">
            <div className="relative">
              <GameCanvas onGameOver={handleGameOver} />
            </div>
          </div>

          {/* Mobile Message */}
          <div className="md:hidden mb-6">
            <PixelCard className="max-w-md mx-auto text-center border-border">
              <div className="space-y-4 py-6">
                <div className="text-[24px] mb-2">🖥️</div>
                <h2 className="text-[14px] font-pixel">DESKTOP REQUIRED</h2>
                <p className="text-[8px] text-muted-foreground px-4">
                  THIS GAME REQUIRES A KEYBOARD TO PLAY.
                  <br />
                  PLEASE USE A LAPTOP OR DESKTOP COMPUTER.
                </p>
              </div>
            </PixelCard>
          </div>

          {/* High Score Dialog */}

        </div>
      </section>

      {/* Stats + CTA Section */}
      <section className="bg-muted/30">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex flex-wrap md:flex-nowrap gap-4 mb-6">

            <PixelButton
              variant="outline"
              size="md"
              onClick={() => navigate('/leaderboard')}
              className="flex-1 min-w-[120px] text-[16px]"
            >
              LEADERBOARD
            </PixelButton>

            <PixelCard className="flex-1 min-w-[120px] text-center border-border shadow-sm">
              <div className="text-[20px] mb-2">
                {isNewHighScore ? (
                  <span className="animate-pulse text-blue-500">🎉 {lastScore}</span>
                ) : (
                  lastScore
                )}
              </div>
              <div className="text-[12px] text-muted-foreground">
                {isNewHighScore ? 'NEW HIGH SCORE!' : 'LAST SCORE'}
              </div>
            </PixelCard>

            <PixelCard className="flex-1 min-w-[120px] text-center border-border shadow-sm">
              <div className="text-[20px] mb-2">{displayStats.bestDistance}</div>
              <div className="text-[12px] text-muted-foreground">BEST DISTANCE</div>
            </PixelCard>

            <PixelCard className="flex-1 min-w-[120px] text-center border-border shadow-sm">
              <div className="text-[20px] mb-2">{displayStats.totalMatches}</div>
              <div className="text-[12px] text-muted-foreground">GAMES PLAYED</div>
            </PixelCard>

            <PixelCard className="flex-1 min-w-[120px] text-center border-border shadow-sm">
              <div className="text-[20px] mb-2">{displayStats.averageDistance}</div>
              <div className="text-[12px] text-muted-foreground">AVG DISTANCE</div>
            </PixelCard>



          </div>


          {/* Guest Mode Warning / Login CTA */}
          {isGuest && (
            <PixelCard className="flex-[2] min-w-[200px] mx-auto text-center border-blue-500 bg-blue-500/10 shadow-sm">
              <div className="flex items-center justify-center gap-2 mb-2">
                <LogIn className="w-4 h-4 text-blue-500" />
                <span className="text-[16px] text-blue-500 font-pixel">GUEST MODE</span>
              </div>

              <p className="text-[11px] text-muted-foreground mb-3">
                Your stats are saved for this session only. Login to save your progress permanently,
                earn coins, and unlock skins!
              </p>

              <Link to="/auth">
                <PixelButton variant="primary" size="sm">
                  LOGIN TO SAVE PROGRESS
                </PixelButton>
              </Link>
            </PixelCard>
          )}
        </div>
      </section>

      {/* Why DinoSprint Section */}
      <Why />

      {/* How to Play Section */}


      {/* Leaderboard Preview Section */}


      {/* Skins System Section */}

      {/* FAQ Section */}
      <FAQ />
    </div>
  );
};

export default LandingPage;
