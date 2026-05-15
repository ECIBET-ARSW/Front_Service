import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { createLobby, getLobbies, joinLobby } from '../../services/poker/lobbyApi';
import './PokerLobby.css';

const MIN_BALANCE = 2000;
const WALLETS_URL = import.meta.env.VITE_WALLETS_URL ?? 'http://localhost:8082';

const PokerLobby = () => {
  const { user, updateBalance } = useAuth();
  const navigate = useNavigate();

  const [rooms, setRooms]             = useState<any[]>([]);
  const [loading, setLoading]         = useState(false);
  const [showModal, setShowModal]     = useState(false);
  const [roomName, setRoomName]       = useState('');
  const [buyIn, setBuyIn]             = useState(10000);
  const [error, setError]             = useState('');
  const [realBalance, setRealBalance] = useState<number | null>(null);

  const playerId   = user?.id || '';
  const playerName = user?.username?.split(' ')[0] || '';
  const credits    = realBalance ?? Math.floor(user?.balance ?? 0);
  const canPlay    = credits >= MIN_BALANCE;

  useEffect(() => {
    async function fetchBalance() {
      if (!playerId) return;
      try {
        const token = localStorage.getItem('token') ?? '';
        const res = await fetch(`${WALLETS_URL}/api/v1/wallets/${playerId}/balance`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        const balance = Math.floor(data?.data?.balance ?? 0);
        setRealBalance(balance);
        updateBalance(balance);
      } catch (_) {
        setRealBalance(Math.floor(user?.balance ?? 0));
      }
    }
    fetchBalance();
  }, [playerId]);

  useEffect(() => {
    loadRooms();
    const interval = setInterval(loadRooms, 3000);
    return () => clearInterval(interval);
  }, []);

  async function loadRooms() {
    try {
      const all = await getLobbies();
      const open = all.filter((l: any) => {
        const players = l.actualGame?.players?.filter((p: any) => p.inLobby) ?? [];
        return !l.actualGame?.inGame && players.length > 0;
      });
      setRooms(open);
    } catch (_) {}
  }

  const handleCreate = async () => {
    if (!roomName.trim() || !user) return;
    if (!canPlay) return setError(`Necesitas mínimo $${MIN_BALANCE.toLocaleString()} COP para jugar`);
    setLoading(true);
    setError('');
    try {
      const lobby = await createLobby({ playerId, playerName, credits: buyIn });
      localStorage.setItem('pokerLobbyId', lobby.id);
      localStorage.setItem('pokerGameId', lobby.actualGame?.id || lobby.id);
      localStorage.setItem('pokerPersonaje', '1Personaje.jpeg');
      setShowModal(false);
      setRoomName('');
      navigate('/games/poker/play');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (room: any) => {
    if (!user || !canPlay) return;
    setLoading(true);
    setError('');
    try {
      const lobby = await joinLobby({ lobbyId: room.id, playerId, playerName, credits });
      localStorage.setItem('pokerLobbyId', lobby.id);
      localStorage.setItem('pokerGameId', lobby.actualGame?.id || lobby.id);
      const players = lobby.actualGame?.players?.filter((p: any) => p.inLobby) ?? [];
      const idx = players.findIndex((p: any) => p.id === playerId);
      localStorage.setItem('pokerPersonaje', `${Math.min(idx >= 0 ? idx + 1 : players.length, 6)}Personaje.jpeg`);
      navigate('/games/poker/play');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lobby-page">
      <div className="lobby-header">
        <button
          onClick={() => navigate('/')}
          style={{ position: 'absolute', left: 0, top: 0, background: 'transparent', border: '1px solid #555', color: '#555', padding: '6px 14px', borderRadius: 2, cursor: 'pointer', fontFamily: "'Courier New', monospace", fontSize: '0.75rem', letterSpacing: 1 }}
        >
          ← Inicio
        </button>
        <motion.h1 className="lobby-title" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          POKER
        </motion.h1>
        <p className="lobby-subtitle">Farolea, apuesta y gana el pozo</p>
        <p style={{ fontFamily: "'Courier New', monospace", fontSize: '0.85rem', color: canPlay ? '#f0a500' : '#c0392b', marginTop: 8 }}>
          Tus créditos: {realBalance === null ? 'Cargando...' : `$${credits.toLocaleString()} COP`}
        </p>
      </div>

      <div className="lobby-how-to-play">
        <h2 className="htp-title">¿Cómo se juega?</h2>
        <div className="htp-steps">
          <div className="htp-step">
            <span className="htp-icon">🃏</span>
            <div><strong>Recibe tus cartas</strong><p>Cada jugador recibe 2 cartas privadas. Usa las cartas comunitarias para formar la mejor mano posible.</p></div>
          </div>
          <div className="htp-step">
            <span className="htp-icon">💰</span>
            <div><strong>Apuesta</strong><p>En cada ronda puedes apostar, igualar, subir o retirarte. La estrategia es clave para sobrevivir.</p></div>
          </div>
          <div className="htp-step">
            <span className="htp-icon">🔄</span>
            <div><strong>Las rondas</strong><p>El juego tiene 4 fases: Pre-flop, Flop (3 cartas), Turn (1 carta) y River (1 carta).</p></div>
          </div>
          <div className="htp-step">
            <span className="htp-icon">🏆</span>
            <div><strong>Gana el mejor</strong><p>El jugador con la mejor mano al final se lleva todo el pozo acumulado.</p></div>
          </div>
        </div>
      </div>

      <div className="lobby-content">
        <div className="lobby-rooms-header">
          <h2>Salas disponibles</h2>
          <button className="btn-create" onClick={() => setShowModal(true)}>+ Crear Sala</button>
        </div>

        {loading && rooms.length === 0 ? (
          <div className="lobby-loading">Buscando salas...</div>
        ) : rooms.length === 0 ? (
          <div className="lobby-empty">
            <p>No hay salas disponibles.</p>
            <p>¡Crea una y espera a los demás!</p>
          </div>
        ) : (
          <div className="lobby-rooms">
            {rooms.map((room, i) => {
              const players = room.actualGame?.players?.filter((p: any) => p.inLobby) ?? [];
              const isFull  = players.length >= 6;
              const inGame  = room.actualGame?.inGame;
              return (
                <motion.div
                  key={room.id}
                  className="room-card"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div className="room-info">
                    <span className="room-name">#{room.id.slice(-6).toUpperCase()}</span>
                    <span className="room-players">{players.length}/6 jugadores</span>
                    <span className="room-buyin">Buy-in: {buyIn.toLocaleString()} COP</span>
                    <div className="room-player-list">
                      {players.map((p: any, idx: number) => (
                        <span key={idx} className="room-player-chip">{p.name || p.id}</span>
                      ))}
                    </div>
                  </div>
                  <div className="room-actions">
                    {inGame ? (
                      <span className="room-badge in-progress">En curso</span>
                    ) : isFull ? (
                      <span className="room-badge full">Llena</span>
                    ) : (
                      <button className="btn-join" onClick={() => handleJoin(room)} disabled={loading || !canPlay}>
                        Unirse
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)}>
            <motion.div className="modal" initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }} onClick={e => e.stopPropagation()}>
              <h3>Crear Sala</h3>
              <div className="modal-field">
                <label>Nombre de la sala</label>
                <input type="text" value={roomName} onChange={e => setRoomName(e.target.value)} placeholder="Ej: Los Valientes" maxLength={30} autoFocus />
              </div>
              <div className="modal-field">
                <label>Buy-in (COP)</label>
                <div className="buyin-options">
                  {[5000, 10000, 25000, 50000].map(v => (
                    <button key={v} className={`buyin-btn ${buyIn === v ? 'selected' : ''}`} onClick={() => setBuyIn(v)}>
                      {v.toLocaleString()}
                    </button>
                  ))}
                </div>
                <input type="number" value={buyIn} onChange={e => setBuyIn(Number(e.target.value))} min={1000} />
              </div>
              {error && <p style={{ color: '#e74c3c', fontSize: '0.8rem', marginBottom: 8 }}>{error}</p>}
              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setShowModal(false)}>Cancelar</button>
                <button className="btn-confirm" onClick={handleCreate} disabled={!roomName.trim() || loading}>
                  {loading ? 'Creando...' : 'Crear'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PokerLobby;