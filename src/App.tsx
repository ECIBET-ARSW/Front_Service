// Root application component.
// Sets up the AuthProvider for global auth state and defines all client-side routes.
// Protected routes redirect unauthenticated users to /auth.
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home/Home';
import Recharge from './pages/Recharge/Recharge';
import Games from './pages/Games/Games';
import Sports from './pages/Sports/Sports';
import Auth from './pages/Auth/Auth';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            {/* Public route: accessible without authentication */}
            <Route path="/auth" element={<Auth />} />

            {/* Protected routes: require the user to be logged in */}
            <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/games" element={<ProtectedRoute><Games /></ProtectedRoute>} />
            <Route path="/sports" element={<ProtectedRoute><Sports /></ProtectedRoute>} />
            <Route path="/recharge" element={<ProtectedRoute><Recharge /></ProtectedRoute>} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App;
