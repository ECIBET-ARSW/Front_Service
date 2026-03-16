// Poker Texas Hold'em hook.
// Multiplayer (up to 6 players). Manages table state, player hand,
// community cards, and available actions per turn via WebSocket.
import { useState, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';
import { useApi } from './useApi';

const POKER_URL = import.meta.env.VITE_POKER_URL ?? 'http://localhost:8093';

export type PokerAction = 'FOLD' | 'CHECK' | 'CALL' | 'RAISE';
type GamePhase = 'WAITING' | 'PRE_FLOP' | 'FLOP' | 'TURN' | 'RIVER' | 'SHOWDOWN';

export interface Card {
  suit: '♠' | '♥' | '♦' | '♣';
  value: string;  // '2'–'10', 'J', 'Q', 'K', 'A'
}

export interface PokerPlayer {
  userId: string;
  username: string;
  chips: number;
  hand: Card[];          // Only populated for the current user
  folded: boolean;
  isCurrentTurn: boolean;
}

export interface PokerTableState {
  sessionId: string;
  phase: GamePhase;
  communityCards: Card[];
  pot: number;
  currentBet: number;
  players: PokerPlayer[];
  availableActions: PokerAction[];
}

interface PokerSession {
  sessionId: string;
  status: 'WAITING' | 'IN_PROGRESS' | 'FINISHED';
}

export function usePoker(userId: string | undefined) {
  const [session, setSession] = useState<PokerSession | null>(null);
  const [tableState, setTableState] = useState<PokerTableState | null>(null);
  const { request, isLoading, error } = useApi<PokerSession>();

  const handleMessage = useCallback((body: unknown) => {
    const msg = body as { type: string; payload: unknown };
    if (msg.type === 'TABLE_STATE') setTableState(msg.payload as PokerTableState);
    if (msg.type === 'SESSION_UPDATE') setSession(msg.payload as PokerSession);
  }, []);

  const { connected, sendMessage } = useWebSocket({
    url: `${POKER_URL}/ws`,
    topic: session ? `/topic/poker/${session.sessionId}` : '',
    onMessage: handleMessage,
    enabled: !!session,
  });

  const createTable = useCallback(async () => {
    const data = await request(`${POKER_URL}/api/games/poker/session`, { method: 'POST' });
    if (data) setSession(data);
  }, [request]);

  const joinTable = useCallback(async (sessionId: string) => {
    const data = await request(`${POKER_URL}/api/games/poker/session/${sessionId}/join`, {
      method: 'POST',
    });
    if (data) setSession(data);
  }, [request]);

  const performAction = useCallback((action: PokerAction, amount?: number) => {
    if (!session || !userId) return;
    sendMessage(`/app/poker/${session.sessionId}/action`, { userId, action, amount });
  }, [session, userId, sendMessage]);

  const leaveTable = useCallback(() => {
    setSession(null);
    setTableState(null);
  }, []);

  return {
    session,
    tableState,
    connected,
    isLoading,
    error,
    createTable,
    joinTable,
    performAction,
    leaveTable,
  };
}
