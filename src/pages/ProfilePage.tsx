import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PixelCard, PixelCardHeader, PixelCardTitle } from '@/components/ui/PixelCard';
import { PixelButton } from '@/components/ui/PixelButton';
import { PixelInput } from '@/components/ui/PixelInput';
import { useGameStore } from '@/store/gameStore';
import { useAuth } from '@/hooks/useAuth';
import { Shield, User } from 'lucide-react';

const ProfilePage: React.FC = () => {
  const { profile, updateProfile } = useGameStore();
  const { isAuthenticated, user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [newUsername, setNewUsername] = useState(profile?.username || '');

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">LOADING PROFILE...</p>
      </div>
    );
  }

  const handleSaveUsername = () => {
    if (newUsername.trim() && newUsername.length >= 3 && newUsername.length <= 12) {
      updateProfile({ username: newUsername.toUpperCase().replace(/[^A-Z0-9_]/g, '') });
      setIsEditing(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).toUpperCase();
  };

  const formatPlaytime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}H ${minutes}M`;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-[16px] md:text-[20px]">PLAYER PROFILE</h1>
        <p className="text-[8px] text-muted-foreground">
          YOUR STATS AND ACHIEVEMENTS
        </p>
      </div>

      {/* Profile Card */}
      <PixelCard>
        <PixelCardHeader>
          <div className="flex items-center justify-between">
            <PixelCardTitle>IDENTITY</PixelCardTitle>
            {isAuthenticated ? (
              <span className="flex items-center gap-1 text-[8px] text-primary px-2 py-1 border border-primary">
                <Shield className="w-3 h-3" />
                VERIFIED
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[8px] text-muted-foreground px-2 py-1 border border-border">
                <User className="w-3 h-3" />
                GUEST
              </span>
            )}
          </div>
        </PixelCardHeader>

        <div className="space-y-4">
          {/* Username */}
          <div>
            <label className="text-[8px] text-muted-foreground block mb-2">USERNAME</label>
            {isEditing ? (
              <div className="flex gap-2">
                <PixelInput
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value.slice(0, 12))}
                  placeholder="ENTER NAME"
                  maxLength={12}
                />
                <PixelButton size="sm" onClick={handleSaveUsername}>
                  SAVE
                </PixelButton>
                <PixelButton
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setNewUsername(profile.username);
                  }}
                >
                  X
                </PixelButton>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-[14px]">{profile.username}</span>
                <PixelButton size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                  EDIT
                </PixelButton>
              </div>
            )}
            <p className="text-[6px] text-muted-foreground mt-1">
              3-12 CHARACTERS, LETTERS AND NUMBERS ONLY
            </p>
          </div>

          {/* Email (for authenticated users) */}
          {isAuthenticated && user?.email && (
            <div>
              <label className="text-[8px] text-muted-foreground block mb-2">EMAIL</label>
              <span className="text-[10px] font-mono">{user.email}</span>
            </div>
          )}

          {/* Player ID */}
          <div>
            <label className="text-[8px] text-muted-foreground block mb-2">PLAYER ID</label>
            <span className="text-[10px] font-mono text-muted-foreground">{profile.id}</span>
          </div>

          {/* Join Date */}
          <div>
            <label className="text-[8px] text-muted-foreground block mb-2">MEMBER SINCE</label>
            <span className="text-[12px]">{formatDate(profile.joinDate)}</span>
          </div>

          {/* Current Skin */}
          <div>
            <label className="text-[8px] text-muted-foreground block mb-2">ACTIVE SKIN</label>
            <span className="text-[12px]">{profile.skin.toUpperCase()}</span>
          </div>
        </div>
      </PixelCard>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <PixelCard className="text-center">
          <div className="text-[24px] mb-2">{profile.bestDistance}</div>
          <div className="text-[8px] text-muted-foreground">BEST DISTANCE</div>
        </PixelCard>
        <PixelCard className="text-center">
          <div className="text-[24px] mb-2">{profile.totalMatches}</div>
          <div className="text-[8px] text-muted-foreground">TOTAL MATCHES</div>
        </PixelCard>
        <PixelCard className="text-center">
          <div className="text-[24px] mb-2">{profile.averageDistance}</div>
          <div className="text-[8px] text-muted-foreground">AVG DISTANCE</div>
        </PixelCard>
        <PixelCard className="text-center">
          <div className="text-[24px] mb-2">{formatPlaytime(profile.totalPlaytime)}</div>
          <div className="text-[8px] text-muted-foreground">PLAYTIME</div>
        </PixelCard>
      </div>

      {/* Achievements Preview */}
      <PixelCard>
        <PixelCardHeader>
          <PixelCardTitle>ACHIEVEMENTS</PixelCardTitle>
        </PixelCardHeader>
        <div className="grid grid-cols-3 gap-3">
          {/* Achievement badges */}
          {[
            { name: 'FIRST JUMP', unlocked: profile.totalMatches >= 1, icon: '◇' },
            { name: '10 GAMES', unlocked: profile.totalMatches >= 10, icon: '◆' },
            { name: '100 GAMES', unlocked: profile.totalMatches >= 100, icon: '★' },
            { name: '1K SCORE', unlocked: profile.bestDistance >= 1000, icon: '▲' },
            { name: '5K SCORE', unlocked: profile.bestDistance >= 5000, icon: '▼' },
            { name: '10K SCORE', unlocked: profile.bestDistance >= 10000, icon: '●' },
          ].map((achievement) => (
            <div
              key={achievement.name}
              className={`text-center p-2 border-2 border-border ${
                achievement.unlocked ? '' : 'opacity-30'
              }`}
            >
              <div className="text-[16px] mb-1">{achievement.icon}</div>
              <div className="text-[6px]">{achievement.name}</div>
            </div>
          ))}
        </div>
      </PixelCard>

      {/* Account Status Card */}
      {isAuthenticated ? (
        <PixelCard className="text-center border-primary">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-[10px] text-primary">ACCOUNT SYNCED</span>
          </div>
          <p className="text-[8px] text-muted-foreground">
            YOUR PROGRESS IS SAVED TO THE CLOUD.
            PLAY ON ANY DEVICE WITH THE SAME ACCOUNT.
          </p>
        </PixelCard>
      ) : (
        <PixelCard className="text-center border-yellow-500 bg-yellow-500/10">
          <div className="flex items-center justify-center gap-2 mb-3">
            <User className="w-4 h-4 text-yellow-500" />
            <span className="text-[10px] text-yellow-500">GUEST MODE</span>
          </div>
          <p className="text-[8px] text-muted-foreground mb-3">
            GUEST PLAYERS CANNOT EARN OR STORE CURRENCY AND SKINS.
            YOUR STATS ARE TEMPORARY AND WILL RESET ON PAGE REFRESH.
            LOGIN TO SAVE PROGRESS, EARN COINS, AND UNLOCK SKINS.
          </p>
          <Link to="/auth">
            <PixelButton variant="primary" size="sm">
              LOGIN TO EARN COINS & UNLOCK SKINS
            </PixelButton>
          </Link>
        </PixelCard>
      )}
    </div>
  );
};

export default ProfilePage;
