import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { createLobby, getLobbies, joinLobby, type Lobby } from '../../services/armies/armiesApi'

const WALLETS_URL = import.meta.env.VITE_WALLETS_URL ?? 'http://localhost:8079'
const MIN_BALANCE = 1000

export default function ArmiesLobby() {
  const { user, updateBalance } = useAuth()
  const navigate = useNavigate()

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [betAmount, setBetAmount] = useState(5000)
  const [lobbyName, setLobbyName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [availableLobbies, setAvailableLobbies] = useState<Lobby[]>([])
  const [realBalance, setRealBalance] = useState<number | null>(null)

  const playerId = user?.id || ''
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
      const waiting = lobbies.filter(l => l.status === 'WAITING' && l.playerCount < 2)
      setAvailableLobbies(waiting)
    } catch (_) {}
  }

  const credits = realBalance ?? Math.floor(user?.balance ?? 0)
  const canPlay = credits >= MIN_BALANCE

  async function handleCreate() {
    if (!canPlay) return setError(`Necesitas mínimo $${MIN_BALANCE.toLocaleString()} COP para jugar`)
    if (betAmount < 1000) return setError('La apuesta mínima es $1.000')
    if (betAmount > credits) return setError('No tienes suficientes créditos')
    if (!lobbyName.trim()) return setError('Ingresa un nombre para la sala')
    
    setError('')
    setLoading(true)
    try {
      const lobby = await createLobby({
        userId: playerId,
        username: playerName,
        lobbyName: lobbyName.trim(),
        betAmount
      })
      localStorage.setItem('armiesLobbyId', lobby.id)
      navigate('/games/armies/play')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleJoin(selectedLobbyId: string) {
    if (!canPlay) return setError(`Necesitas mínimo $${MIN_BALANCE.toLocaleString()} COP para jugar`)
    
    const selectedLobby = availableLobbies.find(l => l.id === selectedLobbyId)
    if (!selectedLobby) return setError('Lobby no encontrado')
    if (selectedLobby.betAmount > credits) return setError('No tienes suficientes créditos para esta apuesta')
    
    setError('')
    setLoading(true)
    try {
      await joinLobby(selectedLobbyId, {
        userId: playerId,
        username: playerName
      })
      localStorage.setItem('armiesLobbyId', selectedLobbyId)
      navigate('/games/armies/play')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <motion.h1 style={s.title} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          💪 ARMIES 💪
        </motion.h1>
        <p style={s.subtitle}>Pulsa espacio más rápido que tu oponente</p>
        <button style={s.btnBack} onClick={() => navigate('/games')}>← Volver</button>
      </div>

      {/* Balance */}
      <div style={s.balanceBar}>
        <span style={s.balanceLabel}>TUS CRÉDITOS</span>
        <span style={{ ...s.balanceValue, color: canPlay ? '#e74c3c' : '#c0392b' }}>
          {realBalance === null ? 'Cargando...' : `$${credits.toLocaleString()} COP`}
        </span>
        {!canPlay && realBalance !== null && (
          <span style={s.balanceWarn}>Mínimo ${MIN_BALANCE.toLocaleString()} para jugar</span>
        )}
      </div>

      {error && <div style={s.errorBar}>{error}</div>}

      {/* Actions */}
      <div style={s.actions}>
        <motion.button
          style={{ ...s.btn, ...s.btnCreate }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => { setError(''); setShowCreateModal(true) }}
        >
          + Crear Sala
        </motion.button>
        <motion.button
          style={{ ...s.btn, ...s.btnJoin }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => { setError(''); setShowJoinModal(true) }}
        >
          Unirse a Sala
        </motion.button>
      </div>

      {/* Modal Crear */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            style={s.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              style={s.modal}
              initial={{ scale: 0.85 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.85 }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <h3 style={s.modalTitle}>Crear Sala</h3>
              
              <div style={s.field}>
                <label style={s.label}>Nombre de la Sala</label>
                <input
                  style={s.input}
                  type="text"
                  value={lobbyName}
                  onChange={e => setLobbyName(e.target.value)}
                  placeholder="Ej: Sala de Juan"
                  maxLength={30}
                />
              </div>

              <div style={s.field}>
                <label style={s.label}>Jugador</label>
                <input style={s.input} value={playerName} readOnly />
              </div>

              <div style={s.field}>
                <label style={s.label}>Apuesta (mín. $1.000)</label>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  {[1000, 5000, 10000, 25000].map(v => (
                    <button
                      key={v}
                      style={{
                        ...s.btn,
                        ...(betAmount === v ? s.btnConfirm : s.btnCancel),
                        padding: '6px 0',
                        flex: 1,
                        fontSize: '0.7rem'
                      }}
                      onClick={() => setBetAmount(v)}
                      disabled={v > credits}
                    >
                      {v.toLocaleString()}
                    </button>
                  ))}
                </div>
                <input
                  style={s.input}
                  type="number"
                  value={betAmount}
                  min={1000}
                  max={credits}
                  onChange={e => setBetAmount(Number(e.target.value))}
                />
                <span style={{ fontSize: '0.7rem', color: '#888', marginTop: 4, display: 'block' }}>
                  Disponible: ${credits.toLocaleString()} COP
                </span>
              </div>

              {error && <p style={s.modalError}>{error}</p>}

              <div style={s.modalActions}>
                <button style={{ ...s.btn, ...s.btnCancel }} onClick={() => setShowCreateModal(false)}>
                  Cancelar
                </button>
                <button
                  style={{ ...s.btn, ...s.btnConfirm }}
                  onClick={handleCreate}
                  disabled={loading || !canPlay}
                >
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
          <motion.div
            style={s.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowJoinModal(false)}
          >
            <motion.div
              style={s.modal}
              initial={{ scale: 0.85 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.85 }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <h3 style={s.modalTitle}>Salas Disponibles</h3>
              {availableLobbies.length === 0 ? (
                <p style={s.empty}>No hay salas disponibles. ¡Crea una!</p>
              ) : (
                <div style={s.roomList}>
                  {availableLobbies.map(lobby => (
                    <motion.div
                      key={lobby.id}
                      style={s.roomCard}
                      whileHover={{ borderColor: '#e74c3c' }}
                      onClick={() => handleJoin(lobby.id)}
                    >
                      <div>
                        <span style={s.roomName}>{lobby.name}</span>
                        <span style={s.roomBet}>Apuesta: ${lobby.betAmount.toLocaleString()}</span>
                        <span style={s.roomPlayers}>{lobby.playerCount}/2 jugadores</span>
                        <div style={s.roomChips}>
                          {lobby.playerNames.map((name, idx) => (
                            <span key={idx} style={s.chip}>{name}</span>
                          ))}
                        </div>
                      </div>
                      <button style={{ ...s.btn, ...s.btnJoinSmall }}>Unirse</button>
                    </motion.div>
                  ))}
                </div>
              )}
              {error && <p style={s.modalError}>{error}</p>}
              <button
                style={{ ...s.btn, ...s.btnCancel, marginTop: 16 }}
                onClick={() => setShowJoinModal(false)}
              >
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
  page: { minHeight: '100vh', padding: '40px 20px', background: '#1a1a2e', color: '#fff', fontFamily: "'Courier New', monospace" },
  header: { textAlign: 'center', marginBottom: 32, position: 'relative' },
  title: { fontSize: '3rem', color: '#e74c3c', letterSpacing: 8, textShadow: '4px 4px 0 #8b0000, 0 0 20px rgba(231,76,60,0.4)', margin: 0 },
  subtitle: { color: '#888', fontSize: '0.9rem', letterSpacing: 3, textTransform: 'uppercase', marginTop: 8 },
  btnBack: { position: 'absolute', top: 0, right: 0, background: 'transparent', border: '1px solid #555', color: '#555', padding: '6px 14px', borderRadius: 2, cursor: 'pointer', fontFamily: "'Courier New', monospace", fontSize: '0.75rem', letterSpacing: 1 },
  balanceBar: { maxWidth: 600, margin: '0 auto 24px', background: '#16213e', border: '1px solid #2a2a4a', borderRadius: 4, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 16 },
  balanceLabel: { fontSize: '0.7rem', color: '#888', letterSpacing: 2, textTransform: 'uppercase' },
  balanceValue: { fontSize: '1.1rem', fontWeight: 'bold', letterSpacing: 1 },
  balanceWarn: { fontSize: '0.7rem', color: '#c0392b', letterSpacing: 1 },
  errorBar: { maxWidth: 600, margin: '0 auto 16px', background: 'rgba(180,0,0,0.2)', border: '1px solid #c0392b', borderRadius: 4, padding: '10px 16px', color: '#e74c3c', fontSize: '0.8rem', textAlign: 'center' },
  actions: { maxWidth: 600, margin: '0 auto', display: 'flex', gap: 12 },
  btn: { fontFamily: "'Courier New', monospace", fontSize: '0.8rem', fontWeight: 'bold', letterSpacing: 2, padding: '12px 24px', borderRadius: 2, cursor: 'pointer', border: 'none', transition: 'all 0.2s' },
  btnCreate: { flex: 1, background: '#e74c3c', color: '#fff' },
  btnJoin: { flex: 1, background: 'transparent', color: '#e74c3c', border: '2px solid #e74c3c' },
  btnCancel: { flex: 1, background: 'transparent', color: '#555', border: '1px solid #555' },
  btnConfirm: { flex: 1, background: '#e74c3c', color: '#fff' },
  btnJoinSmall: { background: 'transparent', color: '#e74c3c', border: '1px solid #e74c3c', padding: '6px 14px', fontSize: '0.7rem' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modal: { background: '#16213e', border: '2px solid #e74c3c', borderRadius: 4, padding: 32, width: '100%', maxWidth: 460 },
  modalTitle: { color: '#e74c3c', letterSpacing: 4, textTransform: 'uppercase', marginBottom: 24, fontSize: '1rem' },
  field: { marginBottom: 16 },
  label: { display: 'block', fontSize: '0.7rem', color: '#888', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 },
  input: { width: '100%', background: '#0d0d1a', border: '1px solid #2a2a4a', color: '#fff', padding: '10px 12px', fontFamily: "'Courier New', monospace", fontSize: '0.9rem', borderRadius: 2, boxSizing: 'border-box' },
  modalActions: { display: 'flex', gap: 12, marginTop: 24 },
  modalError: { color: '#e74c3c', fontSize: '0.75rem', marginTop: 8 },
  empty: { color: '#555', fontSize: '0.85rem', letterSpacing: 2, textAlign: 'center', padding: '24px 0' },
  roomList: { display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 300, overflowY: 'auto', marginBottom: 8 },
  roomCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0d0d1a', border: '1px solid #2a2a4a', borderRadius: 2, padding: '12px 16px', cursor: 'pointer', transition: 'border-color 0.2s' },
  roomName: { display: 'block', color: '#e74c3c', fontWeight: 'bold', fontSize: '0.9rem', letterSpacing: 2, marginBottom: 4 },
  roomBet: { display: 'block', color: '#f0a500', fontSize: '0.75rem', letterSpacing: 1, marginBottom: 4 },
  roomPlayers: { display: 'block', color: '#888', fontSize: '0.7rem', letterSpacing: 1, marginBottom: 6 },
  roomChips: { display: 'flex', gap: 4, flexWrap: 'wrap' },
  chip: { background: '#0f3460', border: '1px solid #2a4a8a', borderRadius: 2, padding: '2px 8px', fontSize: '0.65rem', color: '#aaa' },
}
