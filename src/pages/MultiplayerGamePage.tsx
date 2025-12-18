import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PixelButton } from '@/components/ui/PixelButton';
import { PixelCard, PixelCardHeader, PixelCardTitle } from '@/components/ui/PixelCard';

const MultiplayerGamePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <PixelCard className="max-w-md text-center p-8">
        <PixelCardHeader>
          <PixelCardTitle>MULTIPLAYER GAME</PixelCardTitle>
        </PixelCardHeader>
        <p className="text-[10px] text-muted-foreground mb-6">
          MULTIPLAYER MODE IS COMING SOON!
          <br /><br />
          PLAY SINGLE PLAYER FOR NOW.
        </p>
        <PixelButton onClick={() => navigate('/')}>
          BACK TO GAME
        </PixelButton>
      </PixelCard>
    </div>
  );
};

export default MultiplayerGamePage;
