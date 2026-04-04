import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useBetting, useOddsWebSocket, useLiveWebSocket, BettingEvent } from '../../hooks/useBetting';
import './Sports.css';

const Sports = () => {
  const { user, updateBalance } = useAuth();
  const {
    events, setEvents, liveEvents, setLiveEvents, myBets, selectedBets, totalOdds,
    isLoading, error, toggleSelection, clearSlip, placeBet,
    fetchMarkets, fetchSelections,
  } = useBetting(user?.id, updateBalance);

  const [stake, setStake] = useState('');
  const [activeTab, setActiveTab] = useState<'today' | 'live' | 'mybets'>('today');
  const [placingBet, setPlacingBet] = useState(false);
  const [betMessage, setBetMessage] = useState<string | null>(null);
  const [oddsUpdates, setOddsUpdates] = useState<Record<string, any>>({});

  // WebSocket para partidos en tiempo real
  useLiveWebSocket(
    (data) => {
      // Nuevo evento o cambio de estado
      setEvents(prev => {
        const exists = prev.find(e => e.id === data.eventId);
        if (exists) return prev.map(e => e.id === data.eventId ? { ...e, ...data } : e);
        return prev;
      });
      setLiveEvents(prev => {
        const exists = prev.find(e => e.id === data.eventId);
        if (exists) return prev.map(e => e.id === data.eventId ? { ...e, ...data } : e);
        if (data.status === 'LIVE') return [...prev, data];
        return prev;
      });
    },
    (data) => {
      // Actualización de marcador
      const updateScore = (list: BettingEvent[]) =>
        list.map(e => e.id === data.eventId
          ? { ...e, homeScore: data.homeScore, awayScore: data.awayScore, minute: data.minute }
          : e
        );
      setEvents(prev => updateScore(prev));
      setLiveEvents(prev => updateScore(prev));
    }
  );

  // Conectar WebSocket para cuotas en tiempo real
  const eventIds = events.map(e => e.id);
  useOddsWebSocket(eventIds, (eventId, data) => {
    setOddsUpdates(prev => ({ ...prev, [eventId]: data }));
  });

  const handlePlaceBet = async () => {
    if (!stake || selectedBets.length === 0) return;
    setPlacingBet(true);
    setBetMessage(null);
    try {
      for (const bet of selectedBets) {
        await placeBet(bet.selectionId, Number(stake));
      }
      clearSlip();
      setStake('');
      setBetMessage('Apuesta realizada con exito');
    } catch {
      setBetMessage('Error al realizar la apuesta');
    } finally {
      setPlacingBet(false);
    }
  };

  const displayEvents = activeTab === 'live' ? liveEvents : events;

  return (
    <motion.div className="sports-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <div className="sports-header">
        <h1 className="sports-title">Apuestas Deportivas</h1>
        <p className="sports-description">Apuesta en tus deportes favoritos con las mejores cuotas del mercado</p>
      </div>

      <div className="sports-filters">
        {(['today', 'live', 'mybets'] as const).map(tab => (
          <button
            key={tab}
            className={`filter-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'today' ? 'Hoy' : tab === 'live' ? 'En Vivo' : 'Mis Apuestas'}
          </button>
        ))}
      </div>

      <div className="sports-content">
        <div className="matches-section">
          {activeTab === 'mybets' ? (
            <>
              <h2 className="section-title">Mis Apuestas</h2>
              {myBets.length === 0 ? (
                <div className="no-matches"><p>No tienes apuestas registradas</p></div>
              ) : (
                <div className="matches-list">
                  {myBets.map(bet => (
                    <div key={bet.id} className="match-card">
                      <div className="match-header">
                        <span className="match-league">{bet.selectionName}</span>
                        <span className={`match-datetime ${bet.status.toLowerCase()}`}>{bet.status}</span>
                      </div>
                      <div className="match-teams">
                        <div className="team">Cuota: {bet.odds.toFixed(2)}</div>
                        <div className="vs">|</div>
                        <div className="team">Monto: ${bet.amount.toLocaleString()}</div>
                        <div className="vs">|</div>
                        <div className="team">Ganancia: ${bet.potentialWin.toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <h2 className="section-title">{activeTab === 'live' ? 'Partidos en Vivo' : 'Partidos de Hoy'}</h2>
              {isLoading ? (
                <div className="no-matches"><p>Cargando partidos...</p></div>
              ) : error ? (
                <div className="no-matches"><p>Error al cargar partidos. Verifica que el servicio esté corriendo.</p></div>
              ) : displayEvents.length === 0 ? (
                <div className="no-matches"><p>No hay partidos disponibles</p></div>
              ) : (
                <div className="matches-list">
                  {displayEvents.map((event, index) => (
                    <motion.div
                      key={event.id}
                      className="match-card"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <div className="match-header">
                        <span className="match-league">{event.competition}</span>
                        <span className="match-datetime">
                          {new Date(event.startTime).toLocaleDateString()} - {new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {event.status === 'LIVE' && event.minute && ` | ${event.minute}'`}
                        </span>
                      </div>
                      <div className="match-teams">
                        <div className="team">{event.homeTeam}</div>
                        <div className="vs">
                          {event.status === 'LIVE' ? `${event.homeScore ?? 0} - ${event.awayScore ?? 0}` : 'VS'}
                        </div>
                        <div className="team">{event.awayTeam}</div>
                      </div>
                      <MatchOdds
                        event={event}
                        selectedBets={selectedBets.map(b => b.selectionId)}
                        onToggle={toggleSelection}
                        liveOddsUpdate={oddsUpdates[event.id]}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div className="betting-slip">
          <h3 className="slip-title">Boleto de Apuestas</h3>
          {selectedBets.length === 0 ? (
            <div className="slip-empty"><p>Selecciona tus apuestas para comenzar</p></div>
          ) : (
            <>
              <div className="slip-bets">
                {selectedBets.map(bet => (
                  <div key={bet.selectionId} className="slip-bet">
                    <div className="slip-bet-info">
                      <div className="slip-bet-selection">{bet.label}</div>
                    </div>
                    <div className="slip-bet-odd">{bet.odds.toFixed(2)}</div>
                    <button className="slip-bet-remove" onClick={() => toggleSelection(bet.selectionId, bet.odds, bet.label)}>×</button>
                  </div>
                ))}
              </div>
              <div className="slip-summary">
                <div className="slip-row">
                  <span>Total apuestas:</span>
                  <span>{selectedBets.length}</span>
                </div>
                <div className="slip-row">
                  <span>Cuota total:</span>
                  <span className="slip-total-odd">{totalOdds.toFixed(2)}</span>
                </div>
              </div>
              <div className="slip-stake">
                <label>Monto a apostar:</label>
                <input type="number" value={stake} onChange={e => setStake(e.target.value)} placeholder="0" min="1000" />
              </div>
              {betMessage && <p className="slip-message">{betMessage}</p>}
              <button className="slip-submit" onClick={handlePlaceBet} disabled={placingBet || !stake}>
                {placingBet ? 'Procesando...' : 'Realizar Apuesta'}
              </button>
              <button className="slip-clear" onClick={clearSlip}>Limpiar Boleto</button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Subcomponente que muestra las cuotas de cada partido usando los markets del evento
const MatchOdds = ({ event, selectedBets, onToggle, liveOddsUpdate }: {
  event: BettingEvent;
  selectedBets: string[];
  onToggle: (id: string, odds: number, label: string) => void;
  liveOddsUpdate?: any;
}) => {
  const [selections, setSelections] = useState<{ id: string; name: string; odds: number }[]>([]);

  useEffect(() => {
    const markets = event.markets ?? [];
    if (markets.length > 0) {
      setSelections(markets[0].selections?.map((s: any) => ({
        id: s.id,
        name: s.name,
        odds: s.odds
      })) ?? []);
    }
  }, [event]);

  useEffect(() => {
    if (!liveOddsUpdate) return;
    setSelections(prev => prev.map(sel => {
      for (const market of liveOddsUpdate.markets ?? []) {
        for (const s of market.selections ?? []) {
          if (s.selectionName === sel.name) return { ...sel, odds: s.odds };
        }
      }
      return sel;
    }));
  }, [liveOddsUpdate]);

  if (selections.length === 0)
    return <div className="match-odds"><span style={{ color: '#666', fontSize: '0.75rem' }}>Sin cuotas disponibles</span></div>;

  return (
    <div className="match-odds">
      {selections.map(sel => (
        <button
          key={sel.id}
          className={`odd-btn ${selectedBets.includes(sel.id) ? 'selected' : ''}`}
          onClick={() => onToggle(sel.id, sel.odds, sel.name)}
        >
          <span className="odd-label">{sel.name}</span>
          <span className="odd-value">{sel.odds.toFixed(2)}</span>
        </button>
      ))}
    </div>
  );
};

export default Sports;
