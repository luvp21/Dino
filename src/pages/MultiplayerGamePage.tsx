import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameStore } from '@/store/gameStore';
import { MultiplayerGameEngine } from '@/game/MultiplayerGameEngine';
import { DinoGameRenderer } from '@/game/DinoGameRenderer';
import { PixelButton } from '@/components/ui/PixelButton';
import { PixelCard, PixelCardHeader, PixelCardTitle } from '@/components/ui/PixelCard';
import { SoundControls } from '@/components/ui/SoundControls';
import { soundEngine } from '@/services/soundEngine';
import { 
  getLobbyState, 
  submitGameResult, 
  GameWebSocket,
} from '@/services/lobbyService';
import { GAME_CONFIG, type LobbyState, type GameResult, type GameInput } from '@/types/game';

const MultiplayerGamePage: React.FC = () => {
  const { lobbyId } = useParams<{ lobbyId: string }>();
  const navigate = useNavigate();
  const { profile, profileId, currentSkin, updateProfile } = useGameStore();
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<MultiplayerGameEngine | null>(null);
  const rendererRef = useRef<DinoGameRenderer | null>(null);
  const wsRef = useRef<GameWebSocket | null>(null);
  const animationFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const accumulatorRef = useRef<number>(0);
  
  const [lobby, setLobby] = useState<LobbyState | null>(null);
  const [gameStatus, setGameStatus] = useState<'loading' | 'connecting' | 'waiting' | 'countdown' | 'playing' | 'finished'>('loading');
  const [countdown, setCountdown] = useState<number>(3);
  const [results, setResults] = useState<GameResult[]>([]);
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [connectedPlayers, setConnectedPlayers] = useState<string[]>([]);
  const [wsConnected, setWsConnected] = useState(false);

  const FRAME_TIME = 1000 / GAME_CONFIG.TICK_RATE;

  const [isHost, setIsHost] = useState(false);

  // Handle WebSocket messages
  const handleWsMessage = useCallback((data: any) => {
    console.log('[WS] Received:', data.type, data);

    switch (data.type) {
      case 'room:joined': {
        console.log('[WS] Joined room, seed:', data.seed, 'status:', data.status);
        setWsConnected(true);
        setConnectedPlayers(data.players?.map((p: any) => p.id) || []);

        // Check if we're the first player (host)
        if (data.players?.length === 1 && data.players[0].id === profileId) {
          setIsHost(true);
        }

        // Always sync engine to the server-provided seed + player list (so we can't miss game:start)
        if (canvasRef.current && data.seed && Array.isArray(data.players)) {
          const players = data.players.map((p: any) => ({
            id: p.id,
            username: p.username,
            skin: p.skin,
          }));
          engineRef.current = new MultiplayerGameEngine(data.seed, players);
          rendererRef.current?.render(engineRef.current.getState(), profileId || '');
        }

        // IMPORTANT: don't overwrite countdown/playing with waiting
        const roomStatus = (data.status as string) || 'waiting';
        if (roomStatus === 'starting') {
          setGameStatus('countdown');
          setCountdown(3);
        } else if (roomStatus === 'in-game') {
          setGameStatus('countdown');
          setCountdown(0); // start immediately
        } else if (roomStatus === 'finished') {
          setGameStatus('finished');
        } else {
          setGameStatus((prev) => (prev === 'countdown' || prev === 'playing' ? prev : 'waiting'));
        }
        break;
      }

      case 'player:joined':
        console.log('[WS] Player joined:', data.playerName);
        setConnectedPlayers(data.players?.map((p: any) => p.id) || []);
        break;

      case 'player:left':
        console.log('[WS] Player left:', data.playerId);
        setConnectedPlayers(data.players?.map((p: any) => p.id) || []);
        break;

      case 'game:start':
        console.log('[WS] Game starting with seed:', data.seed);
        // Reinitialize engine with the authoritative seed
        if (canvasRef.current && data.players) {
          const players = data.players.map((p: any) => ({
            id: p.id,
            username: p.username,
            skin: p.skin,
          }));
          engineRef.current = new MultiplayerGameEngine(data.seed, players);
          if (rendererRef.current) {
            rendererRef.current.render(engineRef.current.getState(), profileId || '');
          }
        }
        setGameStatus('countdown');
        setCountdown(3);
        break;

      case 'game:input':
        // Apply remote player input to local engine
        if (engineRef.current && data.input) {
          const input: GameInput = data.input;
          // Only queue if it's from another player
          if (input.playerId !== profileId) {
            console.log('[WS] Applying remote input:', input.playerId, input.action);
            engineRef.current.queueInput(input);
          }
        }
        break;

      case 'player:state':
        // Remote player state update for visual sync
        console.log('[WS] Player state update:', data.playerId);
        break;

      case 'player:gameover':
        console.log('[WS] Player game over:', data.playerId, 'distance:', data.distance);
        if (data.playerId !== profileId && engineRef.current) {
          // Mark remote player as dead in engine
          engineRef.current.markPlayerDead(data.playerId, data.score, data.distance);
        }
        break;

      case 'game:finished':
        console.log('[WS] Game finished, results:', data.results);
        setResults(data.results || []);
        setGameStatus('finished');
        cancelAnimationFrame(animationFrameRef.current);
        break;

      case 'error':
        console.error('[WS] Error:', data.message);
        break;
    }
  }, [profileId]);

  // Load lobby and connect WebSocket
  useEffect(() => {
    if (!lobbyId || !profileId) {
      if (!lobbyId) navigate('/lobby');
      return;
    }
    
    const loadAndConnect = async () => {
      // Load lobby data
      const lobbyData = await getLobbyState(lobbyId);
      if (!lobbyData) {
        navigate('/lobby');
        return;
      }
      setLobby(lobbyData);
      
      // Check if we're the host
      if (lobbyData.hostId === profileId) {
        setIsHost(true);
      }
      
      // Initialize canvas with proper dimensions FIRST
      if (canvasRef.current) {
        canvasRef.current.width = GAME_CONFIG.CANVAS_WIDTH;
        canvasRef.current.height = GAME_CONFIG.CANVAS_HEIGHT;
      }
      
      // Initialize renderer
      if (canvasRef.current && !rendererRef.current) {
        rendererRef.current = new DinoGameRenderer(canvasRef.current, currentSkin);
      }
      
      // Initialize engine with lobby data
      const players = lobbyData.players.map(p => ({
        id: p.id,
        username: p.username,
        skin: p.skin,
      }));
      engineRef.current = new MultiplayerGameEngine(lobbyData.seed, players);
      
      // Render initial state
      if (rendererRef.current && engineRef.current) {
        rendererRef.current.render(engineRef.current.getState(), profileId);
      }

      // Connect WebSocket
      const playerProfile = lobbyData.players.find(p => p.id === profileId);
      wsRef.current = new GameWebSocket(
        lobbyId,
        profileId,
        playerProfile?.username || profile?.username || 'PLAYER',
        handleWsMessage,
        () => {
          console.log('[WS] Disconnected');
          setWsConnected(false);
        }
      );
      
      const connected = await wsRef.current.connect();
      if (connected) {
        setWsConnected(true);
        console.log('[WS] Connected successfully');
        
        // If coming from lobby where game was already started, auto-start countdown
        if (lobbyData.status === 'starting' || lobbyData.status === 'in-game') {
          console.log('[WS] Game already started from lobby, starting countdown');
          setGameStatus('countdown');
          setCountdown(3);
        } else {
          setGameStatus('waiting');
        }
      } else {
        console.error('[WS] Failed to connect');
        // Even if WS fails, if lobby is in starting state, start the game
        if (lobbyData.status === 'starting' || lobbyData.status === 'in-game') {
          setGameStatus('countdown');
          setCountdown(3);
        } else {
          setGameStatus('waiting');
        }
      }
    };
    
    loadAndConnect();
    
    return () => {
      wsRef.current?.disconnect();
    };
  }, [lobbyId, profileId, navigate, currentSkin, handleWsMessage, profile?.username]);

  // Countdown effect
  useEffect(() => {
    if (gameStatus !== 'countdown') return;
    
    if (countdown === 0) {
      startGame();
      return;
    }
    
    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [gameStatus, countdown]);

  // Start the game
  const startGame = useCallback(() => {
    if (!engineRef.current) return;
    
    setGameStatus('playing');
    setIsGameOver(false);
    engineRef.current.start();
    soundEngine.startMusic();
    lastTimeRef.current = performance.now();
    accumulatorRef.current = 0;
    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, []);

  // Game loop with state broadcasting
  const gameLoop = useCallback((timestamp: number) => {
    if (!engineRef.current || !rendererRef.current) return;

    const deltaTime = timestamp - lastTimeRef.current;
    lastTimeRef.current = timestamp;
    accumulatorRef.current += deltaTime;

    let stateChanged = false;

    while (accumulatorRef.current >= FRAME_TIME) {
      const state = engineRef.current.tick();
      accumulatorRef.current -= FRAME_TIME;
      stateChanged = true;

      // Check local player status
      const localPlayer = state.players.find(p => p.id === profileId);
      if (localPlayer && !localPlayer.isAlive && !isGameOver) {
        handleLocalGameOver(localPlayer.score, localPlayer.distance);
      }

      // Broadcast state periodically (every 10 frames)
      if (wsRef.current && state.frame % 10 === 0 && localPlayer) {
        wsRef.current.send({
          type: 'game:state',
          state: {
            y: localPlayer.y,
            isAlive: localPlayer.isAlive,
            score: localPlayer.score,
            distance: localPlayer.distance,
            isJumping: localPlayer.isJumping,
            isDucking: localPlayer.isDucking,
          }
        });
      }

      // Check if all players are dead
      if (state.isGameOver) {
        handleAllPlayersFinished(state);
        return;
      }
    }

    // Render
    const state = engineRef.current.getState();
    rendererRef.current.render(state, profileId || '');
    setScore(state.players.find(p => p.id === profileId)?.score || 0);

    if (gameStatus === 'playing') {
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    }
  }, [profileId, isGameOver, FRAME_TIME, gameStatus]);

  // Handle local player game over
  const handleLocalGameOver = async (finalScore: number, finalDistance: number) => {
    setIsGameOver(true);
    
    // Play sounds
    soundEngine.playHit();
    setTimeout(() => soundEngine.playGameOver(), 200);
    
    // Notify server
    wsRef.current?.sendGameOver(finalScore, Math.floor(finalDistance));
    
    // Submit result to database
    if (profileId && lobbyId) {
      await submitGameResult(
        profileId,
        lobbyId,
        Math.floor(finalDistance),
        finalScore,
        1,
        lobby?.seed || 0
      );
    }
  };

  // Handle all players finished
  const handleAllPlayersFinished = (state: ReturnType<MultiplayerGameEngine['getState']>) => {
    cancelAnimationFrame(animationFrameRef.current);
    setGameStatus('finished');
    soundEngine.stopMusic();
    
    // Calculate results
    const gameResults: GameResult[] = state.players
      .map((p) => ({
        playerId: p.id,
        username: p.username,
        distance: Math.floor(p.distance),
        score: p.score,
        placement: 0,
        timestamp: new Date().toISOString(),
      }))
      .sort((a, b) => b.distance - a.distance)
      .map((r, index) => ({ ...r, placement: index + 1 }));
    
    setResults(gameResults);
    
    // Update profile stats
    const localResult = gameResults.find(r => r.playerId === profileId);
    if (localResult && profile) {
      updateProfile({
        totalMatches: profile.totalMatches + 1,
        bestDistance: Math.max(profile.bestDistance, localResult.distance),
      });
    }
  };

  // Handle input with WebSocket broadcast
  const handleInput = useCallback((action: 'jump' | 'duck' | 'release') => {
    if (!engineRef.current || !profileId || isGameOver || gameStatus !== 'playing') return;

    // Play sound effects
    if (action === 'jump') {
      soundEngine.playJump();
    } else if (action === 'duck') {
      soundEngine.playDuck();
    }

    const state = engineRef.current.getState();
    const input: GameInput = {
      frame: state.frame + GAME_CONFIG.INPUT_DELAY,
      action,
      playerId: profileId,
    };
    
    // Queue locally
    engineRef.current.queueInput(input);
    
    // Broadcast to other players
    wsRef.current?.sendInput({ frame: input.frame, action });
    
    console.log('[Input] Sent:', action, 'for frame:', input.frame);
  }, [profileId, isGameOver, gameStatus]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return; // Ignore held keys
      
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        handleInput('jump');
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
  }, [handleInput]);

  // Touch controls
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      handleInput('jump');
    };

    canvas.addEventListener('touchstart', handleTouchStart);
    return () => canvas.removeEventListener('touchstart', handleTouchStart);
  }, [handleInput]);

  // Cleanup
  useEffect(() => {
    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      wsRef.current?.disconnect();
    };
  }, []);

  if (gameStatus === 'loading' || gameStatus === 'connecting') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-[12px] animate-pulse-pixel">
          {gameStatus === 'loading' ? 'LOADING GAME...' : 'CONNECTING TO SERVER...'}
        </p>
        {gameStatus === 'connecting' && (
          <div className="text-[8px] text-muted-foreground">
            ESTABLISHING WEBSOCKET CONNECTION
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Countdown Overlay */}
      {gameStatus === 'countdown' && (
        <div className="fixed inset-0 bg-background/90 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="text-[64px] animate-pulse-pixel">
              {countdown === 0 ? 'GO!' : countdown}
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">
              GET READY TO JUMP!
            </p>
          </div>
        </div>
      )}

      {/* Loading overlay while connecting */}
      {gameStatus === 'waiting' && (
        <div className="fixed inset-0 bg-background/90 flex items-center justify-center z-50">
          <div className="text-center space-y-4">
            <p className="text-[12px] animate-pulse-pixel">
              {wsConnected ? 'WAITING FOR GAME TO START...' : 'CONNECTING...'}
            </p>
            <p className="text-[8px] text-muted-foreground">
              {connectedPlayers.length} PLAYER{connectedPlayers.length !== 1 ? 'S' : ''} CONNECTED
            </p>
            <PixelButton variant="outline" onClick={() => navigate('/lobby')}>
              BACK TO LOBBY
            </PixelButton>
          </div>
        </div>
      )}

      {/* Game Canvas */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="game-canvas pixel-border-thick w-full max-w-[800px] mx-auto"
          style={{ 
            aspectRatio: '800/200',
            maxHeight: '200px',
          }}
        />
        
        {/* Sound Controls */}
        <div className="absolute top-2 left-2">
          <SoundControls />
        </div>
        
        {/* Connection indicator */}
        <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        
        {/* Game Over Indicator */}
        {isGameOver && gameStatus === 'playing' && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50">
            <div className="text-center">
              <p className="text-[14px]">YOU'RE OUT!</p>
              <p className="text-[10px] text-muted-foreground">
                WATCHING OTHER PLAYERS...
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Score Display */}
      {gameStatus === 'playing' && (
        <div className="text-center text-[14px] font-mono">
          SCORE: {score}
        </div>
      )}

      {/* Controls hint */}
      <div className="text-center text-[8px] text-muted-foreground">
        SPACE/UP = JUMP | DOWN = DUCK | TAP = JUMP
      </div>

      {/* Results */}
      {gameStatus === 'finished' && (
        <PixelCard>
          <PixelCardHeader>
            <PixelCardTitle>RACE RESULTS</PixelCardTitle>
          </PixelCardHeader>
          
          <div className="space-y-2">
            {results.map((result) => (
              <div
                key={result.playerId}
                className={`flex items-center justify-between p-2 border-2 border-border ${
                  result.playerId === profileId ? 'bg-accent' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-[14px] w-8">#{result.placement}</span>
                  <span className="text-[10px]">{result.username}</span>
                  {result.playerId === profileId && (
                    <span className="text-[6px] px-1 border border-border">YOU</span>
                  )}
                </div>
                <span className="text-[12px] font-mono">{result.distance}m</span>
              </div>
            ))}
          </div>
          
          <div className="flex justify-center gap-4 mt-4">
            <PixelButton onClick={() => navigate('/lobby')}>
              NEW GAME
            </PixelButton>
            <PixelButton variant="outline" onClick={() => navigate('/')}>
              MENU
            </PixelButton>
          </div>
        </PixelCard>
      )}

      {/* Players Status */}
      {gameStatus === 'playing' && lobby && (
        <div className="flex justify-center gap-4 text-[8px]">
          {lobby.players.map(player => {
            const playerState = engineRef.current?.getPlayer(player.id);
            return (
              <div 
                key={player.id}
                className={`px-2 py-1 border border-border ${
                  playerState?.isAlive ? '' : 'opacity-50 line-through'
                } ${player.id === profileId ? 'bg-accent' : ''}`}
              >
                {player.username}: {playerState?.score || 0}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MultiplayerGamePage;
