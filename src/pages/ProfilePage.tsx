import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PixelCard, PixelCardHeader, PixelCardTitle } from '@/components/ui/PixelCard';
import { PixelButton } from '@/components/ui/PixelButton';
import { PixelInput } from '@/components/ui/PixelInput';
import { useGameStore } from '@/store/gameStore';
import { useAuth } from '@/hooks/useAuth';
import { Shield, User, Coins, Palette } from 'lucide-react';
import { isGuestProfile } from '@/types/game';

const ProfilePage: React.FC = () => {
  const { profile, updateProfile, getCurrency, getOwnedSkins } = useGameStore();
  const { isAuthenticated, user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [newUsername, setNewUsername] = useState(profile?.username || '');
  const [currency, setCurrency] = useState<number>(0);
  const [ownedSkins, setOwnedSkins] = useState<string[]>([]);

  // Fetch currency and owned skins for authenticated users
  useEffect(() => {
    if (isAuthenticated && profile && !isGuestProfile(profile)) {
      getCurrency().then(setCurrency).catch(() => setCurrency(0));
      getOwnedSkins().then(setOwnedSkins).catch(() => setOwnedSkins([]));
    }
  }, [isAuthenticated, profile, getCurrency, getOwnedSkins]);

  useEffect(() => {
    if (profile) {
      setNewUsername(profile.username);
    }
  }, [profile]);

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

  const achievements = [
    { name: 'FIRST JUMP', unlocked: profile.totalMatches >= 1, icon: '◇', desc: 'Play your first game' },
    { name: '10 GAMES', unlocked: profile.totalMatches >= 10, icon: '◆', desc: 'Play 10 games' },
    { name: '100 GAMES', unlocked: profile.totalMatches >= 100, icon: '★', desc: 'Play 100 games' },
    { name: '1K SCORE', unlocked: profile.bestDistance >= 1000, icon: '▲', desc: 'Reach 1,000 points' },
    { name: '5K SCORE', unlocked: profile.bestDistance >= 5000, icon: '▼', desc: 'Reach 5,000 points' },
    { name: '10K SCORE', unlocked: profile.bestDistance >= 10000, icon: '●', desc: 'Reach 10,000 points' },
  ];

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

        {/* IDENTITY */}
        <PixelCard className="md:col-span-2 md:row-span-2 p-6 flex flex-col justify-between space-y-4">

          {/* header */}
          <div className="flex items-center justify-between pb-2 border-b border-border/40">
            <PixelCardTitle className="text-[14px] font-bold tracking-wide uppercase">
              Identity
            </PixelCardTitle>

            {isAuthenticated ? (
              <span className="text-[9px] px-2 py-1 border border-primary text-primary flex items-center gap-1 rounded-sm">
                <Shield className="w-3 h-3" />
                Verified
              </span>
            ) : (
              <span className="text-[9px] px-2 py-1 border border-border text-muted-foreground flex items-center gap-1 rounded-sm">
                <User className="w-3 h-3" />
                Guest
              </span>
            )}
          </div>

          <div className="flex flex-col gap-5">

            {/* Username */}
            <div className="flex items-center justify-between gap-3 w-full">

              {/* left (label + username) */}
              <div className="flex items-center gap-3 min-w-full">
                <label className="text-[12px] uppercase font-bold text-primary tracking-wide">
                  Username:
                </label>

                {isEditing ? (
                  <PixelInput
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value.slice(0, 12))}
                    placeholder="Enter name"
                    maxLength={12}
                  />
                ) : (
                  <span className="text-[12px] font-pixel tracking-wide">
                    {profile.username}
                  </span>
                )}


                {/* right action buttons */}
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <PixelButton size="xs" onClick={handleSaveUsername}>Save</PixelButton>
                    <PixelButton
                      size="xs"
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setNewUsername(profile.username);
                      }}
                    >
                      Cancel
                    </PixelButton>
                  </div>
                ) : (
                  <PixelButton
                    size="xs"
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit
                  </PixelButton>
                )}
              </div>


            </div>


            {isAuthenticated && (
              <div className="space-y-1">
                <label className="text-[12px] uppercase font-bold text-primary">Email </label>
                <span className="text-[12px] font-mono">{user?.email}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[12px] uppercase font-bold text-primary">Player ID </label>
              <span className="text-[12px] font-mono text-muted-foreground">
                {profile.id}
              </span>
            </div>

            <div className="space-y-1">
              <label className="text-[12px] uppercase font-bold text-primary">Member since </label>
              <span className="text-[12px] ">{formatDate(profile.joinDate)}</span>
            </div>

            <div className="space-y-1">
              <label className="text-[12px] uppercase font-bold text-primary">Active Skin </label>
              <span className="text-[12px] font-pixel uppercase tracking-wider">
                {profile.skin}
              </span>
            </div>

          </div>
        </PixelCard>

        {/* Stats Grid */}
        {[
          { label: "Best Distance", value: profile.bestDistance },
          { label: "Total Matches", value: profile.totalMatches },
          { label: "Avg Distance", value: profile.averageDistance },
          { label: "Coins", value: currency, textColor: "text-yellow-500" },
        ].map((stat, i) => (
          <PixelCard key={i} className="flex flex-col justify-center items-center p-6 text-center space-y-1">
            <div className={`text-[26px] font-bold ${stat.textColor || ""}`}>
              {stat.value}
            </div>
            <div className="text-[12px] text-muted-foreground uppercase tracking-wide">
              {stat.label}
            </div>
          </PixelCard>
        ))}

        {/* Achievements */}
        <PixelCard className="md:col-span-2 flex flex-col p-6">
          <PixelCardTitle className="text-[12px] font-bold uppercase mb-4 border-b border-border/40 pb-2">
            Achievements
          </PixelCardTitle>

          <div className="grid grid-cols-3 gap-3">
            {achievements.map((achievement) => (
              <div
                key={achievement.name}
                className={`border border-border rounded-sm px-3 py-4 text-center ${achievement.unlocked ? "" : "opacity-40"
                  }`}
              >
                <div className="text-[22px] mb-1">{achievement.icon}</div>
                <div className="text-[12px] uppercase">{achievement.name}</div>
              </div>
            ))}
          </div>
        </PixelCard>

        {/* Account Status */}
        <PixelCard
          className={`md:col-span-2 ${isAuthenticated
            ? "border-primary"
            : "border-blue-500 bg-blue-500/10"
            } p-6 flex items-center justify-center text-center`}
        >
          {isAuthenticated ? (
            <div>
              <Shield className="w-12 h-12 mx-auto text-primary mb-2" />
              <span className="text-[22px] text-primary font-bold tracking-wide">
                Account Synced
              </span>
              <p className="text-[16px] text-muted-foreground mt-1 leading-tight">
                Your progress is synced to the cloud.<br />
                Play anywhere!
              </p>
            </div>
          ) : (
            <div>
              <p className="text-[16px] text-muted-foreground mb-3 leading-tight">
                Guest progress is local only. Clearing browser<br />
                data erases progress.
              </p>
              <Link to="/auth">
                <PixelButton size="md" variant="primary">
                  Sign Up to Save Progress
                </PixelButton>
              </Link>
            </div>
          )}
        </PixelCard>

      </div>
    </div>
  );
};

export default ProfilePage;
