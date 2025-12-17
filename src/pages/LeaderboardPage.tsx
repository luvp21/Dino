import React, { useState, useEffect } from 'react';
import { PixelCard, PixelCardHeader, PixelCardTitle } from '@/components/ui/PixelCard';
import { PixelButton } from '@/components/ui/PixelButton';
import { useGameStore } from '@/store/gameStore';
import type { LeaderboardEntry, SkinType } from '@/types/game';

const SKIN_SYMBOLS: Record<SkinType, string> = {
  classic: '■',
  inverted: '□',
  phosphor: '◈',
  amber: '◆',
  crt: '▣',
  winter: '❄',
  neon: '◎',
  golden: '★',
};

const LeaderboardPage: React.FC = () => {
  const { profile, leaderboard, fetchLeaderboard } = useGameStore();
  const [activeTab, setActiveTab] = useState<'all-time' | 'weekly'>('all-time');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadLeaderboard = async () => {
      setIsLoading(true);
      await fetchLeaderboard(activeTab);
      setIsLoading(false);
    };
    loadLeaderboard();
  }, [activeTab, fetchLeaderboard]);

  const displayLeaderboard = React.useMemo(() => {
    if (!profile || profile.bestDistance === 0) return leaderboard;
    
    const profileInBoard = leaderboard.some(e => e.playerId === profile.id);
    if (profileInBoard) return leaderboard;
    
    const allEntries = [
      ...leaderboard,
      {
        rank: 0,
        playerId: profile.id,
        username: profile.username,
        skin: profile.skin,
        bestDistance: profile.bestDistance,
        totalMatches: profile.totalMatches,
      }
    ];
    
    return allEntries
      .sort((a, b) => b.bestDistance - a.bestDistance)
      .map((entry, index) => ({ ...entry, rank: index + 1 }))
      .slice(0, 10);
  }, [profile, leaderboard]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-[16px] md:text-[20px]">LEADERBOARD</h1>
        <p className="text-[8px] text-muted-foreground">TOP PLAYERS RANKED BY BEST DISTANCE</p>
      </div>

      <div className="flex justify-center gap-2">
        <PixelButton
          variant={activeTab === 'all-time' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('all-time')}
        >
          ALL TIME
        </PixelButton>
        <PixelButton
          variant={activeTab === 'weekly' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('weekly')}
        >
          THIS WEEK
        </PixelButton>
      </div>

      <PixelCard>
        <PixelCardHeader>
          <div className="flex items-center justify-between text-[8px] text-muted-foreground">
            <span className="w-12">RANK</span>
            <span className="flex-1 text-left">PLAYER</span>
            <span className="w-20 text-right">DISTANCE</span>
            <span className="w-16 text-right">GAMES</span>
          </div>
        </PixelCardHeader>

        {isLoading ? (
          <p className="text-center text-[10px] py-4">LOADING...</p>
        ) : displayLeaderboard.length === 0 ? (
          <p className="text-center text-[10px] text-muted-foreground py-4">NO SCORES YET. BE THE FIRST!</p>
        ) : (
          <div className="space-y-0">
            {displayLeaderboard.map((entry) => {
              const isCurrentPlayer = entry.playerId === profile?.id;
              return (
                <div
                  key={entry.playerId}
                  className={`leaderboard-row flex items-center justify-between text-[10px] ${isCurrentPlayer ? 'bg-accent' : ''}`}
                >
                  <span className="w-12 font-bold">{entry.rank === 1 && '> '}#{entry.rank}</span>
                  <span className="flex-1 text-left flex items-center gap-2">
                    <span className="text-muted-foreground">{SKIN_SYMBOLS[entry.skin]}</span>
                    <span className={isCurrentPlayer ? 'animate-pulse-pixel' : ''}>{entry.username}</span>
                    {isCurrentPlayer && <span className="text-[6px] text-muted-foreground">(YOU)</span>}
                  </span>
                  <span className="w-20 text-right font-mono">{entry.bestDistance.toLocaleString()}</span>
                  <span className="w-16 text-right text-muted-foreground">{entry.totalMatches}</span>
                </div>
              );
            })}
          </div>
        )}
      </PixelCard>

      {profile && (
        <PixelCard className="text-center">
          <PixelCardHeader><PixelCardTitle>YOUR STATS</PixelCardTitle></PixelCardHeader>
          <div className="grid grid-cols-3 gap-4 text-[10px]">
            <div><div className="text-[16px]">{profile.bestDistance}</div><div className="text-muted-foreground text-[8px]">BEST</div></div>
            <div><div className="text-[16px]">{profile.totalMatches}</div><div className="text-muted-foreground text-[8px]">GAMES</div></div>
            <div><div className="text-[16px]">{profile.averageDistance}</div><div className="text-muted-foreground text-[8px]">AVG</div></div>
          </div>
        </PixelCard>
      )}
    </div>
  );
};

export default LeaderboardPage;
