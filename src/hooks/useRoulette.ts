// Roulette game hook.
// Manages session lifecycle, bet placement, and real-time result reception
// via WebSocket. Calls Roulette-Service REST to create/join a session,
// then switches to STOMP for live game state updates.
import { useState, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';
import { useApi } from './useApi';

const ROULETTE_URL = import.meta.env.VITE_ROULETTE_URL ?? 'http://localhost:8090';

export type BetType = 'NUMBER' | 'COLOR' | 'PARITY' | 'DOZEN';
export type RouletteColor = 'RED' | 'BLACK' | 'GREEN';

export interface RouletteBet {
  type: BetType;
  value: string | number;  // e.g. 7, "RED", "ODD", "FIRST"
  amount: number;
}

export interface RouletteResult {
  number: number;
  color: RouletteColor;
  winners: string[];       // userIds that won
  payouts: Record<string, number>;
}

type SessionStatus = 'IDLE' | 'WAITING' | 'BETTING' | 'SPINNING' | 'FINISHED';

interface RouletteSession {
  sessionId: string;
  status: SessionStatus;
  players: string[];
}

export function useRoulette(userId: string | undefined) {
  const [session, setSession] = useState<RouletteSession | null>(null);
  const [result, setResult] = useState<RouletteResult | null>(null);
  const { request, isLoading, error } = useApi<RouletteSession>();

  const handleMessage = useCallback((body: unknown) => {
    const msg = body as { type: string; payload: unknown };
    if (msg.type === 'SESSION_UPDATE') setSession(msg.payload as RouletteSession);
    if (msg.type === 'SPIN_RESULT') setResult(msg.payload as RouletteResult);
  }, []);

  const { connected, sendMessage } = useWebSocket({
    url: `${ROULETTE_URL}/ws`,
    topic: session ? `/topic/roulette/${session.sessionId}` : '',
    onMessage: handleMessage,
    enabled: !!session,
  });

  const createSession = useCallback(async () => {
    const data = await request(`${ROULETTE_URL}/api/games/roulette/session`, { method: 'POST' });
    if (data) setSession(data);
  }, [request]);

  const joinSession = useCallback(async (sessionId: string) => {
    const data = await request(`${ROULETTE_URL}/api/games/roulette/session/${sessionId}/join`, {
      method: 'POST',
    });
    if (data) setSession(data);
  }, [request]);

  const placeBet = useCallback((bet: RouletteBet) => {
    if (!session || !userId) return;
    sendMessage(`/app/roulette/${session.sessionId}/bet`, { ...bet, userId });
  }, [session, userId, sendMessage]);

  const leaveSession = useCallback(() => {
    setSession(null);
    setResult(null);
  }, []);

  return {
    session,
    result,
    connected,
    isLoading,
    error,
    createSession,
    joinSession,
    placeBet,
    leaveSession,
  };
}
