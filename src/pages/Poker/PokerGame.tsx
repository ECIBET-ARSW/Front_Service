import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import PokerTable from './PokerTable'
import { connectSocket, sendPlayerAction, sendDeal, sendNextPhase, disconnectSocket } from '../../services/poker/socket'
import { startGame, leaveLobby, endGame } from '../../services/poker/lobbyApi'

const POKER_BASE = import.meta.env.VITE_POKER_URL ?? 'http://localhost:8085'

function pixelBtn(bg: string, color = '#fff'): React.CSSProperties {
  return { flex: 1, padding: '14px 0', fontFamily: '"Courier New", monospace', fontWeight: 'bold', fontSize: 18, letterSpacing: 3, color, background: bg, border: '3px solid #000', borderBottom: '5px solid #000', borderRight: '4px solid #000', outline: 'none', cursor: 'pointer', textShadow: '1px 1px 0 rgba(0,0,0,0.6)', textTransform: 'uppercase', transition: 'filter 0.1s' }
}

export default function PokerGame() {
  const { user } = useAuth()
  const [game, setGame]           = useState<any>(null)
  const [connected, setConnected] = useState(false)
  const [privateHand, setPrivateHand] = useState<any>(null)
  const [raiseAmt, setRaiseAmt]   = useState(2000)
  const [actionError, setActionError] = useState('')
  const [loading, setLoading]     = useState(false)
  const [showBet, setShowBet]     = useState(false)
  const handFetchedRef  = useRef(false)
  const winnerIdRef     = useRef<string | null>(null)
  const isRunningRef    = useRef(false)
  const gameRef         = useRef<any>(null)
  const raiseAmtRef     = useRef(2000)
  const navigate        = useNavigate()

  const gameId     = localStorage.getItem('pokerGameId') || ''
  const lobbyId    = localStorage.getItem('pokerLobbyId') || ''
  const playerId   = user?.id || ''
  const personaje  = localStorage.getItem('pokerPersonaje') || '1Personaje.jpeg'

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
      .catch(() => setActionError('No se pudo conectar'))

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

  function handleNextPhase() {
    try { sendNextPhase(gameId) } catch (e: any) { setActionError(e.message) }
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

  if (showBet) {
    const currentGame = gameRef.current
    const currentActualBetVal = currentGame?.actualBet || 0
    const minBet = currentActualBetVal > 0 ? currentActualBetVal + 1 : 2000
    const myCredit = currentPlayer?.credit || 0
    return (
      <div style={s.page}>
        <div style={s.bgOverlay} />
        <img src="/imagenesPoker/SeleccionoBet.jpeg" alt="apuesta" style={{ position:'fixed', inset:0, width:'100%', height:'100%', objectFit:'cover', zIndex:0, pointerEvents:'none' }} />
        <div style={{ position:'fixed', top:'68%', left:'3%', zIndex:5, fontFamily:'"Courier New", monospace', fontSize:16, fontWeight:'bold', color:'#f0c040' }}>💰 {myCredit.toLocaleString()}</div>
        <input type="number" value={raiseAmt} onChange={(e) => { const v = Number(e.target.value); setRaiseAmt(v); raiseAmtRef.current = v }} min={minBet} step={500}
          style={{ position:'fixed', top:'68%', left:'36%', width:'28%', zIndex:5, background:'transparent', border:'none', outline:'none', fontFamily:'"Courier New", monospace', fontSize:20, fontWeight:'bold', color:'#222', textAlign:'center' }} />
        <button style={{ position:'fixed', top:'79%', left:'36.1%', width:'27.8%', height:'9%', zIndex:5, background:'transparent', border:'none', cursor:'pointer' }} onClick={handleConfirmBet} />
        <button style={{ position:'fixed', top:'93%', left:'36.1%', width:'27.8%', height:'9%', zIndex:5, background:'transparent', border:'none', cursor:'pointer' }} onClick={() => setShowBet(false)} />
      </div>
    )
  }

  return (
    <div style={s.page}>
      <div style={s.bgOverlay} />
      <img src={`/imagenesPoker/VistaPersonajes/${personaje}`} alt="mesa" style={{ position:'fixed', inset:0, width:'100%', height:'100%', objectFit:'cover', zIndex:0, pointerEvents:'none' }}
        onError={(e: any) => { e.target.src = '/imagenesPoker/VistaPersonajes/1Personaje.jpeg' }} />
      <button style={{ position:'fixed', bottom:18, right:20, zIndex:11, padding:'8px 18px', fontSize:13, fontWeight:'bold', letterSpacing:1, borderRadius:6, border:'2px solid #c0392b', background:'linear-gradient(180deg,#e74c3c,#c0392b)', color:'#fff', cursor:'pointer' }} onClick={handleExit}>SALIR</button>

      <div style={s.content}>
        <div style={s.topBar}>
          <div style={{ display:'flex', flexDirection:'column', gap:1 }}>
            <span style={{ fontSize:10, color:'#555', textTransform:'uppercase', letterSpacing:2, fontFamily:'Cinzel, serif' }}>ID SALA</span>
            <span style={{ fontSize:16, color:'#f0c040', fontFamily:'monospace', letterSpacing:3, fontWeight:'bold' }}>{lobbyId?.slice(-6).toUpperCase()}</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ width:7, height:7, borderRadius:'50%', display:'inline-block', background: connected ? '#7dda58' : '#ff6b6b' }} />
            <span style={{ fontSize:12, color: connected ? '#7dda58' : '#ff6b6b' }}>{connected ? 'Conectado' : 'Desconectado'}</span>
          </div>
        </div>

        <div style={s.tableArea}>
          <PokerTable game={game} currentPlayer={currentPlayer} privateHand={privateHand} onContinue={handleContinue} />
        </div>

        <div style={s.actionsPanel}>
          {!isRunning && !isFinished && (
            <div style={s.actionRow}>
              <button style={s.btnHost} onClick={handleStartGame} disabled={loading || !connected}>
                {loading ? 'Iniciando...' : '▶ INICIAR PARTIDA'}
              </button>
            </div>
          )}
          {isRunning && !isShowdown && (
            <div style={s.pixelBtnRow}>
              <button style={{ ...pixelBtn('linear-gradient(180deg,#e74c3c,#a93226)'), opacity: (!isMyTurn || isFolded) ? 0.4 : 1 }} disabled={!isMyTurn || isFolded || !connected} onClick={handleOpenBet}>APOSTAR</button>
              <button style={{ ...pixelBtn('linear-gradient(180deg,#2980b9,#1a5276)'), opacity: (!isMyTurn || isFolded) ? 0.4 : 1 }} disabled={!isMyTurn || isFolded || !connected} onClick={() => doAction('CALL', 0)}>IGUALAR</button>
              <button style={{ ...pixelBtn('linear-gradient(180deg,#27ae60,#1a7040)'), opacity: (!isMyTurn || isFolded || hasActiveBet) ? 0.4 : 1 }} disabled={!isMyTurn || isFolded || !connected || hasActiveBet} onClick={() => doAction('CHECK', 0)}>PASAR</button>
              <button style={{ ...pixelBtn('linear-gradient(180deg,#d4ac0d,#9a7d0a)', '#000'), opacity: (!isMyTurn || isFolded) ? 0.4 : 1 }} disabled={!isMyTurn || isFolded || !connected} onClick={() => doAction('FOLD', 0)}>RETIRARSE</button>
            </div>
          )}
          {isRunning && isFolded && <div style={{ color:'#888', fontFamily:'Courier New, monospace', fontSize:13, textAlign:'center', padding:'4px 0' }}>Te retiraste — viendo la partida...</div>}
          {isRunning && <div style={s.actionRow}><button style={s.btnPhase} onClick={handleNextPhase} disabled={!connected}>⏭ Siguiente fase</button></div>}
          {actionError && <div style={s.errorMsg}>⚠ {actionError}</div>}
        </div>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#050e08', display: 'flex', flexDirection: 'column', position: 'relative' },
  bgOverlay: { position: 'fixed', inset: 0, background: 'radial-gradient(ellipse at 50% 0%, #0a2e18 0%, #020705 80%)', zIndex: 0 },
  content: { position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', position: 'sticky', top: 0, zIndex: 10 },
  tableArea: { flex: 1, padding: '16px 20px', overflowY: 'auto' },
  actionsPanel: { borderTop: '3px solid #000', background: '#111', padding: '0', display: 'flex', flexDirection: 'column', gap: 0, position: 'sticky', bottom: 0 },
  pixelBtnRow: { display: 'flex', width: '100%' },
  actionRow: { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', padding: '8px 12px' },
  btnHost:  { borderRadius: 6, padding: '10px 18px', fontSize: 13, fontFamily: 'Cinzel, serif', letterSpacing: 0.5, border: '1px solid', cursor: 'pointer', background: 'rgba(30,100,60,0.3)', color: '#7dda58', borderColor: 'rgba(125,218,88,0.2)' },
  btnPhase: { borderRadius: 6, padding: '8px 16px', fontSize: 12, fontFamily: 'Cinzel, serif', letterSpacing: 0.5, border: '1px solid', cursor: 'pointer', background: 'rgba(80,80,200,0.15)', color: '#aab4ff', borderColor: 'rgba(150,150,255,0.3)' },
  errorMsg: { color: '#ff8a8a', fontSize: 13, padding: '7px 12px', margin: '0 12px 8px', background: 'rgba(255,0,0,0.07)', borderRadius: 6, border: '1px solid rgba(255,100,100,0.2)' },
}