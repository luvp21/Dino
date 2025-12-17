import React from 'react';
import { useGameCanvas } from '@/hooks/useGameCanvas';
import { useGameStore } from '@/store/gameStore';
import { SoundControls } from '@/components/ui/SoundControls';

interface GameCanvasProps {
  onGameOver?: (score: number) => void;
  className?: string;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ onGameOver, className }) => {
  const { canvasRef, isRunning, gameOver, score, coinsEarned } = useGameCanvas({ onGameOver });
  const { profile, currentSkin } = useGameStore();

  return (
    <div className={`relative ${className || ''}`}>
      {/* Game canvas */}
      <canvas
        ref={canvasRef}
        className="game-canvas pixel-border-thick w-full max-w-[1100px]"
        style={{
          aspectRatio: '800/200',
          maxHeight: '280px',
        }}
      />
      
      {/* Sound controls */}
      <div className="absolute top-2 right-2">
        <SoundControls />
      </div>

      {/* Current skin indicator */}
      <div className="absolute top-2 left-2 text-[8px] text-muted-foreground">
        SKIN: {currentSkin.toUpperCase()}
      </div>

      {/* Coins earned indicator */}
      {gameOver && coinsEarned > 0 && (
        <div className="absolute bottom-2 right-2 text-[10px] text-yellow-500 font-pixel animate-pulse">
          +{coinsEarned} COINS
        </div>
      )}
      
      {/* Mobile controls hint */}
      <div className="mt-4 text-center text-muted-foreground text-[8px] md:text-[10px]">
        <p>KEYBOARD: SPACE/UP = JUMP | DOWN = DUCK</p>
        <p className="md:hidden mt-1">TOUCH: TAP TOP = JUMP | TAP BOTTOM = DUCK</p>
      </div>
    </div>
  );
};
