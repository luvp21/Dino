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
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/skins" element={<SkinsPage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/lobby" element={<LobbyPage />} />
            <Route path="/game/:lobbyId" element={<MultiplayerGamePage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
