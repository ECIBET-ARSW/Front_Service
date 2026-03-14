// Footer component.
// Displays four columns: brand info, game links, support links, and contact details.
// Rendered on every page through the Layout component.
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">

        {/* Brand column */}
        <div className="footer-section">
          <h3>ECIBET</h3>
          <p>Tu casino online de confianza</p>
          <p>Juega responsablemente</p>
        </div>

        {/* Quick links to each game and sports betting */}
        <div className="footer-section">
          <h3>Juegos</h3>
          <a href="#roulette">Ruleta Clásica</a>
          <a href="#poker">Poker</a>
          <a href="#russian">Ruleta Rusa</a>
          <a href="#retro">Juego Retro</a>
          <a href="/sports">Apuestas Deportivas</a>
        </div>

        {/* Legal and help links */}
        <div className="footer-section">
          <h3>Soporte</h3>
          <a href="#help">Centro de Ayuda</a>
          <a href="#terms">Términos y Condiciones</a>
          <a href="#privacy">Política de Privacidad</a>
        </div>

        {/* Contact information */}
        <div className="footer-section">
          <h3>Contacto</h3>
          <p>Email: soporte@ecibet.com</p>
          <p>Teléfono: +1 (555) 123-4567</p>
          <p>Disponible 24/7</p>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; 2024 ECIBET. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
};

export default Footer;
