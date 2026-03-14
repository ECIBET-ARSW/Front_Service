// Reusable game card component.
// Displays a game's image (or text icon fallback), name, description,
// minimum bet, and max players. Unavailable games show a "Próximamente" badge
// and disable click interaction.
import { motion } from 'framer-motion';
import { Game } from '../../types';
import './GameCard.css';

interface GameCardProps {
  game: Game;
  onClick?: () => void; // Called only when the game is available
}

const GameCard = ({ game, onClick }: GameCardProps) => {
  return (
    <motion.div
      className={`game-card gradient-${game.gradient} ${!game.available ? 'unavailable' : ''}`}
      onClick={game.available ? onClick : undefined}
      // Fade-in + slide-up entrance animation
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Badge shown when the game is not yet available */}
      {!game.available && <div className="game-card-badge">Próximamente</div>}

      {/* Card header: shows the game image if available, otherwise a text icon */}
      <div className="game-card-header">
        {game.image ? (
          <img src={game.image} alt={game.name} className="game-card-image" />
        ) : (
          <span className="game-card-icon">{game.icon}</span>
        )}
      </div>

      {/* Card body: game details */}
      <div className="game-card-body">
        <h3 className="game-card-title">{game.name}</h3>
        <p className="game-card-description">{game.description}</p>
        <div className="game-card-info">
          <span>Apuesta mín: ${game.minBet}</span>
          <span>Jugadores: {game.maxPlayers}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default GameCard;
