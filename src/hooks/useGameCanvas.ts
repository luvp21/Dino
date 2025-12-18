import { useRef, useEffect, useCallback, useState } from 'react';
import { DinoEngine, ENGINE_CONFIG, FPS, InputAction } from '@/game/engine';
import { DinoGameRenderer } from '@/game/DinoGameRenderer';
import { useGameStore } from '@/store/gameStore';
import { supabase } from '@/integrations/supabase/client';
import { type GameState, type Obstacle, type PlayerGameState, GAME_CONFIG } from '@/types/game';
import { toast } from 'sonner';
import { soundEngine } from '@/services/soundEngine';

interface UseGameCanvasOptions {
  onGameOver?: (score: number) => void;
  isSinglePlayer?: boolean;
}

// Convert new engine state to renderer-compatible format
function convertEngineStateToGameState(
  engine: DinoEngine,
  playerId: string,
  username: string,
  skin: string
): GameState {
  const engineState = engine.getState();
  const tRex = engineState.tRex;

  // Convert obstacles to old format
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

  // Create player state from tRex
  const player: PlayerGameState = {
    id: playerId,
    username,
    skin: skin as PlayerGameState['skin'],
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

export function useGameCanvas(options: UseGameCanvasOptions = {}) {
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

    // Render start screen
    rendererRef.current.renderStartScreen(currentSkin);
  }, [profile, currentSkin]);

  // Game loop
  const gameLoop = useCallback((timestamp: number) => {
    if (!engineRef.current || !rendererRef.current || !profile) return;

    const deltaTime = timestamp - lastTimeRef.current;
    lastTimeRef.current = timestamp;
    accumulatorRef.current += deltaTime;

    // Fixed timestep for deterministic physics
    while (accumulatorRef.current >= FRAME_TIME) {
      engineRef.current.update();
      accumulatorRef.current -= FRAME_TIME;

      if (engineRef.current.isGameOver()) {
        setGameOver(true);
        setIsRunning(false);
        // Play hit and game over sounds
        soundEngine.playHit();
        setTimeout(() => soundEngine.playGameOver(), 200);
        soundEngine.stopMusic();

        const finalScore = engineRef.current.getScore();
        setScore(finalScore);
        options.onGameOver?.(finalScore);

        // IMPORTANT: Render the final collision frame before stopping
        const finalState = convertEngineStateToGameState(
          engineRef.current,
          profile.id,
          profile.username,
          currentSkin
        );
        rendererRef.current.render(finalState, profile.id);

        // Award coins for distance traveled
        awardCoins(finalScore).then((coins) => {
          if (coins > 0) {
            soundEngine.playCoin();
          }
        });
        return;
      }
    }

    // Convert engine state to renderer format
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
  }, [isRunning, gameOver, profile, currentSkin, options, FRAME_TIME, awardCoins]);

  // Start game
  const startGame = useCallback(() => {
    if (!engineRef.current) return;

    engineRef.current.start();
    setIsRunning(true);
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

    // Play sound effects
    if (action === 'jump') {
      soundEngine.playJump();
    } else if (action === 'duck') {
      soundEngine.playDuck();
    }

    // Convert to engine input action
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

  // Restart and immediately start playing (no start screen)
  const restartAndPlay = useCallback(() => {
    if (!canvasRef.current || !profile) return;

    cancelAnimationFrame(animationFrameRef.current);

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
          restartAndPlay(); // Restart directly into gameplay
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

  // Initialize once when profile is available.
  // Avoid re-initializing on later profile/skin updates (e.g. after awarding coins),
  // which would otherwise immediately redraw the start screen over the final
  // collision frame.
  useEffect(() => {
    if (!engineRef.current && profile) {
      initGame();
    }

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [profile, currentSkin, initGame]);

  // Start game loop when running
  useEffect(() => {
    if (isRunning && !gameOver) {
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    }

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isRunning, gameOver, gameLoop]);

  return {
    canvasRef,
    isRunning,
    gameOver,
    score,
    coinsEarned,
    startGame,
    restartGame,
    handleInput,
  };
}
