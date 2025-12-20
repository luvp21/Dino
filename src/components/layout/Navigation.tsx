import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useGameStore } from '@/store/gameStore';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { LogIn, LogOut } from 'lucide-react';

export const Navigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useGameStore();
  const { isAuthenticated, signOut, loading } = useAuth();

  const navItems = [
    { path: '/', label: 'PLAY' },
    { path: '/lobby', label: 'MULTI' },
    { path: '/shop', label: 'SHOP' },
    { path: '/leaderboard', label: 'RANKS' },
    { path: '/profile', label: 'PROFILE' },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav className="pixel p-2">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link to="/" className="text-[16px] md:text-[18px] font-pixel font-bold hover:text-muted-foreground transition-colors">
            <img src="/dino.png" alt="DinoSprint Logo" className="inline-block w-8 h-8 mr-2 mb-1" />
            DinoSprint
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-1 md:gap-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'nav-link text-[12px] md:text-[12px]',
                  location.pathname === item.path && 'nav-link-active'
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Player Info & Auth */}
          <div className="flex items-center gap-3">
            {profile && (
              <div className="hidden md:flex items-center gap-1 text-[12px]">
                <span className="text-muted-foreground">
                  {isAuthenticated ? '' : 'GUEST:'}
                </span>
                <span className={isAuthenticated ? 'text-primary' : ''}>
                  {profile.username}
                </span>
              </div>
            )}

            {!loading && (
              isAuthenticated ? (
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-1 text-[12px] font-pixel text-muted-foreground hover:text-primary transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-3 h-3" />
                  <span className="hidden md:inline">LOGOUT</span>
                </button>
              ) : (
                <Link
                  to="/auth"
                  className="flex items-center gap-1 text-[12px] font-pixel text-primary transition-colors"
                >
                  <LogIn className="w-3 h-3" />
                  <span className="hidden md:inline">LOGIN</span>
                </Link>
              )
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
