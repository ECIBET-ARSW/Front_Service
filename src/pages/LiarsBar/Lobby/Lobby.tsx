import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../context/AuthContext';
import { useLobby, RoomSummary } from '../../../hooks/useRussianRoulette';
import './Lobby.css';

const Lobby = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { rooms, loading, createRoom, joinRoom } = useLobby(user?.id);

  const [showModal, setShowModal] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [buyIn, setBuyIn] = useState(10000);

  const handleCreate = async () => {
    if (!roomName.trim() || !user) return;
    const roomId = await createRoom(user.username, roomName, buyIn);
    if (roomId) {
      setShowModal(false);
      setRoomName('');
      navigate(`/games/liars-bar/${roomId}`);
    }
  };

  const handleJoin = async (room: RoomSummary) => {
    if (!user) return;
    const ok = await joinRoom(room.id, user.username);
    if (ok) navigate(`/games/liars-bar/${room.id}`);
  };

  return (
    <div className="lobby-page">
      <div className="lobby-header">
        <motion.h1 className="lobby-title" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          LIAR'S BAR
        </motion.h1>
        <p className="lobby-subtitle">Engaña, acusa y sobrevive</p>
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
            {rooms.map((room, i) => (
              <motion.div
                key={room.id}
                className="room-card"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="room-info">
                  <span className="room-name">{room.name}</span>
                  <span className="room-players">{room.playerCount}/{room.maxPlayers} jugadores</span>
                  <span className="room-buyin">Buy-in: {room.buyIn.toLocaleString()} COP</span>
                  <div className="room-player-list">
                    {room.playerNames.map((name, idx) => (
                      <span key={idx} className="room-player-chip">{name}</span>
                    ))}
                  </div>
                </div>
                <div className="room-actions">
                  {room.status === 'IN_PROGRESS' ? (
                    <span className="room-badge in-progress">En curso</span>
                  ) : room.playerCount >= room.maxPlayers ? (
                    <span className="room-badge full">Llena</span>
                  ) : (
                    <button className="btn-join" onClick={() => handleJoin(room)}>Unirse</button>
                  )}
                </div>
              </motion.div>
            ))}
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
                <input type="text" value={roomName} onChange={e => setRoomName(e.target.value)} placeholder="Ej: Los Valientes" maxLength={30} />
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

export default Lobby;
