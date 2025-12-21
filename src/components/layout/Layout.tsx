import { Navigation } from './Navigation';
import type { ReactNode } from 'react';
import { Analytics } from "@vercel/analytics/react"

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
      <Analytics />
      <footer >
        <div className="container border-t border-border mx-auto px-4 py-3 flex items-center justify-between">

          {/* LEFT */}
          <div className="text-[14px] text-muted-foreground">
      // Run forever. Until you <span className="text-blue-400" >crash()</span>;
          </div>

          {/* CENTER */}
          <a
            href="https://luv-patel.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition"
          >
            <img
              src="/luvv.png"
              alt="avatar"
              className="w-7 h-7 bg-blue-400 rounded-xl"
            />
            <span className="text-[14px]">
              Built with <span className="text-red-400">❤️</span> Luv
            </span>
          </a>

          {/* RIGHT */}
          <div className="text-[14px] text-muted-foreground">
            © 2024 DinoSprint. All rights reserved.
          </div>

        </div>
      </footer>
    </div >
  );
};
