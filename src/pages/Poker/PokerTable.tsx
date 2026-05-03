import React from 'react'

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

interface PokerTableProps {
  game: any
  currentPlayer: any
  privateHand: any
  onContinue: () => void
}

export default function PokerTable({ game, currentPlayer, privateHand, onContinue }: PokerTableProps) {
  if (!game) {
    return (
      <div style={s.center}>
        <div style={s.connectingDot} />
        <p style={s.connectingText}>CONECTANDO...</p>
      </div>
    )
  }

  if (!game.inGame && !game.winner) {
    const lobbyPlayers = game.players?.filter((p: any) => p.inLobby) || []
    return (
      <div style={s.center}>
        <div style={s.waitingBox}>
          <p style={s.waitingTitle}>ESPERANDO JUGADORES</p>
          <p style={s.waitingCount}>{lobbyPlayers.length} / 6</p>
          <div style={s.playerChips}>
            {lobbyPlayers.map((p: any, i: number) => (
              <span key={p.id} style={{ ...s.playerChip, borderColor: i === 0 ? '#f0a500' : '#333' }}>
                {p.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!game.inGame && game.winner) {
    const iWon       = game.winner.id === currentPlayer?.id
    const winnerName = game.winner.name || 'El ganador'
    const pot        = game.pot || 0
    return (
      <div style={s.endScreen}>
        <div style={{ ...s.endBox, borderColor: iWon ? '#f0a500' : '#c0392b' }}>
          <p style={{ ...s.endTitle, color: iWon ? '#f0a500' : '#c0392b' }}>
            {iWon ? '★  GANASTE  ★' : 'PERDISTE'}
          </p>
          {!iWon && <p style={s.endWinnerName}>{winnerName.toUpperCase()} ganó el pozo</p>}
          <p style={s.endPot}>{iWon ? '+' : ''}{pot.toLocaleString()} COP</p>
          {game.winner?.hand?.length > 0 && (
            <div style={s.endCards}>
              {game.winner.hand.map((c: any, i: number) => (
                <img key={i} src={getCardImage(c)} alt={`${c.value}${c.suit}`}
                  onError={(e: any) => { e.target.src = '/imagenesPoker/cartas/CartaVacia.jpeg' }}
                  style={s.endCard} />
              ))}
            </div>
          )}
          <button onClick={onContinue}
            style={{ ...s.gameBtn, background: iWon ? '#f0a500' : '#c0392b', color: iWon ? '#000' : '#fff', marginTop: 8 }}>
            CONTINUAR
          </button>
        </div>
      </div>
    )
  }

  const currentTurnPlayer = game.players?.[game.currentPlayerIndex]
  const isMyTurn   = currentPlayer && currentTurnPlayer?.id === currentPlayer.id
  const myHand     = privateHand?.hand || []
  const actualBet  = game.actualBet || 0
  const tableSlots = Array(5).fill(null)
  if (game.cartsInTable) game.cartsInTable.forEach((c: any, i: number) => { tableSlots[i] = c })
  const activePlayers = game.players?.filter((p: any) => p.inLobby) || game.players || []

  return (
    <div style={s.wrap}>

      {/* Barra de apuesta */}
      <div style={s.betBanner}>
        {actualBet > 0
          ? <><span style={s.betLabel}>APUESTA MÍN.</span><span style={s.betAmt}>{actualBet.toLocaleString()} COP</span></>
          : <span style={s.betLabel}>SIN APUESTA — PASA O APUESTA</span>
        }
      </div>

      {/* Indicador de turno */}
      <div style={{ ...s.turnBanner, borderColor: isMyTurn ? '#f0a500' : '#1a1a1a', background: isMyTurn ? 'rgba(240,165,0,0.07)' : 'rgba(0,0,0,0.5)' }}>
        <span style={{ color: isMyTurn ? '#f0a500' : '#888', letterSpacing: 3, fontSize: 'clamp(12px, 3vw, 18px)' }}>
          {isMyTurn ? '▶ TU TURNO' : currentTurnPlayer ? `TURNO DE ${currentTurnPlayer.name?.toUpperCase()}...` : ''}
        </span>
      </div>

      {/* Cartas del crupier */}
      <div style={s.communitySection}>
        <p style={s.sectionLabel}>MESA</p>
        <div style={s.communityCards}>
          {tableSlots.map((card: any, i: number) => (
            <img key={i}
              src={card ? getCardImage(card) : '/imagenesPoker/cartas/CartaVacia.jpeg'}
              alt={card ? `${card.value} ${card.suit}` : 'vacía'}
              onError={(e: any) => { e.target.src = '/imagenesPoker/cartas/CartaVacia.jpeg' }}
              style={{
                ...s.communityCard,
                opacity:     card ? 1 : 0.18,
                filter:      card ? 'drop-shadow(0 0 8px rgba(240,165,0,0.4))' : 'none',
                borderColor: card ? '#2a2a2a' : '#111',
              }}
            />
          ))}
        </div>
      </div>

      {/* Jugadores */}
      <div style={s.playersSection}>
        <p style={s.sectionLabel}>TURNO</p>
        <div style={s.playersGrid}>
          {activePlayers.map((p: any, i: number) => {
            const isTurn = game.players?.indexOf(p) === game.currentPlayerIndex
            const isMe   = p.id === currentPlayer?.id
            return (
              <div key={p.id} style={{
                ...s.playerCard,
                borderColor: isTurn ? '#f0a500' : isMe ? 'rgba(240,165,0,0.25)' : '#1a1a1a',
                background:  isTurn ? 'rgba(240,165,0,0.07)' : isMe ? 'rgba(240,165,0,0.03)' : 'rgba(0,0,0,0.5)',
                opacity:     p.folded ? 0.3 : 1,
              }}>
                {isTurn && <div style={s.turnDot} />}
                {isTurn && <span style={s.turnLabel}>TURNO</span>}
                <img src={`/imagenesPoker/VistaPersonajes/${(i % 6) + 1}Personaje.jpeg`} alt={p.name}
                  onError={(e: any) => { e.target.src = '/imagenesPoker/cartas/CartaVacia.jpeg' }}
                  style={s.playerAvatar} />
                <span style={{ ...s.playerName, color: isTurn ? '#f0a500' : isMe ? 'rgba(240,165,0,0.65)' : '#666' }}>
                  {p.name}
                </span>
                <span style={s.playerCredits}>{(p.credit ?? p.chips ?? 0).toLocaleString()}</span>
                {p.currentBet > 0 && <span style={s.playerBet}>↑ {p.currentBet.toLocaleString()}</span>}
                {p.folded && <span style={s.badge}>RETIRO</span>}
                {p.allIn  && <span style={{ ...s.badge, color: '#e67e22', borderColor: '#5a3000' }}>ALL-IN</span>}
              </div>
            )
          })}
        </div>
      </div>

      {/* Mi mano */}
      <div style={s.myHandSection}>
        <div style={s.myHandHeader}>
          <p style={s.sectionLabel}>TU MANO</p>
          <span style={s.myCredits}>💰 {currentPlayer?.credit?.toLocaleString() ?? '—'} COP</span>
        </div>
        <div style={s.myCards}>
          {myHand.length > 0
            ? myHand.map((c: any, i: number) => (
                <img key={i} src={getCardImage(c)} alt={`${c.value} ${c.suit}`}
                  onError={(e: any) => { e.target.src = '/imagenesPoker/cartas/CartaVacia.jpeg' }}
                  style={s.myCard} />
              ))
            : <>
                <img src="/imagenesPoker/cartas/CartaVacia.jpeg" style={{ ...s.myCard, opacity: 0.15 }} alt="vacía" />
                <img src="/imagenesPoker/cartas/CartaVacia.jpeg" style={{ ...s.myCard, opacity: 0.15 }} alt="vacía" />
              </>
          }
        </div>
      </div>

    </div>
  )
}

const isMobile = () => window.innerWidth <= 768

const s: Record<string, React.CSSProperties> = {
  center:         { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 16 },
  connectingDot:  { width: 12, height: 12, borderRadius: '50%', background: '#27ae60', boxShadow: '0 0 14px #27ae60' },
  connectingText: { fontFamily: 'Courier New, monospace', color: '#555', fontSize: 14, letterSpacing: 4 },

  waitingBox:   { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, padding: 'clamp(24px, 5vw, 48px) clamp(24px, 8vw, 64px)', border: '1px solid #1e1e1e', background: 'rgba(0,0,0,0.7)', borderRadius: 2 },
  waitingTitle: { fontFamily: 'Courier New, monospace', color: '#f0a500', fontSize: 'clamp(14px, 3vw, 18px)', letterSpacing: 4, textTransform: 'uppercase', margin: 0 },
  waitingCount: { fontFamily: 'Courier New, monospace', color: '#fff', fontSize: 'clamp(40px, 10vw, 64px)', fontWeight: 'bold', letterSpacing: 4, margin: 0 },
  playerChips:  { display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' },
  playerChip:   { fontFamily: 'Courier New, monospace', fontSize: 'clamp(12px, 3vw, 16px)', color: '#aaa', padding: '6px 16px', border: '1px solid', borderRadius: 2, letterSpacing: 1 },

  endScreen:    { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, padding: 16 },
  endBox:       { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, padding: 'clamp(24px, 5vw, 40px) clamp(20px, 6vw, 56px)', border: '2px solid', background: 'rgba(0,0,0,0.9)', borderRadius: 2, width: '100%', maxWidth: 480 },
  endTitle:     { fontFamily: 'Courier New, monospace', fontSize: 'clamp(22px, 6vw, 36px)', fontWeight: 'bold', letterSpacing: 5, margin: 0 },
  endWinnerName:{ fontFamily: 'Courier New, monospace', fontSize: 'clamp(12px, 3vw, 16px)', color: '#555', letterSpacing: 2, margin: 0 },
  endPot:       { fontFamily: 'Courier New, monospace', fontSize: 'clamp(28px, 8vw, 44px)', fontWeight: 'bold', color: '#f0a500', letterSpacing: 3, margin: 0 },
  endCards:     { display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  endCard:      { width: 'clamp(56px, 14vw, 84px)', height: 'auto', aspectRatio: '2/3', objectFit: 'contain', borderRadius: 4, border: '1px solid #2a2a2a', imageRendering: 'pixelated' as any },
  gameBtn:      { fontFamily: 'Courier New, monospace', fontWeight: 'bold', fontSize: 'clamp(14px, 3vw, 18px)', letterSpacing: 4, padding: 'clamp(10px, 3vw, 16px) clamp(20px, 6vw, 40px)', border: 'none', borderRadius: 2, cursor: 'pointer', textTransform: 'uppercase', width: '100%' },

  wrap: { display: 'flex', flexDirection: 'column', gap: 0 },

  betBanner: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 'clamp(10px, 2vw, 16px) 24px', background: 'rgba(0,0,0,0.8)', borderBottom: '1px solid #111', flexWrap: 'wrap' },
  betLabel:  { fontFamily: 'Courier New, monospace', fontSize: 'clamp(10px, 2vw, 14px)', color: '#555', letterSpacing: 3, textTransform: 'uppercase' },
  betAmt:    { fontFamily: 'Courier New, monospace', fontSize: 'clamp(18px, 4vw, 26px)', color: '#f0a500', fontWeight: 'bold', letterSpacing: 2 },

  turnBanner: { padding: 'clamp(8px, 2vw, 14px) 24px', borderTop: '1px solid', borderBottom: '1px solid', textAlign: 'center', transition: 'all 0.3s', fontFamily: 'Courier New, monospace' },

  sectionLabel: { fontFamily: 'Courier New, monospace', fontSize: 'clamp(10px, 2vw, 14px)', color: '#f0a500', letterSpacing: 4, textTransform: 'uppercase', margin: '0 0 14px 0', fontWeight: 'bold' },

  communitySection: { padding: 'clamp(14px, 3vw, 24px) clamp(12px, 3vw, 24px) clamp(12px, 3vw, 20px)', borderBottom: '1px solid #0f0f0f' },
  communityCards:   { display: 'flex', gap: 'clamp(6px, 2vw, 14px)', justifyContent: 'center', flexWrap: 'wrap' },
  communityCard:    { width: 'clamp(54px, 16vw, 120px)', height: 'auto', aspectRatio: '2/3', objectFit: 'contain', borderRadius: 6, border: '1px solid', imageRendering: 'pixelated' as any, transition: 'filter 0.3s, opacity 0.3s' },

  playersSection: { padding: 'clamp(12px, 3vw, 20px) clamp(12px, 3vw, 24px)', borderBottom: '1px solid #0f0f0f' },
  playersGrid:    { display: 'flex', gap: 'clamp(6px, 2vw, 12px)', flexWrap: 'wrap', justifyContent: 'center' },
  playerCard:     { position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: 'clamp(8px, 2vw, 14px) clamp(6px, 2vw, 12px)', border: '1px solid', borderRadius: 2, minWidth: 'clamp(70px, 18vw, 110px)', maxWidth: 'clamp(80px, 20vw, 130px)', transition: 'all 0.2s', flex: '1 1 clamp(70px, 18vw, 110px)' },
  turnDot:        { position: 'absolute', top: -6, left: '50%', transform: 'translateX(-50%)', width: 10, height: 10, borderRadius: '50%', background: '#f0a500', boxShadow: '0 0 10px #f0a500' },
  turnLabel:      { position: 'absolute', top: -22, left: '50%', transform: 'translateX(-50%)', fontFamily: 'Courier New, monospace', fontSize: 11, color: '#f0a500', letterSpacing: 2, whiteSpace: 'nowrap', fontWeight: 'bold' },
  playerAvatar:   { width: 'clamp(36px, 10vw, 56px)', height: 'clamp(36px, 10vw, 56px)', borderRadius: '50%', objectFit: 'cover', border: '1px solid #1a1a1a' },
  playerName:     { fontFamily: 'Courier New, monospace', fontSize: 'clamp(9px, 2vw, 13px)', letterSpacing: 1, textAlign: 'center', maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', transition: 'color 0.2s' },
  playerCredits:  { fontFamily: 'Courier New, monospace', fontSize: 'clamp(8px, 1.8vw, 12px)', color: '#555' },
  playerBet:      { fontFamily: 'Courier New, monospace', fontSize: 'clamp(8px, 1.8vw, 12px)', color: '#7ec8e3' },
  badge:          { fontFamily: 'Courier New, monospace', fontSize: 10, color: '#444', border: '1px solid #2a2a2a', padding: '2px 6px', borderRadius: 2, letterSpacing: 1 },

  myHandSection:  { padding: 'clamp(12px, 3vw, 20px) clamp(12px, 3vw, 24px) clamp(10px, 2vw, 16px)' },
  myHandHeader:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 },
  myCredits:      { fontFamily: 'Courier New, monospace', fontSize: 'clamp(14px, 3.5vw, 22px)', color: '#f0a500', fontWeight: 'bold', letterSpacing: 2 },
  myCards:        { display: 'flex', gap: 'clamp(10px, 3vw, 20px)', justifyContent: 'center' },
  myCard:         { width: 'clamp(80px, 22vw, 150px)', height: 'auto', aspectRatio: '2/3', objectFit: 'contain', borderRadius: 8, border: '2px solid #1e1e1e', imageRendering: 'pixelated' as any, boxShadow: '0 6px 24px rgba(0,0,0,0.9)', transition: 'transform 0.2s, box-shadow 0.2s' },
}