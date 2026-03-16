// Liar's Bar (Russian Roulette) hook.
// Manages lobby (room list), session lifecycle, and the 3 in-game actions:
// play cards, accuse, and shoot.
import { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';
import { useApi } from './useApi';

const BASE_URL = import.meta.env.VITE_RUSSIAN_ROULETTE_URL ?? 'http://localhost:8091';

// ── Types ────────────────────────────────────────────────────────────────────

export type CardType = 'KING' | 'ACE' | 'JOKER';
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
  turnTimerSeconds: number;
  players: PlayerState[];
  revealedPlay?: RevealedPlay;
  shotResult?: ShotResult;
  winnerId?: string;
  winnerUsername?: string;
}

export interface PlayCardsPayload {
  userId: string;
  cards: CardType[];
  declaredCard: CardType;
  declaredCount: number;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useRussianRoulette(userId: string | undefined) {
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [currentRoom, setCurrentRoom] = useState<RoomSummary | null>(null);
  const [gameEvent, setGameEvent] = useState<GameEvent | null>(null);
  const [myCards, setMyCards] = useState<CardType[]>([]);
  const { request, isLoading, error } = useApi<RoomSummary>();

  // ── WebSocket: lista global de salas ──────────────────────────────────────
  const handleLobbyMessage = useCallback((body: unknown) => {
    const event = body as GameEvent;
    if (event.type === 'LOBBY_UPDATE') fetchRooms();
  }, []);

  useWebSocket({
    url: `${BASE_URL}/ws`,
    topic: '/topic/room/lobby',
    onMessage: handleLobbyMessage,
    enabled: true,
  });

  // ── WebSocket: sala activa ────────────────────────────────────────────────
  const handleRoomMessage = useCallback((body: unknown) => {
    const event = body as GameEvent;
    setGameEvent(event);

    // Actualiza mis cartas cuando empieza el juego o nueva ronda
    if (event.type === 'GAME_STARTED' || event.type === 'SHOT_RESULT') {
      const me = event.players.find(p => p.userId === userId);
      if (me) setMyCards(prev => prev); // el servidor no envía cartas reales al broadcast
    }
  }, [userId]);

  const { connected, sendMessage } = useWebSocket({
    url: `${BASE_URL}/ws`,
    topic: currentRoom ? `/topic/room/${currentRoom.id}` : '',
    onMessage: handleRoomMessage,
    enabled: !!currentRoom,
  });

  // ── REST: lista de salas ──────────────────────────────────────────────────
  const fetchRooms = useCallback(async () => {
    const data = await request(`${BASE_URL}/api/games/liars-bar/rooms`);
    if (data) setRooms(data as unknown as RoomSummary[]);
  }, [request]);

  useEffect(() => { fetchRooms(); }, [fetchRooms]);

  // ── REST: crear sala ──────────────────────────────────────────────────────
  const createRoom = useCallback(async (username: string, roomName: string, buyIn: number) => {
    const data = await request(`${BASE_URL}/api/games/liars-bar/rooms`, {
      method: 'POST',
      body: JSON.stringify({ userId, username, roomName, buyIn }),
    });
    if (data) setCurrentRoom(data);
  }, [userId, request]);

  // ── REST: unirse a sala ───────────────────────────────────────────────────
  const joinRoom = useCallback(async (roomId: string, username: string) => {
    const data = await request(`${BASE_URL}/api/games/liars-bar/rooms/${roomId}/join`, {
      method: 'POST',
      body: JSON.stringify({ userId, username }),
    });
    if (data) setCurrentRoom(data);
  }, [userId, request]);

  // ── REST: salir de sala ───────────────────────────────────────────────────
  const leaveRoom = useCallback(async () => {
    if (!currentRoom) return;
    await request(`${BASE_URL}/api/games/liars-bar/rooms/${currentRoom.id}/leave?userId=${userId}`, {
      method: 'DELETE',
    });
    setCurrentRoom(null);
    setGameEvent(null);
    setMyCards([]);
  }, [currentRoom, userId, request]);

  // ── WebSocket: acciones de juego ──────────────────────────────────────────
  const startGame = useCallback(() => {
    if (!currentRoom) return;
    sendMessage(`/app/room/${currentRoom.id}/start`, userId);
  }, [currentRoom, userId, sendMessage]);

  const playCards = useCallback((payload: PlayCardsPayload) => {
    if (!currentRoom) return;
    sendMessage(`/app/room/${currentRoom.id}/play`, payload);
  }, [currentRoom, sendMessage]);

  const accuse = useCallback(() => {
    if (!currentRoom || !userId) return;
    sendMessage(`/app/room/${currentRoom.id}/accuse`, { userId });
  }, [currentRoom, userId, sendMessage]);

  const shoot = useCallback(() => {
    if (!currentRoom || !userId) return;
    sendMessage(`/app/room/${currentRoom.id}/shoot`, userId);
  }, [currentRoom, userId, sendMessage]);

  return {
    // Lobby
    rooms,
    fetchRooms,
    createRoom,
    joinRoom,
    leaveRoom,
    // Sala actual
    currentRoom,
    connected,
    // Estado del juego
    gameEvent,
    myCards,
    setMyCards,
    // Acciones
    startGame,
    playCards,
    accuse,
    shoot,
    // Estado de la petición
    isLoading,
    error,
  };
}
