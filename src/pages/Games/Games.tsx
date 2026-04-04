// Games catalog page.
// Lists all four casino games as GameCard components and includes
// a promotional banner linking to the Sports betting page.
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import GameCard from '../../components/GameCard/GameCard';
import { Game } from '../../types';
import './Games.css';

const Games = () => {
  const navigate = useNavigate();
  // Full catalog of casino games — all marked unavailable until implemented
  const games: Game[] = [
    {
      id: '1',
      name: 'Ruleta Clásica',
      description: 'La clásica ruleta de casino con apuestas múltiples y emoción garantizada',
      minBet: 10,
      maxPlayers: 8,
      image: '/img/Roulette.jpg',
      gradient: '1',
      available: false
    },
    {
      id: '2',
      name: 'Poker Texas Hold\'em',
      description: 'Poker clásico con hasta 6 jugadores por mesa. Demuestra tu estrategia',
      minBet: 50,
      maxPlayers: 6,
      image: '/img/Poker.jpg',
      gradient: '2',
      available: false
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
      name: 'Juego Retro',
      description: 'Experiencia nostálgica de consola antigua con premios modernos',
      minBet: 25,
      maxPlayers: 1,
      icon: 'RETRO',
      gradient: 'gold',
      available: false
    }
  ];

  return (
    <motion.div
      className="games-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="games-header">
        <h1 className="games-title">Nuestros Juegos</h1>
        <p className="games-description">
          Explora nuestra colección de juegos emocionantes. Más juegos próximamente.
        </p>
      </div>

      {/* Staggered entrance animation for each game card */}
      <div className="games-grid">
        {games.map((game, index) => (
          <motion.div
            key={game.id}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <GameCard
              game={game}
              onClick={game.id === '3' ? () => navigate('/games/liars-bar') : undefined}
            />
          </motion.div>
        ))}
      </div>

      {/* Sports betting promotional banner */}
      <motion.div
        className="sports-section"
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <div className="sports-icon">APUESTAS DEPORTIVAS</div>
        <h2 className="sports-title">Apuestas Deportivas</h2>
        <p className="sports-description">
          Apuesta en tus deportes favoritos: fútbol, baloncesto,
          tenis y mucho más. Cuotas competitivas y mercados variados.
        </p>
        <Link to="/sports" className="btn btn-primary">Ver Apuestas</Link>
      </motion.div>
    </motion.div>
  );
};

export default Games;
