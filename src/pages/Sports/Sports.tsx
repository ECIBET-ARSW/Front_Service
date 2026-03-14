// Sports betting page.
// Displays a filterable list of upcoming matches and a sticky betting slip
// where users can accumulate selections and see the combined odds in real time.
import { useState } from 'react';
import { motion } from 'framer-motion';
import './Sports.css';

/** Represents a single sports match with its available betting odds. */
interface Match {
  id: string;
  sport: string;    // Used for filtering (football, basketball, etc.)
  league: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  time: string;
  odds: {
    home: number;
    draw?: number;  // Optional — not all sports have a draw outcome
    away: number;
  };
}

const Sports = () => {
  // Currently selected sport filter ('all' shows every match)
  const [selectedSport, setSelectedSport] = useState<string>('all');
  // List of bet IDs in the format "{matchId}-{type}" e.g. "1-home"
  const [selectedBets, setSelectedBets] = useState<string[]>([]);

  const sports = [
    { id: 'all',        name: 'Todos'       },
    { id: 'football',   name: 'Fútbol'      },
    { id: 'basketball', name: 'Baloncesto'  },
    { id: 'tennis',     name: 'Tenis'       },
    { id: 'baseball',   name: 'Béisbol'     }
  ];

  // Static match data — replace with an API call when the backend is ready
  const matches: Match[] = [
    {
      id: '1', sport: 'football', league: 'La Liga',
      homeTeam: 'Real Madrid', awayTeam: 'Barcelona',
      date: '2024-12-20', time: '20:00',
      odds: { home: 2.10, draw: 3.40, away: 3.20 }
    },
    {
      id: '2', sport: 'football', league: 'Premier League',
      homeTeam: 'Manchester United', awayTeam: 'Liverpool',
      date: '2024-12-21', time: '15:00',
      odds: { home: 2.80, draw: 3.10, away: 2.50 }
    },
    {
      id: '3', sport: 'basketball', league: 'NBA',
      homeTeam: 'Lakers', awayTeam: 'Warriors',
      date: '2024-12-20', time: '22:00',
      odds: { home: 1.85, away: 1.95 }
    },
    {
      id: '4', sport: 'tennis', league: 'ATP Finals',
      homeTeam: 'Djokovic', awayTeam: 'Alcaraz',
      date: '2024-12-22', time: '18:00',
      odds: { home: 1.70, away: 2.10 }
    },
    {
      id: '5', sport: 'baseball', league: 'MLB',
      homeTeam: 'Yankees', awayTeam: 'Red Sox',
      date: '2024-12-23', time: '19:30',
      odds: { home: 1.90, away: 1.90 }
    }
  ];

  // Derived list based on the active sport filter
  const filteredMatches = selectedSport === 'all'
    ? matches
    : matches.filter(m => m.sport === selectedSport);

  /** Adds a bet to the slip if not present, or removes it if already selected. */
  const toggleBet = (betId: string) => {
    if (selectedBets.includes(betId)) {
      setSelectedBets(selectedBets.filter(id => id !== betId));
    } else {
      setSelectedBets([...selectedBets, betId]);
    }
  };

  /**
   * Calculates the combined (parlay) odds by multiplying all selected odds.
   * Starts at 1 so the product is correct when no bets are selected.
   */
  const totalOdds = selectedBets.reduce((acc, betId) => {
    const [matchId, type] = betId.split('-');
    const match = matches.find(m => m.id === matchId);
    if (!match) return acc;

    const odd = type === 'home' ? match.odds.home
              : type === 'draw' ? match.odds.draw || 1
              : match.odds.away;
    return acc * odd;
  }, 1);

  return (
    <motion.div
      className="sports-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="sports-header">
        <h1 className="sports-title">Apuestas Deportivas</h1>
        <p className="sports-description">
          Apuesta en tus deportes favoritos con las mejores cuotas del mercado
        </p>
      </div>

      {/* Sport filter buttons */}
      <div className="sports-filters">
        {sports.map(sport => (
          <button
            key={sport.id}
            className={`filter-btn ${selectedSport === sport.id ? 'active' : ''}`}
            onClick={() => setSelectedSport(sport.id)}
          >
            {sport.name}
          </button>
        ))}
      </div>

      {/* Two-column layout: match list on the left, betting slip on the right */}
      <div className="sports-content">

        {/* ── Match list ── */}
        <div className="matches-section">
          <h2 className="section-title">Partidos Disponibles</h2>

          {filteredMatches.length === 0 ? (
            <div className="no-matches">
              <p>No hay partidos disponibles en esta categoría</p>
            </div>
          ) : (
            <div className="matches-list">
              {filteredMatches.map((match, index) => (
                <motion.div
                  key={match.id}
                  className="match-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <div className="match-header">
                    <span className="match-league">{match.league}</span>
                    <span className="match-datetime">{match.date} - {match.time}</span>
                  </div>

                  <div className="match-teams">
                    <div className="team">{match.homeTeam}</div>
                    <div className="vs">VS</div>
                    <div className="team">{match.awayTeam}</div>
                  </div>

                  {/* Odds buttons — clicking toggles the bet in the slip */}
                  <div className="match-odds">
                    <button
                      className={`odd-btn ${selectedBets.includes(`${match.id}-home`) ? 'selected' : ''}`}
                      onClick={() => toggleBet(`${match.id}-home`)}
                    >
                      <span className="odd-label">{match.homeTeam}</span>
                      <span className="odd-value">{match.odds.home.toFixed(2)}</span>
                    </button>

                    {/* Draw option only available for sports that support it */}
                    {match.odds.draw && (
                      <button
                        className={`odd-btn ${selectedBets.includes(`${match.id}-draw`) ? 'selected' : ''}`}
                        onClick={() => toggleBet(`${match.id}-draw`)}
                      >
                        <span className="odd-label">Empate</span>
                        <span className="odd-value">{match.odds.draw.toFixed(2)}</span>
                      </button>
                    )}

                    <button
                      className={`odd-btn ${selectedBets.includes(`${match.id}-away`) ? 'selected' : ''}`}
                      onClick={() => toggleBet(`${match.id}-away`)}
                    >
                      <span className="odd-label">{match.awayTeam}</span>
                      <span className="odd-value">{match.odds.away.toFixed(2)}</span>
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* ── Betting slip (sticky sidebar) ── */}
        <div className="betting-slip">
          <h3 className="slip-title">Boleto de Apuestas</h3>

          {selectedBets.length === 0 ? (
            <div className="slip-empty">
              <p>Selecciona tus apuestas para comenzar</p>
            </div>
          ) : (
            <>
              {/* List of selected bets */}
              <div className="slip-bets">
                {selectedBets.map(betId => {
                  const [matchId, type] = betId.split('-');
                  const match = matches.find(m => m.id === matchId);
                  if (!match) return null;

                  const odd = type === 'home' ? match.odds.home
                            : type === 'draw' ? match.odds.draw || 1
                            : match.odds.away;

                  const label = type === 'home' ? match.homeTeam
                              : type === 'draw' ? 'Empate'
                              : match.awayTeam;

                  return (
                    <div key={betId} className="slip-bet">
                      <div className="slip-bet-info">
                        <div className="slip-bet-match">{match.homeTeam} vs {match.awayTeam}</div>
                        <div className="slip-bet-selection">{label}</div>
                      </div>
                      <div className="slip-bet-odd">{odd.toFixed(2)}</div>
                      {/* Remove individual bet from the slip */}
                      <button
                        className="slip-bet-remove"
                        onClick={() => toggleBet(betId)}
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Summary: total bets and combined odds */}
              <div className="slip-summary">
                <div className="slip-row">
                  <span>Total de apuestas:</span>
                  <span>{selectedBets.length}</span>
                </div>
                <div className="slip-row">
                  <span>Cuota total:</span>
                  <span className="slip-total-odd">{totalOdds.toFixed(2)}</span>
                </div>
              </div>

              {/* Stake input */}
              <div className="slip-stake">
                <label>Monto a apostar:</label>
                <input type="number" placeholder="0.00" min="1" />
              </div>

              {/* TODO: wire up to real bet submission API */}
              <button className="slip-submit">Realizar Apuesta</button>
              <button
                className="slip-clear"
                onClick={() => setSelectedBets([])}
              >
                Limpiar Boleto
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default Sports;
