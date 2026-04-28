import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { createLobby, getLobbies, joinLobby } from '../../services/poker/lobbyApi'

const WALLETS_URL = import.meta.env.VITE_WALLETS_URL ?? 'http://localhost:8079'
const MIN_BALANCE = 2000

export default function PokerLobby() {
  const { user, updateBalance } = useAuth()
  const navigate = useNavigate()

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showJoinModal, setShowJoinModal]     = useState(false)
  const [buyIn, setBuyIn]                     = useState(10000)
  const [loading, setLoading]                 = useState(false)
  const [error, setError]                     = useState('')
  const [availableLobbies, setAvailableLobbies] = useState<any[]>([])
  const [realBalance, setRealBalance]         = useState<number | null>(null)

  const playerId   = user?.id || ''
  const playerName = user?.username?.split(' ')[0] || ''

  useEffect(() => {
    async function fetchBalance() {
      if (!playerId) return
      try {
        const token = localStorage.getItem('token') ?? ''
        const res = await fetch(`${WALLETS_URL}/api/v1/wallets/${playerId}/balance`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (!res.ok) return
        const data = await res.json()
        const balance = Math.floor(data?.data?.balance ?? 0)
        setRealBalance(balance)
        updateBalance(balance)
      } catch (_) {
        setRealBalance(Math.floor(user?.balance ?? 0))
      }
    }
    fetchBalance()
  }, [playerId])

  useEffect(() => {
    if (!showJoinModal) return
    loadLobbies()
    const interval = setInterval(loadLobbies, 3000)
    return () => clearInterval(interval)
  }, [showJoinModal])

  async function loadLobbies() {
    try {
      const lobbies = await getLobbies()
      const open = lobbies.filter((l: any) =>
        !l.actualGame?.inGame && (l.actualGame?.players?.filter((p: any) => p.inLobby)?.length || 0) > 0
      )
      setAvailableLobbies(open)
    } catch (_) {}
  }

  const credits  = realBalance ?? Math.floor(user?.balance ?? 0)
  const canPlay  = credits >= MIN_BALANCE

  async function handleCreate() {
    if (!canPlay) return setError(`Necesitas mínimo $${MIN_BALANCE.toLocaleString()} COP para jugar`)
    if (buyIn < 2000) return setError('El mínimo de créditos es $2.000 (big blind)')
    if (buyIn > credits) return setError('No tienes suficientes créditos')
    setError(''); setLoading(true)
    try {
      const lobby = await createLobby({ playerId, playerName, credits: buyIn })
      localStorage.setItem('pokerLobbyId',   lobby.id)
      localStorage.setItem('pokerGameId',    lobby.actualGame?.id || lobby.id)
      localStorage.setItem('pokerPersonaje', '1Personaje.jpeg')
      navigate('/games/poker/play')
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  async function handleJoin(selectedLobbyId: string) {
    if (!canPlay) return setError(`Necesitas mínimo $${MIN_BALANCE.toLocaleString()} COP para jugar`)
    if (buyIn < 2000) return setError('El mínimo de créditos es $2.000 (big blind)')
    if (buyIn > credits) return setError('No tienes suficientes créditos')
    setError(''); setLoading(true)
    try {
      const lobbies = await getLobbies()
      const found = lobbies.find((l: any) =>
        l.id === selectedLobbyId || l.id.slice(-6).toLowerCase() === selectedLobbyId.toLowerCase()
      )
      if (!found) return setError('No se encontró esa sala')
      const lobby = await joinLobby({ lobbyId: found.id, playerId, playerName, credits: buyIn })
      localStorage.setItem('pokerLobbyId', lobby.id)
      localStorage.setItem('pokerGameId',  lobby.actualGame?.id || lobby.id)
      const players = lobby.actualGame?.players || []
      const active  = players.filter((p: any) => p.inLobby)
      const idx     = active.findIndex((p: any) => p.id === playerId)
      localStorage.setItem('pokerPersonaje', `${Math.min(idx >= 0 ? idx + 1 : active.length, 6)}Personaje.jpeg`)
      navigate('/games/poker/play')
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <motion.h1 style={s.title} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          POKER
        </motion.h1>
        <p style={s.subtitle}>Farolea, apuesta y gana el pozo</p>
      </div>

      {/* Balance */}
      <div style={s.balanceBar}>
        <span style={s.balanceLabel}>TUS CRÉDITOS</span>
        <span style={{ ...s.balanceValue, color: canPlay ? '#f0a500' : '#c0392b' }}>
          {realBalance === null ? 'Cargando...' : `$${credits.toLocaleString()} COP`}
        </span>
        {!canPlay && realBalance !== null && (
          <span style={s.balanceWarn}>Mínimo ${MIN_BALANCE.toLocaleString()} para jugar</span>
        )}
      </div>

      {error && <div style={s.errorBar}>{error}</div>}

      {/* Actions */}
      <div style={s.actions}>
        <motion.button style={{ ...s.btn, ...s.btnCreate }} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={() => { setError(''); setShowCreateModal(true) }}>
          + Crear Sala
        </motion.button>
        <motion.button style={{ ...s.btn, ...s.btnJoin }} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={() => { setError(''); setShowJoinModal(true) }}>
          Unirse a Sala
        </motion.button>
      </div>

      {/* Modal Crear */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div style={s.overlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowCreateModal(false)}>
            <motion.div style={s.modal} initial={{ scale: 0.85 }} animate={{ scale: 1 }} exit={{ scale: 0.85 }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}>
              <h3 style={s.modalTitle}>Crear Sala</h3>
              <div style={s.field}>
                <label style={s.label}>Jugador</label>
                <input style={s.input} value={playerName} readOnly />
              </div>
              <div style={s.field}>
                <label style={s.label}>Créditos a llevar (mín. $2.000)</label>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  {[5000, 10000, 25000, 50000].map(v => (
                    <button key={v} style={{ ...s.btn, ...(buyIn === v ? s.btnConfirm : s.btnCancel), padding: '6px 0', flex: 1, fontSize: '0.7rem' }}
                      onClick={() => setBuyIn(v)} disabled={v > credits}>
                      {v.toLocaleString()}
                    </button>
                  ))}
                </div>
                <input style={s.input} type="number" value={buyIn} min={2000} max={credits}
                  onChange={e => setBuyIn(Number(e.target.value))} />
                <span style={{ fontSize: '0.7rem', color: '#888', marginTop: 4, display: 'block' }}>
                  Disponible: ${credits.toLocaleString()} COP
                </span>
              </div>
              {error && <p style={s.modalError}>{error}</p>}
              <div style={s.modalActions}>
                <button style={{ ...s.btn, ...s.btnCancel }} onClick={() => setShowCreateModal(false)}>Cancelar</button>
                <button style={{ ...s.btn, ...s.btnConfirm }} onClick={handleCreate} disabled={loading || !canPlay}>
                  {loading ? 'Creando...' : 'Crear'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Unirse */}
      <AnimatePresence>
        {showJoinModal && (
          <motion.div style={s.overlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowJoinModal(false)}>
            <motion.div style={s.modal} initial={{ scale: 0.85 }} animate={{ scale: 1 }} exit={{ scale: 0.85 }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}>
              <h3 style={s.modalTitle}>Salas Disponibles</h3>
              <div style={s.field}>
                <label style={s.label}>Créditos a llevar (mín. $2.000)</label>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  {[5000, 10000, 25000, 50000].map(v => (
                    <button key={v} style={{ ...s.btn, ...(buyIn === v ? s.btnConfirm : s.btnCancel), padding: '6px 0', flex: 1, fontSize: '0.7rem' }}
                      onClick={() => setBuyIn(v)} disabled={v > credits}>
                      {v.toLocaleString()}
                    </button>
                  ))}
                </div>
                <input style={s.input} type="number" value={buyIn} min={2000} max={credits}
                  onChange={e => setBuyIn(Number(e.target.value))} />
                <span style={{ fontSize: '0.7rem', color: '#888', marginTop: 4, display: 'block' }}>
                  Disponible: ${credits.toLocaleString()} COP
                </span>
              </div>
              {availableLobbies.length === 0 ? (
                <p style={s.empty}>No hay salas disponibles. ¡Crea una!</p>
              ) : (
                <div style={s.roomList}>
                  {availableLobbies.map((l: any) => {
                    const activePlayers = l.actualGame?.players?.filter((p: any) => p.inLobby) ?? []
                    return (
                      <motion.div key={l.id} style={s.roomCard} whileHover={{ borderColor: '#f0a500' }}
                        onClick={() => handleJoin(l.id)}>
                        <div>
                          <span style={s.roomCode}>#{l.id.slice(-6).toUpperCase()}</span>
                          <span style={s.roomPlayers}>{activePlayers.length}/6 jugadores</span>
                          <div style={s.roomChips}>
                            {activePlayers.map((p: any) => (
                              <span key={p.id} style={s.chip}>{p.name}</span>
                            ))}
                          </div>
                        </div>
                        <button style={{ ...s.btn, ...s.btnJoinSmall }}>Unirse</button>
                      </motion.div>
                    )
                  })}
                </div>
              )}
              {error && <p style={s.modalError}>{error}</p>}
              <button style={{ ...s.btn, ...s.btnCancel, marginTop: 16 }} onClick={() => setShowJoinModal(false)}>
                Cerrar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page:        { minHeight: '100vh', padding: '40px 20px', background: '#0d0d1a', color: '#fff', fontFamily: "'Courier New', monospace" },
  header:      { textAlign: 'center', marginBottom: 32 },
  title:       { fontSize: '3rem', color: '#f0a500', letterSpacing: 8, textShadow: '4px 4px 0 #7a5200, 0 0 20px rgba(240,165,0,0.4)', margin: 0 },
  subtitle:    { color: '#888', fontSize: '0.9rem', letterSpacing: 3, textTransform: 'uppercase', marginTop: 8 },
  balanceBar:  { maxWidth: 600, margin: '0 auto 24px', background: '#16213e', border: '1px solid #2a2a4a', borderRadius: 4, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 16 },
  balanceLabel:{ fontSize: '0.7rem', color: '#888', letterSpacing: 2, textTransform: 'uppercase' },
  balanceValue:{ fontSize: '1.1rem', fontWeight: 'bold', letterSpacing: 1 },
  balanceWarn: { fontSize: '0.7rem', color: '#c0392b', letterSpacing: 1 },
  errorBar:    { maxWidth: 600, margin: '0 auto 16px', background: 'rgba(180,0,0,0.2)', border: '1px solid #c0392b', borderRadius: 4, padding: '10px 16px', color: '#e74c3c', fontSize: '0.8rem', textAlign: 'center' },
  actions:     { maxWidth: 600, margin: '0 auto', display: 'flex', gap: 12 },
  btn:         { fontFamily: "'Courier New', monospace", fontSize: '0.8rem', fontWeight: 'bold', letterSpacing: 2, padding: '12px 24px', borderRadius: 2, cursor: 'pointer', border: 'none', transition: 'all 0.2s' },
  btnCreate:   { flex: 1, background: '#f0a500', color: '#000' },
  btnJoin:     { flex: 1, background: 'transparent', color: '#f0a500', border: '2px solid #f0a500' },
  btnCancel:   { flex: 1, background: 'transparent', color: '#555', border: '1px solid #555' },
  btnConfirm:  { flex: 1, background: '#f0a500', color: '#000' },
  btnJoinSmall:{ background: 'transparent', color: '#f0a500', border: '1px solid #f0a500', padding: '6px 14px', fontSize: '0.7rem' },
  overlay:     { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modal:       { background: '#16213e', border: '2px solid #f0a500', borderRadius: 4, padding: 32, width: '100%', maxWidth: 460 },
  modalTitle:  { color: '#f0a500', letterSpacing: 4, textTransform: 'uppercase', marginBottom: 24, fontSize: '1rem' },
  field:       { marginBottom: 16 },
  label:       { display: 'block', fontSize: '0.7rem', color: '#888', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 },
  input:       { width: '100%', background: '#0d0d1a', border: '1px solid #2a2a4a', color: '#fff', padding: '10px 12px', fontFamily: "'Courier New', monospace", fontSize: '0.9rem', borderRadius: 2, boxSizing: 'border-box' as const },
  modalActions:{ display: 'flex', gap: 12, marginTop: 24 },
  modalError:  { color: '#e74c3c', fontSize: '0.75rem', marginTop: 8 },
  empty:       { color: '#555', fontSize: '0.85rem', letterSpacing: 2, textAlign: 'center', padding: '24px 0' },
  roomList:    { display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 300, overflowY: 'auto', marginBottom: 8 },
  roomCard:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0d0d1a', border: '1px solid #2a2a4a', borderRadius: 2, padding: '12px 16px', cursor: 'pointer', transition: 'border-color 0.2s' },
  roomCode:    { display: 'block', color: '#f0a500', fontWeight: 'bold', fontSize: '0.9rem', letterSpacing: 2, marginBottom: 4 },
  roomPlayers: { display: 'block', color: '#888', fontSize: '0.7rem', letterSpacing: 1, marginBottom: 6 },
  roomChips:   { display: 'flex', gap: 4, flexWrap: 'wrap' as const },
  chip:        { background: '#0f3460', border: '1px solid #2a4a8a', borderRadius: 2, padding: '2px 8px', fontSize: '0.65rem', color: '#aaa' },
}
