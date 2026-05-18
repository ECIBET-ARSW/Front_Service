import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { getLobbies, createLobby, joinLobby, Lobby as LobbyType } from '../../services/armies/armiesApi';
import './ArmiesLobby.css';

const ArmiesLobby = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [lobbies, setLobbies] = useState<LobbyType[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [lobbyName, setLobbyName] = useState('');
  const [betAmount, setBetAmount] = useState(10000);

  useEffect(() => {
    fetchLobbies();
    const interval = setInterval(fetchLobbies, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchLobbies = async () => {
    try {
      const data = await getLobbies();
      setLobbies(data.filter((l: LobbyType) => l.status === 'WAITING'));
    } catch (error) {
      console.error('Error fetching lobbies:', error);
    }
  };

  const handleCreate = async () => {
    if (!lobbyName.trim() || !user) return;
    setLoading(true);
    try {
      const lobby = await createLobby({
        userId: user.id,
        username: user.username,
        lobbyName,
        betAmount
      });
      setShowModal(false);
      setLobbyName('');
      navigate(`/games/armies/${lobby.id}`);
    } catch (error) {
      console.error('Error creating lobby:', error);
      alert('Error al crear la sala');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (lobbyId: string) => {
    if (!user) return;
    setLoading(true);
    try {
      await joinLobby(lobbyId, {
        userId: user.id,
        username: user.username
      });
      navigate(`/games/armies/${lobbyId}`);
    } catch (error) {
      console.error('Error joining lobby:', error);
      alert('Error al unirse a la sala');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="armies-lobby-page">
      <div className="armies-lobby-header">
        <motion.h1 
          className="armies-lobby-title" 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }}
        >
          ARMIES
        </motion.h1>
        <p className="armies-lobby-subtitle">Pulsa espacio más rápido que tu oponente</p>
      </div>

      <div className="armies-how-to-play">
        <h2 className="htp-title">¿Cómo se juega?</h2>
        <div className="htp-steps">
          <div className="htp-step">
            <span className="htp-icon">⚔️</span>
            <div>
              <strong>Duelo de velocidad</strong>
              <p>Presiona la barra espaciadora lo más rápido posible cuando comience el round.</p>
            </div>
          </div>
          <div className="htp-step">
            <span className="htp-icon">🏃</span>
            <div>
              <strong>3 Rounds</strong>
              <p>El juego consiste en 3 rounds. Quien presione más veces la barra espaciadora gana el round.</p>
            </div>
          </div>
          <div className="htp-step">
            <span className="htp-icon">🎯</span>
            <div>
              <strong>Gana 2 de 3</strong>
              <p>El primer jugador en ganar 2 rounds se lleva todo el pozo acumulado.</p>
            </div>
          </div>
          <div className="htp-step">
            <span className="htp-icon">💰</span>
            <div>
              <strong>El ganador se lleva todo</strong>
              <p>El ganador recibe el doble de su apuesta. ¡Que gane el más rápido!</p>
            </div>
          </div>
        </div>
      </div>

      <div className="armies-lobby-content">
        <div className="armies-lobby-rooms-header">
          <h2>Salas disponibles</h2>
          <button className="btn-create" onClick={() => setShowModal(true)}>
            + Crear Sala
          </button>
        </div>

        {loading && lobbies.length === 0 ? (
          <div className="armies-lobby-loading">Buscando salas...</div>
        ) : lobbies.length === 0 ? (
          <div className="armies-lobby-empty">
            <p>No hay salas disponibles.</p>
            <p>¡Crea una y espera a tu oponente!</p>
          </div>
        ) : (
          <div className="armies-lobby-rooms">
            {lobbies.map((lobby, i) => (
              <motion.div
                key={lobby.id}
                className="armies-room-card"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="armies-room-info">
                  <span className="armies-room-name">{lobby.name}</span>
                  <span className="armies-room-players">
                    {lobby.playerCount}/2 jugadores
                  </span>
                  <span className="armies-room-bet">
                    Apuesta: ${lobby.betAmount.toLocaleString()}
                  </span>
                  <div className="armies-room-player-list">
                    {lobby.playerNames.map((name: string, idx: number) => (
                      <span key={idx} className="armies-room-player-chip">
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="armies-room-actions">
                  {lobby.playerCount >= 2 ? (
                    <span className="armies-room-badge full">Llena</span>
                  ) : (
                    <button 
                      className="btn-join" 
                      onClick={() => handleJoin(lobby.id)}
                      disabled={loading}
                    >
                      Unirse
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div 
            className="modal-overlay" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={() => setShowModal(false)}
          >
            <motion.div 
              className="modal" 
              initial={{ scale: 0.8 }} 
              animate={{ scale: 1 }} 
              exit={{ scale: 0.8 }}
              onClick={e => e.stopPropagation()}
            >
              <h3>Crear Sala</h3>
              <div className="modal-field">
                <label>Nombre de la sala</label>
                <input 
                  type="text" 
                  value={lobbyName} 
                  onChange={e => setLobbyName(e.target.value)} 
                  placeholder="Ej: Batalla Épica" 
                  maxLength={30}
                />
              </div>
              <div className="modal-field">
                <label>Apuesta (COP)</label>
                <div className="buyin-options">
                  {[1000, 5000, 10000, 25000, 50000].map(v => (
                    <button 
                      key={v} 
                      className={`buyin-btn ${betAmount === v ? 'selected' : ''}`}
                      onClick={() => setBetAmount(v)}
                    >
                      ${v.toLocaleString()}
                    </button>
                  ))}
                </div>
                <input 
                  type="number" 
                  value={betAmount} 
                  onChange={e => setBetAmount(Number(e.target.value))} 
                  min={1000}
                />
              </div>
              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button 
                  className="btn-confirm" 
                  onClick={handleCreate}
                  disabled={!lobbyName.trim() || loading}
                >
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

export default ArmiesLobby;
