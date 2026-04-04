// Credit recharge page.
// Lets the user pick a payment method, enter or select a preset amount,
// and submit a recharge request. Min/max limits are enforced per method.
import { useState } from 'react';
import { motion } from 'framer-motion';
import { RechargeMethod } from '../../types';
import { useAuth } from '../../context/AuthContext';
import './Recharge.css';

const API_GATEWAY_URL = import.meta.env.VITE_API_GATEWAY_URL ?? 'http://localhost:8079';

const Recharge = () => {
  const { user, updateBalance } = useAuth();
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; success: boolean } | null>(null);

  // Available payment methods with their respective limits
  const methods: RechargeMethod[] = [
    { id: 'card',   name: 'Tarjeta', icon: 'CARD',   minAmount: 10000,  maxAmount: 5000000  },
    { id: 'paypal', name: 'PayPal',  icon: 'PAYPAL', minAmount: 10000,  maxAmount: 2000000  },
    { id: 'crypto', name: 'Crypto',  icon: 'CRYPTO', minAmount: 50000,  maxAmount: 20000000 },
    { id: 'bank',   name: 'Banco',   icon: 'BANK',   minAmount: 50000,  maxAmount: 10000000 }
  ];

  const suggestedAmounts = [50000, 100000, 250000, 500000, 1000000, 2500000];

  /** Sets the amount from a preset button and highlights it. */
  const handleAmountClick = (value: number) => {
    setAmount(value.toString());
    setSelectedAmount(value);
  };

  /** Validates the form and simulates a recharge submission. */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMethod || !amount) {
      setMessage({ text: 'Por favor selecciona un método de pago y un monto', success: false });
      return;
    }
    const selectedMethodData = methods.find(m => m.id === selectedMethod);
    const numAmount = parseFloat(amount);
    if (selectedMethodData && (numAmount < selectedMethodData.minAmount || numAmount > selectedMethodData.maxAmount)) {
      setMessage({ text: `El monto debe estar entre $${selectedMethodData.minAmount.toLocaleString()} y $${selectedMethodData.maxAmount.toLocaleString()} COP`, success: false });
      return;
    }
    setIsLoading(true);
    setMessage(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_GATEWAY_URL}/api/v1/transactions/deposit/${user?.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount: parseFloat(amount) })
      });
      if (!res.ok) throw new Error('Deposit failed');
      const data = await res.json();
      updateBalance(data.data.balanceAfter);
      setMessage({ text: `¡Recarga de $${amount} procesada exitosamente!`, success: true });
      setAmount('');
      setSelectedAmount(null);
      setSelectedMethod('');
    } catch (error) {
      setMessage({ text: 'Error al procesar la recarga', success: false });
    } finally {
      setIsLoading(false);
    }
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
                  ${value.toLocaleString()} COP
                </button>
              ))}
            </div>
          </div>

          {/* Min/max info banner — shown only after a method is selected */}
          {selectedMethod && (
            <div className="recharge-info">
              Monto mínimo: ${methods.find(m => m.id === selectedMethod)?.minAmount.toLocaleString()} COP |
              Monto máximo: ${methods.find(m => m.id === selectedMethod)?.maxAmount.toLocaleString()} COP
            </div>
          )}

          {message && (
            <div className={`recharge-message ${message.success ? 'success' : 'error'}`}>
              {message.text}
            </div>
          )}

          <button
            type="submit"
            className="submit-btn"
            disabled={!selectedMethod || !amount || isLoading}
          >
            {isLoading ? 'Procesando...' : 'Recargar Ahora'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default Recharge;
