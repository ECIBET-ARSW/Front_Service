import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import PokerTable from './PokerTable'
import { connectSocket, sendPlayerAction, sendDeal, disconnectSocket } from '../../services/poker/socket'
import { startGame, leaveLobby, endGame } from '../../services/poker/lobbyApi'

const POKER_BASE   = import.meta.env.VITE_POKER_URL   ?? 'http://localhost:8085'
const WALLETS_URL  = import.meta.env.VITE_WALLETS_URL ?? 'http://localhost:8082'
const AUTO_ACTION_SECONDS = 90

export default function PokerGame() {
  const { user, updateBalance } = useAuth()
  const [game, setGame]               = useState<any>(null)
  const [connected, setConnected]     = useState(false)
  const [privateHand, setPrivateHand] = useState<any>(null)
  const [raiseAmt, setRaiseAmt]       = useState(2000)
  const [actionError, setActionError] = useState('')
  const [betWarning, setBetWarning]   = useState('')
  const [loading, setLoading]         = useState(false)
  const [showBet, setShowBet]         = useState(false)
  const [turnTimer, setTurnTimer]     = useState(AUTO_ACTION_SECONDS)
  const handFetchedRef  = useRef(false)
  const winnerIdRef     = useRef<string | null>(null)
  const isRunningRef    = useRef(false)
  const gameRef         = useRef<any>(null)
  const raiseAmtRef     = useRef(2000)
  const timerRef        = useRef<any>(null)
  const navigate        = useNavigate()

  const gameId    = localStorage.getItem('pokerGameId') || ''
  const lobbyId   = localStorage.getItem('pokerLobbyId') || ''
  const playerId  = user?.id || ''
  const personaje = localStorage.getItem('pokerPersonaje') || '1Personaje.jpeg'

  useEffect(() => { raiseAmtRef.current = raiseAmt }, [raiseAmt])

  function calcMaxAllIn(gameData: any): number {
    if (!gameData?.players) return 0
    const active = gameData.players.filter((p: any) => p.inLobby && !p.folded)
    if (active.length === 0) return 0
    return Math.min(...active.map((p: any) => p.credit ?? 0))
  }

  async function fetchMyHand() {
    try {
      const gId = localStorage.getItem('pokerGameId')
      const res = await fetch(`${POKER_BASE}/api/v1/player/${gId}/${playerId}/hand`)
      const json = await res.json()
      if (json.data) setPrivateHand(json.data)
    } catch(e) { console.error('Error fetching hand:', e) }
  }

  async function refreshWalletBalance() {
    if (!playerId) return
    try {
      const token = localStorage.getItem('token') ?? ''
      const res = await fetch(`${WALLETS_URL}/api/v1/wallets/${playerId}/balance`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) return
      const data = await res.json()
      const balance = Math.floor(data?.data?.balance ?? 0)
      updateBalance(balance)
    } catch (_) {}
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
        if (!gameJson.data.inGame && gameJson.data.winner) {
          winnerIdRef.current = gameJson.data.winner.id
          refreshWalletBalance()
        }
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
        if (!data.inGame && data.winner) {
          winnerIdRef.current = data.winner.id
          refreshWalletBalance()
        }
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
  const isAllIn           = currentPlayer?.allIn === true
  const hasActiveBet      = (game?.actualBet || 0) > 0
  const pot               = game?.pot || 0
  const maxAllIn          = calcMaxAllIn(game)
  const myCredit          = currentPlayer?.credit ?? 0

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (!isMyTurn || !isRunning || isFolded || isAllIn) {
      setTurnTimer(AUTO_ACTION_SECONDS)
      return
    }
    setTurnTimer(AUTO_ACTION_SECONDS)
    timerRef.current = setInterval(() => {
      setTurnTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          if ((gameRef.current?.actualBet || 0) > 0) {
            doAction('CALL', 0)
          } else {
            doAction('CHECK', 0)
          }
          return AUTO_ACTION_SECONDS
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [isMyTurn, isRunning, game?.currentPlayerIndex])

  function doAction(action: string, amount: number) {
    if (!gameId || !playerId) return
    setActionError('')
    try { sendPlayerAction(gameId, action, playerId, amount || 0) } catch (e: any) { setActionError(e.message) }
  }

  function handleConfirmBet() {
    const currentActualBet = gameRef.current?.actualBet || 0
    const increment = Math.max(raiseAmtRef.current - currentActualBet, 0)
    const currentMyCredit = gameRef.current?.players?.find((p: any) => p.id === playerId)?.credit ?? 0

    if (increment > currentMyCredit) {
      setBetWarning(`No tienes suficientes créditos. Máximo: $${currentMyCredit.toLocaleString()} COP`)
      setRaiseAmt(currentActualBet + currentMyCredit)
      raiseAmtRef.current = currentActualBet + currentMyCredit
      return
    }

    const currentMaxAllIn = calcMaxAllIn(gameRef.current)
    if (increment > currentMaxAllIn) {
      setBetWarning(`La apuesta máxima permitida es $${currentMaxAllIn.toLocaleString()} COP (all-in del jugador con menos créditos)`)
      return
    }
    setBetWarning('')
    setShowBet(false)
    doAction('RAISE', increment)
  }

  function handleAllIn() {
    const currentActualBet = gameRef.current?.actualBet || 0
    const currentMaxAllIn  = calcMaxAllIn(gameRef.current)
    setRaiseAmt(currentActualBet + currentMaxAllIn)
    raiseAmtRef.current = currentActualBet + currentMaxAllIn
    setBetWarning('')
  }

  function handleOpenBet() {
    const currentActualBet = gameRef.current?.actualBet || 0
    setRaiseAmt(currentActualBet > 0 ? currentActualBet + 1 : 2000)
    setBetWarning('')
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
      await refreshWalletBalance()
      window.location.reload()
    } catch(e: any) { setActionError(e.message); setLoading(false) }
  }

  async function handleExit() {
    if (playerId) { try { await leaveLobby(playerId) } catch (_) {} }
    disconnectSocket()
    await refreshWalletBalance()
    localStorage.removeItem('pokerGameId')
    localStorage.removeItem('pokerLobbyId')
    localStorage.removeItem('pokerPersonaje')
    navigate('/games/poker')
  }

  /* ── PANTALLA DE APUESTA ── */
  if (showBet) {
    const currentActualBetVal = gameRef.current?.actualBet || 0
    const minBet = currentActualBetVal > 0 ? currentActualBetVal + 1 : 2000
    return (
      <div style={s.page}>
        <div style={s.betScreen}>
          <div style={s.betCard}>
            <p style={s.betCardTitle}>SELECCIONA TU APUESTA</p>

            <div style={s.betCreditsRow}>
              <span style={s.betCreditsLabel}>Tus créditos</span>
              <span style={s.betCreditsValue}>💰 {myCredit.toLocaleString()} COP</span>
            </div>

            <div style={s.betCreditsRow}>
              <span style={s.betCreditsLabel}>Máx. all-in</span>
              <span style={{ ...s.betCreditsValue, color: '#e67e22' }}>${maxAllIn.toLocaleString()} COP</span>
            </div>

            <input
              type="number"
              value={raiseAmt}
              onChange={(e) => {
                const v = Number(e.target.value)
                const capped = Math.min(v, myCredit)
                setRaiseAmt(capped)
                raiseAmtRef.current = capped
                setBetWarning('')
              }}
              min={minBet}
              max={myCredit}
              step={500}
              style={s.betInput}
            />

            {betWarning && (
              <div style={s.betWarning}>⚠ {betWarning}</div>
            )}

            <div style={s.betQuickRow}>
              {[minBet, Math.floor(maxAllIn * 0.25), Math.floor(maxAllIn * 0.5), maxAllIn].map((v, i) => (
                <button key={i} style={s.betQuickBtn} onClick={() => {
                  const val = currentActualBetVal + v
                  setRaiseAmt(val)
                  raiseAmtRef.current = val
                  setBetWarning('')
                }}>
                  {i === 0 ? 'MÍN' : i === 1 ? '25%' : i === 2 ? '50%' : 'ALL-IN'}
                </button>
              ))}
            </div>

            <button style={s.allInBtn} onClick={handleAllIn}>
              🔥 ALL-IN — ${maxAllIn.toLocaleString()} COP
            </button>

            <div style={s.betActions}>
              <button style={{ ...s.betActionBtn, background: 'transparent', border: '1px solid #555', color: '#555' }} onClick={() => { setShowBet(false); setBetWarning('') }}>
                CANCELAR
              </button>
              <button style={{ ...s.betActionBtn, background: '#c0392b', color: '#fff' }} onClick={handleConfirmBet}>
                APOSTAR
              </button>
            </div>
          </div>
        </div>
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
            <span style={s.topBarLabel}>MESA</span>
            <span style={s.topBarValue}>{lobbyId?.slice(-6).toUpperCase()}</span>
          </div>

          {/* POZO ACUMULADO */}
          {isRunning && (
            <div style={s.potDisplay}>
              <span style={s.potLabel}>POZO</span>
              <span style={s.potValue}>${pot.toLocaleString()} COP</span>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', display: 'inline-block', background: connected ? '#27ae60' : '#c0392b', boxShadow: connected ? '0 0 6px #27ae60' : 'none' }} />
              <span style={{ fontFamily: 'Courier New, monospace', fontSize: 10, color: connected ? '#27ae60' : '#c0392b', letterSpacing: 2 }}>
                {connected ? 'CONECTADO' : 'DESCONECTADO'}
              </span>
            </div>
            <button style={s.exitBtn} onClick={handleExit}>SALIR</button>
          </div>
        </div>

        {/* Tabla de juego */}
        <div style={s.tableArea}>
          <PokerTable game={game} currentPlayer={currentPlayer} privateHand={privateHand} onContinue={handleContinue} />
        </div>

        {/* Panel de acciones */}
        <div style={s.actionsPanel}>

          {!isRunning && !isFinished && (
            <div style={s.actionRow}>
              <button style={s.btnStart} onClick={handleStartGame} disabled={loading || !connected}>
                {loading ? 'INICIANDO...' : '▶  INICIAR PARTIDA'}
              </button>
            </div>
          )}

          {isRunning && !isShowdown && (
            <>
              {isMyTurn && !isFolded && !isAllIn && (
                <div style={s.timerBar}>
                  <div style={{ ...s.timerFill, width: `${(turnTimer / AUTO_ACTION_SECONDS) * 100}%`, background: turnTimer <= 10 ? '#c0392b' : '#f0a500' }} />
                  <span style={s.timerText}>{turnTimer}s</span>
                </div>
              )}
              <div style={s.btnRow}>
                <button
                  style={{ ...s.btn, ...s.btnRed, opacity: (!isMyTurn || isFolded || isAllIn || myCredit === 0) ? 0.3 : 1 }}
                  disabled={!isMyTurn || isFolded || isAllIn || myCredit === 0 || !connected}
                  onClick={handleOpenBet}
                >APOSTAR</button>

                <button
                  style={{ ...s.btn, ...s.btnBlue, opacity: (!isMyTurn || isFolded || isAllIn || !hasActiveBet || myCredit === 0) ? 0.3 : 1 }}
                  disabled={!isMyTurn || isFolded || isAllIn || !hasActiveBet || myCredit === 0 || !connected}
                  onClick={() => doAction('CALL', 0)}
                >IGUALAR</button>

                <button
                  style={{ ...s.btn, ...s.btnGreen, opacity: (!isMyTurn || isFolded || hasActiveBet) ? 0.3 : 1 }}
                  disabled={!isMyTurn || isFolded || !connected || hasActiveBet}
                  onClick={() => doAction('CHECK', 0)}
                >PASAR</button>

                <button
                  style={{ ...s.btn, ...s.btnGold, opacity: (!isMyTurn || isFolded || isAllIn) ? 0.3 : 1 }}
                  disabled={!isMyTurn || isFolded || isAllIn || !connected}
                  onClick={() => doAction('FOLD', 0)}
                >RETIRARSE</button>
              </div>
            </>
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

  topBar:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'clamp(8px,2vw,12px) clamp(12px,3vw,20px)', borderBottom: '1px solid #0f0f0f', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', position: 'sticky', top: 0, zIndex: 10 },
  topBarLabel: { fontFamily: 'Courier New, monospace', fontSize: 10, color: '#f0a500', letterSpacing: 3, textTransform: 'uppercase' },
  topBarValue: { fontFamily: 'Courier New, monospace', fontSize: 'clamp(12px,3vw,16px)', color: '#fff', letterSpacing: 4, fontWeight: 'bold' },

  potDisplay: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 },
  potLabel:   { fontFamily: 'Courier New, monospace', fontSize: 10, color: '#f0a500', letterSpacing: 3, textTransform: 'uppercase' },
  potValue:   { fontFamily: 'Courier New, monospace', fontSize: 'clamp(14px,3vw,22px)', color: '#f0a500', fontWeight: 'bold', letterSpacing: 2, textShadow: '0 0 10px rgba(240,165,0,0.5)' },

  exitBtn: { fontFamily: 'Courier New, monospace', fontSize: 10, fontWeight: 'bold', letterSpacing: 2, padding: '7px 16px', background: 'transparent', border: '1px solid #3a0a0a', color: '#c0392b', cursor: 'pointer', borderRadius: 2 },

  tableArea:    { flex: 1, overflowY: 'auto' },
  actionsPanel: { borderTop: '2px solid #0a0a0a', background: 'rgba(0,0,0,0.92)', display: 'flex', flexDirection: 'column', gap: 0, position: 'sticky', bottom: 0, backdropFilter: 'blur(4px)' },

  actionRow: { display: 'flex', gap: 8, alignItems: 'center', padding: '10px 16px' },
  btnRow:    { display: 'flex', width: '100%', gap: 0 },

  btn: {
    fontFamily: 'Courier New, monospace',
    fontWeight: 'bold',
    fontSize: 'clamp(11px,2.5vw,22px)',
    letterSpacing: 'clamp(1px,0.5vw,3px)',
    textTransform: 'uppercase',
    padding: 'clamp(16px,4vw,42px) 0',
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

  btnStart:  { padding: '10px 20px', background: 'transparent', border: '1px solid rgba(125,218,88,0.3)', color: '#7dda58', borderRadius: 2, fontSize: 12, fontFamily: 'Courier New, monospace', cursor: 'pointer', letterSpacing: 2 },
  foldedMsg: { fontFamily: 'Courier New, monospace', fontSize: 10, color: '#444', letterSpacing: 2, textAlign: 'center', padding: '8px', borderTop: '1px solid #111' },
  errorMsg:  { fontFamily: 'Courier New, monospace', color: '#e74c3c', fontSize: 11, padding: '8px 16px', background: 'rgba(192,57,43,0.08)', borderTop: '1px solid rgba(192,57,43,0.2)' },
  timerBar:  { position: 'relative' as const, height: 4, background: '#1a1a1a', overflow: 'hidden' },
  timerFill: { position: 'absolute' as const, left: 0, top: 0, height: '100%', transition: 'width 1s linear, background 0.3s' },
  timerText: { position: 'absolute' as const, right: 8, top: -14, fontFamily: 'Courier New, monospace', fontSize: 10, color: '#555', letterSpacing: 1 },

  betScreen:       { position: 'fixed', inset: 0, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.92)', padding: 16 },
  betCard:         { background: '#0d1a0d', border: '2px solid #f0a500', borderRadius: 4, padding: 'clamp(20px,5vw,36px)', width: '100%', maxWidth: 440, display: 'flex', flexDirection: 'column', gap: 16 },
  betCardTitle:    { fontFamily: 'Courier New, monospace', color: '#f0a500', fontSize: 'clamp(12px,3vw,16px)', letterSpacing: 4, textTransform: 'uppercase', margin: 0, textAlign: 'center' },
  betCreditsRow:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.4)', padding: '8px 14px', borderRadius: 2 },
  betCreditsLabel: { fontFamily: 'Courier New, monospace', fontSize: 11, color: '#555', letterSpacing: 2 },
  betCreditsValue: { fontFamily: 'Courier New, monospace', fontSize: 'clamp(14px,3.5vw,20px)', color: '#f0a500', fontWeight: 'bold' },
  betInput:        { width: '100%', background: '#0d0d1a', border: '2px solid #f0a500', color: '#fff', padding: '14px 16px', fontFamily: 'Courier New, monospace', fontSize: 'clamp(24px,6vw,40px)', fontWeight: 'bold', borderRadius: 2, textAlign: 'center', boxSizing: 'border-box' as const },
  betWarning:      { fontFamily: 'Courier New, monospace', fontSize: 11, color: '#e67e22', background: 'rgba(230,126,34,0.1)', border: '1px solid rgba(230,126,34,0.3)', padding: '8px 12px', borderRadius: 2, letterSpacing: 1, lineHeight: 1.4 },
  betQuickRow:     { display: 'flex', gap: 8 },
  betQuickBtn:     { flex: 1, background: 'transparent', border: '1px solid #2a2a4a', color: '#888', padding: '8px 4px', fontFamily: 'Courier New, monospace', fontSize: 'clamp(9px,2vw,11px)', cursor: 'pointer', borderRadius: 2, letterSpacing: 1 },
  allInBtn:        { width: '100%', background: 'linear-gradient(135deg, #7a2d00, #c0392b)', border: '2px solid #e67e22', color: '#fff', padding: '12px', fontFamily: 'Courier New, monospace', fontSize: 'clamp(12px,3vw,16px)', fontWeight: 'bold', letterSpacing: 3, cursor: 'pointer', borderRadius: 2, textTransform: 'uppercase' },
  betActions:      { display: 'flex', gap: 12 },
  betActionBtn:    { flex: 1, padding: 'clamp(10px,3vw,14px)', fontFamily: 'Courier New, monospace', fontWeight: 'bold', fontSize: 'clamp(12px,3vw,16px)', letterSpacing: 2, cursor: 'pointer', borderRadius: 2, border: 'none' },
}