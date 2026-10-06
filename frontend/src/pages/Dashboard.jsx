import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Map, ShieldAlert, Car, Clock, TrendingUp, Zap, ChevronRight, MapPin, Star } from 'lucide-react';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [recentRides, setRecentRides] = useState([]);
  const [loadingRides, setLoadingRides] = useState(true);

  // Greeting based on time
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  useEffect(() => {
    axios.get('/ride/history/me')
      .then((res) => setRecentRides(res.data.slice(0, 5)))
      .catch((error) => console.error('Failed to load ride history', error))
      .finally(() => setLoadingRides(false));
  }, []);

  const rideTypes = [
    { name: 'Standard', icon: <Car size={24} />, desc: 'Everyday rides at great value', color: 'var(--primary)', time: '5 min' },
    { name: 'Premium', icon: <Star size={24} />, desc: 'Luxury rides, top-rated drivers', color: '#F59E0B', time: '3 min' },
    { name: 'Carpool', icon: <Zap size={24} />, desc: 'Share your ride, save more', color: 'var(--secondary)', time: '8 min' },
  ];

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Hero Greeting */}
      <div style={{ marginBottom: '2.5rem' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '0.25rem' }}>{greeting} 👋</p>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.5px', lineHeight: 1.2 }}>
          Welcome back, <span style={{ background: 'linear-gradient(90deg, var(--primary), var(--secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{user?.name?.split(' ')[0]}</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Where would you like to go today?</p>
      </div>

      {/* Quick Book CTA */}
      <div className="glass" style={{ padding: '2rem', marginBottom: '2rem', background: 'linear-gradient(135deg, rgba(79,70,229,0.2) 0%, rgba(16,185,129,0.1) 100%)', borderColor: 'rgba(79,70,229,0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem' }}>Ready to ride?</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Book your ride in under 30 seconds.</p>
          </div>
          <Link to="/book" className="btn" style={{ textDecoration: 'none', color: 'white', width: 'auto', padding: '14px 32px', fontSize: '1rem', fontWeight: 700 }}>
            <MapPin size={18} /> Book Now
          </Link>
        </div>
      </div>

      {/* Ride Type Cards */}
      <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--text-muted)', fontWeight: 500 }}>Choose Your Ride Type</h3>
      <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        {rideTypes.map((type) => (
          <Link key={type.name} to={`/book?type=${type.name}`} style={{ textDecoration: 'none' }}>
            <div className="glass card-hover" style={{ padding: '1.5rem', cursor: 'pointer', transition: 'all 0.3s ease', borderColor: 'rgba(255,255,255,0.1)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = type.color; e.currentTarget.style.transform = 'translateY(-4px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div style={{ color: type.color, marginBottom: '0.75rem' }}>{type.icon}</div>
              <h4 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>{type.name}</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.75rem' }}>{type.desc}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: type.color, fontSize: '0.8rem', fontWeight: 600 }}>
                <Clock size={13} /> {type.time} away
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Feature Cards Grid */}
      <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--text-muted)', fontWeight: 500 }}>Quick Actions</h3>
      <div className="grid-2" style={{ marginBottom: '2rem' }}>
        <div className="glass" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', borderRadius: '12px', padding: '10px', display: 'inline-flex' }}>
              <ShieldAlert size={24} color="var(--secondary)" />
            </div>
            <Link to="/profile" style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', textDecoration: 'none' }}>
              Manage <ChevronRight size={14} />
            </Link>
          </div>
          <h3 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Safety Center</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Emergency contacts, live OTP, and ride-sharing alerts.</p>
        </div>

        {user?.role === 'admin' && (
          <div className="glass" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ background: 'rgba(79, 70, 229, 0.15)', borderRadius: '12px', padding: '10px', display: 'inline-flex' }}>
                <TrendingUp size={24} color="var(--primary)" />
              </div>
              <Link to="/admin" style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', textDecoration: 'none' }}>
                View <ChevronRight size={14} />
              </Link>
            </div>
            <h3 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Admin Panel</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>View real-time stats, revenue charts, and all bookings.</p>
          </div>
        )}
      </div>

      {/* Recent Rides */}
      <div className="glass" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontWeight: 700 }}>Recent Rides</h3>
        </div>
        {loadingRides ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            <div className="pulse-dot" />
            Loading rides...
          </div>
        ) : recentRides.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            <Car size={40} style={{ margin: '0 auto 1rem', display: 'block', opacity: 0.3 }} />
            <p>No rides yet. Book your first ride!</p>
            <Link to="/book" className="btn" style={{ textDecoration: 'none', color: 'white', width: 'auto', padding: '10px 24px', marginTop: '1rem', display: 'inline-flex' }}>
              Book a Ride
            </Link>
          </div>
        ) : (
          recentRides.map(ride => (
            <div key={ride._id} style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center' }}>
              <div><p>{ride.pickup} → {ride.dropoff}</p><small style={{ color: 'var(--text-muted)' }}>{ride.fare} · {ride.createdAt ? new Date(ride.createdAt).toLocaleDateString() : ''}</small></div>
              <Link to={`/track/${ride._id}`} className="btn btn-secondary" style={{ width: 'auto', padding: '8px 12px', textDecoration: 'none' }}>Track</Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Dashboard;
