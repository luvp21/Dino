import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GameCanvas } from '@/components/game/GameCanvas';
import { PixelButton } from '@/components/ui/PixelButton';
import { PixelCard, PixelCardHeader, PixelCardTitle } from '@/components/ui/PixelCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useGameStore } from '@/store/gameStore';
import { useAuth } from '@/hooks/useAuth';
import { submitGameResult } from '@/services/lobbyService';
import { isGuestProfile } from '@/types/game';
import { Trophy, LogIn, X } from 'lucide-react';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { profile, profileId, updateProfile, sessionStats, updateSessionStats, getSessionStats } = useGameStore();
  const { isAuthenticated } = useAuth();
  const [lastScore, setLastScore] = useState<number>(0);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const [showHighScoreDialog, setShowHighScoreDialog] = useState(false);
  const [sessionStatsDisplay, setSessionStatsDisplay] = useState(getSessionStats());

  // Load session stats on mount
  // NOTE: Profile loading is handled by useAuth hook, not here
  // We do NOT call syncProfile() to prevent duplicate profile creation
  useEffect(() => {
    setSessionStatsDisplay(getSessionStats());
  }, []);

  // Check for pending score after authentication
  useEffect(() => {
    if (isAuthenticated && profile && !isGuestProfile(profile) && profileId) {
      // Check if there's a pending score to save
      if (typeof window !== 'undefined') {
        const pendingScoreData = sessionStorage.getItem('pixel-dino-pending-score');
        if (pendingScoreData) {
          try {
            const { score, timestamp } = JSON.parse(pendingScoreData);
            // Only save if score is recent (within last hour)
            if (Date.now() - timestamp < 3600000) {
              // Save the pending score to leaderboard
              submitGameResult(
                profileId,
                null,
                score,
                score,
                1,
                timestamp
              ).then(() => {
                // Clear pending score
                sessionStorage.removeItem('pixel-dino-pending-score');
                // Update profile stats
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
              // Score is too old, remove it
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
        // Authenticated user - update and persist stats
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

        // Submit to database (includes coin award for authenticated users)
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
      } else {
        // Guest user - update session stats in sessionStorage
        updateSessionStats(score);
        const updatedStats = getSessionStats();
        setSessionStatsDisplay(updatedStats);

        // Check if this is a new high score for the session
        const wasHighScore = score > updatedStats.bestDistance;
        setIsNewHighScore(wasHighScore);

        // Show login prompt if it's a high score (and user isn't already logged in)
        if (wasHighScore && !isAuthenticated) {
          setShowHighScoreDialog(true);
        }
      }
    }
  };

  const handleSaveToLeaderboard = () => {
    // Store pending score in sessionStorage to save after login
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('pixel-dino-pending-score', JSON.stringify({
        score: lastScore,
        timestamp: Date.now(),
      }));
    }
    setShowHighScoreDialog(false);
    navigate('/auth');
  };

  // Determine which stats to display (user profile or session stats)
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
        <GameCanvas onGameOver={handleGameOver} />
      </div>

      {/* High Score Dialog - Prompt to login and save score */}
      <Dialog open={showHighScoreDialog} onOpenChange={setShowHighScoreDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              <DialogTitle className="text-[16px] font-pixel">NEW HIGH SCORE!</DialogTitle>
            </div>
            <DialogDescription className="text-[12px]">
              You scored <span className="font-bold text-primary">{lastScore}</span> points!
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-[10px] text-muted-foreground">
              Login to save your score to the leaderboard and compete with players worldwide!
              Your score will be permanently recorded.
            </p>
            <div className="flex gap-2">
              <PixelButton
                variant="primary"
                onClick={handleSaveToLeaderboard}
                className="flex-1"
              >
                <LogIn className="w-4 h-4 mr-2" />
                LOGIN TO SAVE
              </PixelButton>
              <PixelButton
                variant="outline"
                onClick={() => setShowHighScoreDialog(false)}
                className="flex-1"
              >
                <X className="w-4 h-4 mr-2" />
                CONTINUE AS GUEST
              </PixelButton>
            </div>
            <p className="text-[8px] text-muted-foreground text-center">
              Note: Guest scores are only saved for this session. Login to save permanently.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 max-w-3xl mx-auto">
        <PixelButton
          variant="outline"
          size="lg"
          onClick={() => navigate('/leaderboard')}
        >
          LEADERBOARD
        </PixelButton>

        <PixelCard className="text-center">
          <div className="text-[20px] mb-2">
            {isNewHighScore ? (
              <span className="animate-pulse text-yellow-500">🎉 {lastScore}</span>
            ) : (
              lastScore
            )}
          </div>
          <div className="text-[8px] text-muted-foreground">
            {isNewHighScore ? "NEW HIGH SCORE!" : "LAST SCORE"}
          </div>
        </PixelCard>

        <PixelCard className="text-center">
          <div className="text-[20px] mb-2">{displayStats.bestDistance}</div>
          <div className="text-[8px] text-muted-foreground">
            BEST DISTANCE
            {isGuest && <span className="block text-[6px] text-yellow-500">(SESSION)</span>}
          </div>
        </PixelCard>
        <PixelCard className="text-center">
          <div className="text-[20px] mb-2">{displayStats.totalMatches}</div>
          <div className="text-[8px] text-muted-foreground">
            GAMES PLAYED
            {isGuest && <span className="block text-[6px] text-yellow-500">(SESSION)</span>}
          </div>
        </PixelCard>
        <PixelCard className="text-center">
          <div className="text-[20px] mb-2">{displayStats.averageDistance}</div>
          <div className="text-[8px] text-muted-foreground">
            AVG DISTANCE
            {isGuest && <span className="block text-[6px] text-yellow-500">(SESSION)</span>}
          </div>
        </PixelCard>
      </div>

      {/* Guest Info Banner */}
      {isGuest && (
        <PixelCard className="max-w-3xl mx-auto text-center border-yellow-500 bg-yellow-500/10">
          <div className="flex items-center justify-center gap-2 mb-2">
            <LogIn className="w-4 h-4 text-yellow-500" />
            <span className="text-[10px] text-yellow-500 font-pixel">GUEST MODE</span>
          </div>
          <p className="text-[8px] text-muted-foreground mb-3">
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
  );
};

export default HomePage;
