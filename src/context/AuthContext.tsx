// Authentication context.
// Provides global auth state (user, isAuthenticated, isLoading) and
// the login, register, and logout actions to the entire component tree.
// User session is persisted in localStorage so it survives page refreshes.
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';

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
  const login = async (email: string, _password: string) => {
    setIsLoading(true);
    try {
      // TODO: Replace with real API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockUser: User = {
        id: '1',
        username: email.split('@')[0],
        email,
        balance: 5000
      };

      setUser(mockUser);
      localStorage.setItem('user', JSON.stringify(mockUser));
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
  const register = async (username: string, email: string, _password: string) => {
    setIsLoading(true);
    try {
      // TODO: Replace with real API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockUser: User = {
        id: Date.now().toString(),
        username,
        email,
        balance: 1000
      };

      setUser(mockUser);
      localStorage.setItem('user', JSON.stringify(mockUser));
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
