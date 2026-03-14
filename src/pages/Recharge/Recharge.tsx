// Credit recharge page.
// Lets the user pick a payment method, enter or select a preset amount,
// and submit a recharge request. Min/max limits are enforced per method.
import { useState } from 'react';
import { motion } from 'framer-motion';
import { RechargeMethod } from '../../types';
import './Recharge.css';

const Recharge = () => {
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  // Tracks which preset amount button is highlighted
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);

  // Available payment methods with their respective limits
  const methods: RechargeMethod[] = [
    { id: 'card',   name: 'Tarjeta', icon: 'CARD',   minAmount: 10,  maxAmount: 10000 },
    { id: 'paypal', name: 'PayPal',  icon: 'PAYPAL', minAmount: 10,  maxAmount: 5000  },
    { id: 'crypto', name: 'Crypto',  icon: 'CRYPTO', minAmount: 50,  maxAmount: 50000 },
    { id: 'bank',   name: 'Banco',   icon: 'BANK',   minAmount: 100, maxAmount: 20000 }
  ];

  // Quick-select preset amounts shown as shortcut buttons
  const suggestedAmounts = [50, 100, 250, 500, 1000, 2500];

  /** Sets the amount from a preset button and highlights it. */
  const handleAmountClick = (value: number) => {
    setAmount(value.toString());
    setSelectedAmount(value);
  };

  /** Validates the form and simulates a recharge submission. */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMethod || !amount) {
      alert('Por favor selecciona un método de pago y un monto');
      return;
    }
    // TODO: Replace alert with a real API call and balance update
    alert(`Recarga de $${amount} con ${methods.find(m => m.id === selectedMethod)?.name} procesada exitosamente!`);
  };

  return (
    <motion.div
      className="recharge-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="recharge-header">
        <h1 className="recharge-title">Recargar Saldo</h1>
        <p className="recharge-description">
          Selecciona tu método de pago preferido y el monto a recargar
        </p>
      </div>

      {/* Form card slides up on mount */}
      <motion.div
        className="recharge-container"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <form onSubmit={handleSubmit} className="recharge-form">

          {/* Payment method selector */}
          <div className="recharge-methods">
            <h3>Método de Pago</h3>
            <div className="methods-grid">
              {methods.map((method) => (
                <div
                  key={method.id}
                  className={`method-card ${selectedMethod === method.id ? 'selected' : ''}`}
                  onClick={() => setSelectedMethod(method.id)}
                >
                  <div className="method-icon">{method.icon}</div>
                  <div className="method-name">{method.name}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Manual amount input — deselects any preset button */}
          <div className="form-group">
            <label>Monto a Recargar</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setSelectedAmount(null);
              }}
              placeholder="Ingresa el monto"
              min="10"
            />
          </div>

          {/* Preset amount shortcuts */}
          <div className="form-group">
            <label>Montos Sugeridos</label>
            <div className="amount-suggestions">
              {suggestedAmounts.map((value) => (
                <button
                  key={value}
                  type="button"
                  className={`amount-btn ${selectedAmount === value ? 'selected' : ''}`}
                  onClick={() => handleAmountClick(value)}
                >
                  ${value}
                </button>
              ))}
            </div>
          </div>

          {/* Min/max info banner — shown only after a method is selected */}
          {selectedMethod && (
            <div className="recharge-info">
              Monto mínimo: ${methods.find(m => m.id === selectedMethod)?.minAmount} |
              Monto máximo: ${methods.find(m => m.id === selectedMethod)?.maxAmount.toLocaleString()}
            </div>
          )}

          <button
            type="submit"
            className="submit-btn"
            disabled={!selectedMethod || !amount}
          >
            Recargar Ahora
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default Recharge;
