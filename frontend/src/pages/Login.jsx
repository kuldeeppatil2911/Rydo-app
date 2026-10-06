import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LogIn } from 'lucide-react';

const demoAccounts = import.meta.env.DEV ? [
  { label: 'User', email: 'user@rydo.com', password: 'user123' },
  { label: 'Driver', email: 'driver@rydo.com', password: 'driver123' },
  { label: 'Admin', email: 'admin@rydo.com', password: 'admin123' }
] : [];
const accountTypes = [
  { role: 'user', label: 'User' },
  { role: 'driver', label: 'Driver' },
  { role: 'admin', label: 'Admin' }
];

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [expectedRole, setExpectedRole] = useState('user');
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password, expectedRole);
      const storedUser = JSON.parse(localStorage.getItem('user'));
      navigate(storedUser?.role === 'driver' ? '/driver' : storedUser?.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    }
  };

  const fillDemoAccount = (account) => {
    setEmail(account.email);
    setPassword(account.password);
    setExpectedRole(account.label.toLowerCase());
  };

  return (
    <div className="auth-container">
      <div className="auth-card glass">
        <h2>Welcome Back</h2>
        {!import.meta.env.DEV && <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '1rem' }}>Demo accounts are for local development. Create a production account with Sign Up.</p>}
        <div role="group" aria-label="Account type" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '0.5rem', marginBottom: '1rem' }}>
          {accountTypes.map((accountType) => (
            <button
              key={accountType.role}
              type="button"
              className={`btn ${expectedRole === accountType.role ? '' : 'btn-secondary'}`}
              aria-pressed={expectedRole === accountType.role}
              onClick={() => setExpectedRole(accountType.role)}
              style={{ width: '100%', justifyContent: 'center', padding: '10px 8px' }}
            >
              {accountType.label}
            </button>
          ))}
        </div>
        {import.meta.env.DEV && <div style={{ marginBottom: '1rem', display: 'grid', gap: '0.5rem' }}>
          {demoAccounts.map((account) => (
            <button
              key={account.label}
              type="button"
              onClick={() => fillDemoAccount(account)}
              className="btn btn-secondary"
              style={{ width: '100%', justifyContent: 'center', fontSize: '0.85rem', padding: '10px 12px' }}
            >
              Use {account.label} demo account
            </button>
          ))}
        </div>}
        {error && <div style={{ color: '#ef4444', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
        <form onSubmit={handleSubmit}>
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
            />
          </div>
          <button type="submit" className="btn" style={{ marginTop: '1rem' }}>
            <LogIn size={20} /> Login
          </button>
        </form>
        <p style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Don't have an account? <Link to="/signup" style={{ color: 'var(--primary)' }}>Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
