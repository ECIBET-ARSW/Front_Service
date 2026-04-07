import React from 'react'

const AVATAR_EMOJI = ['🎩', '🃏', '♠', '♥', '♦', '♣']

function getCardImage(card: any) {
  if (!card) return '/imagenesPoker/cartas/CartaVacia.jpeg'
  const SUIT_MAP: Record<string, { folder: string; suffix: string }> = {
    SPADES:   { folder: 'picas',     suffix: 'pica'     },
    HEARTS:   { folder: 'corazones', suffix: 'corazon'  },
    DIAMONDS: { folder: 'diamantes', suffix: 'diamante' },
    CLUBS:    { folder: 'treboles',  suffix: 'trebol'   },
  }
  const suit  = card.suit?.toUpperCase()
  const value = card.value
  if (!suit || !value) return '/imagenesPoker/cartas/CartaVacia.jpeg'
  const cfg = SUIT_MAP[suit]
  if (!cfg) return '/imagenesPoker/cartas/CartaVacia.jpeg'
  if (suit === 'SPADES' && value === 'K') return '/imagenesPoker/cartas/picas/Kpika.jpeg'
  const fileValue = value === 'A' ? 'AS' : value
  return `/imagenesPoker/cartas/${cfg.folder}/${fileValue}${cfg.suffix}.jpeg`
}

function roleBadge(color: string) {
  return { display: 'inline-block', padding: '0 4px', borderRadius: 3, border: `1px solid ${color}`, color, fontSize: 9, fontFamily: 'Courier New, monospace' }
}

interface PokerTableProps {
  game: any
  currentPlayer: any
  privateHand: any
  onContinue: () => void
}

export default function PokerTable({ game, currentPlayer, privateHand, onContinue }: PokerTableProps) {
  if (!game) {
    return <div style={s.center}><p style={{ color: '#aaa', fontFamily: 'Courier New, monospace' }}>Conectando...</p></div>
  }

  if (!game.inGame && !game.winner) {
    return (
      <div style={s.center}>
        <h3 style={{ color: '#f0c040', fontFamily: 'Courier New, monospace', fontSize: 18, marginBottom: 12 }}>ESPERANDO JUGADORES</h3>
        <p style={{ color: '#aaa', fontSize: 14, fontFamily: 'Courier New, monospace' }}>Jugadores: {game.players?.filter((p: any) => p.inLobby)?.length || 0} / 6</p>
        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          {game.players?.filter((p: any) => p.inLobby)?.map((p: any, i: number) => (
            <span key={p.id} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', padding: '4px 12px', borderRadius: 4, color: '#ddd', fontSize: 13, fontFamily: 'Courier New, monospace' }}>
              {AVATAR_EMOJI[i % 6]} {p.name}
            </span>
          ))}
        </div>
      </div>
    )
  }

  if (!game.inGame && game.winner) {
    const iWon = game.winner.id === currentPlayer?.id
    const creditsWon = game.pot || 0
    const winnerName = game.winner.name || 'El ganador'

    if (iWon) {
      return (
        <div style={s.endScreen}>
          <img src="/imagenesPoker/PartidaGanada.jpeg" alt="ganador" style={{ width: '100%', maxWidth: 680, borderRadius: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.7)' }} />
          <div style={{ marginTop: 20, fontFamily: '"Courier New", monospace', fontSize: 32, fontWeight: 'bold', color: '#f0c040', textShadow: '0 0 20px rgba(240,192,64,0.8), 2px 2px 0 #000', letterSpacing: 4 }}>
            💰 {creditsWon.toLocaleString()} CRÉDITOS
          </div>
          <div style={{ color: '#f0c040', fontFamily: '"Courier New", monospace', fontSize: 16, marginTop: 6, letterSpacing: 3, fontWeight: 'bold' }}>¡GRAN JUGADA!</div>
          <button onClick={onContinue} style={s.continueGreen}>CONTINUAR</button>
        </div>
      )
    } else {
      return (
        <div style={s.endScreen}>
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', justifyContent: 'center', width: '100%' }}>
            <img src="/imagenesPoker/PartidaPerdida.jpeg" alt="perdedor" style={{ width: '60%', maxWidth: 480, borderRadius: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.7)' }} />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, paddingTop: 20 }}>
              <div style={{ fontFamily: '"Courier New", monospace', fontSize: 13, color: '#aaa', letterSpacing: 2 }}>GANÓ</div>
              <div style={{ fontFamily: '"Courier New", monospace', fontSize: 22, fontWeight: 'bold', color: '#f0c040', letterSpacing: 2, textAlign: 'center' }}>{winnerName.toUpperCase()}</div>
              {game.winner?.hand && game.winner.hand.length > 0 ? (
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  {game.winner.hand.map((c: any, i: number) => (
                    <img key={i} src={getCardImage(c)} alt={`${c.value}${c.suit}`}
                      onError={(e: any) => { e.target.onerror = null; e.target.src = '/imagenesPoker/cartas/CartaVacia.jpeg' }}
                      style={{ width: 60, height: 90, objectFit: 'contain', borderRadius: 5, boxShadow: '0 3px 10px rgba(0,0,0,0.6)' }} />
                  ))}
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  <img src="/imagenesPoker/cartas/CartaVacia.jpeg" alt="carta" style={{ width: 60, height: 90, objectFit: 'contain', borderRadius: 5 }} />
                  <img src="/imagenesPoker/cartas/CartaVacia.jpeg" alt="carta" style={{ width: 60, height: 90, objectFit: 'contain', borderRadius: 5 }} />
                </div>
              )}
              <div style={{ fontFamily: '"Courier New", monospace', fontSize: 16, fontWeight: 'bold', color: '#f0c040', marginTop: 4 }}>💰 {creditsWon.toLocaleString()}</div>
            </div>
          </div>
          <button onClick={onContinue} style={s.continueRed}>CONTINUAR</button>
        </div>
      )
    }
  }

  const currentTurnPlayer = game.players?.[game.currentPlayerIndex]
  const isMyTurn = currentPlayer && currentTurnPlayer?.id === currentPlayer.id
  const myHand = privateHand?.hand || []
  const actualBet = game.actualBet || 0
  const tableSlots = Array(5).fill(null)
  if (game.cartsInTable) game.cartsInTable.forEach((c: any, i: number) => { tableSlots[i] = c })

  return (
    <div style={s.wrap}>
      <div style={s.minBetBanner}>{actualBet > 0 ? `APUESTA MÍNIMA: ${actualBet.toLocaleString()}` : 'SIN APUESTA — PASA O APUESTA'}</div>
      <div style={s.playersGrid}>
        {game.players?.map((p: any, i: number) => {
          const isTurn = i === game.currentPlayerIndex
          const isMe   = p.id === currentPlayer?.id
          return (
            <div key={p.id} style={{ ...s.playerCard, border: isTurn ? '2px solid #f0c040' : isMe ? '2px solid rgba(212,160,23,0.4)' : '2px solid rgba(255,255,255,0.1)', opacity: p.folded ? 0.4 : 1 }}>
              {isTurn && <div style={s.turnArrow}>▶</div>}
              <img src={`/imagenesPoker/VistaPersonajes/${(i % 6) + 1}Personaje.jpeg`} alt={p.name}
                onError={(e: any) => { e.target.onerror = null; e.target.src = '/imagenesPoker/cartas/CartaVacia.jpeg' }}
                style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
              <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, color: isTurn ? '#f0c040' : '#ddd', marginTop: 3, textAlign: 'center' }}>{p.name}</div>
              {p.currentBet > 0 && <div style={{ fontSize: 10, color: '#7ec8e3', fontFamily: 'Courier New, monospace' }}>APUESTA: {p.currentBet?.toLocaleString()}</div>}
              <div style={{ fontSize: 9, display: 'flex', gap: 2, marginTop: 2, justifyContent: 'center' }}>
                {p.folded && <span style={roleBadge('#666')}>RETIRADO</span>}
                {p.allIn  && <span style={roleBadge('#e67e22')}>ALL-IN</span>}
              </div>
            </div>
          )
        })}
      </div>
      <div style={s.tableCards}>
        {tableSlots.map((card: any, i: number) => (
          <img key={i} src={card ? getCardImage(card) : '/imagenesPoker/cartas/CartaVacia.jpeg'} alt={card ? `${card.value}${card.suit}` : 'vacía'}
            onError={(e: any) => { e.target.onerror = null; e.target.src = '/imagenesPoker/cartas/CartaVacia.jpeg' }}
            style={s.card} />
        ))}
      </div>
      <div style={{ ...s.turnBanner, background: isMyTurn ? 'rgba(212,160,23,0.15)' : 'rgba(0,0,0,0.3)', borderColor: isMyTurn ? '#f0c040' : 'rgba(255,255,255,0.1)', color: isMyTurn ? '#f0c040' : '#aaa' }}>
        {isMyTurn ? '⚡ TU TURNO' : currentTurnPlayer ? `TURNO DE ${currentTurnPlayer.name.toUpperCase()}...` : ''}
      </div>
      <div style={s.handRow}>
        <div style={s.creditsBox}>
          <div style={s.creditsLabel}>TUS CRÉDITOS</div>
          <div style={s.creditsValue}>💰 {currentPlayer?.credit?.toLocaleString() || '—'}</div>
        </div>
        <div style={s.myCards}>
          {myHand.length > 0
            ? myHand.map((c: any, i: number) => (
                <img key={i} src={getCardImage(c)} alt={`${c.value}${c.suit}`}
                  onError={(e: any) => { e.target.onerror = null; e.target.src = '/imagenesPoker/cartas/CartaVacia.jpeg' }}
                  style={s.myCard} />
              ))
            : <><img src="/imagenesPoker/cartas/CartaVacia.jpeg" alt="carta" style={s.myCard} /><img src="/imagenesPoker/cartas/CartaVacia.jpeg" alt="carta" style={s.myCard} /></>
          }
        </div>
      </div>
    </div>
  )
}

const btnBase: React.CSSProperties = { marginTop: 24, padding: '14px 56px', fontFamily: '"Courier New", monospace', fontWeight: 'bold', fontSize: 20, letterSpacing: 4, color: '#fff', border: '3px solid #000', borderBottom: '5px solid #000', borderRight: '4px solid #000', cursor: 'pointer', textTransform: 'uppercase' }

const s: Record<string, React.CSSProperties> = {
  center: { textAlign: 'center', padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center' },
  endScreen: { textAlign: 'center', padding: '12px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  continueGreen: { ...btnBase, background: 'linear-gradient(180deg,#27ae60,#1a7a40)' },
  continueRed:   { ...btnBase, background: 'linear-gradient(180deg,#e74c3c,#a93226)' },
  wrap: { display: 'flex', flexDirection: 'column', gap: 12, padding: '8px 0' },
  minBetBanner: { textAlign: 'center', fontFamily: '"Courier New", monospace', fontSize: 20, fontWeight: 'bold', color: '#f0c040', letterSpacing: 3, textShadow: '0 0 12px rgba(240,192,64,0.5), 2px 2px 0 #000', background: 'rgba(0,0,0,0.5)', padding: '8px 24px', border: '2px solid rgba(240,192,64,0.4)' },
  playersGrid: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  playerCard: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 6px', borderRadius: 6, minWidth: 70, maxWidth: 85, position: 'relative', background: 'rgba(0,0,0,0.4)' },
  turnArrow: { position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', color: '#f0c040', fontSize: 11 },
  tableCards: { display: 'flex', gap: 6, justifyContent: 'center' },
  card: { width: 70, height: 105, objectFit: 'contain', borderRadius: 5, boxShadow: '0 3px 10px rgba(0,0,0,0.5)' },
  turnBanner: { textAlign: 'center', padding: '8px 16px', border: '1px solid', fontFamily: '"Courier New", monospace', fontSize: 14, letterSpacing: 2, fontWeight: 'bold' },
  handRow: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 20, padding: '8px 0' },
  creditsBox: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end' },
  creditsLabel: { fontFamily: '"Courier New", monospace', fontSize: 10, color: '#888', letterSpacing: 2 },
  creditsValue: { fontFamily: '"Courier New", monospace', fontSize: 18, fontWeight: 'bold', color: '#f0c040' },
  myCards: { display: 'flex', gap: 6 },
  myCard: { width: 80, height: 120, objectFit: 'contain', borderRadius: 6, boxShadow: '0 4px 16px rgba(0,0,0,0.6)' },
}