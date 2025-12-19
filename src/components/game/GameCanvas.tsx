import React from 'react';
import { useGameCanvas } from '@/hooks/useGameCanvas';
import { useGameStore } from '@/store/gameStore';
import { SoundControls } from '@/components/ui/SoundControls';
import { GAME_CONFIG } from '@/types/game';

interface GameCanvasProps {
  onGameOver?: (score: number) => void;
  className?: string;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ onGameOver, className }) => {
  const { canvasRef, isRunning, gameOver, score, coinsEarned, debugMode } = useGameCanvas({ onGameOver });
  const { profile, currentSkin } = useGameStore();

  return (
    <div className={`relative ${className || ''}`}>
      {/* Game canvas */}


<canvas
  ref={canvasRef}
  width={GAME_CONFIG.CANVAS_WIDTH}
  height={GAME_CONFIG.CANVAS_HEIGHT}
  className="game-canvas pixel-border-thick"
  style={{
    width: `${GAME_CONFIG.CANVAS_WIDTH}px`,
    height: `${GAME_CONFIG.CANVAS_HEIGHT}px`,
  }}
/>

      {/* Sound controls */}
      <div className="absolute top-2 left-2">
        <SoundControls />
      </div>

      {/* Current skin indicator */}
      <div className="absolute bottom-2 left-2 text-[8px] text-muted-foreground">
        SKIN: {currentSkin.toUpperCase()}
      </div>

      {/* Debug mode indicator */}
      {debugMode && (
        <div className="absolute top-2 right-2 text-[8px] text-red-500 font-pixel bg-black/50 px-2 py-1 rounded">
          DEBUG MODE (Ctrl+D)
        </div>
      )}

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
