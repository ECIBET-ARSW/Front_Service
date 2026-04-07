// Authentication page — handles both login and registration in a single form.
// Toggling between modes resets the form and clears any error messages.
// On success, the user is redirected to the home page.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

const Auth = () => {
  // true = login mode, false = register mode
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    birthDate: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const { login, register, isLoading } = useAuth();
  const navigate = useNavigate();

  /** Validates the form and calls the appropriate auth action. */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isLogin) {
      if (!formData.email || !formData.password) {
        setError('Por favor completa todos los campos');
        return;
      }
      try {
        await login(formData.email, formData.password);
        navigate('/dashboard');
      } catch (err) {
        setError('Credenciales inválidas');
      }
    } else {
      // Registration validations
      if (!formData.firstName || !formData.lastName || !formData.birthDate || !formData.email || !formData.password || !formData.confirmPassword) {
        setError('Por favor completa todos los campos');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Las contraseñas no coinciden');
        return;
      }
      if (formData.password.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres');
        return;
      }
      try {
        await register(formData.firstName, formData.lastName, formData.birthDate, formData.email, formData.password);
        navigate('/dashboard');
      } catch (err) {
        setError('Error al registrar usuario');
      }
    }
  };

  /** Syncs each input field to its corresponding key in formData. */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  /** Switches between login and register modes and resets the form state. */
  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setFormData({ firstName: '', lastName: '', birthDate: '', email: '', password: '', confirmPassword: '' });
  };

  return (
    <div className="auth-page">
      <motion.div
        className="auth-container"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="auth-header">
          <h1 className="auth-logo">ECIBET</h1>
          <h2 className="auth-title">{isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}</h2>
          <p className="auth-subtitle">
            {isLogin ? 'Bienvenido de nuevo' : 'Únete a la mejor experiencia de casino'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {/* Register fields */}
          {!isLogin && (
            <>
              <div className="form-group">
                <label htmlFor="firstName">Nombre</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  className="form-input"
                  placeholder="Tu nombre"
                  value={formData.firstName}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="lastName">Apellido</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  className="form-input"
                  placeholder="Tu apellido"
                  value={formData.lastName}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="birthDate">Fecha de Nacimiento</label>
                <input
                  type="date"
                  id="birthDate"
                  name="birthDate"
                  className="form-input"
                  value={formData.birthDate}
                  onChange={handleChange}
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label htmlFor="email">Correo Electrónico</label>
            <input
              type="email"
              id="email"
              name="email"
              className="form-input"
              placeholder="tu@email.com"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              name="password"
              className="form-input"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          {/* Confirm password + requirements — only shown in register mode */}
          {!isLogin && (
            <>
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirmar Contraseña</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  className="form-input"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>

              <div className="password-requirements">
                <strong>Requisitos de contraseña:</strong>
                <ul>
                  <li>Mínimo 6 caracteres</li>
                  <li>Se recomienda usar letras y números</li>
                </ul>
              </div>
            </>
          )}

          {/* Inline error message */}
          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="auth-button" disabled={isLoading}>
            {isLoading ? 'Procesando...' : isLogin ? 'Iniciar Sesión' : 'Registrarse'}
          </button>
        </form>

        <div className="auth-divider">o</div>

        {/* Toggle between login and register */}
        <div className="auth-switch">
          {isLogin ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
          <span className="auth-switch-link" onClick={toggleMode}>
            {isLogin ? 'Regístrate' : 'Inicia Sesión'}
          </span>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
