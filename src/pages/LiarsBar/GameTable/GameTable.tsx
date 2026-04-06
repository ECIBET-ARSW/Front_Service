import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../context/AuthContext';
import { useGameRoom, CardType, GameEvent } from '../../../hooks/useRussianRoulette';
import './GameTable.css';

const BASE_URL = import.meta.env.VITE_API_GATEWAY_URL ?? 'http://localhost:8079';
const BASE = '/img/Russian Roulette images/Frames';

const OPPONENT_SPRITES: Record<string, string>[] = [1, 2, 3, 4].map(n => ({
  idle:         `${BASE}/Personaje ${n}/Estando quieto esperando.png`,
  playingCards: `${BASE}/Personaje ${n}/Poniendo cartas.png`,
  accusing:     `${BASE}/Personaje ${n}/Acusando.png`,
  shooting:     `${BASE}/Personaje ${n}/Apuntando pistola.png`,
  surviving:    `${BASE}/Personaje ${n}/Salvandose.png`,
  dying:        `${BASE}/Personaje ${n}/Muriendo.png`,
}));

const CARD_IMAGES: Record<CardType, string> = {
  KING:  '/img/Russian Roulette images/Cartas/King Card.png',
  ACE:   '/img/Russian Roulette images/Cartas/Ace Card.png',
  QUEEN: '/img/Russian Roulette images/Cartas/Queen Card.png',
  JOKER: '/img/Russian Roulette images/Cartas/Joker Card.png',
};

const GameTable = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const {
    room: currentRoom, gameEvent, currentTurnPlayerId, setCurrentTurnPlayerId,
    myCards, playCards, accuse, pass, shoot, connected, fetchHand,
  } = useGameRoom(user?.id, roomId);

  const [lookingAtCards, setLookingAtCards]   = useState(false);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [declaredCard, setDeclaredCard]       = useState<CardType>('KING');
  const [declaredCount, setDeclaredCount]     = useState(1);
  const [overlay, setOverlay]                 = useState<{ type: string; message: string } | null>(null);
  const [timer, setTimer]                     = useState(30);
  const [lastPlay, setLastPlay]               = useState<{ username: string; message: string } | null>(null);
  const [activeCard, setActiveCard]           = useState<CardType | null>(null);

  useEffect(() => {
    if (activeCard) setDeclaredCard(activeCard);
  }, [activeCard]);
  const [currentRound, setCurrentRound]       = useState(1);
  const [players, setPlayers]                 = useState<GameEvent['players']>([]);
  const [opponentAnims, setOpponentAnims]     = useState<Record<string, string>>({});
  const [shotsFired, setShotsFired]           = useState(0);
  const [totalChambers, setTotalChambers]     = useState(6);

  const setOpponentAnim = (userId: string, anim: string, duration = 1500) => {
    setOpponentAnims(prev => ({ ...prev, [userId]: anim }));
    setTimeout(() => setOpponentAnims(prev => ({ ...prev, [userId]: 'idle' })), duration);
  };

  const processEvent = (event: GameEvent) => {
    if (event.activeCard) setActiveCard(event.activeCard);
    if (event.currentRound) setCurrentRound(event.currentRound);
    if (event.players?.length) setPlayers(event.players);
    if (event.currentTurnPlayerId) setCurrentTurnPlayerId(event.currentTurnPlayerId);
    if (event.shotsFired !== undefined) setShotsFired(event.shotsFired);
    if (event.totalChambers) setTotalChambers(event.totalChambers);
    setTimer(event.turnTimerSeconds ?? 30);

    switch (event.type) {
      case 'GAME_STARTED':
        fetchHand();
        setLastPlay(null);
        break;

      case 'CARDS_PLAYED':
        fetchHand();
        if (event.lastPlayerId) {
          const whoPlayed = event.players.find(p => p.userId === event.lastPlayerId);
          setLastPlay({ username: whoPlayed?.username ?? '', message: event.message });
          if (event.lastPlayerId !== user?.id)
            setOpponentAnim(event.lastPlayerId, 'playingCards');
        }
        break;

      case 'ACCUSED':
        setLastPlay(null);
        if (event.currentTurnPlayerId !== user?.id)
          setOpponentAnim(event.currentTurnPlayerId, 'accusing');
        if (event.revealedPlay?.loserPlayerId !== user?.id)
          setOpponentAnim(event.revealedPlay!.loserPlayerId, 'shooting', 99999);
        if (event.revealedPlay?.loserPlayerId === user?.id) {
          setOverlay({
            type: 'shoot',
            message: `Te atraparon. Debes jalar el gatillo.\n${event.revealedPlay?.wasLying ? 'Estabas mintiendo.' : 'Dijiste la verdad pero te acusaron.'}`,
          });
        } else {
          setOverlay({ type: 'info', message: event.message });
          setTimeout(() => setOverlay(null), 3000);
        }
        break;

      case 'SHOT_RESULT':
        fetchHand();
        setLastPlay(null);
        if (event.shotResult) {
          const { playerId, eliminated } = event.shotResult;
          if (playerId !== user?.id)
            setOpponentAnim(playerId, eliminated ? 'dying' : 'surviving', 3000);
          if (playerId === user?.id) {
            if (eliminated) {
              setOverlay({ type: 'dead', message: 'Fuiste eliminado. Ahora eres espectador.' });
            } else {
              setOverlay({ type: 'survived', message: 'Sobreviviste. El gatillo fallo.' });
              setTimeout(() => setOverlay(null), 3000);
            }
          } else {
            const p = event.players.find(p => p.userId === playerId);
            setOverlay({
              type: 'info',
              message: eliminated ? `${p?.username} fue eliminado` : `${p?.username} sobrevivio`,
            });
            setTimeout(() => setOverlay(null), 3000);
          }
        }
        break;

      case 'GAME_OVER':
        setOverlay({ type: 'winner', message: `${event.winnerUsername} gana el pozo` });
        setTimeout(() => navigate('/games/liars-bar'), 5000);
        break;
    }
  };

  useEffect(() => {
    if (!roomId || !user?.id) return;
    const token = localStorage.getItem('token') ?? '';
    fetch(`${BASE_URL}/api/games/liars-bar/rooms/${roomId}/state`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.ok ? r.json() : null)
      .then((data: GameEvent | null) => { if (data) processEvent(data); })
      .catch(() => {});
    fetchHand();
  }, [roomId, user?.id]);

  useEffect(() => {
    if (!gameEvent) return;
    processEvent(gameEvent);
  }, [gameEvent]);

  useEffect(() => {
    const interval = setInterval(() => setTimer(t => Math.max(0, t - 1)), 1000);
    return () => clearInterval(interval);
  }, [gameEvent]);

  const isMyTurn = currentTurnPlayerId === user?.id;
  const myCardCount = myCards.length;
  const canAccuse = isMyTurn && lastPlay !== null;
  const canPass = isMyTurn && myCardCount === 0;

  const handlePlayCards = () => {
    if (!user || selectedIndices.size === 0) return;
    playCards({ userId: user.id, cards: myCards.filter((_, i) => selectedIndices.has(i)), declaredCard, declaredCount });
    setSelectedIndices(new Set());
  };

  const handleAccuse = () => accuse();
  const handleShoot  = () => { shoot(); setOverlay(null); };

  const toggleCard = (index: number) => {
    setSelectedIndices(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else if (next.size < 3) next.add(index);
      return next;
    });
  };

  const otherPlayers = players.filter(p => p.userId !== user?.id);

  return (
    <div className="game-table">
      <img src="/img/Russian Roulette images/Fondo.png" alt="bar" className="gt-background" />

      <div className="gt-hud-top">
        <div className="gt-round">Ronda {currentRound}</div>
        {activeCard && (
          <div className="gt-active-card">
            <span className="gt-active-card-label">CARTA ACTIVA</span>
            <img src={CARD_IMAGES[activeCard]} alt={activeCard} className="gt-active-card-img" />
          </div>
        )}
        <div className={`gt-timer ${timer <= 10 ? 'urgent' : ''}`}>{timer}s</div>
        <div className="gt-pot">Pozo: {currentRoom?.pot?.toLocaleString() ?? 0} COP</div>
        <div className={`gt-conn ${connected ? 'on' : 'off'}`} />
      </div>

      <div className="gt-opponents">
        {otherPlayers.map((p) => {
          const globalIndex = players.findIndex(pl => pl.userId === p.userId);
          const sprites = OPPONENT_SPRITES[globalIndex % OPPONENT_SPRITES.length];
          const anim = opponentAnims[p.userId] ?? 'idle';
          const sprite = p.eliminated ? sprites.dying : (sprites[anim] ?? sprites.idle);
          return (
            <motion.div
              key={p.userId}
              className={`gt-opponent ${p.isCurrentTurn ? 'active-turn' : ''} ${p.eliminated ? 'eliminated' : ''}`}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            >
              <img src={sprite} alt={p.username} className="gt-opponent-sprite"
                style={{ filter: p.eliminated ? 'grayscale(1) brightness(0.4)' : undefined }}
              />
              <div className="gt-opponent-info">
                <span className="gt-opponent-name">{p.username}</span>
                <div className="gt-opponent-shots">
                  {Array.from({ length: totalChambers }).map((_, i) => (
                    <div key={i} className={`gt-shot-chamber ${i < p.shotsFired ? 'fired' : ''}`} />
                  ))}
                </div>
                {p.isCurrentTurn && <span className="gt-turn-indicator">TURNO</span>}
                {p.eliminated && <span className="gt-dead-label">ELIMINADO</span>}
              </div>
            </motion.div>
          );
        })}
      </div>

      {lastPlay && (
        <div className="gt-last-play">
          <strong>{lastPlay.message}</strong>
        </div>
      )}

      <div className="gt-bottom">
        <button className="gt-btn-look" onClick={() => { if (!lookingAtCards) fetchHand(); setLookingAtCards(prev => !prev); }}>
          {lookingAtCards ? 'Ocultar cartas' : 'Ver mis cartas'}
        </button>

        <AnimatePresence>
          {lookingAtCards && (
            <motion.div className="gt-cards"
              initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
            >
              {myCards.map((card, i) => (
                <motion.img
                  key={`${card}-${i}`} src={CARD_IMAGES[card]} alt={card}
                  className={`gt-card ${selectedIndices.has(i) ? 'selected' : ''}`}
                  onClick={() => toggleCard(i)} whileHover={{ y: -10 }} whileTap={{ scale: 0.95 }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {isMyTurn && !overlay && (
          <motion.div className="gt-actions" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {myCardCount > 0 && (
              <div className="gt-play-controls">
                <span className="gt-select gt-declared-card">{declaredCard}</span>
                <select className="gt-select" value={declaredCount} onChange={e => setDeclaredCount(Number(e.target.value))}>
                  {[1,2,3].map(n => <option key={n} value={n}>{n} carta{n > 1 ? 's' : ''}</option>)}
                </select>
                <button className="gt-btn-play" onClick={handlePlayCards} disabled={selectedIndices.size === 0}>
                  Jugar cartas ({selectedIndices.size})
                </button>
              </div>
            )}
            {canAccuse && <button className="gt-btn-accuse" onClick={handleAccuse}>MENTIRA</button>}
            {canPass && <button className="gt-btn-pass" onClick={() => pass()}>PASAR</button>}
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {overlay && (
          <motion.div className={`gt-overlay ${overlay.type}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="gt-overlay-box" initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
              <p className="gt-overlay-message">{overlay.message}</p>
              {overlay.type === 'shoot' && (
                <>
                  <div className="gt-chambers">
                    {Array.from({ length: 6 }).map((_, i) => <div key={i} className="gt-chamber" />)}
                  </div>
                  <button className="gt-btn-shoot" onClick={handleShoot}>JALAR EL GATILLO</button>
                </>
              )}
              {overlay.type === 'dead' && (
                <button className="gt-btn-spectate" onClick={() => setOverlay(null)}>Ver como espectador</button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GameTable;
