import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import GameCard from '../../components/GameCard/GameCard';
import { Game } from '../../types';
import './Games.css';

const Games = () => {
  const navigate = useNavigate();
  const games: Game[] = [
    {
      id: '2',
      name: 'Poker Texas Hold\'em',
      description: 'Poker clásico con hasta 6 jugadores por mesa. Demuestra tu estrategia',
      minBet: 50,
      maxPlayers: 6,
      image: '/img/Poker.jpg',
      gradient: '2',
      available: true
    },
    {
      id: '3',
      name: 'Ruleta Rusa',
      description: 'Liar\'s Bar — Engaña, acusa y sobrevive. El último en pie gana el pozo.',
      minBet: 5000,
      maxPlayers: 4,
      image: '/img/Russian Roulette.jpg',
      gradient: '3',
      available: true
    },
    {
      id: '4',
      name: 'Armies',
      description: 'Pulsa espacio más rápido que tu oponente. 3 rounds para ganar.',
      minBet: 1000,
      maxPlayers: 2,
      image: '/img/Armies.jpg',
      gradient: 'red',
      available: true
    },
    {
      id: '5',
      name: '5InLine',
      description: 'Corre, salta y esquiva obstáculos. El último en pie se lleva todo.',
      minBet: 25,
      maxPlayers: 5,
      image: '/img/5inline.jpg',
      gradient: 'gold',
      available: true
    }
  ];

  const handleGameClick = (game: Game) => {
    if (game.id === '2') navigate('/games/poker');
    if (game.id === '3') navigate('/games/liars-bar');
    if (game.id === '4') navigate('/games/armies');
    if (game.id === '5') navigate('/5inline');
  };

  return (
    <motion.div className="games-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <div className="games-header">
        <h1 className="games-title">Nuestros Juegos</h1>
        <p className="games-description">Explora nuestra colección de juegos emocionantes.</p>
      </div>
      <div className="games-grid">
        {games.map((game, index) => (
          <motion.div key={game.id} initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.1 }}>
            <GameCard game={game} onClick={game.available ? () => handleGameClick(game) : undefined} />
          </motion.div>
        ))}
      </div>
      <motion.div className="sports-section" initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
        <div className="sports-icon">APUESTAS DEPORTIVAS</div>
        <h2 className="sports-title">Apuestas Deportivas</h2>
        <p className="sports-description">Apuesta en tus deportes favoritos: fútbol, baloncesto, tenis y mucho más.</p>
        <Link to="/sports" className="btn btn-primary">Ver Apuestas</Link>
      </motion.div>
    </motion.div>
  );
};

export default Games;
