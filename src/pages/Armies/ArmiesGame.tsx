import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useArmiesGame } from '../../hooks/useArmies';
import { Player } from '../../services/armies/armiesApi';
import './ArmiesGame.css';

const ArmiesGame = () => {
  const { lobbyId } = useParams<{ lobbyId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const { lobby, gameState, isHost, connected, startGame: startGameWS, registerKeyPress: registerKeyPressWS, leaveLobby: leaveLobbyWS } = useArmiesGame(user?.id, lobbyId);
  
  const [canPress, setCanPress] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (!gameState) return;

    if (gameState.type === 'GAME_STARTED' || gameState.type === 'ROUND_WON') {
      startRoundCountdown();
    }

    if (gameState.type === 'GAME_ENDED') {
      setTimeout(() => navigate('/games/armies'), 3000);
    }
  }, [gameState, navigate]);

  const startRoundCountdown = () => {
    setCanPress(false);
    setCountdown(3);
    
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          setCanPress(true);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (e.code !== 'Space' || !canPress) return;
    
    setCanPress(false);
    registerKeyPressWS();
  }, [canPress, registerKeyPressWS]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  const handleStart = () => {
    startGameWS();
  };

  const handleLeave = async () => {
    await leaveLobbyWS();
    navigate('/games/armies');
  };

  if (!lobby && !gameState) {
    return (
      <div className="armies-game-loading">
        <div className="spinner"></div>
        <p>Cargando...</p>
      </div>
    );
  }

  const players = gameState?.players ?? lobby?.playerNames.map((name, idx) => ({
    userId: idx === 0 ? lobby.hostId : `player-${idx}`,
    username: name,
    roundsWon: 0,
    ready: false,
    lastKeyPressTime: null
  })) ?? [];

  const myPlayer = players.find((p: Player) => p.userId === user?.id);
  const opponent = players.find((p: Player) => p.userId !== user?.id);

  const status = gameState?.status ?? lobby?.status ?? 'WAITING';
  const currentRound = gameState?.currentRound ?? 0;
  const pot = gameState?.pot ?? lobby?.pot ?? 0;
  const winnerId = gameState?.winnerId;

  const getBackgroundImage = () => {
    if (status === 'FINISHED') {
      return winnerId === user?.id ? 'jugador1_gana.png' : 'jugador2_gana.png';
    }
    if (status !== 'IN_PROGRESS') return 'inicio.png';

    const myWins = myPlayer?.roundsWon ?? 0;
    const oppWins = opponent?.roundsWon ?? 0;

    if (myWins === 2) return 'jugador1_casi_gana.png';
    if (oppWins === 2) return 'jugador2_casi_gana.png';
    if (myWins > oppWins) return 'jugador1_ventaja.png';
    if (oppWins > myWins) return 'jugador2_ventaja.png';
    return 'fondo.png';
  };

  return (
    <div 
      className="armies-game-container"
      style={{ backgroundImage: `url(/imagenesArmies/${getBackgroundImage()})` }}
    >
      <div className="armies-game-overlay">
        <button className="btn-leave" onClick={handleLeave}>
          ← Salir
        </button>

        <div className="armies-game-hud">
          <div className="armies-player-info left">
            <div className="player-name">{myPlayer?.username ?? 'Tú'}</div>
            <div className="player-rounds">Rounds: {myPlayer?.roundsWon ?? 0}</div>
          </div>

          <div className="armies-center-info">
            <div className="pot-display">
              💰 ${pot.toLocaleString()}
            </div>
            {status === 'IN_PROGRESS' && (
              <div className="round-display">
                Round {currentRound}
              </div>
            )}
          </div>

          <div className="armies-player-info right">
            <div className="player-name">{opponent?.username ?? 'Esperando...'}</div>
            <div className="player-rounds">Rounds: {opponent?.roundsWon ?? 0}</div>
          </div>
        </div>

        <AnimatePresence>
          {countdown !== null && (
            <motion.div 
              className="countdown-overlay"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
            >
              <div className="countdown-number">{countdown}</div>
            </motion.div>
          )}
        </AnimatePresence>

        {status === 'WAITING' && (
          <div className="armies-waiting">
            <h2>Sala de Espera</h2>
            {players.length < 2 ? (
              <p>Esperando al segundo jugador...</p>
            ) : (
              <>
                <p>¡Listos para comenzar!</p>
                {isHost && (
                  <button className="btn-start-game" onClick={handleStart}>
                    Iniciar Juego
                  </button>
                )}
                {!isHost && <p className="host-message">Esperando que el host inicie...</p>}
              </>
            )}
          </div>
        )}

        {status === 'IN_PROGRESS' && canPress && (
          <motion.div 
            className="press-space-indicator"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 0.8 }}
          >
            ¡PRESIONA ESPACIO!
          </motion.div>
        )}

        {status === 'FINISHED' && (
          <motion.div 
            className="game-result"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <h1>{winnerId === user?.id ? '¡VICTORIA!' : 'DERROTA'}</h1>
            <p className="winner-name">
              {players.find((p: Player) => p.userId === winnerId)?.username} gana
            </p>
            <p className="prize-amount">${pot.toLocaleString()}</p>
            <p className="redirect-message">Redirigiendo al lobby...</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ArmiesGame;
