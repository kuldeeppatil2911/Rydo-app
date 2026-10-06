import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { UserPlus } from 'lucide-react';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [invitationCode, setInvitationCode] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [plate, setPlate] = useState('');
  const [error, setError] = useState('');
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await register({
        name,
        email,
        password,
        role,
        ...(role !== 'user' && { invitationCode }),
        ...(role === 'driver' && { vehicle, plate })
      });
      navigate(role === 'driver' ? '/driver' : role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card glass">
        <h2>Create Account</h2>
        {error && <div style={{ color: '#ef4444', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div role="group" aria-label="Account type" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '0.5rem', marginBottom: '1rem' }}>
            {[
              { value: 'user', label: 'User' },
              { value: 'driver', label: 'Driver' },
              { value: 'admin', label: 'Admin' }
            ].map((accountType) => (
              <button
                key={accountType.value}
                type="button"
                className={`btn ${role === accountType.value ? '' : 'btn-secondary'}`}
                aria-pressed={role === accountType.value}
                onClick={() => {
                  setRole(accountType.value);
                  setInvitationCode('');
                }}
                style={{ width: '100%', justifyContent: 'center', padding: '10px 8px' }}
              >
                {accountType.label}
              </button>
            ))}
          </div>
          {role !== 'user' && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
              Staff accounts require an invitation code from an authorized administrator.
            </p>
          )}
          <div className="form-group">
            <label>Name</label>
            <input 
              type="text" 
              className="glass-input" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required 
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input 
              type="email" 
              className="glass-input" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              className="glass-input" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              minLength="6"
            />
          </div>
          {role !== 'user' && (
            <div className="form-group">
              <label htmlFor="invitationCode">Staff Invitation Code</label>
              <input
                id="invitationCode"
                type="password"
                className="glass-input"
                value={invitationCode}
                onChange={(e) => setInvitationCode(e.target.value)}
                autoComplete="off"
                required
              />
            </div>
          )}
          {role === 'driver' && (
            <>
              <div className="form-group">
                <label htmlFor="vehicle">Vehicle</label>
                <input
                  id="vehicle"
                  type="text"
                  className="glass-input"
                  value={vehicle}
                  onChange={(e) => setVehicle(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="plate">License Plate</label>
                <input
                  id="plate"
                  type="text"
                  className="glass-input"
                  value={plate}
                  onChange={(e) => setPlate(e.target.value)}
                  required
                />
              </div>
            </>
          )}
          <button type="submit" className="btn" style={{ marginTop: '1rem' }}>
            <UserPlus size={20} /> Sign Up
          </button>
        </form>
        <p style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--primary)' }}>Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
