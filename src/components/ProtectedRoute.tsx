// Route guard component.
// Renders children only when the user is authenticated.
// While the auth state is loading it shows a loading indicator.
// Unauthenticated users are redirected to /auth.
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading } = useAuth();

  // Wait for localStorage session check before making a redirect decision
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        color: 'var(--primary)',
        fontSize: '1.5rem'
      }}>
        Cargando...
      </div>
    );
  }

  // Redirect to auth page if not logged in
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
