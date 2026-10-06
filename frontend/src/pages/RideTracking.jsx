import React, { useContext, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { ShieldCheck, Car, PhoneCall, CheckCircle2 } from 'lucide-react';
import LocationMap from '../components/LocationMap';
import { AuthContext } from '../context/AuthContext';

const RideTracking = () => {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alertLoading, setAlertLoading] = useState(false);
  const previousStatus = useRef(null);
  const { user } = useContext(AuthContext);

  const [routeCoords, setRouteCoords] = useState({ pickup: null, dropoff: null });
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Request notification permission on mount
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }

    const fetchRide = async () => {
      try {
        const res = await axios.get(`/ride/${id}`);
        const newBooking = res.data;
        
        // Check for status change to trigger notification
        if (previousStatus.current && previousStatus.current !== newBooking.status) {
          if (Notification.permission === 'granted') {
            new Notification('Ride Update', {
              body: `Your ride status is now: ${newBooking.status}`,
              icon: '/vite.svg'
            });
          }
        }

        previousStatus.current = newBooking.status;
        setBooking(newBooking);
        
        setRouteCoords({ pickup: newBooking.pickupCoords, dropoff: newBooking.dropoffCoords });

        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    fetchRide();
    
    // Polling to simulate status updates from driver app
    const interval = setInterval(fetchRide, 5000);
    return () => clearInterval(interval);
  }, [id]);

  const updateStatus = async (status) => {
    try {
      const res = await axios.patch(`/ride/${id}/status`, { status });
      setBooking((current) => ({ ...current, ...res.data }));
      setMessage(`Ride status updated to ${status}.`);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Status update failed.');
    }
  };

  const sendEmergencyAlert = async () => {
    setAlertLoading(true);
    try {
      const response = await axios.post(`/ride/${id}/emergency-alert`);
      setMessage(response.data.message);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Emergency alert could not be processed.');
    } finally {
      setAlertLoading(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem' }}>Loading ride details...</div>;
  if (!booking) return <div style={{ textAlign: 'center', padding: '3rem' }}>Ride not found.</div>;

  return (
    <div className="grid-2">
      {/* Tracking Details */}
      <div>
        <h2 style={{ marginBottom: '1.5rem' }}>Ride Status: {booking.status}</h2>
        
        <div className="glass" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
          <h3 style={{ color: 'var(--primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Car /> Driver Details
          </h3>
          {booking.driver ? (
            <>
              <p><strong>Name:</strong> {booking.driver.name}</p>
              <p><strong>Vehicle:</strong> {booking.driver.vehicle}</p>
              <p><strong>Plate:</strong> {booking.driver.plate}</p>
              <p><strong>Rating:</strong> ⭐ {booking.driver.rating}</p>
            </>
          ) : (
            <p>Waiting for a driver to accept your request...</p>
          )}
        </div>

        <div className="glass" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck color="var(--secondary)" /> Safety Information
          </h3>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--secondary)', padding: '1rem', borderRadius: '8px' }}>
            <p style={{ margin: 0 }}><strong>OTP to share with driver:</strong> <span style={{ fontSize: '1.5rem', fontWeight: 'bold', letterSpacing: '2px', color: 'var(--secondary)' }}>{booking.otp}</span></p>
          </div>
          <p style={{ marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Emergency alerts use your saved contact details when alert settings and a delivery service are configured.
          </p>
          {user?.role === 'user' && !['Payment Pending', 'Payment Failed', 'Completed', 'Cancelled'].includes(booking.status) && (
            <button className="btn btn-secondary" onClick={sendEmergencyAlert} disabled={alertLoading} style={{ marginTop: '1rem' }}>
              <PhoneCall size={17} /> {alertLoading ? 'Sending alert...' : 'Send Emergency Alert'}
            </button>
          )}
          {message && <p style={{ color: 'var(--secondary)', marginTop: '0.75rem' }}>{message}</p>}
        </div>
        {(user?.role === 'driver' || user?.role === 'admin') && booking.driver && !['Completed', 'Cancelled'].includes(booking.status) && (
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
              {booking.status === 'Assigned' && <button className="btn btn-secondary" onClick={() => updateStatus('Arriving')}><CheckCircle2 size={17} /> Driver Arriving</button>}
              {booking.status === 'Arriving' && <button className="btn" onClick={() => updateStatus('In Progress')}><Car size={17} /> Start Ride</button>}
              {booking.status === 'In Progress' && <button className="btn btn-success" onClick={() => updateStatus('Completed')}>Complete Ride</button>}
          </div>
        )}
        {user?.role === 'user' && ['Searching', 'Assigned'].includes(booking.status) && (
          <button className="btn" onClick={() => updateStatus('Cancelled')} style={{ marginTop: '1rem' }}>Cancel Ride</button>
        )}
      </div>

      {/* Map Simulation */}
      <div className="glass" style={{ overflow: 'hidden', height: '500px' }}>
        <LocationMap pickup={routeCoords.pickup} dropoff={routeCoords.dropoff} />
        {!routeCoords.pickup?.lat && <p style={{ padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Map coordinates are unavailable for this ride, so Vadodara is shown as the default location.</p>}
      </div>
    </div>
  );
};

export default RideTracking;
