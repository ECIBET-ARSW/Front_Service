// 5Line slot machine hook.
// Single-player. Player selects active lines (1–5) and bet per line,
// then spins. Server returns the 3x5 symbol matrix and winning lines.
import { useState, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';
import { useApi } from './useApi';

const FIVELINE_URL = import.meta.env.VITE_FIVELINE_URL ?? 'http://localhost:8092';

export type SlotSymbol = '🍒' | '🍋' | '🍊' | '🍇' | '⭐' | '💎' | '7️⃣';

export interface FiveLineResult {
  matrix: SlotSymbol[][];   // 3 rows x 5 columns
  winningLines: number[];   // indices of lines that won (0–4)
  totalPayout: number;
}

interface FiveLineSession {
  sessionId: string;
  status: 'READY' | 'SPINNING' | 'FINISHED';
}

export function useFiveLine(userId: string | undefined) {
  const [session, setSession] = useState<FiveLineSession | null>(null);
  const [result, setResult] = useState<FiveLineResult | null>(null);
  const [activeLines, setActiveLines] = useState(1);
  const [betPerLine, setBetPerLine] = useState(1000);
  const { request, isLoading, error } = useApi<FiveLineSession>();

  const handleMessage = useCallback((body: unknown) => {
    const msg = body as { type: string; payload: unknown };
    if (msg.type === 'SPIN_RESULT') setResult(msg.payload as FiveLineResult);
    if (msg.type === 'SESSION_UPDATE') setSession(msg.payload as FiveLineSession);
  }, []);

  const { connected, sendMessage } = useWebSocket({
    url: `${FIVELINE_URL}/ws`,
    topic: session ? `/topic/5line/${session.sessionId}` : '',
    onMessage: handleMessage,
    enabled: !!session,
  });

  const createSession = useCallback(async () => {
    const data = await request(`${FIVELINE_URL}/api/games/5line/session`, { method: 'POST' });
    if (data) setSession(data);
  }, [request]);

  const spin = useCallback(() => {
    if (!session || !userId) return;
    sendMessage(`/app/5line/${session.sessionId}/spin`, {
      userId,
      activeLines,
      betPerLine,
    });
    setResult(null);
  }, [session, userId, activeLines, betPerLine, sendMessage]);

  return {
    session,
    result,
    connected,
    isLoading,
    error,
    activeLines,
    betPerLine,
    setActiveLines,
    setBetPerLine,
    createSession,
    spin,
  };
}
