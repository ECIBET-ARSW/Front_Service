// Authentication context.
// Provides global auth state (user, isAuthenticated, isLoading) and
// the login, register, and logout actions to the entire component tree.
// User session is persisted in localStorage so it survives page refreshes.
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';

const API_GATEWAY_URL = import.meta.env.VITE_AUTH_URL ?? 'http://localhost:8080';
const USERS_URL = import.meta.env.VITE_USERS_URL ?? 'http://localhost:8081';
const WALLETS_URL = import.meta.env.VITE_WALLETS_URL ?? 'http://localhost:8082';

/** Shape of the values exposed by AuthContext. */
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (firstName: string, lastName: string, birthDate: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateBalance: (newBalance: number) => void;
  isAuthenticated: boolean;
  isLoading: boolean; // True while checking localStorage on first render
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Wraps the app and makes auth state available to all children. */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount, restore the session from localStorage if it exists.
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  /**
   * Simulates an API login call.
   * On success, stores the user in state and localStorage.
   */
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const authRes = await fetch(`${API_GATEWAY_URL}/api/v1/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (!authRes.ok) throw new Error('Login failed');
      const authData = await authRes.json();
      const token = authData.data.token;

      const userRes = await fetch(`${USERS_URL}/api/v1/users/email/${email}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!userRes.ok) throw new Error('Failed to fetch user');
      const userData = await userRes.json();

      const walletRes = await fetch(`${WALLETS_URL}/api/v1/wallets/${userData.data.id}/balance`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const walletData = walletRes.ok ? await walletRes.json() : null;

      const loggedUser: User = {
        id: userData.data.id,
        username: `${userData.data.firstName} ${userData.data.lastName}`,
        email: userData.data.email,
        balance: walletData?.data?.balance ?? 0
      };
      setUser(loggedUser);
      localStorage.setItem('user', JSON.stringify(loggedUser));
      localStorage.setItem('token', token);
    } catch (error) {
      throw new Error('Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Simulates an API registration call.
   * New users start with a $1,000 balance.
   */
  const register = async (firstName: string, lastName: string, birthDate: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const registerRes = await fetch(`${USERS_URL}/api/v1/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, birthDate, email, password })
      });
      if (!registerRes.ok) throw new Error('Registration failed');

      await login(email, password);
    } catch (error) {
      throw new Error('Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const updateBalance = (newBalance: number) => {
    if (!user) return;
    const updated = { ...user, balance: newBalance };
    setUser(updated);
    localStorage.setItem('user', JSON.stringify(updated));
  };

  /** Clears the user from state and localStorage, effectively logging out. */
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      register,
      logout,
      updateBalance,
      isAuthenticated: !!user,
      isLoading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to consume AuthContext.
 * Must be used inside an AuthProvider, otherwise throws an error.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
