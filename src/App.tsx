// Pixel Dino - Multiplayer Game
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import HomePage from "@/pages/HomePage";
import LeaderboardPage from "@/pages/LeaderboardPage";
import ProfilePage from "@/pages/ProfilePage";
import SkinsPage from "@/pages/SkinsPage";
import ShopPage from "@/pages/ShopPage";
import LobbyPage from "@/pages/LobbyPage";
import MultiplayerGamePage from "@/pages/MultiplayerGamePage";
import AuthPage from "@/pages/AuthPage";
import NotFound from "@/pages/NotFound";
import AuthCallback from "@/pages/auth/AuthCallback";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout><HomePage /></Layout>} />
          <Route path="/auth" element={<Layout><AuthPage /></Layout>} />
          <Route path="/auth/callback" element={<Layout><AuthCallback /></Layout>} />
          <Route path="/leaderboard" element={<Layout><LeaderboardPage /></Layout>} />
          <Route path="/profile" element={<Layout><ProfilePage /></Layout>} />
          <Route path="/skins" element={<Layout><SkinsPage /></Layout>} />
          <Route path="/shop" element={<Layout><ShopPage /></Layout>} />
          <Route path="/lobby" element={<Layout><LobbyPage /></Layout>} />
          <Route path="/game/:lobbyId" element={<Layout><MultiplayerGamePage /></Layout>} />
          <Route path="*" element={<Layout><NotFound /></Layout>} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
