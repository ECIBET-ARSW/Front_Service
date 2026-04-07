import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing/Landing';
import Home from './pages/Home/Home';
import Recharge from './pages/Recharge/Recharge';
import Games from './pages/Games/Games';
import Sports from './pages/Sports/Sports';
import Auth from './pages/Auth/Auth';
import Lobby from './pages/LiarsBar/Lobby/Lobby';
import WaitingRoom from './pages/LiarsBar/WaitingRoom/WaitingRoom';
import GameTable from './pages/LiarsBar/GameTable/GameTable';
import './App.css';

// Rutas que NO usan el Layout (pantalla completa sin navbar)
const FULLSCREEN_ROUTES = ['/games/liars-bar/:roomId'];

const AppRoutes = () => {
  const location = useLocation();
  const isFullscreen = location.pathname.match(/^\/games\/liars-bar\/.+/);

  const routes = (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/dashboard" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/games" element={<ProtectedRoute><Games /></ProtectedRoute>} />
      <Route path="/sports" element={<ProtectedRoute><Sports /></ProtectedRoute>} />
      <Route path="/recharge" element={<ProtectedRoute><Recharge /></ProtectedRoute>} />
      <Route path="/games/liars-bar" element={<ProtectedRoute><Lobby /></ProtectedRoute>} />
      <Route path="/games/liars-bar/:roomId" element={<ProtectedRoute><WaitingRoom /></ProtectedRoute>} />
      <Route path="/games/liars-bar/:roomId/play" element={<ProtectedRoute><GameTable /></ProtectedRoute>} />
    </Routes>
  );

  return isFullscreen ? routes : <Layout>{routes}</Layout>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
