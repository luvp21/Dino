import React, { useRef, useEffect, useState, useCallback } from 'react';
import { DinoEngine, FPS, InputAction } from '@/game/engine';
import { DinoGameRenderer } from '@/game/DinoGameRenderer';
import { useGameStore } from '@/store/gameStore';
import { supabase } from '@/integrations/supabase/client';
import { type GameState, type Obstacle, type PlayerGameState, GAME_CONFIG, SkinType } from '@/types/game';
import { toast } from 'sonner';
import { soundEngine } from '@/services/soundEngine';
import { SoundControls } from '@/components/ui/SoundControls';
import { CloudLayer } from './CloudLayer';
import { Billboard } from './Billboard';

interface SinglePlayerCanvasProps {
  onGameOver?: (score: number) => void;
}

// Convert engine state to renderer format
function convertEngineStateToGameState(
  engine: DinoEngine,
  playerId: string,
  username: string,
  skin: string
): GameState {
  const engineState = engine.getState();
  const tRex = engineState.tRex;

  const obstacles: Obstacle[] = engineState.obstacles.map(o => ({
    id: o.id,
    type: o.type === 'CACTUS_SMALL' ? 'cactus-small' :
          o.type === 'CACTUS_LARGE' ? 'cactus-large' :
          o.type === 'PTERODACTYL' ? 'pterodactyl' : 'cactus-group',
    x: o.x,
    y: o.y,
    width: o.width,
    height: o.height,
    frame: o.currentFrame,
  }));

  const player: PlayerGameState = {
    id: playerId,
    username,
    skin: skin as SkinType,
    y: tRex.y,
    velocityY: tRex.jumpVelocity,
    isJumping: tRex.jumping,
    isDucking: tRex.ducking,
    isAlive: !engineState.isGameOver,
    distance: engineState.score,
    score: engineState.score,
  };

  return {
    frame: engineState.frame,
    seed: engine.getSeed(),
    speed: engineState.currentSpeed,
    distance: engineState.score,
    isRunning: engineState.isRunning,
    isGameOver: engineState.isGameOver,
    obstacles,
    players: [player],
  };
}

export const SinglePlayerCanvas: React.FC<SinglePlayerCanvasProps> = ({ onGameOver }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<DinoEngine | null>(null);
  const rendererRef = useRef<DinoGameRenderer | null>(null);
  const animationFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const accumulatorRef = useRef<number>(0);

  const { profile, currentSkin, profileId } = useGameStore();
  const [isRunning, setIsRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  const FRAME_TIME = 1000 / FPS;

  // Award coins after game
  const awardCoins = useCallback(async (distance: number) => {
    if (!profileId) return 0;

    try {
      const { data, error } = await supabase.rpc('award_coins', {
        p_profile_id: profileId,
        p_distance: distance,
      });

      if (!error && data) {
        setCoinsEarned(data);
        toast.success(`+${data} coins earned!`);
        return data;
      }
    } catch (error) {
      console.error('Error awarding coins:', error);
    }
    return 0;
  }, [profileId]);

  // Initialize game
  const initGame = useCallback(() => {
    if (!canvasRef.current || !profile) return;

    const seed = Date.now();
    engineRef.current = new DinoEngine(seed);

    if (!rendererRef.current) {
      rendererRef.current = new DinoGameRenderer(canvasRef.current, currentSkin);
    } else {
      rendererRef.current.setSkin(currentSkin);
    }

    setGameOver(false);
    setScore(0);
    setCoinsEarned(0);
    setIsRunning(false);
    setIsExpanded(false);

    rendererRef.current.renderStartScreen(currentSkin);
  }, [profile, currentSkin]);

  // Game loop
  const gameLoop = useCallback((timestamp: number) => {
    if (!engineRef.current || !rendererRef.current || !profile) return;

    const deltaTime = timestamp - lastTimeRef.current;
    lastTimeRef.current = timestamp;
    accumulatorRef.current += deltaTime;

    while (accumulatorRef.current >= FRAME_TIME) {
      engineRef.current.update();
      accumulatorRef.current -= FRAME_TIME;

      if (engineRef.current.isGameOver()) {
        setGameOver(true);
        setIsRunning(false);
        soundEngine.playHit();
        setTimeout(() => soundEngine.playGameOver(), 200);
        soundEngine.stopMusic();

        const finalScore = engineRef.current.getScore();
        setScore(finalScore);
        onGameOver?.(finalScore);

        // Render the exact collision frame (with GAME OVER overlay) before stopping
        const finalState = convertEngineStateToGameState(
          engineRef.current,
          profile.id,
          profile.username,
          currentSkin
        );
        rendererRef.current.render(finalState, profile.id);

        awardCoins(finalScore).then((coins) => {
          if (coins > 0) {
            soundEngine.playCoin();
          }
        });
        return;
      }
    }

    const state = convertEngineStateToGameState(
      engineRef.current,
      profile.id,
      profile.username,
      currentSkin
    );
    rendererRef.current.render(state, profile.id);
    setScore(state.distance);

    if (isRunning && !gameOver) {
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    }
  }, [isRunning, gameOver, profile, currentSkin, onGameOver, FRAME_TIME, awardCoins]);

  // Start game
  const startGame = useCallback(() => {
    if (!engineRef.current) return;

    engineRef.current.start();
    setIsRunning(true);
    setIsExpanded(true);
    soundEngine.startMusic();
    lastTimeRef.current = performance.now();
    accumulatorRef.current = 0;
    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [gameLoop]);

  // Handle input
  const handleInput = useCallback((action: 'jump' | 'duck' | 'release') => {
    if (!engineRef.current || !profile || gameOver) return;

    if (!isRunning && action === 'jump') {
      startGame();
      soundEngine.playJump();
      return;
    }

    if (action === 'jump') {
      soundEngine.playJump();
    } else if (action === 'duck') {
      soundEngine.playDuck();
    }

    const engineAction: InputAction =
      action === 'jump' ? 'jump' :
      action === 'duck' ? 'duck_start' :
      'duck_end';

    engineRef.current.processInput(engineAction);
  }, [profile, isRunning, gameOver, startGame]);

  // Restart game (shows start screen)
  const restartGame = useCallback(() => {
    cancelAnimationFrame(animationFrameRef.current);
    initGame();
  }, [initGame]);

  // Restart and immediately play (no start screen)
  const restartAndPlay = useCallback(() => {
    if (!canvasRef.current || !profile) return;

    cancelAnimationFrame(animationFrameRef.current);

    // Clear restart button state
    if (rendererRef.current) {
      rendererRef.current.clearRestartButtonState();
    }

    const seed = Date.now();
    engineRef.current = new DinoEngine(seed);

    if (!rendererRef.current) {
      rendererRef.current = new DinoGameRenderer(canvasRef.current, currentSkin);
    } else {
      rendererRef.current.setSkin(currentSkin);
    }

    setGameOver(false);
    setScore(0);
    setCoinsEarned(0);
    setIsExpanded(true);

    engineRef.current.start();
    setIsRunning(true);
    soundEngine.startMusic();
    lastTimeRef.current = performance.now();
    accumulatorRef.current = 0;
    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [profile, currentSkin, gameLoop]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (gameOver) {
          restartAndPlay();
        } else {
          handleInput('jump');
        }
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        handleInput('duck');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowDown') {
        e.preventDefault();
        handleInput('release');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleInput, restartAndPlay, gameOver]);

  // Touch controls
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const y = touch.clientY - rect.top;

      if (gameOver) {
        restartAndPlay();
      } else if (y < rect.height / 2) {
        handleInput('jump');
      } else {
        handleInput('duck');
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      handleInput('release');
    };

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleInput, restartAndPlay, gameOver]);

  // Mouse controls for restart button hover/click
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !rendererRef.current) return;

    const getCanvasCoords = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = GAME_CONFIG.CANVAS_WIDTH / rect.width;
      const scaleY = GAME_CONFIG.CANVAS_HEIGHT / rect.height;
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!gameOver || !rendererRef.current) return;
      const { x, y } = getCanvasCoords(e);
      const isOver = rendererRef.current.isPointOverRestartButton(x, y);
      rendererRef.current.setRestartHovered(isOver);
      canvas.style.cursor = isOver ? 'pointer' : 'default';
      // Re-render to show hover state
      if (engineRef.current && profile) {
        const state = convertEngineStateToGameState(
          engineRef.current,
          profile.id,
          profile.username,
          currentSkin
        );
        rendererRef.current.render(state, profile.id);
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (!gameOver || !rendererRef.current) return;
      const { x, y } = getCanvasCoords(e);
      if (rendererRef.current.isPointOverRestartButton(x, y)) {
        rendererRef.current.setRestartPressed(true);
        // Re-render to show press state
        if (engineRef.current && profile) {
          const state = convertEngineStateToGameState(
            engineRef.current,
            profile.id,
            profile.username,
            currentSkin
          );
          rendererRef.current.render(state, profile.id);
        }
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!gameOver || !rendererRef.current) return;
      const { x, y } = getCanvasCoords(e);
      const wasPressed = rendererRef.current.isPointOverRestartButton(x, y);
      rendererRef.current.setRestartPressed(false);
      if (wasPressed) {
        rendererRef.current.clearRestartButtonState();
        canvas.style.cursor = 'default';
        restartAndPlay();
      }
    };

    const handleMouseLeave = () => {
      if (!rendererRef.current) return;
      rendererRef.current.setRestartHovered(false);
      rendererRef.current.setRestartPressed(false);
      canvas.style.cursor = 'default';
      // Re-render to clear hover state
      if (gameOver && engineRef.current && profile) {
        const state = convertEngineStateToGameState(
          engineRef.current,
          profile.id,
          profile.username,
          currentSkin
        );
        rendererRef.current.render(state, profile.id);
      }
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [gameOver, profile, currentSkin, restartAndPlay]);

  // Initialize on mount
  useEffect(() => {
    initGame();

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [initGame]);

  // Start game loop when running
  useEffect(() => {
    if (isRunning && !gameOver) {
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    }

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isRunning, gameOver, gameLoop]);

  return (
    <div
      className={`relative transition-all duration-500 ease-out ${
        isExpanded 
          ? 'fixed inset-4 md:inset-8 z-50 flex flex-col' 
          : 'w-full max-w-[800px]'
      }`}
    >
      {/* Sky Background - only visible when expanded */}
      <div
        className={`absolute inset-0 overflow-hidden rounded-lg transition-opacity duration-500 ${
          isExpanded ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          background: currentSkin === 'inverted' || currentSkin === 'phosphor' || currentSkin === 'amber' || currentSkin === 'crt' || currentSkin === 'neon'
            ? 'linear-gradient(180deg, hsl(var(--background)) 0%, hsl(var(--muted)) 100%)'
            : 'linear-gradient(180deg, #87CEEB 0%, #E0F6FF 60%, #FFF9E6 100%)'
        }}
      >
        {/* Clouds */}
        {isExpanded && <CloudLayer speed={isRunning ? score * 0.1 : 0} skin={currentSkin} />}

        {/* Sun/Moon based on skin */}
        <div
          className={`absolute top-4 right-8 w-12 h-12 rounded-full transition-all duration-300 ${
            currentSkin === 'inverted' || currentSkin === 'phosphor' || currentSkin === 'amber' || currentSkin === 'crt' || currentSkin === 'neon'
              ? 'bg-muted-foreground/30'
              : 'bg-yellow-200 shadow-[0_0_30px_rgba(255,223,0,0.5)]'
          }`}
        />
      </div>

      {/* Close button when expanded */}
      {isExpanded && (
        <button
          onClick={() => {
            setIsExpanded(false);
            restartGame();
          }}
          className="absolute top-2 right-2 z-30 pixel-border bg-background px-3 py-1 text-[10px] font-pixel hover:bg-muted transition-colors"
        >
          EXIT
        </button>
      )}

      {/* Billboard - Left */}
      {isExpanded && (
        <Billboard
          position="left"
          content="YOUR AD HERE"
          className="hidden xl:block"
        />
      )}

      {/* Billboard - Right */}
      {isExpanded && (
        <Billboard
          position="right"
          content="PIXEL DINO"
          className="hidden lg:block"
        />
      )}

      {/* Main Game Container */}
      <div
        className={`relative z-10 mx-auto transition-all duration-500 flex-1 flex flex-col justify-center ${
          isExpanded ? 'w-full h-full' : ''
        }`}
      >
        {/* Score Display Above Canvas */}
        {isExpanded && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
            <div className="bg-background/80 backdrop-blur-sm px-4 py-2 pixel-border">
              <span className="text-[14px] font-pixel">{Math.floor(score)}</span>
            </div>
          </div>
        )}

        {/* Game Canvas */}
        <div className="relative flex justify-center items-center flex-1">
          <canvas
            ref={canvasRef}
            className={`game-canvas pixel-border-thick transition-all duration-500 ${
              isExpanded ? 'w-full max-w-[95vw] md:max-w-[85vw]' : 'w-full max-w-[800px]'
            }`}
            style={{
              aspectRatio: '800/200',
              maxHeight: isExpanded ? '50vh' : '200px',
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
        </div>

        {/* Mobile controls hint */}
        <div className="mt-4 text-center text-muted-foreground text-[8px] md:text-[10px]">
          <p>KEYBOARD: SPACE/UP = JUMP | DOWN = DUCK</p>
          <p className="md:hidden mt-1">TOUCH: TAP TOP = JUMP | TAP BOTTOM = DUCK</p>
        </div>
      </div>

      {/* Ground Extension for expanded view */}
      {isExpanded && (
        <div
          className="absolute bottom-0 left-0 right-0 h-8"
          style={{
            background: currentSkin === 'inverted' || currentSkin === 'phosphor' || currentSkin === 'amber' || currentSkin === 'crt' || currentSkin === 'neon'
              ? 'hsl(var(--muted))'
              : '#C4A86E'
          }}
        />
      )}
    </div>
  );
};
