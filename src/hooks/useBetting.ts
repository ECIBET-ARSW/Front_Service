// Sports betting hook — connects to Betting-Service real endpoints.
import { useState, useEffect, useCallback, useRef } from 'react';
import { useApi } from './useApi';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const API_GATEWAY_URL = import.meta.env.VITE_API_GATEWAY_URL ?? 'http://localhost:8079';
const BETTING_WS_URL = import.meta.env.VITE_BETTING_URL ?? 'http://localhost:8083';

export interface BettingEvent {
  id: string;
  footballDataId?: number;
  homeTeam: string;
  awayTeam: string;
  competition: string;
  startTime: string;
  utcDate?: string;
  status: 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'CANCELLED';
  minute?: number;
  homeScore?: number;
  awayScore?: number;
  markets?: any[];
}

export interface Selection {
  id: string;
  name: string;
  odds: number;
  marketId: string;
}

export interface Market {
  id: string;
  name: string;
  eventId: string;
  selections: Selection[];
}

export interface PlacedBet {
  id: string;
  userId: string;
  eventId: string;
  selectionId: string;
  selectionName: string;
  odds: number;
  amount: number;
  potentialWin: number;
  status: 'PENDING' | 'WON' | 'LOST' | 'REJECTED';
  createdAt: string;
}

export function useBetting(userId: string | undefined, updateBalance?: (balance: number) => void) {

  const normalizeEvent = (e: any): BettingEvent => ({
    ...e,
    startTime: e.utcDate ?? e.startTime ?? '',
    competition: e.competition ?? e.displayName ?? '',
  });

  const normalizeBet = (b: any): PlacedBet => ({
    ...b,
    selectionName: b.selectionName ?? '',
    odds: b.oddsAtPlacement ?? b.odds ?? 0,
    amount: b.stake ?? b.amount ?? 0,
    potentialWin: b.potentialWin ?? 0,
    createdAt: b.placedAt ?? b.createdAt ?? '',
  });
  const [events, setEvents] = useState<BettingEvent[]>([]);
  const [liveEvents, setLiveEvents] = useState<BettingEvent[]>([]);
  const [myBets, setMyBets] = useState<PlacedBet[]>([]);
  const [selectedBets, setSelectedBets] = useState<{ selectionId: string; odds: number; label: string }[]>([]);
  const { request, isLoading, error } = useApi<BettingEvent[]>();

  const fetchTodayEvents = useCallback(async () => {
    const token = localStorage.getItem('token');
    const data = await request(`${API_GATEWAY_URL}/api/v1/events/today`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (data) setEvents((data as any[]).map(normalizeEvent));
  }, [request]);

  const fetchLiveEvents = useCallback(async () => {
    const token = localStorage.getItem('token');
    const data = await request(`${API_GATEWAY_URL}/api/v1/events/live`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (data) setLiveEvents((data as any[]).map(normalizeEvent));
  }, [request]);

  const fetchEventsByDate = useCallback(async (date: string) => {
    const token = localStorage.getItem('token');
    const data = await request(`${API_GATEWAY_URL}/api/v1/events/by-date?date=${date}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (data) setEvents((data as any[]).map(normalizeEvent));
  }, [request]);

  const fetchMarkets = useCallback(async (eventId: string): Promise<Market[]> => {
    const token = localStorage.getItem('token');
    const data = await request(`${API_GATEWAY_URL}/api/v1/events/${eventId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return (data as any)?.markets ?? [];
  }, [request]);

  const fetchSelections = useCallback(async (marketId: string): Promise<Selection[]> => {
    return [];
  }, []);

  const fetchMyBets = useCallback(async () => {
    if (!userId) return;
    const token = localStorage.getItem('token');
    const data = await request(`${API_GATEWAY_URL}/api/v1/bets/user/${userId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (data) setMyBets((data as any[]).map(normalizeBet));
  }, [userId, request]);

  const fetchMyBetsByStatus = useCallback(async (status: PlacedBet['status']) => {
    if (!userId) return;
    const token = localStorage.getItem('token');
    const data = await request(`${API_GATEWAY_URL}/api/v1/bets/user/${userId}/status/${status}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (data) setMyBets((data as any[]).map(normalizeBet));
  }, [userId, request]);

  const toggleSelection = useCallback((selectionId: string, odds: number, label: string) => {
    setSelectedBets(prev =>
      prev.some(b => b.selectionId === selectionId)
        ? prev.filter(b => b.selectionId !== selectionId)
        : [...prev, { selectionId, odds, label }]
    );
  }, []);

  const clearSlip = useCallback(() => setSelectedBets([]), []);

  const totalOdds = selectedBets.reduce((acc, b) => acc * b.odds, 1);

  const placeBet = useCallback(async (selectionId: string, stake: number): Promise<boolean> => {
    if (!userId) return false;
    const token = localStorage.getItem('token');
    const result = await request(`${API_GATEWAY_URL}/api/v1/bets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ selectionId, stake }),
    });
    if (result) {
      await fetchMyBets();
      if (updateBalance && userId) {
        const token = localStorage.getItem('token');
        const previousBalance = (result as any)?.balance;
        // Polling hasta que el balance cambie (max 3s)
        for (let i = 0; i < 6; i++) {
          await new Promise(resolve => setTimeout(resolve, 500));
          const walletRes = await fetch(`${API_GATEWAY_URL}/api/v1/wallets/${userId}/balance`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (walletRes.ok) {
            const walletData = await walletRes.json();
            const newBalance = walletData.data.balance;
            updateBalance(newBalance);
            if (newBalance !== previousBalance) break;
          }
        }
      }
      return true;
    }
    return false;
  }, [userId, request, fetchMyBets, updateBalance]);

  useEffect(() => {
    fetchTodayEvents();
    fetchLiveEvents();
    fetchMyBets();
  }, [fetchTodayEvents, fetchLiveEvents, fetchMyBets]);

  return {
    events,
    setEvents,
    liveEvents,
    setLiveEvents,
    myBets,
    selectedBets,
    totalOdds,
    isLoading,
    error,
    toggleSelection,
    clearSlip,
    placeBet,
    fetchEventsByDate,
    fetchMarkets,
    fetchSelections,
    fetchMyBetsByStatus,
    refetch: fetchTodayEvents,
  };
}

// Hook para recibir actualizaciones de cuotas en tiempo real via WebSocket
export function useOddsWebSocket(eventIds: string[], onOddsUpdate: (eventId: string, data: any) => void) {
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    if (eventIds.length === 0) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(`${BETTING_WS_URL}/ws-live`),
      reconnectDelay: 5000,
      onConnect: () => {
        eventIds.forEach(eventId => {
          client.subscribe(`/topic/odds/${eventId}`, msg => {
            try {
              onOddsUpdate(eventId, JSON.parse(msg.body));
            } catch {}
          });
        });
      },
    });

    client.activate();
    clientRef.current = client;

    return () => { client.deactivate(); };
  }, [eventIds.join(',')]);
}

// Hook para recibir actualizaciones de partidos en tiempo real via WebSocket
export function useLiveWebSocket(
  onEventUpdate: (data: any) => void,
  onScoreUpdate: (data: any) => void
) {
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS(`${BETTING_WS_URL}/ws-live`),
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe('/topic/live/events', msg => {
          try { onEventUpdate(JSON.parse(msg.body)); } catch {}
        });
        client.subscribe('/topic/live/scores', msg => {
          try { onScoreUpdate(JSON.parse(msg.body)); } catch {}
        });
      },
    });

    client.activate();
    clientRef.current = client;

    return () => { client.deactivate(); };
  }, []);
}
