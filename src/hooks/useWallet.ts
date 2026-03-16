// Wallet hook.
// Fetches the user's balance and transaction history from Wallets-Service.
// Recharge is simulated (no real payment gateway).
import { useState, useEffect, useCallback } from 'react';
import { useApi } from './useApi';

const WALLETS_URL = import.meta.env.VITE_WALLETS_URL ?? 'http://localhost:8082';

export interface Transaction {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'BET' | 'WIN';
  amount: number;
  description: string;
  createdAt: string;
}

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
}

export function useWallet(userId: string | undefined) {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { isLoading, error, request } = useApi<Wallet>();

  const fetchWallet = useCallback(async () => {
    if (!userId) return;
    const data = await request(`${WALLETS_URL}/api/v1/wallets/${userId}`);
    if (data) setWallet(data);
  }, [userId, request]);

  const fetchTransactions = useCallback(async () => {
    if (!userId) return;
    const data = await request(`${WALLETS_URL}/api/v1/transactions/history/${userId}`);
    if (data) setTransactions(data as unknown as Transaction[]);
  }, [userId, request]);

  const deposit = useCallback(async (amount: number): Promise<boolean> => {
    if (!userId) return false;
    const result = await request(`${WALLETS_URL}/api/v1/transactions/deposit/${userId}`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
    if (result) { await fetchWallet(); return true; }
    return false;
  }, [userId, request, fetchWallet]);

  const withdraw = useCallback(async (amount: number): Promise<boolean> => {
    if (!userId) return false;
    const result = await request(`${WALLETS_URL}/api/v1/transactions/withdraw/${userId}`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
    if (result) { await fetchWallet(); return true; }
    return false;
  }, [userId, request, fetchWallet]);

  const transfer = useCallback(async (toUserId: string, amount: number): Promise<boolean> => {
    if (!userId) return false;
    const result = await request(`${WALLETS_URL}/api/v1/transactions/transfer/${userId}`, {
      method: 'POST',
      body: JSON.stringify({ toUserId, amount }),
    });
    if (result) { await fetchWallet(); return true; }
    return false;
  }, [userId, request, fetchWallet]);

  useEffect(() => {
    fetchWallet();
    fetchTransactions();
  }, [fetchWallet, fetchTransactions]);

  return {
    wallet,
    transactions,
    isLoading,
    error,
    deposit,
    withdraw,
    transfer,
    refetch: fetchWallet,
  };
}
