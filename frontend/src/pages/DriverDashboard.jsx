import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Navigation, MapPin } from 'lucide-react';

const DriverDashboard = () => {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigned, setAssigned] = useState([]);
  const previousRideCount = useRef(0);
  const refreshRides = useRef(null);

  useEffect(() => {
    const fetchRides = async () => {
      try {
        const res = await axios.get('/driver/pending');
        const newRides = res.data;
        if (newRides.length > previousRideCount.current && previousRideCount.current !== 0) {
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('New Ride Request', {
              body: 'A new ride request is available!',
              icon: '/vite.svg'
            });
          }
        }
        previousRideCount.current = newRides.length;
        setRides(newRides);
        const assignedResponse = await axios.get('/driver/assigned');
        setAssigned(assignedResponse.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    refreshRides.current = fetchRides;
    // Request notification permission on mount
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }

    fetchRides();
    const interval = setInterval(fetchRides, 5000); // Poll for new rides
    return () => clearInterval(interval);
  }, []);

  const handleAccept = async (bookingId) => {
    try {
      await axios.post('/driver/accept', { bookingId });
      alert('Ride accepted. The rider can now track this trip.');
      refreshRides.current?.();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to accept ride');
    }
  };

  if (loading) return <div>Searching for rides...</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '2rem' }}>Driver Dashboard - Available Rides</h2>
      
      {assigned.length > 0 && (
        <div className="glass" style={{ padding: '1rem', marginBottom: '1.5rem', borderColor: 'var(--secondary)' }}>
          <strong>Active trips: {assigned.length}</strong>
          {assigned.map((ride) => (
            <div key={ride._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', paddingTop: '1rem' }}>
              <div>
                <p>{ride.pickup} to {ride.dropoff}</p>
                <small style={{ color: 'var(--text-muted)' }}>{ride.user?.name || 'Rider'} · {ride.status}</small>
              </div>
              <Link to={`/track/${ride._id}`} className="btn btn-secondary" style={{ width: 'auto', textDecoration: 'none' }}>Open trip</Link>
            </div>
          ))}
        </div>
      )}
      {rides.length === 0 ? (
        <div className="glass" style={{ padding: '3rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)' }}>No rides available right now. Waiting for requests...</p>
        </div>
      ) : (
        rides.map(ride => (
          <div key={ride._id} className="glass" style={{ padding: '1.5rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ marginBottom: '0.5rem', color: 'var(--primary)' }}>{ride.user?.name}</h4>
              <p style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <MapPin size={16} /> Pickup: {ride.pickup}
              </p>
              <p style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <Navigation size={16} /> Dropoff: {ride.dropoff}
              </p>
              <p style={{ color: 'var(--secondary)' }}>Fare: {ride.fare} • Distance: {ride.distance}</p>
            </div>
            <button onClick={() => handleAccept(ride._id)} className="btn" style={{ width: 'auto', padding: '12px 32px' }}>
              Accept Ride
            </button>
          </div>
        ))
      )}
    </div>
  );
};

export default DriverDashboard;
