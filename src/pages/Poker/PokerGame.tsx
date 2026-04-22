import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import PokerTable from './PokerTable'
import { connectSocket, sendPlayerAction, sendDeal, disconnectSocket } from '../../services/poker/socket'
import { startGame, leaveLobby, endGame } from '../../services/poker/lobbyApi'

const POKER_BASE = import.meta.env.VITE_POKER_URL ?? 'http://localhost:8085'

export default function PokerGame() {
  const { user } = useAuth()
  const [game, setGame]             = useState<any>(null)
  const [connected, setConnected]   = useState(false)
  const [privateHand, setPrivateHand] = useState<any>(null)
  const [raiseAmt, setRaiseAmt]     = useState(2000)
  const [actionError, setActionError] = useState('')
  const [loading, setLoading]       = useState(false)
  const [showBet, setShowBet]       = useState(false)
  const handFetchedRef  = useRef(false)
  const winnerIdRef     = useRef<string | null>(null)
  const isRunningRef    = useRef(false)
  const gameRef         = useRef<any>(null)
  const raiseAmtRef     = useRef(2000)
  const navigate        = useNavigate()

  const gameId    = localStorage.getItem('pokerGameId') || ''
  const lobbyId   = localStorage.getItem('pokerLobbyId') || ''
  const playerId  = user?.id || ''
  const personaje = localStorage.getItem('pokerPersonaje') || '1Personaje.jpeg'

  useEffect(() => { raiseAmtRef.current = raiseAmt }, [raiseAmt])

  async function fetchMyHand() {
    try {
      const gId = localStorage.getItem('pokerGameId')
      const res = await fetch(`${POKER_BASE}/api/v1/player/${gId}/${playerId}/hand`)
      const json = await res.json()
      if (json.data) setPrivateHand(json.data)
    } catch(e) { console.error('Error fetching hand:', e) }
  }

  async function fetchGameState() {
    try {
      const res = await fetch(`${POKER_BASE}/api/v1/lobby`)
      const json = await res.json()
      const lobbies = json.data || []
      const myLobby = lobbies.find((l: any) => l.id === lobbyId)
      if (myLobby?.actualGame?.id) {
        const currentGameId = myLobby.actualGame.id
        if (currentGameId !== localStorage.getItem('pokerGameId')) {
          localStorage.setItem('pokerGameId', currentGameId)
          window.location.reload()
          return
        }
      }
      const gId = localStorage.getItem('pokerGameId')
      const gameRes = await fetch(`${POKER_BASE}/api/v1/game/${gId}`)
      const gameJson = await gameRes.json()
      if (gameJson.data) {
        if (!gameJson.data.inGame && gameJson.data.winner) winnerIdRef.current = gameJson.data.winner.id
        setGame(gameJson.data)
        gameRef.current = gameJson.data
        if (gameJson.data.inGame && !handFetchedRef.current) {
          handFetchedRef.current = true
          setTimeout(() => fetchMyHand(), 500)
        }
      }
    } catch(e) { console.error('Error fetching game state:', e) }
  }

  useEffect(() => {
    if (!gameId || !playerId) { navigate('/games/poker'); return }
    connectSocket(gameId, playerId,
      (data) => {
        if (!data.inGame && data.winner) winnerIdRef.current = data.winner.id
        if (data.inGame && !handFetchedRef.current) { handFetchedRef.current = true; setTimeout(() => fetchMyHand(), 1000) }
        setGame(data); gameRef.current = data
      },
      (handData) => { if (handData?.playerId === playerId) setPrivateHand(handData) }
    )
      .then(() => { setConnected(true); setTimeout(() => fetchGameState(), 500) })
      .catch(() => setActionError('No se pudo conectar al servidor'))

    const pollInterval = setInterval(() => { if (!isRunningRef.current) fetchGameState() }, 3000)
    return () => { disconnectSocket(); setConnected(false); clearInterval(pollInterval) }
  }, [gameId, playerId])

  const currentPlayer     = game?.players?.find((p: any) => p.id === playerId) || null
  const currentTurnPlayer = game?.players?.[game?.currentPlayerIndex]
  const isMyTurn          = !!(currentPlayer && currentTurnPlayer?.id === currentPlayer.id)
  const isRunning         = game?.inGame === true
  isRunningRef.current    = isRunning
  const isFinished        = game?.inGame === false && game?.winner
  const isShowdown        = game?.phase === 'SHOWDOWN'
  const isFolded          = currentPlayer?.folded === true
  const hasActiveBet      = (game?.actualBet || 0) > 0

  function doAction(action: string, amount: number) {
    if (!gameId || !playerId) return
    setActionError('')
    try { sendPlayerAction(gameId, action, playerId, amount || 0) } catch (e: any) { setActionError(e.message) }
  }

  function handleConfirmBet() {
    const currentActualBet = gameRef.current?.actualBet || 0
    const increment = Math.max(raiseAmtRef.current - currentActualBet, 0)
    setShowBet(false)
    doAction('RAISE', increment)
  }

  function handleOpenBet() {
    const currentActualBet = gameRef.current?.actualBet || 0
    setRaiseAmt(currentActualBet > 0 ? currentActualBet + 1 : 2000)
    setShowBet(true)
  }

  async function handleStartGame() {
    if (!lobbyId) return setActionError('No se encontró el lobby')
    setLoading(true); setActionError('')
    try {
      await startGame(lobbyId)
      setTimeout(() => { try { sendDeal(gameId) } catch(e) {} }, 500)
    } catch (e: any) { setActionError(e.message) }
    finally { setLoading(false) }
  }

  async function handleContinue() {
    if (!lobbyId) return
    setLoading(true); setActionError('')
    try {
      let winnerId = winnerIdRef.current || gameRef.current?.winner?.id
      if (!winnerId) {
        const gRes = await fetch(`${POKER_BASE}/api/v1/game/${gameId}`)
        const gJson = await gRes.json()
        winnerId = gJson.data?.winner?.id
      }
      if (winnerId) {
        const updatedLobby = await endGame(lobbyId, winnerId)
        const newGameId = updatedLobby?.actualGame?.id
        if (newGameId) localStorage.setItem('pokerGameId', newGameId)
      }
      window.location.reload()
    } catch(e: any) { setActionError(e.message); setLoading(false) }
  }

  async function handleExit() {
    if (playerId) { try { await leaveLobby(playerId) } catch (_) {} }
    disconnectSocket()
    localStorage.removeItem('pokerGameId')
    localStorage.removeItem('pokerLobbyId')
    localStorage.removeItem('pokerPersonaje')
    navigate('/games/poker')
  }

  /* ── PANTALLA DE APUESTA ── */
  if (showBet) {
    const currentActualBetVal = gameRef.current?.actualBet || 0
    const minBet   = currentActualBetVal > 0 ? currentActualBetVal + 1 : 2000
    const myCredit = currentPlayer?.credit || 0
    return (
      <div style={s.page}>
        <img src="/imagenesPoker/SeleccionoBet.jpeg" alt="apuesta"
          style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0, pointerEvents: 'none' }} />

        {/* Créditos disponibles — más grande */}
        <div style={{ position: 'fixed', top: '65%', left: '2%', zIndex: 5, fontFamily: 'Courier New, monospace', fontSize: 36, fontWeight: 'bold', color: '#f0a500', textShadow: '1px 1px 0 #000' }}>
          💰 {myCredit.toLocaleString()}
        </div>

        {/* Input de cantidad — mucho más grande */}
        <input type="number" value={raiseAmt}
          onChange={(e) => { const v = Number(e.target.value); setRaiseAmt(v); raiseAmtRef.current = v }}
          min={minBet} step={500}
          style={{ position: 'fixed', top: '66%', left: '36%', width: '28%', zIndex: 5, background: 'transparent', border: 'none', outline: 'none', fontFamily: 'Courier New, monospace', fontSize: 56, fontWeight: 'bold', color: '#222', textAlign: 'center' }} />

        <button style={{ position: 'fixed', top: '79%', left: '36.1%', width: '27.8%', height: '9%', zIndex: 5, background: 'transparent', border: 'none', cursor: 'pointer' }} onClick={handleConfirmBet} />
        <button style={{ position: 'fixed', top: '93%', left: '36.1%', width: '27.8%', height: '9%', zIndex: 5, background: 'transparent', border: 'none', cursor: 'pointer' }} onClick={() => setShowBet(false)} />
      </div>
    )
  }

  return (
    <div style={s.page}>
      <img src={`/imagenesPoker/VistaPersonajes/${personaje}`} alt="mesa"
        style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0, pointerEvents: 'none' }}
        onError={(e: any) => { e.target.src = '/imagenesPoker/VistaPersonajes/1Personaje.jpeg' }} />

      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse at 50% 0%, rgba(10,20,10,0.55) 0%, rgba(2,5,2,0.75) 100%)', zIndex: 0 }} />

      <div style={s.content}>

        {/* Top bar */}
        <div style={s.topBar}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <span style={s.topBarLabel}>CÓDIGO MESA</span>
            <span style={s.topBarValue}>{lobbyId?.slice(-6).toUpperCase()}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', display: 'inline-block', background: connected ? '#27ae60' : '#c0392b', boxShadow: connected ? '0 0 6px #27ae60' : 'none' }} />
            <span style={{ fontFamily: 'Courier New, monospace', fontSize: 10, color: connected ? '#27ae60' : '#c0392b', letterSpacing: 2 }}>
              {connected ? 'CONECTADO' : 'DESCONECTADO'}
            </span>
          </div>
          <button style={s.exitBtn} onClick={handleExit}>SALIR</button>
        </div>

        {/* Tabla de juego */}
        <div style={s.tableArea}>
          <PokerTable game={game} currentPlayer={currentPlayer} privateHand={privateHand} onContinue={handleContinue} />
        </div>

        {/* Panel de acciones */}
        <div style={s.actionsPanel}>

          {!isRunning && !isFinished && (
            <div style={s.actionRow}>
              <button style={{ ...s.btn, ...s.btnStart }} onClick={handleStartGame} disabled={loading || !connected}>
                {loading ? 'INICIANDO...' : '▶  INICIAR PARTIDA'}
              </button>
            </div>
          )}

          {isRunning && !isShowdown && (
            <div style={s.btnRow}>
              <button
                style={{ ...s.btn, ...s.btnRed, opacity: (!isMyTurn || isFolded) ? 0.3 : 1 }}
                disabled={!isMyTurn || isFolded || !connected}
                onClick={handleOpenBet}
              >APOSTAR</button>

              <button
                style={{ ...s.btn, ...s.btnBlue, opacity: (!isMyTurn || isFolded) ? 0.3 : 1 }}
                disabled={!isMyTurn || isFolded || !connected}
                onClick={() => doAction('CALL', 0)}
              >IGUALAR</button>

              <button
                style={{ ...s.btn, ...s.btnGreen, opacity: (!isMyTurn || isFolded || hasActiveBet) ? 0.3 : 1 }}
                disabled={!isMyTurn || isFolded || !connected || hasActiveBet}
                onClick={() => doAction('CHECK', 0)}
              >PASAR</button>

              <button
                style={{ ...s.btn, ...s.btnGold, opacity: (!isMyTurn || isFolded) ? 0.3 : 1 }}
                disabled={!isMyTurn || isFolded || !connected}
                onClick={() => doAction('FOLD', 0)}
              >RETIRARSE</button>
            </div>
          )}

          {isRunning && isFolded && (
            <div style={s.foldedMsg}>te retiraste — observando la partida...</div>
          )}

          {actionError && (
            <div style={s.errorMsg}>⚠  {actionError}</div>
          )}

        </div>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page:    { minHeight: '100vh', background: '#050e08', display: 'flex', flexDirection: 'column', position: 'relative' },
  content: { position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' },

  topBar:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid #0f0f0f', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', position: 'sticky', top: 0, zIndex: 10 },
  topBarLabel: { fontFamily: 'Courier New, monospace', fontSize: 10, color: '#f0a500', letterSpacing: 3, textTransform: 'uppercase' },
  topBarValue: { fontFamily: 'Courier New, monospace', fontSize: 16, color: '#fff', letterSpacing: 4, fontWeight: 'bold' },

  exitBtn: { fontFamily: 'Courier New, monospace', fontSize: 10, fontWeight: 'bold', letterSpacing: 2, padding: '7px 16px', background: 'transparent', border: '1px solid #3a0a0a', color: '#c0392b', cursor: 'pointer', borderRadius: 2 },

  tableArea:    { flex: 1, overflowY: 'auto' },
  actionsPanel: { borderTop: '2px solid #0a0a0a', background: 'rgba(0,0,0,0.92)', display: 'flex', flexDirection: 'column', gap: 0, position: 'sticky', bottom: 0, backdropFilter: 'blur(4px)' },

  actionRow: { display: 'flex', gap: 8, alignItems: 'center', padding: '10px 16px' },

  btnRow: { display: 'flex', width: '100%', gap: 0 },

  btn: {
    fontFamily: 'Courier New, monospace',
    fontWeight: 'bold',
    fontSize: 22,
    letterSpacing: 3,
    textTransform: 'uppercase',
    padding: '42px 0',
    flex: 1,
    border: 'none',
    borderRight: '1px solid rgba(0,0,0,0.4)',
    cursor: 'pointer',
    transition: 'filter 0.15s, opacity 0.2s',
    borderRadius: 0,
  },

  btnRed:   { background: '#c0392b', color: '#fff' },
  btnBlue:  { background: '#1a5276', color: '#aee6ff' },
  btnGreen: { background: '#1a4a28', color: '#7dda58' },
  btnGold:  { background: '#2e2400', color: '#f0a500', borderRight: 'none' },

  btnStart:  { flex: 'none', padding: '10px 20px', background: 'transparent', border: '1px solid rgba(125,218,88,0.3)', color: '#7dda58', borderRadius: 2, fontSize: 12 },
  foldedMsg: { fontFamily: 'Courier New, monospace', fontSize: 10, color: '#444', letterSpacing: 2, textAlign: 'center', padding: '8px', borderTop: '1px solid #111' },
  errorMsg:  { fontFamily: 'Courier New, monospace', color: '#e74c3c', fontSize: 11, padding: '8px 16px', background: 'rgba(192,57,43,0.08)', borderTop: '1px solid rgba(192,57,43,0.2)' },
}