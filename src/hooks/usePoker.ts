import { useState, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';

const BASE_URL = import.meta.env.VITE_API_GATEWAY_URL ?? 'http://localhost:8079';
const POKER_WS_URL = import.meta.env.VITE_POKER_URL ?? 'http://localhost:8093';

export type PokerAction = 'FOLD' | 'CHECK' | 'CALL' | 'RAISE';

export interface Card {
  suit: string;
  value: string;
}

export interface PokerPlayer {
  id: string;
  username: string;
  chips: number;
  folded: boolean;
  currentBet: number;
  isCurrentTurn: boolean;
}

export interface GamePublicDTO {
  id: string;
  phase: string;
  communityCards: Card[];
  pot: number;
  currentBet: number;
  players: PokerPlayer[];
  currentPlayerId: string;
}

export interface PlayerPrivateDTO {
  playerId: string;
  hand: Card[];
}

export interface LobbyDTO {
  id: string;
  name: string;
  buyIn: number;
  status: string;
  players: { id: string; username: string }[];
  gameId?: string;
}

const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token') ?? ''}`,
});

export function usePoker(userId: string | undefined) {
  const [lobbies, setLobbies] = useState<LobbyDTO[]>([]);
  const [currentLobby, setCurrentLobby] = useState<LobbyDTO | null>(null);
  const [gameState, setGameState] = useState<GamePublicDTO | null>(null);
  const [myHand, setMyHand] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const gameId = currentLobby?.gameId;

  const handleMessage = useCallback((body: unknown) => {
    const msg = body as GamePublicDTO;
    if (msg?.phase) setGameState(msg);
  }, []);

  const handlePrivateMessage = useCallback((body: unknown) => {
    const msg = body as PlayerPrivateDTO;
    if (msg?.hand) setMyHand(msg.hand);
  }, []);

  const { connected, sendMessage } = useWebSocket({
    url: `${POKER_WS_URL}/ws-poker`,
    topic: gameId ? `/topic/game/${gameId}` : '',
    privateTopic: userId ? `/user/queue/hand` : '',
    onMessage: handleMessage,
    onPrivateMessage: handlePrivateMessage,
    enabled: !!gameId,
  });

  const fetchLobbies = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/v1/lobby`, { headers: authHeaders() });
      const data = await res.json();
      setLobbies(data.data ?? []);
    } catch {
      setError('Error cargando lobbies');
    }
  }, []);

  const createLobby = useCallback(async (playerName: string, credits: number): Promise<LobbyDTO | null> => {
    setIsLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/v1/lobby`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ playerId: userId, playerName, credits }),
      });
      const data = await res.json();
      const lobby = data.data as LobbyDTO;
      setCurrentLobby(lobby);
      return lobby;
    } catch {
      setError('Error creando lobby');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const joinLobby = useCallback(async (lobbyId: string, playerName: string, credits: number): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/v1/lobby/player`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ lobbyId, playerId: userId, playerName, credits }),
      });
      const data = await res.json();
      setCurrentLobby(data.data as LobbyDTO);
      return true;
    } catch {
      setError('Error uniéndose al lobby');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const startGame = useCallback(async (lobbyId: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/v1/lobby/${lobbyId}`, {
        method: 'PUT',
        headers: authHeaders(),
      });
      const data = await res.json();
      setCurrentLobby(data.data as LobbyDTO);
      return true;
    } catch {
      setError('Error iniciando partida');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchGameState = useCallback(async (gId: string) => {
    try {
      const res = await fetch(`${BASE_URL}/api/v1/game/${gId}`, { headers: authHeaders() });
      const data = await res.json();
      setGameState(data.data as GamePublicDTO);
    } catch {}
  }, []);

  const dealCards = useCallback(() => {
    if (!gameId) return;
    sendMessage(`/app/game/${gameId}/deal`, {});
  }, [gameId, sendMessage]);

  const nextPhase = useCallback(() => {
    if (!gameId) return;
    sendMessage(`/app/game/${gameId}/phase`, {});
  }, [gameId, sendMessage]);

  const performAction = useCallback((action: PokerAction, amount?: number) => {
    if (!gameId || !userId) return;
    sendMessage(`/app/game/${gameId}/action`, { playerId: userId, action, amount });
  }, [gameId, userId, sendMessage]);

  const leaveLobby = useCallback(async (lobbyId: string) => {
    await fetch(`${BASE_URL}/api/v1/lobby/player/end`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ lobbyId, playerId: userId }),
    });
    setCurrentLobby(null);
    setGameState(null);
    setMyHand([]);
  }, [userId]);

  return {
    lobbies,
    currentLobby,
    gameState,
    myHand,
    connected,
    isLoading,
    error,
    fetchLobbies,
    createLobby,
    joinLobby,
    startGame,
    fetchGameState,
    dealCards,
    nextPhase,
    performAction,
    leaveLobby,
  };
}
