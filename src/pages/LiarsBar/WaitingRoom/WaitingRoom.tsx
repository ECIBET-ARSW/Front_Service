import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../../context/AuthContext';
import { useGameRoom } from '../../../hooks/useRussianRoulette';
import './WaitingRoom.css';

const SEAT_POSITIONS = ['seat-left', 'seat-center', 'seat-right'];

const WaitingRoom = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { room, gameEvent, connected, startGame, leaveRoom } = useGameRoom(user?.id, roomId);

  useEffect(() => {
    if (gameEvent?.type === 'GAME_STARTED') {
      navigate(`/games/liars-bar/${roomId}/play`);
    }
  }, [gameEvent, roomId, navigate]);

  const handleLeave = async () => {
    await leaveRoom();
    navigate('/games/liars-bar');
  };

  const otherPlayers = room?.playerNames.filter(n => n !== user?.username) ?? [];
  const isHost = room?.hostId === user?.id;
  const canStart = (room?.playerCount ?? 0) >= 2;

  return (
    <div className="waiting-room">
      <div className="wr-scene">
        <img src="/img/Russian Roulette images/Fondo.png" alt="bar" className="wr-background" />

        <div className="wr-seats">
          {SEAT_POSITIONS.map((cls, i) => {
            const player = otherPlayers[i];
            return (
              <div key={cls} className={`wr-seat ${cls}`}>
                {player ? (
                  <motion.div className="wr-player" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.15 }}>
                    <img
                      src="/img/Russian Roulette images/Frames/Personaje 1/Estando quieto esperando.png"
                      alt={player}
                      className="wr-character"
                    />
                    <span className="wr-player-name">{player}</span>
                  </motion.div>
                ) : (
                  <div className="wr-empty-seat">
                    <div className="wr-empty-icon">?</div>
                    <span className="wr-empty-label">Esperando...</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="wr-hud">
          <div className="wr-room-info">
            <span className="wr-room-name">{room?.name ?? '...'}</span>
            <span className="wr-room-buyin">Buy-in: {room?.buyIn?.toLocaleString() ?? 0} COP</span>
          </div>
          <div className="wr-connection">
            <span className={`wr-dot ${connected ? 'connected' : 'disconnected'}`} />
            {connected ? 'Conectado' : 'Conectando...'}
          </div>
        </div>

        <div className="wr-bottom">
          <div className="wr-players-count">
            <span>{room?.playerCount ?? 0}</span>
            <span className="wr-slash">/</span>
            <span>{room?.maxPlayers ?? 4}</span>
            <span className="wr-players-label">jugadores</span>
          </div>
          <div className="wr-pot">
            Pozo: <strong>{room?.pot?.toLocaleString() ?? 0} COP</strong>
          </div>
          <div className="wr-actions">
            {isHost ? (
              <motion.button
                className="wr-btn-start"
                onClick={startGame}
                disabled={!canStart}
                whileHover={{ scale: canStart ? 1.05 : 1 }}
                whileTap={{ scale: canStart ? 0.95 : 1 }}
              >
                {canStart ? '▶ INICIAR PARTIDA' : `Esperando jugadores (${room?.playerCount ?? 0}/2 mín)`}
              </motion.button>
            ) : (
              <p className="wr-waiting-msg">Esperando que el host inicie la partida...</p>
            )}
            <button className="wr-btn-leave" onClick={handleLeave}>Salir</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaitingRoom;
