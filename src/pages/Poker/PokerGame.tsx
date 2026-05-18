import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import PokerTable from './PokerTable'
import { connectSocket, sendPlayerAction, sendDeal, disconnectSocket } from '../../services/poker/socket'
import { startGame, leaveLobby, endGame } from '../../services/poker/lobbyApi'

const POKER_BASE   = import.meta.env.VITE_POKER_URL   ?? 'http://localhost:8085'
const WALLETS_URL  = import.meta.env.VITE_WALLETS_URL ?? 'http://localhost:8082'
const AUTO_ACTION_SECONDS = 120
const AUTO_START_SECONDS  = 150

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
  const [leaderId, setLeaderId]       = useState<string | null>(null)
  const handFetchedRef   = useRef(false)
  const winnerIdRef      = useRef<string | null>(null)
  const isRunningRef     = useRef(false)
  const gameRef          = useRef<any>(null)
  const raiseAmtRef      = useRef(2000)
  const timerRef         = useRef<any>(null)
  const autoStartRef     = useRef<any>(null)
  const autoStartedRef   = useRef(false)
  const navigate         = useNavigate()
  const gameId    = localStorage.getItem('pokerGameId') || ''
  const lobbyId   = localStorage.getItem('pokerLobbyId') || ''
  const playerId  = user?.id || ''
  const myAvatarIndex = game?.players?.find((p: any) => p.id === playerId)?.avatarIndex
  const personaje = myAvatarIndex
    ? `${Math.min(myAvatarIndex, 6)}Personaje.jpeg`
    : localStorage.getItem('pokerPersonaje') || '1Personaje.jpeg'
  useEffect(() => { raiseAmtRef.current = raiseAmt }, [raiseAmt])
  function calcMaxAllIn(gameData: any): number {
    if (!gameData?.players) return 0
    if (gameData.maxBet > 0) return gameData.maxBet
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

  async function fetchLeaderId() {
    try {
      const res = await fetch(`${POKER_BASE}/api/v1/lobby`)
      const json = await res.json()
      const lobbies = json.data || []
      const myLobby = lobbies.find((l: any) => l.id === lobbyId)
      if (myLobby?.leaderId) setLeaderId(myLobby.leaderId)
    } catch (_) {}
  }

  function startAutoStartTimer() {
    if (autoStartRef.current) clearTimeout(autoStartRef.current)
    autoStartRef.current = setTimeout(async () => {
      if (!isRunningRef.current && !autoStartedRef.current) {
        const currentGame = gameRef.current
        const activePlayers = currentGame?.players?.filter((p: any) => p.inLobby) ?? []
        if (activePlayers.length >= 2) {
          autoStartedRef.current = true
          try {
            await startGame(lobbyId)
            setTimeout(() => { try { sendDeal(localStorage.getItem('pokerGameId') || '') } catch(_) {} }, 500)
          } catch (_) {}
        }
      }
    }, AUTO_START_SECONDS * 1000)
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
          const me = gameJson.data.players?.find((p: any) => p.id === playerId)
          const lost = gameJson.data.winner.id !== playerId
          if (lost && me && (me.credit ?? 0) === 0) {
            setTimeout(() => {
              localStorage.removeItem('pokerGameId')
              localStorage.removeItem('pokerLobbyId')
              localStorage.removeItem('pokerPersonaje')
              navigate('/games/poker')
            }, 3000)
          }
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
    fetchLeaderId()
    connectSocket(gameId, playerId,
      (data) => {
        if (!data.inGame && data.winner) {
          winnerIdRef.current = data.winner.id
          refreshWalletBalance()
          const me = data.players?.find((p: any) => p.id === playerId)
          const lost = data.winner.id !== playerId
          if (lost && me && (me.credit ?? 0) === 0) {
            setTimeout(() => {
              localStorage.removeItem('pokerGameId')
              localStorage.removeItem('pokerLobbyId')
              localStorage.removeItem('pokerPersonaje')
              navigate('/games/poker')
            }, 3000)
          }
        }
        if (data.inGame && !handFetchedRef.current) { handFetchedRef.current = true; setTimeout(() => fetchMyHand(), 1000) }
        setGame(data)
        gameRef.current = data
        if (!data.inGame) fetchGameState()
      },
      (handData) => { if (handData?.playerId === playerId) setPrivateHand(handData) }
    )
      .then(() => {
        setConnected(true)
        setTimeout(() => fetchGameState(), 500)
        startAutoStartTimer()
      })
      .catch(() => setActionError('No se pudo conectar al servidor'))

    const pollInterval = setInterval(() => {
      if (!isRunningRef.current) {
        fetchGameState()
        fetchLeaderId()
      }
    }, 3000)
    return () => {
      disconnectSocket()
      setConnected(false)
      clearInterval(pollInterval)
      if (autoStartRef.current) clearTimeout(autoStartRef.current)
    }
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
  const someoneAllIn      = game?.players?.some((p: any) => p.inLobby && !p.folded && p.allIn) ?? false
  const activePlayers     = game?.players?.filter((p: any) => p.inLobby) ?? []
  const isLeader          = leaderId === playerId
  const canStart          = isLeader && activePlayers.length >= 2

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
      setBetWarning(`La apuesta máxima permitida es $${currentMaxAllIn.toLocaleString()} COP`)
      return
    }
    setBetWarning('')
    setShowBet(false)
    doAction('RAISE', increment)
  }

  function handleAllIn() {
    const currentMaxAllIn = calcMaxAllIn(gameRef.current)
    setBetWarning('')
    setShowBet(false)
    doAction('RAISE', currentMaxAllIn)
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
    try {
      const map = JSON.parse(localStorage.getItem('pokerPersonajeMap') || '{}')
      delete map[playerId]
      if (Object.keys(map).length === 0) {
        localStorage.removeItem('pokerPersonajeMap')
      } else {
        localStorage.setItem('pokerPersonajeMap', JSON.stringify(map))
      }
    } catch (_) {}
    localStorage.removeItem('pokerGameId')
    localStorage.removeItem('pokerLobbyId')
    localStorage.removeItem('pokerPersonaje')
    navigate('/games/poker')
  }

  const allInPlayer     = game?.players?.find((p: any) => p.inLobby && !p.folded && p.allIn)
  const isAllInPlayer   = allInPlayer?.id === playerId
  const allPlayersEqual = someoneAllIn && game?.players
    ?.filter((p: any) => p.inLobby && !p.folded)
    .every((p: any) => p.allIn || p.currentBet === game?.actualBet)
  const canBet   = isMyTurn && !isFolded && !isAllIn && !someoneAllIn && myCredit > 0
  const canCall  = isMyTurn && !isFolded && !isAllIn && (hasActiveBet || someoneAllIn) && myCredit > 0 && !allPlayersEqual
  const canCheck = isMyTurn && !isFolded && !isAllIn && !someoneAllIn && !hasActiveBet || (allPlayersEqual && isAllInPlayer && isMyTurn)
  const canFold  = isMyTurn && !isFolded && !isAllIn && !allPlayersEqual

  if (showBet) {
    const currentActualBetVal = gameRef.current?.actualBet || 0
    const minBet = currentActualBetVal > 0 ? currentActualBetVal + 1 : 2000
    const pcts = [
      { label: 'MÍN', val: minBet },
      { label: '25%', val: Math.floor(maxAllIn * 0.25) },
      { label: '50%', val: Math.floor(maxAllIn * 0.5)  },
      { label: '75%', val: Math.floor(maxAllIn * 0.75) },
    ]
    return (
      <div style={s.betOverlay}>
        <div style={s.betModal}>
          <div style={s.betHeader}>
            <span style={s.betHeaderTitle}>💰 TU APUESTA</span>
            <button style={s.betCloseBtn} onClick={() => { setShowBet(false); setBetWarning('') }}>✕</button>
          </div>

          <div style={s.betInfoGrid}>
            <div style={s.betInfoBox}>
              <span style={s.betInfoLabel}>Tus créditos</span>
              <span style={s.betInfoValue}>{myCredit.toLocaleString()}</span>
            </div>
            <div style={s.betInfoBox}>
              <span style={s.betInfoLabel}>Apuesta actual</span>
              <span style={{ ...s.betInfoValue, color: '#e67e22' }}>{currentActualBetVal.toLocaleString()}</span>
            </div>
            <div style={s.betInfoBox}>
              <span style={s.betInfoLabel}>Máx. all-in</span>
              <span style={{ ...s.betInfoValue, color: '#c0392b' }}>{maxAllIn.toLocaleString()}</span>
            </div>
          </div>

          <div style={s.betSliderWrap}>
            <input
              type="range"
              min={minBet}
              max={maxAllIn}
              step={500}
              value={Math.min(raiseAmt, maxAllIn)}
              onChange={(e) => {
                const v = Number(e.target.value)
                setRaiseAmt(v); raiseAmtRef.current = v; setBetWarning('')
              }}
              style={s.betSlider}
            />
            <div style={s.betAmountDisplay}>
              <span style={s.betCurrencySymbol}>$</span>
              <input
                type="number"
                value={raiseAmt}
                onChange={(e) => {
                  const v = Math.min(Number(e.target.value), maxAllIn)
                  setRaiseAmt(v); raiseAmtRef.current = v; setBetWarning('')
                }}
                min={minBet}
                max={maxAllIn}
                style={s.betAmountInput}
              />
              <span style={s.betCOPLabel}>COP</span>
            </div>
          </div>

          {betWarning && <div style={s.betWarning}>⚠ {betWarning}</div>}

          <div style={s.betQuickRow}>
            {pcts.map((p, i) => (
              <button key={i} style={s.betQuickBtn} onClick={() => {
                setRaiseAmt(p.val); raiseAmtRef.current = p.val; setBetWarning('')
              }}>{p.label}</button>
            ))}
          </div>

          <div style={s.betActions}>
            <button style={s.betCancelBtn} onClick={() => { setShowBet(false); setBetWarning('') }}>CANCELAR</button>
            <button style={s.betAllInBtn} onClick={handleAllIn}>🔥 ALL-IN</button>
            <button style={s.betConfirmBtn} onClick={handleConfirmBet}>APOSTAR</button>
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
        <div style={s.topBar}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <span style={s.topBarLabel}>MESA</span>
            <span style={s.topBarValue}>{lobbyId?.slice(-6).toUpperCase()}</span>
          </div>
          {isRunning && (
            <div style={s.potDisplay}>
              <span style={s.potLabel}>{someoneAllIn ? '🔥 ALL-IN' : 'POZO'}</span>
              <span style={{ ...s.potValue, color: someoneAllIn ? '#e74c3c' : '#f0a500' }}>
                ${pot.toLocaleString()} COP
              </span>
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
        {isRunning && someoneAllIn && (
          <div style={s.allInBanner}>
            APUESTA: ALL-IN
          </div>
        )}
        <div style={s.tableArea}>
          <PokerTable game={game} currentPlayer={currentPlayer} privateHand={privateHand} onContinue={handleContinue} />
        </div>
        <div style={s.actionsPanel}>
          {!isRunning && !isFinished && (
            <div style={s.actionRow}>
              {isLeader ? (
                <button
                  style={{ ...s.btnStart, opacity: canStart ? 1 : 0.4, cursor: canStart ? 'pointer' : 'not-allowed' }}
                  onClick={handleStartGame}
                  disabled={loading || !connected || !canStart}
                >
                  {loading ? 'INICIANDO...' : canStart ? '▶  INICIAR PARTIDA' : `ESPERANDO JUGADORES (${activePlayers.length}/2)`}
                </button>
              ) : (
                <span style={{ fontFamily: 'Courier New, monospace', fontSize: 11, color: '#555', letterSpacing: 2 }}>
                  ESPERANDO QUE EL LÍDER INICIE...
                </span>
              )}
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
                  style={{ ...s.btn, ...s.btnRed, opacity: canBet ? 1 : 0.3 }}
                  disabled={!canBet || !connected}
                  onClick={handleOpenBet}
                >APOSTAR</button>

                <button
                  style={{ ...s.btn, ...s.btnBlue, opacity: canCall ? 1 : 0.3 }}
                  disabled={!canCall || !connected}
                  onClick={() => doAction('CALL', 0)}
                >IGUALAR</button>

                <button
                  style={{ ...s.btn, ...s.btnGreen, opacity: canCheck ? 1 : 0.3 }}
                  disabled={!canCheck || !connected}
                  onClick={() => doAction('CHECK', 0)}
                >PASAR</button>

                <button
                  style={{ ...s.btn, ...s.btnGold, opacity: canFold ? 1 : 0.3, borderRight: 'none' }}
                  disabled={!canFold || !connected}
                  onClick={() => doAction('FOLD', 0)}
                >RETIRARSE</button>

              </div>
            </>
          )}

          {isRunning && isFolded && (
            <div style={s.foldedMsg}>te retiraste — observando la partida...</div>
          )}
          {isRunning && isAllIn && !isFolded && (
            <div style={s.foldedMsg}>hiciste all-in — esperando resultado...</div>
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
  potDisplay:  { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 },
  potLabel:    { fontFamily: 'Courier New, monospace', fontSize: 10, color: '#f0a500', letterSpacing: 3, textTransform: 'uppercase' },
  potValue:    { fontFamily: 'Courier New, monospace', fontSize: 'clamp(14px,3vw,22px)', color: '#f0a500', fontWeight: 'bold', letterSpacing: 2, textShadow: '0 0 10px rgba(240,165,0,0.5)' },
  exitBtn:     { fontFamily: 'Courier New, monospace', fontSize: 10, fontWeight: 'bold', letterSpacing: 2, padding: '7px 16px', background: 'transparent', border: '1px solid #3a0a0a', color: '#c0392b', cursor: 'pointer', borderRadius: 2 },

  allInBanner: { background: 'rgba(192,57,43,0.15)', border: '1px solid rgba(192,57,43,0.4)', color: '#e74c3c', fontFamily: 'Courier New, monospace', fontSize: 'clamp(10px,2.5vw,13px)', letterSpacing: 2, textAlign: 'center', padding: 'clamp(8px,2vw,12px)', textTransform: 'uppercase' },

  tableArea:    { flex: 1, overflowY: 'auto' },
  actionsPanel: { borderTop: '2px solid #0a0a0a', background: 'rgba(0,0,0,0.92)', display: 'flex', flexDirection: 'column', gap: 0, position: 'sticky', bottom: 0, backdropFilter: 'blur(4px)' },
  actionRow:    { display: 'flex', gap: 8, alignItems: 'center', padding: '10px 16px' },
  btnRow:       { display: 'flex', width: '100%', gap: 0 },

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
  btnGold:  { background: '#2e2400', color: '#f0a500' },

  btnStart:  { padding: '10px 20px', background: 'transparent', border: '1px solid rgba(125,218,88,0.3)', color: '#7dda58', borderRadius: 2, fontSize: 12, fontFamily: 'Courier New, monospace', cursor: 'pointer', letterSpacing: 2 },
  foldedMsg: { fontFamily: 'Courier New, monospace', fontSize: 10, color: '#444', letterSpacing: 2, textAlign: 'center', padding: '8px', borderTop: '1px solid #111' },
  errorMsg:  { fontFamily: 'Courier New, monospace', color: '#e74c3c', fontSize: 11, padding: '8px 16px', background: 'rgba(192,57,43,0.08)', borderTop: '1px solid rgba(192,57,43,0.2)' },
  timerBar:  { position: 'relative' as const, height: 4, background: '#1a1a1a', overflow: 'hidden' },
  timerFill: { position: 'absolute' as const, left: 0, top: 0, height: '100%', transition: 'width 1s linear, background 0.3s' },
  timerText: { position: 'absolute' as const, right: 8, top: -14, fontFamily: 'Courier New, monospace', fontSize: 10, color: '#555', letterSpacing: 1 },

  betOverlay:       { position: 'fixed', inset: 0, zIndex: 20, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,0.85)' },
  betModal:         { background: '#0d1a0d', borderTop: '2px solid #f0a500', borderRadius: '12px 12px 0 0', padding: 'clamp(16px,4vw,28px)', width: '100%', maxWidth: 520, display: 'flex', flexDirection: 'column', gap: 'clamp(12px,3vw,18px)' },
  betHeader:        { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  betHeaderTitle:   { fontFamily: 'Courier New, monospace', color: '#f0a500', fontSize: 'clamp(14px,3.5vw,18px)', letterSpacing: 3, fontWeight: 'bold' },
  betCloseBtn:      { background: 'transparent', border: 'none', color: '#555', fontSize: 20, cursor: 'pointer', padding: '0 4px' },
  betInfoGrid:      { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 },
  betInfoBox:       { background: 'rgba(0,0,0,0.4)', borderRadius: 4, padding: 'clamp(8px,2vw,12px)', display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' },
  betInfoLabel:     { fontFamily: 'Courier New, monospace', fontSize: 'clamp(8px,2vw,10px)', color: '#555', letterSpacing: 2, textTransform: 'uppercase' },
  betInfoValue:     { fontFamily: 'Courier New, monospace', fontSize: 'clamp(12px,3vw,16px)', color: '#f0a500', fontWeight: 'bold' },
  betSliderWrap:    { display: 'flex', flexDirection: 'column', gap: 10 },
  betSlider:        { width: '100%', accentColor: '#f0a500', cursor: 'pointer' },
  betAmountDisplay: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'rgba(0,0,0,0.5)', border: '2px solid #f0a500', borderRadius: 6, padding: 'clamp(8px,2vw,14px)' },
  betCurrencySymbol:{ fontFamily: 'Courier New, monospace', fontSize: 'clamp(18px,5vw,26px)', color: '#f0a500', fontWeight: 'bold' },
  betAmountInput:   { background: 'transparent', border: 'none', color: '#fff', fontFamily: 'Courier New, monospace', fontSize: 'clamp(22px,6vw,36px)', fontWeight: 'bold', textAlign: 'center', width: '100%', outline: 'none' },
  betCOPLabel:      { fontFamily: 'Courier New, monospace', fontSize: 'clamp(10px,2.5vw,13px)', color: '#555', letterSpacing: 2 },
  betWarning:       { fontFamily: 'Courier New, monospace', fontSize: 11, color: '#e67e22', background: 'rgba(230,126,34,0.1)', border: '1px solid rgba(230,126,34,0.3)', padding: '8px 12px', borderRadius: 4, letterSpacing: 1 },
  betQuickRow:      { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 },
  betQuickBtn:      { background: 'rgba(240,165,0,0.08)', border: '1px solid rgba(240,165,0,0.2)', color: '#f0a500', padding: 'clamp(8px,2vw,12px) 4px', fontFamily: 'Courier New, monospace', fontSize: 'clamp(10px,2.5vw,13px)', cursor: 'pointer', borderRadius: 4, letterSpacing: 1, fontWeight: 'bold' },
  betActions:       { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 },
  betCancelBtn:     { padding: 'clamp(12px,3vw,16px)', fontFamily: 'Courier New, monospace', fontWeight: 'bold', fontSize: 'clamp(11px,2.5vw,13px)', letterSpacing: 2, cursor: 'pointer', borderRadius: 4, border: '1px solid #333', background: 'transparent', color: '#555' },
  betAllInBtn:      { padding: 'clamp(12px,3vw,16px)', fontFamily: 'Courier New, monospace', fontWeight: 'bold', fontSize: 'clamp(11px,2.5vw,13px)', letterSpacing: 2, cursor: 'pointer', borderRadius: 4, border: '2px solid #c0392b', background: 'rgba(192,57,43,0.15)', color: '#e74c3c' },
  betConfirmBtn:    { padding: 'clamp(12px,3vw,16px)', fontFamily: 'Courier New, monospace', fontWeight: 'bold', fontSize: 'clamp(11px,2.5vw,13px)', letterSpacing: 2, cursor: 'pointer', borderRadius: 4, border: 'none', background: '#f0a500', color: '#000' },
}