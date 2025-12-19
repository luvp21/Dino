import { Navigation } from './Navigation';
import type { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      <main className="flex-1 container mx-auto px-4 py-6">
        {children}
      </main>
      <footer className="pixel-border-thin border-t-2 border-x-0 border-b-0 py-4">
        <div className="container mx-auto px-4 text-center text-[8px] text-muted-foreground">
          <p>PIXEL DINO v1.0 | INSPIRED BY CHROME OFFLINE GAME</p>
          <p className="mt-1">PRESS SPACE TO JUMP | DOWN TO DUCK</p>
        </div>
      </footer>
    </div>
  );
};
