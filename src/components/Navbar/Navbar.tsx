// Top navigation bar component.
// Fixed at the top of the viewport with a blur backdrop.
// Shows navigation links, the user's balance, and a dropdown with logout.
// Hidden on the /auth page since unauthenticated users don't need it.
// On mobile, navigation collapses into a hamburger menu.
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  // Controls the mobile hamburger menu open/close state
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  /** Returns 'active' class when the given path matches the current route. */
  const isActive = (path: string) => location.pathname === path ? 'active' : '';

  /** Logs the user out, closes the mobile menu, and redirects to /auth. */
  const handleLogout = () => {
    logout();
    navigate('/auth');
    setIsOpen(false);
  };

  // Do not render the navbar on the authentication page
  if (location.pathname === '/auth') {
    return null;
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">ECIBET</Link>

        {/* Hamburger toggle button — visible only on mobile */}
        <button className="navbar-toggle" onClick={() => setIsOpen(!isOpen)}>
          ☰
        </button>

        {/* Navigation links */}
        <ul className={`navbar-menu ${isOpen ? 'open' : ''}`}>
          <li><Link to="/" className={`navbar-link ${isActive('/')}`} onClick={() => setIsOpen(false)}>Inicio</Link></li>
          <li><Link to="/games" className={`navbar-link ${isActive('/games')}`} onClick={() => setIsOpen(false)}>Juegos</Link></li>
          <li><Link to="/sports" className={`navbar-link ${isActive('/sports')}`} onClick={() => setIsOpen(false)}>Apuestas</Link></li>
          <li><Link to="/recharge" className={`navbar-link ${isActive('/recharge')}`} onClick={() => setIsOpen(false)}>Recargar</Link></li>

          {/* Logout button shown inside the mobile menu only */}
          {isAuthenticated && (
            <li className="navbar-mobile-only">
              <button className="navbar-logout-mobile" onClick={handleLogout}>
                Cerrar Sesión
              </button>
            </li>
          )}
        </ul>

        {/* User section: balance display and dropdown with user info + logout */}
        {isAuthenticated && (
          <div className="navbar-user">
            <div className="navbar-balance">
              ${user?.balance.toLocaleString()}
            </div>
            <div className="navbar-dropdown">
              <button className="navbar-user-btn">
                {user?.username}
              </button>
              {/* Dropdown revealed on hover via CSS */}
              <div className="navbar-dropdown-content">
                <div className="navbar-user-info">
                  <p><strong>{user?.username}</strong></p>
                  <p className="navbar-user-email">{user?.email}</p>
                </div>
                <button className="navbar-logout" onClick={handleLogout}>
                  Cerrar Sesión
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
