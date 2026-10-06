import React, { useContext, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Car, User, LogOut, LayoutDashboard, Map, Shield, Settings, Menu, X } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const navLinkStyle = (path) => ({
    color: isActive(path) ? 'var(--primary)' : 'var(--text-muted)',
    textDecoration: 'none',
    fontWeight: 500,
    fontSize: '0.9rem',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: '8px',
    background: isActive(path) ? 'rgba(79, 70, 229, 0.15)' : 'transparent',
    transition: 'all 0.2s ease',
  });

  return (
    <nav className="navbar glass">
      <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.5rem', fontWeight: 800 }}>
        <div style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))', borderRadius: '10px', padding: '6px', display: 'flex' }}>
          <Car size={22} color="white" />
        </div>
        <Link to="/" style={{ color: 'white', textDecoration: 'none', letterSpacing: '-0.5px' }}>
          Rydo<span style={{ color: 'var(--primary)' }}>.</span>
        </Link>
      </div>

      <div className="nav-links" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        {user ? (
          <>
            {user.role === 'user' && <>
              <Link to="/dashboard" style={navLinkStyle('/dashboard')}>
                <LayoutDashboard size={16} /> Dashboard
              </Link>
              <Link to="/book" style={navLinkStyle('/book')}>
                <Map size={16} /> Book Ride
              </Link>
            </>}
            {user.role === 'driver' && (
              <Link to="/driver" style={navLinkStyle('/driver')} title="Driver Portal">
                <Car size={16} /> Driver Dashboard
              </Link>
            )}
            {user.role === 'admin' && (
              <Link to="/admin" style={navLinkStyle('/admin')} title="Admin Portal">
                <Shield size={16} /> Admin Dashboard
              </Link>
            )}
            <Link to="/profile" style={navLinkStyle('/profile')}>
              <User size={16} /> Profile
            </Link>
            <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem', width: 'auto' }}>
              <LogOut size={15} /> Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" style={navLinkStyle('/login')}>Login</Link>
            <Link to="/signup" className="btn" style={{ padding: '8px 20px', textDecoration: 'none', color: 'white', width: 'auto', fontSize: '0.9rem' }}>
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
