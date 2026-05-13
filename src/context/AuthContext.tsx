// Authentication context
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';

// URLs DIRECTAS de los servicios (temporal mientras arreglamos el gateway)
const AUTH_URL = 'http://localhost:8081';
const USERS_URL = 'http://localhost:8080';
const WALLETS_URL = 'http://localhost:8082';

interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => Promise<void>;
    register: (firstName: string, lastName: string, birthDate: string, email: string, password: string) => Promise<void>;
    logout: () => void;
    updateBalance: (newBalance: number) => void;
    isAuthenticated: boolean;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');
        if (storedUser && storedToken) {
            setUser(JSON.parse(storedUser));
        }
        setIsLoading(false);
    }, []);

    const login = async (email: string, password: string) => {
        setIsLoading(true);
        try {
            // Llamar DIRECTAMENTE al auth-service
            const authRes = await fetch(`${AUTH_URL}/api/v1/auth`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (!authRes.ok) {
                throw new Error('Login failed');
            }

            const authData = await authRes.json();
            const token = authData.data.token;

            // Llamar DIRECTAMENTE al users-service
            const userRes = await fetch(`${USERS_URL}/api/v1/users/email/${email}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!userRes.ok) throw new Error('Failed to fetch user data');
            const userData = await userRes.json();

            // Llamar DIRECTAMENTE al wallets-service
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
            console.error('Login error:', error);
            throw new Error('Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (firstName: string, lastName: string, birthDate: string, email: string, password: string) => {
        setIsLoading(true);
        try {
            // Llamar DIRECTAMENTE al users-service
            const registerRes = await fetch(`${USERS_URL}/api/v1/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ firstName, lastName, birthDate, email, password })
            });

            if (!registerRes.ok) {
                const errorData = await registerRes.json();
                throw new Error(errorData.message || 'Registration failed');
            }

            // Hacer login automático
            await login(email, password);
        } catch (error) {
            console.error('Registration error:', error);
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

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};