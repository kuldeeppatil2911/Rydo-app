import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, Clock3, MapPin, Navigation } from 'lucide-react';

const Receipt = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [payment, setPayment] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    let interval;
    const fetchPayment = async () => {
      try {
        const response = await axios.get(`/payment/${id}`);
        if (!active) return;
        setPayment(response.data);
        if (response.data.status !== 'Pending' || response.data.method === 'Cash') clearInterval(interval);
      } catch {
        if (active) setError('Receipt is not available for this booking yet.');
        clearInterval(interval);
      }
    };
    fetchPayment();
    interval = setInterval(fetchPayment, 3000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [id]);

  if (error) return <div className="glass" style={{ maxWidth: '600px', margin: '3rem auto', padding: '2rem', textAlign: 'center' }}>{error}</div>;
  if (!payment) return <div style={{ textAlign: 'center', padding: '3rem' }}>Loading receipt...</div>;

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      <div className="glass" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {payment.status === 'Paid' ? <CheckCircle color="var(--secondary)" size={32} /> : <Clock3 color="var(--primary)" size={32} />}
          <div><h2>{payment.status === 'Paid' ? 'Payment Receipt' : 'Payment Status'}</h2><p style={{ color: 'var(--text-muted)' }}>{payment.status === 'Paid' ? 'Rydo ride transaction completed' : payment.method === 'Cash' ? 'Cash payment is due to your driver' : 'Waiting for Stripe payment confirmation'}</p></div>
        </div>
        <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
          <div><small>Receipt ID</small><strong style={{ display: 'block', marginTop: '0.25rem' }}>{payment.receiptId}</strong></div>
          <div><small>Transaction ID</small><strong style={{ display: 'block', marginTop: '0.25rem' }}>{payment.transactionId}</strong></div>
          <div><small>Payment Method</small><strong style={{ display: 'block', marginTop: '0.25rem' }}>{payment.method}</strong></div>
          <div><small>Payment Status</small><strong style={{ display: 'block', marginTop: '0.25rem', color: payment.status === 'Paid' ? 'var(--secondary)' : 'var(--primary)' }}>{payment.status}</strong></div>
        </div>
        <div style={{ borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', padding: '1.25rem 0', marginBottom: '1.5rem' }}>
          <p style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}><MapPin size={17} color="var(--secondary)" /> {payment.booking.pickup}</p>
          <p style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.75rem' }}><Navigation size={17} color="var(--primary)" /> {payment.booking.dropoff}</p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 800 }}><span>{payment.status === 'Paid' ? 'Total paid' : 'Amount'}</span><span style={{ color: 'var(--secondary)' }}>{payment.amount}</span></div>
        <button className="btn" onClick={() => navigate(`/track/${id}`)} style={{ marginTop: '1.5rem' }}>View Live Tracking</button>
      </div>
    </div>
  );
};

export default Receipt;