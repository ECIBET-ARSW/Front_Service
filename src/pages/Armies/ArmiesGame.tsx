import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { startGame, registerKeyPress, leaveLobby, getGameState, GameState, Player } from '../../services/armies/armiesApi';
import './ArmiesGame.css';

const ARMIES_WS_URL = import.meta.env.VITE_ARMIES_WS_URL ?? 'ws://localhost:8094';

const ArmiesGame = () => {
  const { lobbyId } = useParams<{ lobbyId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [canPress, setCanPress] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!lobbyId || !user) return;

    const ws = new WebSocket(`${ARMIES_WS_URL}/ws/armies?lobbyId=${lobbyId}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket conectado');
      fetchInitialState();
    };

    ws.onmessage = (event) => {
      const data: GameState = JSON.parse(event.data);
      setGameState(data);

      if (data.type === 'GAME_STARTED' || data.type === 'ROUND_WON') {
        startRoundCountdown();
      }

      if (data.type === 'GAME_ENDED') {
        setTimeout(() => navigate('/games/armies'), 3000);
      }
    };

    ws.onerror = (error) => console.error('WebSocket error:', error);
    ws.onclose = () => console.log('WebSocket desconectado');

    return () => {
      ws.close();
      if (lobbyId && user) {
        leaveLobby(lobbyId, user.id).catch(console.error);
      }
    };
  }, [lobbyId, user]);

  const fetchInitialState = async () => {
    if (!lobbyId) return;
    try {
      const state = await getGameState(lobbyId);
      setGameState(state);
    } catch (error) {
      console.error('Error fetching game state:', error);
    }
  };

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

  const handleKeyPress = useCallback(async (e: KeyboardEvent) => {
    if (e.code !== 'Space' || !canPress || !lobbyId || !user) return;
    
    setCanPress(false);
    try {
      await registerKeyPress(lobbyId, user.id);
    } catch (error) {
      console.error('Error registering key press:', error);
    }
  }, [canPress, lobbyId, user]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  const handleStart = async () => {
    if (!lobbyId || !user || !gameState) return;
    try {
      await startGame(lobbyId, user.id);
    } catch (error) {
      console.error('Error starting game:', error);
      alert('Error al iniciar el juego');
    }
  };

  const handleLeave = async () => {
    if (!lobbyId || !user) return;
    try {
      await leaveLobby(lobbyId, user.id);
      navigate('/games/armies');
    } catch (error) {
      console.error('Error leaving lobby:', error);
    }
  };

  if (!gameState) {
    return (
      <div className="armies-game-loading">
        <div className="spinner"></div>
        <p>Cargando...</p>
      </div>
    );
  }

  const myPlayer = gameState.players.find((p: Player) => p.userId === user?.id);
  const opponent = gameState.players.find((p: Player) => p.userId !== user?.id);
  const isHost = gameState.players[0]?.userId === user?.id;

  const getBackgroundImage = () => {
    if (gameState.status === 'FINISHED') {
      return gameState.winnerId === user?.id ? 'jugador1_gana.png' : 'jugador2_gana.png';
    }
    if (gameState.status !== 'IN_PROGRESS') return 'inicio.png';

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
              💰 ${gameState.pot.toLocaleString()}
            </div>
            {gameState.status === 'IN_PROGRESS' && (
              <div className="round-display">
                Round {gameState.currentRound}
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

        {gameState.status === 'WAITING' && (
          <div className="armies-waiting">
            <h2>Sala de Espera</h2>
            {gameState.players.length < 2 ? (
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

        {gameState.status === 'IN_PROGRESS' && canPress && (
          <motion.div 
            className="press-space-indicator"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 0.8 }}
          >
            ¡PRESIONA ESPACIO!
          </motion.div>
        )}

        {gameState.status === 'FINISHED' && (
          <motion.div 
            className="game-result"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <h1>{gameState.winnerId === user?.id ? '¡VICTORIA!' : 'DERROTA'}</h1>
            <p className="winner-name">
              {gameState.players.find((p: Player) => p.userId === gameState.winnerId)?.username} gana
            </p>
            <p className="prize-amount">${gameState.pot.toLocaleString()}</p>
            <p className="redirect-message">Redirigiendo al lobby...</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ArmiesGame;
