// Generic hook for HTTP requests.
// Wraps fetch with loading, error, and data state so every service
// hook can reuse the same async pattern without boilerplate.
import { useState, useCallback } from 'react';

interface ApiState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

export function useApi<T>() {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    isLoading: false,
    error: null,
  });

  const request = useCallback(async (url: string, options?: RequestInit): Promise<T | null> => {
    setState({ data: null, isLoading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...options?.headers,
        },
      });

      if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);

      const data: T = await res.json();
      setState({ data, isLoading: false, error: null });
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setState({ data: null, isLoading: false, error: message });
      return null;
    }
  }, []);

  return { ...state, request };
}
