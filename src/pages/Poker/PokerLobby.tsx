import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { createLobby, getLobbies, joinLobby } from '../../services/poker/lobbyApi'

export default function PokerLobby() {
  const { user } = useAuth()
  const [screen, setScreen]       = useState('home')
  const [lobbyName, setLobbyName] = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [availableLobbies, setAvailableLobbies] = useState<any[]>([])
  const navigate = useNavigate()

  const playerId   = user?.id || ''
  const playerName = user?.username?.split(' ')[0] || ''
  const credits    = Math.floor(user?.balance || 10000)

  useEffect(() => {
    if (screen === 'join') {
      loadLobbies()
      const interval = setInterval(loadLobbies, 3000)
      return () => clearInterval(interval)
    }
  }, [screen])

  async function loadLobbies() {
    try {
      const lobbies = await getLobbies()
      const open = lobbies.filter((l: any) => !l.actualGame?.inGame && (l.actualGame?.players?.filter((p: any) => p.inLobby)?.length || 0) > 0)
      setAvailableLobbies(open)
    } catch(_) {}
  }

  function goHome() { setScreen('home'); setError('') }

  async function handleCreate() {
    setError(''); setLoading(true)
    try {
      const lobby = await createLobby({ playerId, playerName, credits })
      localStorage.setItem('pokerLobbyId',   lobby.id)
      localStorage.setItem('pokerGameId',    lobby.actualGame?.id || lobby.id)
      localStorage.setItem('pokerPersonaje', '1Personaje.jpeg')
      navigate('/games/poker/play')
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  async function handleJoin(selectedLobbyId?: string) {
    const lid = selectedLobbyId || lobbyName.trim()
    if (!lid) return setError('Selecciona o escribe una sala')
    setError(''); setLoading(true)
    try {
      const lobbies = await getLobbies()
      const found = lobbies.find((l: any) =>
        l.id === lid || l.id.slice(-6).toLowerCase() === lid.toLowerCase()
      )
      if (!found) return setError('No se encontró esa sala')
      const lobby = await joinLobby({ lobbyId: found.id, playerId, playerName, credits })
      localStorage.setItem('pokerLobbyId',   lobby.id)
      localStorage.setItem('pokerGameId',    lobby.actualGame?.id || lobby.id)
      const players = lobby.actualGame?.players || []
      const activePlayers = players.filter((p: any) => p.inLobby)
      const myActiveIndex = activePlayers.findIndex((p: any) => p.id === playerId)
      const num = myActiveIndex >= 0 ? myActiveIndex + 1 : activePlayers.length
      localStorage.setItem('pokerPersonaje', `${Math.min(num, 6)}Personaje.jpeg`)
      navigate('/games/poker/play')
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  if (screen === 'home') {
    return (
      <div style={s.page}>
        <img src="/imagenesPoker/InicioLobby.jpeg" alt="poker" style={s.bgImg} />
        <div style={s.bottomBar}>
          <div style={s.creditsBox}>
            <div style={s.creditsLabel}>TUS CRÉDITOS</div>
            <div style={s.creditsValue}>{credits.toLocaleString()}</div>
            <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>{playerName}</div>
          </div>
          <div style={s.btnRow}>
            <button style={s.btnCreate} onClick={() => setScreen('create')}>CREAR SALA</button>
            <button style={s.btnJoin} onClick={() => setScreen('join')}>UNIRSE A SALA</button>
          </div>
          <button style={s.btnExit} onClick={() => navigate('/games')}>✕ VOLVER</button>
        </div>
      </div>
    )
  }

  if (screen === 'create') {
    return (
      <div style={s.page}>
        <img src="/imagenesPoker/NuevoLobby.jpeg" alt="nuevo lobby" style={s.bgImg} />
        <input style={{ ...s.overlayInput, top: '47.5%', left: '50%', width: '19%' }} value={lobbyName} onChange={(e) => setLobbyName(e.target.value)} maxLength={30} />
        <input style={{ ...s.overlayInput, top: '57%', left: '50%', width: '19%' }} value={playerName} readOnly maxLength={20} />
        {error && <div style={s.floatError}>{error}</div>}
        <button style={{ ...s.overlayBtn, top: '65%', left: '33%', width: '17%', height: '10%' }} onClick={handleCreate} disabled={loading} />
        <button style={{ ...s.overlayBtn, top: '65%', left: '53.5%', width: '14%', height: '10%' }} onClick={goHome} />
      </div>
    )
  }

  if (screen === 'join') {
    return (
      <div style={s.page}>
        <img src="/imagenesPoker/UnirseLobby.jpeg" alt="unirse" style={s.bgImg} />
        <input style={{ ...s.overlayInput, top: '47.5%', left: '50%', width: '19%' }} value={lobbyName} onChange={(e) => setLobbyName(e.target.value)} placeholder="ID de la sala" maxLength={40} autoFocus />
        <input style={{ ...s.overlayInput, top: '57%', left: '50%', width: '19%' }} value={playerName} readOnly />
        {error && <div style={s.floatError}>{error}</div>}
        <div style={s.lobbyList}>
          <div style={s.lobbyListTitle}>SALAS DISPONIBLES</div>
          {availableLobbies.length === 0 && (
            <div style={{ color: '#888', fontSize: 12, textAlign: 'center', fontFamily: 'Courier New, monospace' }}>No hay salas disponibles</div>
          )}
          {availableLobbies.map((l: any) => (
            <div key={l.id} style={s.lobbyItem} onClick={() => setLobbyName(l.id.slice(-6).toUpperCase())}>
              <span style={s.lobbyCode}>#{l.id.slice(-6).toUpperCase()}</span>
              <span style={s.lobbyPlayers}>{l.actualGame?.players?.filter((p: any) => p.inLobby)?.length || 0}/6 jugadores</span>
              <button style={s.lobbyJoinBtn} onClick={(e) => { e.stopPropagation(); handleJoin(l.id) }}>UNIRSE</button>
            </div>
          ))}
        </div>
        <button style={{ ...s.overlayBtn, top: '65%', left: '33%', width: '17%', height: '10%' }} onClick={() => handleJoin()} disabled={loading} />
        <button style={{ ...s.overlayBtn, top: '65%', left: '53.5%', width: '14%', height: '10%' }} onClick={goHome} />
      </div>
    )
  }

  return null
}

const s: Record<string, React.CSSProperties> = {
  page: { width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' },
  bgImg: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 },
  bottomBar: { position: 'relative', zIndex: 2, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px 20px', background: 'rgba(0,0,0,0.55)', gap: 12 },
  creditsBox: { position: 'absolute', left: 20, display: 'flex', flexDirection: 'column' },
  creditsLabel: { fontSize: 10, color: '#aaa', letterSpacing: 1, textTransform: 'uppercase' },
  creditsValue: { fontSize: 18, fontWeight: 'bold', color: '#f0c040', letterSpacing: 1 },
  btnRow: { display: 'flex', gap: 12 },
  btnCreate: { padding: '14px 36px', fontSize: 18, fontWeight: 'bold', letterSpacing: 2, borderRadius: 6, border: '3px solid #2ecc71', background: 'linear-gradient(180deg, #27ae60, #1a7a40)', color: '#fff', cursor: 'pointer', boxShadow: '0 3px 10px rgba(0,0,0,0.4)', minWidth: 200 },
  btnJoin:   { padding: '14px 36px', fontSize: 18, fontWeight: 'bold', letterSpacing: 2, borderRadius: 6, border: '3px solid #d4a017', background: 'linear-gradient(180deg, #d4a017, #9a7500)', color: '#fff', cursor: 'pointer', boxShadow: '0 3px 10px rgba(0,0,0,0.4)', minWidth: 200 },
  btnExit:   { position: 'absolute', right: 12, padding: '8px 16px', fontSize: 13, fontWeight: 'bold', letterSpacing: 1, borderRadius: 6, border: '2px solid #c0392b', background: 'linear-gradient(180deg, #e74c3c, #c0392b)', color: '#fff', cursor: 'pointer' },
  overlayInput: { position: 'absolute', zIndex: 3, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: 16, padding: '6px 10px', caretColor: '#f0c040' },
  overlayBtn: { position: 'absolute', zIndex: 3, background: 'transparent', border: 'none', cursor: 'pointer' },
  floatError: { position: 'absolute', top: '38%', left: '50%', transform: 'translateX(-50%)', zIndex: 5, background: 'rgba(180,0,0,0.88)', color: '#fff', fontSize: 13, padding: '6px 16px', borderRadius: 4, whiteSpace: 'nowrap' },
  lobbyList: { position: 'absolute', top: '72%', left: '50%', transform: 'translateX(-50%)', zIndex: 5, background: 'rgba(0,0,0,0.85)', border: '1px solid rgba(240,192,64,0.3)', borderRadius: 8, padding: '10px', minWidth: 320, maxHeight: 200, overflowY: 'auto' },
  lobbyListTitle: { color: '#f0c040', fontFamily: '"Courier New", monospace', fontSize: 11, letterSpacing: 2, marginBottom: 8, textAlign: 'center' },
  lobbyItem: { display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px', borderRadius: 4, cursor: 'pointer', marginBottom: 4, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' },
  lobbyCode: { fontFamily: '"Courier New", monospace', color: '#f0c040', fontWeight: 'bold', fontSize: 14, flex: 1 },
  lobbyPlayers: { color: '#aaa', fontSize: 11, fontFamily: '"Courier New", monospace' },
  lobbyJoinBtn: { padding: '4px 10px', fontSize: 11, fontWeight: 'bold', borderRadius: 4, border: '1px solid #27ae60', background: 'rgba(39,174,96,0.2)', color: '#7dda58', cursor: 'pointer', letterSpacing: 1 },
}