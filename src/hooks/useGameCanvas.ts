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
          o.type === 'CACTUS_SMALL_2' ? 'cactus-small-2' :
          o.type === 'CACTUS_SMALL_3' ? 'cactus-small-3' :
          o.type === 'CACTUS_LARGE_2' ? 'cactus-large-2' :
          o.type === 'CACTUS_LARGE_3' ? 'cactus-large-3' :
          'pterodactyl',
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
  const gameOverTimeRef = useRef<number>(0);

  const { profile, currentSkin, profileId } = useGameStore();
  const [isRunning, setIsRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [debugMode, setDebugMode] = useState(false);

  const FRAME_TIME = 1000 / FPS;
  const RESTART_DELAY_MS = 500; // Delay before allowing restart after game over

  // Award coins after game - ONLY for authenticated users
  // Guests get no-op (no coins earned)
  const awardCoins = useCallback(async (distance: number) => {
    // Guard: Only award coins for authenticated users
    if (!profileId || !profile) return 0;

    // Check if user is guest (guests cannot earn coins)
    const { isGuest } = profile;
    if (isGuest) {
      console.warn('Guests cannot earn coins - login required');
      return 0;
    }

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
  }, [profileId, profile]);

  // Initialize game
  const initGame = useCallback(async () => {
    if (!canvasRef.current) return;

    engineRef.current = new DinoEngine(Date.now());
    if (engineRef.current) {
      engineRef.current.setDebugMode(debugMode);
    }

    if (!rendererRef.current) {
      rendererRef.current = new DinoGameRenderer(canvasRef.current, currentSkin);
    } else {
      rendererRef.current.setSkin(currentSkin);
    }

    await rendererRef.current.waitUntilReady();

    rendererRef.current.renderStartScreen(currentSkin, debugMode);

    setGameOver(false);
    setIsRunning(false);
    setScore(0);
    gameOverTimeRef.current = 0; // Reset game over timestamp
  }, [currentSkin, debugMode]);

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
        gameOverTimeRef.current = Date.now(); // Record when game over happened
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
        const collisionDebugData = engineRef.current.getCollisionDebugData();
        rendererRef.current.render(finalState, profile.id, collisionDebugData);

        // Award coins for distance traveled (only for authenticated users)
        // Guests get no-op - awardCoins will return 0 for guests
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
    const collisionDebugData = engineRef.current.getCollisionDebugData();
    rendererRef.current.render(state, profile.id, collisionDebugData);
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

    // Convert to engine input action
    const engineAction: InputAction =
      action === 'jump' ? 'jump' :
      action === 'duck' ? 'duck_start' :
      'duck_end';

    // Check if jump will actually execute before playing sound
    if (action === 'jump') {
      const tRex = engineRef.current.getTRex();
      // Only play sound if dino is not already jumping or ducking
      if (!tRex.jumping && !tRex.ducking) {
        soundEngine.playJump();
      }
    } else if (action === 'duck') {
      soundEngine.playDuck();
    }

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

    // Check if enough time has passed since game over
    const timeSinceGameOver = Date.now() - gameOverTimeRef.current;
    if (gameOver && timeSinceGameOver < RESTART_DELAY_MS) {
      return; // Don't restart yet, delay hasn't passed
    }

    cancelAnimationFrame(animationFrameRef.current);

    const seed = Date.now();
    engineRef.current = new DinoEngine(seed);
    if (engineRef.current) {
      engineRef.current.setDebugMode(debugMode);
    }

    if (!rendererRef.current) {
      rendererRef.current = new DinoGameRenderer(canvasRef.current, currentSkin);
    } else {
      rendererRef.current.setSkin(currentSkin);
    }

    setGameOver(false);
    setScore(0);
    setCoinsEarned(0);
    gameOverTimeRef.current = 0; // Reset game over timestamp

    engineRef.current.start();
    setIsRunning(true);
    soundEngine.startMusic();
    lastTimeRef.current = performance.now();
    accumulatorRef.current = 0;

    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [profile, currentSkin, gameLoop, gameOver, debugMode]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle debug mode with 'D' key
      if (e.code === 'KeyD' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        const newDebugMode = !debugMode;
        setDebugMode(newDebugMode);
        if (engineRef.current) {
          engineRef.current.setDebugMode(newDebugMode);
        }
        return;
      }

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
  }, [handleInput, restartAndPlay, gameOver, debugMode]);

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

  // Update debug mode when it changes
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setDebugMode(debugMode);
    }
    // Re-render start screen if game is not running
    if (rendererRef.current && !isRunning && !gameOver) {
      rendererRef.current.renderStartScreen(currentSkin, debugMode);
    }
  }, [debugMode, isRunning, gameOver, currentSkin]);

  // Initialize on mount when profile is available
  useEffect(() => {
    if (!profile) return;

    if (!engineRef.current) {
      void initGame();
    }

    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [profile, initGame]);

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
    debugMode,
    startGame,
    restartGame,
    handleInput,
  };
}
