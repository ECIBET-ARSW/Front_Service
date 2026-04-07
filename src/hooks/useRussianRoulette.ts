import { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';

const BASE_URL = import.meta.env.VITE_RUSSIAN_ROULETTE_URL ?? 'http://localhost:8079';
const WS_URL = import.meta.env.VITE_RUSSIAN_ROULETTE_WS_URL ?? 'http://localhost:8091';

const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token') ?? ''}`,
});

export type CardType = 'KING' | 'ACE' | 'QUEEN' | 'JOKER';
export type RoomStatus = 'WAITING' | 'IN_PROGRESS' | 'FINISHED';
export type GameEventType =
  | 'GAME_STARTED' | 'CARDS_PLAYED' | 'ACCUSED'
  | 'SHOT_RESULT'  | 'GAME_OVER'    | 'LOBBY_UPDATE' | 'ERROR';

export interface RoomSummary {
  id: string;
  name: string;
  hostId: string;
  status: RoomStatus;
  buyIn: number;
  pot: number;
  playerCount: number;
  maxPlayers: number;
  playerNames: string[];
}

export interface PlayerState {
  userId: string;
  username: string;
  cardCount: number;
  eliminated: boolean;
  spectator: boolean;
  isCurrentTurn: boolean;
  shotsFired: number;
}

export interface RevealedPlay {
  playerId: string;
  actualCards: CardType[];
  declaredCard: CardType;
  declaredCount: number;
  wasLying: boolean;
  loserPlayerId: string;
}

export interface ShotResult {
  playerId: string;
  eliminated: boolean;
}

export interface GameEvent {
  type: GameEventType;
  message: string;
  currentRound: number;
  activeCard: CardType;
  currentTurnPlayerId: string;
  currentTurnUsername: string;
  lastPlayerId?: string;
  turnTimerSeconds: number;
  players: PlayerState[];
  revealedPlay?: RevealedPlay;
  shotResult?: ShotResult;
  shotsFired?: number;
  totalChambers?: number;
  winnerId?: string;
  winnerUsername?: string;
}

export interface PlayCardsPayload {
  userId: string;
  cards: CardType[];
  declaredCard: CardType;
  declaredCount: number;
}

// ── Hook de lobby — solo para la página de lista de salas ─────────────────────
export function useLobby(userId: string | undefined) {
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRooms = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/games/liars-bar/rooms`, { headers: authHeaders() });
      const data: RoomSummary[] = await res.json();
      setRooms(data);
    } catch {
      setError('Error cargando salas');
    }
  }, []);

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 3000);
    return () => clearInterval(interval);
  }, [fetchRooms]);

  const createRoom = async (username: string, roomName: string, buyIn: number): Promise<string | null> => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/games/liars-bar/rooms`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ userId, username, roomName, buyIn }),
      });
      if (!res.ok) throw new Error('Error creando sala');
      const data: RoomSummary = await res.json();
      return data.id;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = async (roomId: string, username: string): Promise<boolean> => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/games/liars-bar/rooms/${roomId}/join`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ userId, username }),
      });
      if (!res.ok) throw new Error('Error uniéndose a la sala');
      return true;
    } catch (e: any) {
      setError(e.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { rooms, loading, error, fetchRooms, createRoom, joinRoom };
}

// ── Hook de sala — para WaitingRoom y GameTable ───────────────────────────────
export function useGameRoom(userId: string | undefined, roomId: string | undefined) {
  const [room, setRoom] = useState<RoomSummary | null>(null);
  const [gameEvent, setGameEvent] = useState<GameEvent | null>(null);
  const [currentTurnPlayerId, setCurrentTurnPlayerId] = useState<string | null>(null);
  const [myCards, setMyCards] = useState<CardType[]>([]);

  // Polling del estado de la sala
  useEffect(() => {
    if (!roomId) return;
    const fetch_ = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/games/liars-bar/rooms/${roomId}`, { headers: authHeaders() });
        if (res.ok) setRoom(await res.json());
      } catch {}
    };
    fetch_();
    const interval = setInterval(fetch_, 2000);
    return () => clearInterval(interval);
  }, [roomId]);

  const fetchHand = useCallback(async () => {
    if (!roomId || !userId) return;
    try {
      const res = await fetch(`${BASE_URL}/api/games/liars-bar/rooms/${roomId}/hand?userId=${userId}`, { headers: authHeaders() });
      if (res.ok) {
        const cards: CardType[] = await res.json();
        setMyCards(cards);
      }
    } catch {}
  }, [roomId, userId]);

  const handleMessage = useCallback((body: unknown) => {
    const event = body as GameEvent;
    setGameEvent(event);
    if (event.currentTurnPlayerId) {
      setCurrentTurnPlayerId(event.currentTurnPlayerId);
    }
  }, []);

  // Actualizar currentTurnPlayerId también cuando cambia gameEvent
  useEffect(() => {
    if (gameEvent?.currentTurnPlayerId) {
      setCurrentTurnPlayerId(gameEvent.currentTurnPlayerId);
    }
  }, [gameEvent]);

  const { connected, sendMessage } = useWebSocket({
    url: `${WS_URL}/ws`,
    topic: roomId ? `/topic/room/${roomId}` : '',
    onMessage: handleMessage,
    enabled: !!roomId,
  });

  const startGame = useCallback(() => {
    if (!roomId || !userId) return;
    sendMessage(`/app/room/${roomId}/start`, userId);
  }, [roomId, userId, sendMessage]);

  const playCards = useCallback((payload: PlayCardsPayload) => {
    if (!roomId) return;
    sendMessage(`/app/room/${roomId}/play`, payload);
  }, [roomId, sendMessage]);

  const accuse = useCallback(() => {
    if (!roomId || !userId) return;
    sendMessage(`/app/room/${roomId}/accuse`, { userId });
  }, [roomId, userId, sendMessage]);

  const shoot = useCallback(() => {
    if (!roomId || !userId) return;
    sendMessage(`/app/room/${roomId}/shoot`, userId);
  }, [roomId, userId, sendMessage]);

  const pass = useCallback(() => {
    if (!roomId || !userId) return;
    sendMessage(`/app/room/${roomId}/pass`, userId);
  }, [roomId, userId, sendMessage]);

  const leaveRoom = async () => {
    if (!roomId || !userId) return;
    await fetch(`${BASE_URL}/api/games/liars-bar/rooms/${roomId}/leave?userId=${userId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
  };

  return {
    room,
    gameEvent,
    currentTurnPlayerId,
    setCurrentTurnPlayerId,
    myCards,
    setMyCards,
    connected,
    startGame,
    playCards,
    accuse,
    pass,
    shoot,
    leaveRoom,
    fetchHand,
  };
}
