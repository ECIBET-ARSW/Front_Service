import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import './Landing.css';

const stats = [
  { value: '10K+', label: 'Jugadores activos' },
  { value: '4', label: 'Juegos disponibles' },
  { value: '24/7', label: 'Disponibilidad' },
  { value: '100%', label: 'Seguro' },
];

const games = [
  {
    name: "Ruleta Rusa — Liar's Bar",
    description: "Engaña, acusa y sobrevive. El último en pie gana el pozo.",
    image: '/img/Russian Roulette.jpg',
    tag: 'DISPONIBLE',
    tagClass: 'tag-live',
  },
  {
    name: "Poker Texas Hold'em",
    description: 'Hasta 6 jugadores por mesa. Demuestra tu estrategia y llévate el pozo.',
    image: '/img/Poker.jpg',
    tag: 'PRÓXIMAMENTE',
    tagClass: 'tag-soon',
  },
  {
    name: 'Ruleta Clásica',
    description: 'La clásica ruleta de casino con apuestas múltiples y emoción garantizada.',
    image: '/img/Roulette.jpg',
    tag: 'PRÓXIMAMENTE',
    tagClass: 'tag-soon',
  },
];

const Landing = () => {
  return (
    <div className="landing">

      {/* ── Navbar ── */}
      <nav className="landing-nav">
        <span className="landing-logo">ECIBET</span>
        <div className="landing-nav-actions">
          <Link to="/auth" className="landing-btn-outline">Iniciar Sesión</Link>
          <Link to="/auth?mode=register" className="landing-btn-solid">Registrarse</Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="landing-hero">
        <div className="landing-hero-glow" />
        <motion.div
          className="landing-hero-content"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <span className="landing-badge">♠ Casino Online</span>
          <h1 className="landing-title">
            Juega. Apuesta.<br />
            <span className="landing-title-gold">Gana en grande.</span>
          </h1>
          <p className="landing-subtitle">
            La plataforma de casino más emocionante con juegos en tiempo real,
            apuestas deportivas y premios increíbles.
          </p>
          <div className="landing-hero-actions">
            <Link to="/auth?mode=register" className="landing-btn-solid landing-btn-lg">
              Comenzar ahora →
            </Link>
            <Link to="/auth" className="landing-btn-ghost">
              Iniciar Sesión
            </Link>
          </div>
        </motion.div>

        <motion.div
          className="landing-hero-cards"
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <div className="hero-card hero-card-1">♠</div>
          <div className="hero-card hero-card-2">♦</div>
          <div className="hero-card hero-card-3">♣</div>
          <div className="hero-card hero-card-4">♥</div>
        </motion.div>
      </section>

      {/* ── Stats ── */}
      <section className="landing-stats">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            className="landing-stat"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
          >
            <span className="stat-value">{s.value}</span>
            <span className="stat-label">{s.label}</span>
          </motion.div>
        ))}
      </section>

      {/* ── Juegos ── */}
      <section className="landing-games">
        <motion.h2
          className="landing-section-title"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          Nuestros Juegos
        </motion.h2>
        <div className="landing-games-grid">
          {games.map((game, i) => (
            <motion.div
              key={game.name}
              className="landing-game-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              whileHover={{ y: -8 }}
            >
              <div className="landing-game-img-wrap">
                <img src={game.image} alt={game.name} className="landing-game-img" />
                <span className={`landing-game-tag ${game.tagClass}`}>{game.tag}</span>
              </div>
              <div className="landing-game-info">
                <h3>{game.name}</h3>
                <p>{game.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="landing-features">
        {[
          { icon: '♜', title: 'Seguro y Confiable', desc: 'Transacciones cifradas y datos protegidos en todo momento.' },
          { icon: '♞', title: 'Tiempo Real', desc: 'Juegos multijugador en vivo con WebSocket para cero latencia.' },
          { icon: '♛', title: 'Retiros Rápidos', desc: 'Gestiona tu saldo y retira tus ganancias fácilmente.' },
          { icon: '♟', title: 'Apuestas Deportivas', desc: 'Apuesta en tus partidos favoritos con las mejores cuotas.' },
        ].map((f, i) => (
          <motion.div
            key={f.title}
            className="landing-feature"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
          >
            <span className="landing-feature-icon">{f.icon}</span>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </motion.div>
        ))}
      </section>

      {/* ── CTA ── */}
      <section className="landing-cta">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <h2>¿Listo para jugar?</h2>
          <p>Crea tu cuenta gratis y empieza a ganar hoy mismo.</p>
          <Link to="/auth?mode=register" className="landing-btn-solid landing-btn-lg">
            Crear cuenta gratis
          </Link>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <span className="landing-logo">ECIBET</span>
        <p>© 2026 ECIBET. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
};

export default Landing;
