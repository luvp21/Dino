import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PixelCard, PixelCardHeader, PixelCardTitle } from '@/components/ui/PixelCard';
import { PixelButton } from '@/components/ui/PixelButton';
import { PixelInput } from '@/components/ui/PixelInput';
import { useGameStore } from '@/store/gameStore';
import { 
  createLobby, 
  joinLobby, 
  leaveLobby, 
  setReady, 
  startGame,
  getAvailableLobbies,
  subscribeLobbyUpdates,
  GameWebSocket,
} from '@/services/lobbyService';
import type { LobbyState } from '@/types/game';

const LobbyPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile, profileId, currentSkin } = useGameStore();
  const [lobby, setLobby] = useState<LobbyState | null>(null);
  const [availableLobbies, setAvailableLobbies] = useState<LobbyState[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [roomIdInput, setRoomIdInput] = useState('');
  const wsRef = useRef<GameWebSocket | null>(null);

  // Fetch available lobbies
  const fetchLobbies = useCallback(async () => {
    const lobbies = await getAvailableLobbies();
    setAvailableLobbies(lobbies);
  }, []);

  useEffect(() => {
    fetchLobbies();
    const interval = setInterval(fetchLobbies, 5000);
    return () => clearInterval(interval);
  }, [fetchLobbies]);

  // Handle WebSocket messages in lobby
  const handleWsMessage = useCallback((data: any) => {
    console.log('[Lobby WS] Received:', data.type, data);

    switch (data.type) {
      case 'room:joined':
        setWsConnected(true);
        if (data.players) {
          setLobby(prev => prev ? {
            ...prev,
            players: data.players.map((p: any) => ({
              id: p.id,
              username: p.username,
              skin: p.skin,
              isReady: p.isReady || false,
              isHost: prev.hostId === p.id,
            }))
          } : prev);
        }
        break;

      case 'player:joined':
      case 'player:left':
      case 'player:ready':
        if (data.players) {
          setLobby(prev => prev ? {
            ...prev,
            players: data.players.map((p: any) => ({
              id: p.id,
              username: p.username,
              skin: p.skin,
              isReady: p.isReady || false,
              isHost: prev.hostId === p.id,
            }))
          } : prev);
        }
        break;

      case 'game:start':
        // Game is starting - navigate to game page
        console.log('[Lobby WS] Game starting, navigating...');
        setCountdown(3);
        break;
    }
  }, []);

  // Connect WebSocket when joining/creating lobby
  const connectWebSocket = useCallback(async (lobbyData: LobbyState) => {
    if (!profileId || !profile) return;

    wsRef.current = new GameWebSocket(
      lobbyData.id,
      profileId,
      profile.username,
      handleWsMessage,
      () => {
        console.log('[Lobby WS] Disconnected');
        setWsConnected(false);
      },
      currentSkin
    );

    const connected = await wsRef.current.connect();
    if (connected) {
      setWsConnected(true);
      console.log('[Lobby WS] Connected');
    }
  }, [profileId, profile, currentSkin, handleWsMessage]);

  // Cleanup WebSocket on unmount or lobby leave
  useEffect(() => {
    return () => {
      wsRef.current?.disconnect();
    };
  }, []);

  // Subscribe to lobby updates when in a lobby (database fallback)
  useEffect(() => {
    if (!lobby) return;
    
    const unsubscribe = subscribeLobbyUpdates(lobby.id, (updatedLobby) => {
      setLobby(updatedLobby);
      
      // Handle game starting from database
      if (updatedLobby.status === 'starting' && countdown === null) {
        setCountdown(3);
      }
    });
    
    return unsubscribe;
  }, [lobby?.id, countdown]);

  // Countdown effect
  useEffect(() => {
    if (countdown === null) return;
    
    if (countdown === 0) {
      // Navigate to game
      navigate(`/game/${lobby?.id}`);
      return;
    }
    
    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [countdown, lobby?.id, navigate]);

  const handleCreateLobby = async () => {
    if (!profileId) {
      setError('PROFILE NOT LOADED');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    const newLobby = await createLobby(profileId);
    
    if (newLobby) {
      setLobby(newLobby);
      await connectWebSocket(newLobby);
    } else {
      setError('FAILED TO CREATE LOBBY');
    }
    
    setIsLoading(false);
  };

  const handleJoinLobby = async (lobbyId: string) => {
    if (!profileId) {
      setError('PROFILE NOT LOADED');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    const joinedLobby = await joinLobby(lobbyId, profileId);
    
    if (joinedLobby) {
      setLobby(joinedLobby);
      await connectWebSocket(joinedLobby);
    } else {
      setError('FAILED TO JOIN LOBBY - ROOM MAY NOT EXIST');
    }
    
    setIsLoading(false);
  };

  const handleJoinByRoomId = async () => {
    if (!roomIdInput.trim()) {
      setError('ENTER A ROOM ID');
      return;
    }
    await handleJoinLobby(roomIdInput.trim());
    setRoomIdInput('');
  };

  const handleLeaveLobby = async () => {
    if (!lobby || !profileId) return;
    
    wsRef.current?.disconnect();
    setWsConnected(false);
    await leaveLobby(lobby.id, profileId);
    setLobby(null);
  };

  const handleToggleReady = async () => {
    if (!lobby || !profileId) return;
    
    const currentPlayer = lobby.players.find(p => p.id === profileId);
    if (!currentPlayer) return;
    
    // Send via WebSocket
    wsRef.current?.sendReady();
    
    // Also update database
    await setReady(lobby.id, profileId, !currentPlayer.isReady);
  };

  const handleStartGame = async () => {
    if (!lobby) return;
    
    // Send start via WebSocket first (for real-time sync)
    wsRef.current?.sendStart();
    
    // Also update database status
    const success = await startGame(lobby.id);
    if (!success) {
      setError('FAILED TO START GAME');
    }
  };

  const isHost = lobby?.hostId === profileId;
  const currentPlayer = lobby?.players.find(p => p.id === profileId);
  const nonHostPlayers = lobby?.players.filter(p => !p.isHost) || [];
  const allNonHostsReady = nonHostPlayers.length === 0 || nonHostPlayers.every(p => p.isReady);
  const canStart = isHost && lobby && lobby.players.length >= 1 && allNonHostsReady;

  // Copy room code to clipboard
  const copyRoomCode = () => {
    if (lobby?.roomCode) {
      navigator.clipboard.writeText(lobby.roomCode);
    }
  };

  // Countdown overlay
  if (countdown !== null) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
        <div className="text-center">
          <div className="text-[64px] animate-pulse-pixel">{countdown || 'GO!'}</div>
          <p className="text-[12px] text-muted-foreground mt-4">
            GAME STARTING...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-[16px] md:text-[20px]">MULTIPLAYER LOBBY</h1>
        <p className="text-[8px] text-muted-foreground">
          {lobby ? 'WAITING FOR PLAYERS' : 'CREATE OR JOIN A GAME'}
        </p>
      </div>

      {error && (
        <div className="pixel-border bg-destructive/10 p-3 text-center text-[10px]">
          {error}
        </div>
      )}

      {!lobby ? (
        <>
          {/* Create Lobby */}
          <PixelCard className="text-center">
            <PixelCardHeader>
              <PixelCardTitle>CREATE NEW GAME</PixelCardTitle>
            </PixelCardHeader>
            <p className="text-[8px] text-muted-foreground mb-4">
              HOST A NEW MULTIPLAYER MATCH
            </p>
            <PixelButton onClick={handleCreateLobby} disabled={isLoading}>
              {isLoading ? 'CREATING...' : 'CREATE LOBBY'}
            </PixelButton>
          </PixelCard>

          {/* Join by Room ID */}
          <PixelCard>
            <PixelCardHeader>
              <PixelCardTitle>JOIN BY CODE</PixelCardTitle>
            </PixelCardHeader>
            <p className="text-[8px] text-muted-foreground mb-4">
              ENTER 6-CHARACTER CODE OR FULL ROOM ID
            </p>
            <div className="flex gap-2">
              <PixelInput
                placeholder="ABC123"
                value={roomIdInput}
                onChange={(e) => setRoomIdInput(e.target.value.toUpperCase())}
                className="flex-1 text-center tracking-widest font-mono"
                maxLength={36}
              />
              <PixelButton onClick={handleJoinByRoomId} disabled={isLoading || !roomIdInput.trim()}>
                JOIN
              </PixelButton>
            </div>
          </PixelCard>

          {/* Available Lobbies */}
          <PixelCard>
            <PixelCardHeader>
              <div className="flex items-center justify-between">
                <PixelCardTitle>AVAILABLE GAMES</PixelCardTitle>
                <PixelButton size="sm" variant="ghost" onClick={fetchLobbies}>
                  REFRESH
                </PixelButton>
              </div>
            </PixelCardHeader>
            
            {availableLobbies.length === 0 ? (
              <p className="text-center text-[10px] text-muted-foreground py-4">
                NO GAMES AVAILABLE. CREATE ONE!
              </p>
            ) : (
              <div className="space-y-2">
                {availableLobbies.map((l) => (
                  <div
                    key={l.id}
                    className="flex items-center justify-between p-3 border-2 border-border"
                  >
                    <div>
                      <div className="text-[10px]">
                        HOST: {l.players.find(p => p.isHost)?.username || 'UNKNOWN'}
                      </div>
                      <div className="text-[8px] text-muted-foreground">
                        PLAYERS: {l.players.length}/{l.maxPlayers}
                      </div>
                    </div>
                    <PixelButton
                      size="sm"
                      onClick={() => handleJoinLobby(l.id)}
                      disabled={isLoading || l.players.length >= l.maxPlayers}
                    >
                      JOIN
                    </PixelButton>
                  </div>
                ))}
              </div>
            )}
          </PixelCard>
        </>
      ) : (
        <>
          {/* Lobby Info */}
          <PixelCard>
            <PixelCardHeader>
              <div className="flex items-center justify-between">
                <PixelCardTitle>
                  {isHost ? 'YOUR LOBBY' : 'JOINED LOBBY'}
                </PixelCardTitle>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-yellow-500'}`} />
                  <span className="text-[8px] text-muted-foreground">
                    {lobby.players.length}/{lobby.maxPlayers} PLAYERS
                  </span>
                </div>
              </div>
            </PixelCardHeader>

            {/* Room ID for sharing */}
            <div className="mb-4 p-2 border-2 border-dashed border-border">
              <div className="text-[8px] text-muted-foreground mb-1">ROOM CODE</div>
              <div className="flex items-center gap-2">
                <code className="text-[14px] font-mono tracking-widest font-bold">
                  {lobby.roomCode}
                </code>
                <PixelButton size="sm" variant="ghost" onClick={copyRoomCode}>
                  COPY
                </PixelButton>
              </div>
            </div>
            
            {/* Player List */}
            <div className="space-y-2 mb-4">
              {lobby.players.map((player) => (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-2 border-2 border-border ${
                    player.id === profileId ? 'bg-accent' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] ${player.isReady || player.isHost ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {player.isHost ? '★' : (player.isReady ? '✓' : '○')}
                    </span>
                    <span className="text-[10px]">{player.username}</span>
                    {player.isHost && (
                      <span className="text-[6px] px-1 border border-border">HOST</span>
                    )}
                    {player.id === profileId && (
                      <span className="text-[6px] px-1 border border-border">YOU</span>
                    )}
                  </div>
                  <span className="text-[8px] text-muted-foreground">
                    {player.isHost ? 'READY' : (player.isReady ? 'READY' : 'NOT READY')}
                  </span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 justify-center">
              {!isHost && (
                <PixelButton
                  variant={currentPlayer?.isReady ? 'outline' : 'primary'}
                  onClick={handleToggleReady}
                >
                  {currentPlayer?.isReady ? 'NOT READY' : 'READY'}
                </PixelButton>
              )}
              
              {isHost && (
                <PixelButton
                  onClick={handleStartGame}
                  disabled={!canStart}
                >
                  START GAME
                </PixelButton>
              )}
              
              <PixelButton variant="outline" onClick={handleLeaveLobby}>
                LEAVE
              </PixelButton>
            </div>
            
            {isHost && !canStart && nonHostPlayers.length > 0 && (
              <p className="text-center text-[8px] text-muted-foreground mt-4">
                WAITING FOR ALL PLAYERS TO BE READY
              </p>
            )}

            {isHost && lobby.players.length === 1 && (
              <p className="text-center text-[8px] text-muted-foreground mt-4">
                YOU CAN START SOLO OR WAIT FOR OTHERS
              </p>
            )}
          </PixelCard>

          {/* Game Info */}
          <PixelCard className="text-center">
            <PixelCardHeader>
              <PixelCardTitle>GAME INFO</PixelCardTitle>
            </PixelCardHeader>
            <div className="grid grid-cols-2 gap-4 text-[10px]">
              <div>
                <div className="text-muted-foreground text-[8px]">SEED</div>
                <div className="font-mono">{lobby.seed}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-[8px]">MODE</div>
                <div>RACE</div>
              </div>
            </div>
            <p className="text-[8px] text-muted-foreground mt-4">
              ALL PLAYERS WILL FACE THE SAME OBSTACLES
            </p>
          </PixelCard>
        </>
      )}

      {/* Back Button */}
      <div className="text-center">
        <PixelButton variant="outline" onClick={() => navigate('/')}>
          BACK TO MENU
        </PixelButton>
      </div>
    </div>
  );
};

export default LobbyPage;