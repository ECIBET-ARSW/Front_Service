import { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';
import { getLobbies, createLobby, joinLobby, leaveLobby, CreateLobbyRequest, JoinLobbyRequest, Lobby, GameState } from '../services/armies/armiesApi';

const ARMIES_WS_URL = import.meta.env.VITE_ARMIES_WS_URL ?? 'http://localhost:8094';

// Hook para la página de lobby (lista de salas)
export function useArmiesLobby(userId: string | undefined) {
  const [lobbies, setLobbies] = useState<Lobby[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLobbies = useCallback(async () => {
    try {
      const data = await getLobbies();
      setLobbies(data.filter(l => l.status === 'WAITING'));
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    fetchLobbies();
    const interval = setInterval(fetchLobbies, 3000);
    return () => clearInterval(interval);
  }, [fetchLobbies]);

  const handleCreateLobby = async (lobbyName: string, betAmount: number): Promise<string | null> => {
    if (!userId) return null;
    setLoading(true);
    try {
      const data: CreateLobbyRequest = {
        userId,
        username: 'Player', // Se debe pasar desde el componente
        lobbyName,
        betAmount
      };
      const lobby = await createLobby(data);
      return lobby.id;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleJoinLobby = async (lobbyId: string, username: string): Promise<boolean> => {
    if (!userId) return false;
    setLoading(true);
    try {
      const data: JoinLobbyRequest = { userId, username };
      await joinLobby(lobbyId, data);
      return true;
    } catch (e: any) {
      setError(e.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { lobbies, loading, error, fetchLobbies, createLobby: handleCreateLobby, joinLobby: handleJoinLobby };
}

// Hook para la sala de juego (waiting room y game)
export function useArmiesGame(userId: string | undefined, lobbyId: string | undefined) {
  const [lobby, setLobby] = useState<Lobby | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isHost, setIsHost] = useState(false);

  // Polling del estado del lobby (HTTP)
  useEffect(() => {
    if (!lobbyId) return;
    const fetchLobby = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_ARMIES_URL ?? 'http://localhost:8094'}/api/games/armies/lobbies/${lobbyId}`);
        if (res.ok) {
          const data = await res.json();
          setLobby(data);
          if (userId) {
            setIsHost(data.hostId === userId);
          }
        }
      } catch {}
    };
    fetchLobby();
    const interval = setInterval(fetchLobby, 2000);
    return () => clearInterval(interval);
  }, [lobbyId, userId]);

  const handleMessage = useCallback((body: unknown) => {
    const state = body as GameState;
    setGameState(state);
  }, []);

  const { connected, sendMessage } = useWebSocket({
    url: `${ARMIES_WS_URL}/ws`,
    topic: lobbyId ? `/topic/lobby/${lobbyId}` : '',
    onMessage: handleMessage,
    enabled: !!lobbyId,
  });

  const startGame = useCallback(() => {
    if (!lobbyId || !userId) return;
    sendMessage(`/app/lobby/${lobbyId}/start`, userId);
  }, [lobbyId, userId, sendMessage]);

  const registerKeyPress = useCallback(() => {
    if (!lobbyId || !userId) return;
    sendMessage(`/app/lobby/${lobbyId}/keypress`, userId);
  }, [lobbyId, userId, sendMessage]);

  const handleLeaveLobby = useCallback(async () => {
    if (!lobbyId || !userId) return;
    await leaveLobby(lobbyId, userId);
  }, [lobbyId, userId]);

  return {
    lobby,
    gameState,
    isHost,
    connected,
    startGame,
    registerKeyPress,
    leaveLobby: handleLeaveLobby,
  };
}
