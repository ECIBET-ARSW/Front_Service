import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { startGame, registerKeyPress, leaveLobby, type GameState, type Player } from '../../services/armies/armiesApi'

const ARMIES_WS_URL = import.meta.env.VITE_ARMIES_WS_URL ?? 'ws://localhost:8094'

export default function ArmiesGame() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const wsRef = useRef<WebSocket | null>(null)
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [currentImage, setCurrentImage] = useState('inicio.png')
  const [message, setMessage] = useState('')
  const [canPressKey, setCanPressKey] = useState(false)
  const [keyPressed, setKeyPressed] = useState(false)

  const lobbyId = localStorage.getItem('armiesLobbyId') || ''
  const userId = user?.id || ''

  useEffect(() => {
    if (!lobbyId || !userId) {
      navigate('/games/armies')
      return
    }

    // Conectar WebSocket
    const ws = new WebSocket(`${ARMIES_WS_URL}/ws/armies?lobbyId=${lobbyId}`)

    ws.onopen = () => {
      console.log('✅ WebSocket conectado')
    }

    ws.onmessage = (event) => {
      const data: GameState = JSON.parse(event.data)
      console.log('📨 Mensaje recibido:', data)
      setGameState(data)
      handleGameStateUpdate(data)
    }

    ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error)
    }

    ws.onclose = () => {
      console.log('🔌 WebSocket desconectado')
    }

    wsRef.current = ws

    return () => {
      ws.close()
    }
  }, [lobbyId, userId])

  const handleGameStateUpdate = (state: GameState) => {
    switch (state.type) {
      case 'PLAYER_JOINED':
        setMessage('¡Jugador unido!')
        break
      case 'GAME_STARTED':
        setMessage('¡Juego iniciado! Presiona ESPACIO lo más rápido posible')
        setCanPressKey(true)
        setKeyPressed(false)
        updateGameImage(state)
        break
      case 'ROUND_WON':
        setMessage(`Round ${state.currentRound - 1} completado`)
        setCanPressKey(true)
        setKeyPressed(false)
        updateGameImage(state)
        setTimeout(() => {
          if (state.currentRound <= 3) {
            setMessage(`Round ${state.currentRound} - ¡Presiona ESPACIO!`)
          }
        }, 2000)
        break
      case 'GAME_ENDED':
        setCanPressKey(false)
        updateGameImage(state)
        const winner = state.players.find(p => p.userId === state.winnerId)
        setMessage(`¡${winner?.username} ha ganado! Pozo: $${state.pot.toLocaleString()}`)
        setTimeout(() => {
          localStorage.removeItem('armiesLobbyId')
          navigate('/games/armies')
        }, 5000)
        break
      case 'PLAYER_LEFT':
        setMessage('Un jugador ha salido')
        break
      default:
        updateGameImage(state)
    }
  }

  const updateGameImage = (state: GameState) => {
    if (!state.players || state.players.length < 2) {
      setCurrentImage('inicio.png')
      return
    }

    const player1 = state.players[0]
    const player2 = state.players[1]
    const diff = player1.roundsWon - player2.roundsWon

    if (state.status === 'FINISHED') {
      setCurrentImage(state.winnerId === player1.userId ? 'jugador1_gana.png' : 'jugador2_gana.png')
    } else if (diff === 0) {
      setCurrentImage('inicio.png')
    } else if (diff === 1) {
      setCurrentImage('jugador1_ventaja.png')
    } else if (diff === 2) {
      setCurrentImage('jugador1_casi_gana.png')
    } else if (diff === -1) {
      setCurrentImage('jugador2_ventaja.png')
    } else if (diff === -2) {
      setCurrentImage('jugador2_casi_gana.png')
    }
  }

  const handleKeyPress = useCallback(async (e: KeyboardEvent) => {
    if (e.code === 'Space' && canPressKey && !keyPressed && gameState?.status === 'IN_PROGRESS') {
      e.preventDefault()
      setKeyPressed(true)
      setCanPressKey(false)
      try {
        await registerKeyPress(lobbyId, userId)
        setMessage('¡Tecla registrada! Esperando al otro jugador...')
      } catch (error) {
        console.error('Error al registrar tecla:', error)
        setKeyPressed(false)
        setCanPressKey(true)
      }
    }
  }, [canPressKey, keyPressed, gameState, lobbyId, userId])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [handleKeyPress])

  const handleStartGame = async () => {
    if (!gameState || gameState.hostId !== userId) return
    try {
      await startGame(lobbyId, userId)
    } catch (error) {
      console.error('Error al iniciar juego:', error)
    }
  }

  const handleLeaveLobby = async () => {
    try {
      await leaveLobby(lobbyId, userId)
      localStorage.removeItem('armiesLobbyId')
      navigate('/games/armies')
    } catch (error) {
      console.error('Error al salir:', error)
      navigate('/games/armies')
    }
  }

  if (!gameState) {
    return (
      <div style={s.loading}>
        <h2>Cargando...</h2>
      </div>
    )
  }

  const isHost = gameState.players[0]?.userId === userId
  const player1 = gameState.players[0]
  const player2 = gameState.players[1]

  return (
    <div style={{ ...s.page, backgroundImage: `url('/imagenesArmies/fondo.png')` }}>
      {/* Imagen del estado del juego */}
      <div style={s.gameImageContainer}>
        <motion.img
          key={currentImage}
          src={`/imagenesArmies/${currentImage}`}
          alt="Game State"
          style={s.gameImage}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* HUD Superior */}
      <div style={s.topHud}>
        <div style={s.playerInfo}>
          <div style={s.playerName}>{player1?.username || 'Esperando...'}</div>
          <div style={s.roundsWon}>
            {[...Array(3)].map((_, i) => (
              <span key={i} style={{ ...s.roundDot, ...(i < (player1?.roundsWon || 0) ? s.roundDotActive : {}) }}>
                ●
              </span>
            ))}
          </div>
        </div>

        <div style={s.centerInfo}>
          <div style={s.roundNumber}>ROUND {gameState.currentRound}</div>
          <div style={s.pot}>POZO: ${gameState.pot.toLocaleString()}</div>
        </div>

        <div style={s.playerInfo}>
          <div style={s.playerName}>{player2?.username || 'Esperando...'}</div>
          <div style={s.roundsWon}>
            {[...Array(3)].map((_, i) => (
              <span key={i} style={{ ...s.roundDot, ...(i < (player2?.roundsWon || 0) ? s.roundDotActive : {}) }}>
                ●
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Mensaje Central */}
      <AnimatePresence>
        {message && (
          <motion.div
            style={s.messageBox}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instrucción de tecla */}
      {gameState.status === 'IN_PROGRESS' && canPressKey && (
        <motion.div
          style={s.keyInstruction}
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 1 }}
        >
          ⌨️ PRESIONA ESPACIO ⌨️
        </motion.div>
      )}

      {/* Controles de Lobby */}
      {gameState.status === 'WAITING' && (
        <div style={s.lobbyControls}>
          {isHost && gameState.players.length === 2 && (
            <motion.button
              style={{ ...s.btn, ...s.btnStart }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStartGame}
            >
              INICIAR PARTIDA
            </motion.button>
          )}
          {isHost && gameState.players.length < 2 && (
            <div style={s.waitingMessage}>Esperando al segundo jugador...</div>
          )}
          <motion.button
            style={{ ...s.btn, ...s.btnLeave }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLeaveLobby}
          >
            SALIR
          </motion.button>
        </div>
      )}

      {/* Botón de salir durante el juego */}
      {gameState.status === 'IN_PROGRESS' && (
        <button style={s.btnExitGame} onClick={handleLeaveLobby}>
          ✕
        </button>
      )}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    width: '100vw',
    position: 'relative',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Courier New', monospace",
    overflow: 'hidden'
  },
  loading: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#1a1a2e',
    color: '#fff',
    fontFamily: "'Courier New', monospace"
  },
  gameImageContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 1
  },
  gameImage: {
    maxWidth: '80vw',
    maxHeight: '70vh',
    objectFit: 'contain'
  },
  topHud: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '0 40px',
    zIndex: 10
  },
  playerInfo: {
    background: 'rgba(0,0,0,0.7)',
    border: '2px solid #e74c3c',
    borderRadius: 8,
    padding: '12px 20px',
    minWidth: 200
  },
  playerName: {
    color: '#fff',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 8
  },
  roundsWon: {
    display: 'flex',
    gap: 8
  },
  roundDot: {
    color: '#555',
    fontSize: '1.5rem'
  },
  roundDotActive: {
    color: '#e74c3c'
  },
  centerInfo: {
    background: 'rgba(0,0,0,0.8)',
    border: '3px solid #f0a500',
    borderRadius: 8,
    padding: '16px 32px',
    textAlign: 'center'
  },
  roundNumber: {
    color: '#f0a500',
    fontSize: '1.5rem',
    fontWeight: 'bold',
    letterSpacing: 4,
    marginBottom: 8
  },
  pot: {
    color: '#fff',
    fontSize: '1.1rem',
    letterSpacing: 2
  },
  messageBox: {
    position: 'absolute',
    top: '20%',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(231,76,60,0.95)',
    color: '#fff',
    padding: '16px 32px',
    borderRadius: 8,
    fontSize: '1.2rem',
    fontWeight: 'bold',
    letterSpacing: 2,
    textAlign: 'center',
    zIndex: 20,
    border: '2px solid #fff',
    boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
  },
  keyInstruction: {
    position: 'absolute',
    bottom: '15%',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(240,165,0,0.95)',
    color: '#000',
    padding: '20px 40px',
    borderRadius: 12,
    fontSize: '2rem',
    fontWeight: 'bold',
    letterSpacing: 4,
    zIndex: 20,
    border: '3px solid #fff',
    boxShadow: '0 4px 30px rgba(240,165,0,0.6)'
  },
  lobbyControls: {
    position: 'absolute',
    bottom: 40,
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    alignItems: 'center',
    zIndex: 10
  },
  waitingMessage: {
    color: '#fff',
    fontSize: '1rem',
    letterSpacing: 2,
    background: 'rgba(0,0,0,0.7)',
    padding: '12px 24px',
    borderRadius: 8,
    border: '1px solid #555'
  },
  btn: {
    fontFamily: "'Courier New', monospace",
    fontSize: '1rem',
    fontWeight: 'bold',
    letterSpacing: 3,
    padding: '16px 40px',
    borderRadius: 8,
    cursor: 'pointer',
    border: 'none',
    transition: 'all 0.2s',
    textTransform: 'uppercase'
  },
  btnStart: {
    background: '#e74c3c',
    color: '#fff',
    border: '3px solid #fff',
    boxShadow: '0 4px 20px rgba(231,76,60,0.5)'
  },
  btnLeave: {
    background: 'transparent',
    color: '#fff',
    border: '2px solid #fff'
  },
  btnExitGame: {
    position: 'absolute',
    top: 20,
    right: 20,
    background: 'rgba(0,0,0,0.7)',
    color: '#fff',
    border: '2px solid #e74c3c',
    borderRadius: '50%',
    width: 50,
    height: 50,
    fontSize: '1.5rem',
    cursor: 'pointer',
    zIndex: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Courier New', monospace"
  }
}
