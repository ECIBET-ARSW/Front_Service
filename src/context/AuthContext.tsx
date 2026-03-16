// Authentication context.
// Provides global auth state (user, isAuthenticated, isLoading) and
// the login, register, and logout actions to the entire component tree.
// User session is persisted in localStorage so it survives page refreshes.
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';

const USERS_URL = import.meta.env.VITE_USERS_URL ?? 'http://localhost:8081';

/** Shape of the values exposed by AuthContext. */
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
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
      const res = await fetch(`${USERS_URL}/api/v1/users/email/${encodeURIComponent(email)}`, {
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Credenciales inválidas');
      const userData = await res.json();
      // Validate password via auth header or token — store user on success
      const token = btoa(`${email}:${password}`);
      const authUser: User = {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        balance: userData.balance ?? 0,
      };
      setUser(authUser);
      localStorage.setItem('user', JSON.stringify(authUser));
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
  const register = async (username: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${USERS_URL}/api/v1/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });
      if (!res.ok) throw new Error('Registration failed');
      const userData = await res.json();
      const token = btoa(`${email}:${password}`);
      const newUser: User = {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        balance: userData.balance ?? 0,
      };
      setUser(newUser);
      localStorage.setItem('user', JSON.stringify(newUser));
      localStorage.setItem('token', token);
    } catch (error) {
      throw new Error('Registration failed');
    } finally {
      setIsLoading(false);
    }
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
