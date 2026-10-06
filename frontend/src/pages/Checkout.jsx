import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { CreditCard } from 'lucide-react';

const Checkout = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Payload passed from RideBooking
  const payload = location.state?.payload;

  if (!payload) return <div>Invalid Checkout Session</div>;

  const handlePayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const bookingResponse = await axios.post('/ride/book', payload);
      const sessionResponse = await axios.post('/payment/checkout', {
        bookingId: bookingResponse.data.booking._id,
        method: payload.paymentMode
      });

      if (!sessionResponse.data?.url) throw new Error('Stripe did not return a checkout URL');
      window.location.href = sessionResponse.data.url;
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Payment failed, please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card glass" style={{ maxWidth: '500px' }}>
        <h2>Complete Payment</h2>
        <p style={{ textAlign: 'center', marginBottom: '2rem', color: 'var(--text-muted)' }}>
          Amount to pay: <span style={{ color: 'white', fontWeight: 'bold', fontSize: '1.2rem' }}>{payload.fare}</span>
        </p>
        
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          Payment details are entered securely on Stripe. Rydo does not collect or store your card details.
        </p>
        {error && <p role="alert" style={{ color: '#ef4444', marginBottom: '1rem' }}>{error}</p>}
        <form onSubmit={handlePayment}>
          <button type="submit" className="btn" style={{ marginTop: '1rem' }} disabled={loading}>
            <CreditCard size={20} /> {loading ? 'Connecting to Stripe...' : `Continue to Stripe · ${payload.fare}`}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Checkout;
