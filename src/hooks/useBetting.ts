// Sports betting hook — connects to Betting-Service real endpoints.
import { useState, useEffect, useCallback } from 'react';
import { useApi } from './useApi';

const BETTING_URL = import.meta.env.VITE_BETTING_URL ?? 'http://localhost:8083';

export interface BettingEvent {
  id: string;
  footballDataId?: number;
  homeTeam: string;
  awayTeam: string;
  competition: string;
  startTime: string;
  status: 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'CANCELLED';
  minute?: number;
  homeScore?: number;
  awayScore?: number;
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

export function useBetting(userId: string | undefined) {
  const [events, setEvents] = useState<BettingEvent[]>([]);
  const [liveEvents, setLiveEvents] = useState<BettingEvent[]>([]);
  const [myBets, setMyBets] = useState<PlacedBet[]>([]);
  const [selectedBets, setSelectedBets] = useState<{ selectionId: string; odds: number; label: string }[]>([]);
  const { request, isLoading, error } = useApi<BettingEvent[]>();

  const fetchTodayEvents = useCallback(async () => {
    const data = await request(`${BETTING_URL}/api/v1/events/today`);
    if (data) setEvents(data);
  }, [request]);

  const fetchLiveEvents = useCallback(async () => {
    const data = await request(`${BETTING_URL}/api/v1/events/live`);
    if (data) setLiveEvents(data);
  }, [request]);

  const fetchEventsByDate = useCallback(async (date: string) => {
    const data = await request(`${BETTING_URL}/api/v1/events/by-date?date=${date}`);
    if (data) setEvents(data);
  }, [request]);

  const fetchMarkets = useCallback(async (eventId: string): Promise<Market[]> => {
    const data = await request(`${BETTING_URL}/api/v1/events/${eventId}/markets`);
    return (data as unknown as Market[]) ?? [];
  }, [request]);

  const fetchSelections = useCallback(async (marketId: string): Promise<Selection[]> => {
    const data = await request(`${BETTING_URL}/api/v1/markets/${marketId}/selections`);
    return (data as unknown as Selection[]) ?? [];
  }, [request]);

  const fetchMyBets = useCallback(async () => {
    if (!userId) return;
    const data = await request(`${BETTING_URL}/api/v1/bets/user/${userId}`);
    if (data) setMyBets(data as unknown as PlacedBet[]);
  }, [userId, request]);

  const fetchMyBetsByStatus = useCallback(async (status: PlacedBet['status']) => {
    if (!userId) return;
    const data = await request(`${BETTING_URL}/api/v1/bets/user/${userId}/status/${status}`);
    if (data) setMyBets(data as unknown as PlacedBet[]);
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

  const placeBet = useCallback(async (selectionId: string, amount: number): Promise<boolean> => {
    if (!userId) return false;
    const result = await request(`${BETTING_URL}/api/v1/bets`, {
      method: 'POST',
      headers: { 'X-User-Id': userId },
      body: JSON.stringify({ selectionId, amount }),
    });
    if (result) {
      await fetchMyBets();
      return true;
    }
    return false;
  }, [userId, request, fetchMyBets]);

  useEffect(() => {
    fetchTodayEvents();
    fetchLiveEvents();
    fetchMyBets();
  }, [fetchTodayEvents, fetchLiveEvents, fetchMyBets]);

  return {
    events,
    liveEvents,
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
