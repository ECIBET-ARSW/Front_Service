// Home page — landing screen of the application.
// Composed of three sections:
//   1. Hero: animated headline with call-to-action buttons.
//   2. Features: three highlight cards (games, security, bonuses).
//   3. Games preview: a grid of the three main featured games.
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import GameCard from '../../components/GameCard/GameCard';
import { Game } from '../../types';
import './Home.css';

const Home = () => {
  // Subset of games shown on the landing page as a preview
  const featuredGames: Game[] = [
    {
      id: '1',
      name: 'Ruleta Clásica',
      description: 'La clásica ruleta de casino con apuestas múltiples',
      minBet: 10,
      maxPlayers: 8,
      image: '/img/Roulette.jpg',
      gradient: '1',
      available: false
    },
    {
      id: '2',
      name: 'Poker Texas',
      description: 'Poker clásico con hasta 6 jugadores por mesa',
      minBet: 50,
      maxPlayers: 6,
      image: '/img/Poker.jpg',
      gradient: '2',
      available: false
    },
    {
      id: '3',
      name: 'Ruleta Rusa',
      description: 'Juego de cartas con 4 jugadores, alta tensión',
      minBet: 100,
      maxPlayers: 4,
      image: '/img/Russian Roulette.jpg',
      gradient: '3',
      available: false
    }
  ];

  return (
    <div className="home">

      {/* ── Hero section ── */}
      <section className="hero">
        <div className="hero-content">
          <motion.h1
            className="hero-title"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            Bienvenido a ECIBET
          </motion.h1>
          <motion.p
            className="hero-subtitle"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            La experiencia de casino más emocionante en línea
          </motion.p>
          <motion.div
            className="hero-buttons"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Link to="/games" className="btn btn-primary">Explorar Juegos</Link>
            <Link to="/recharge" className="btn btn-secondary">Recargar Saldo</Link>
          </motion.div>
        </div>
      </section>

      {/* ── Feature highlight cards ── */}
      <section className="features">
        <motion.div
          className="feature-card"
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="feature-icon">JUEGOS</div>
          <h3 className="feature-title">Variedad de Juegos</h3>
          <p className="feature-description">
            Ruleta, Poker, y juegos únicos para todos los gustos
          </p>
        </motion.div>

        <motion.div
          className="feature-card"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="feature-icon">SEGURO</div>
          <h3 className="feature-title">Seguro y Confiable</h3>
          <p className="feature-description">
            Transacciones seguras y datos protegidos
          </p>
        </motion.div>

        <motion.div
          className="feature-card"
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="feature-icon">BONOS</div>
          <h3 className="feature-title">Bonos Increíbles</h3>
          <p className="feature-description">
            Promociones y bonos para nuevos jugadores
          </p>
        </motion.div>
      </section>

      {/* ── Featured games grid ── */}
      <section className="games-preview">
        <h2 className="section-title">Juegos Destacados</h2>
        <div className="games-grid">
          {featuredGames.map(game => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
