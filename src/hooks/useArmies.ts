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
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isHost, setIsHost] = useState(false);

  const handleMessage = useCallback((body: unknown) => {
    const state = body as GameState;
    setGameState(state);
    
    // Determinar si el usuario es el host
    if (state.players && state.players.length > 0 && userId) {
      // El host es el primer jugador en la lista
      setIsHost(state.players[0].userId === userId);
    }
  }, [userId]);

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
    gameState,
    isHost,
    connected,
    startGame,
    registerKeyPress,
    leaveLobby: handleLeaveLobby,
  };
}
