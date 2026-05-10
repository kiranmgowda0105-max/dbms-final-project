import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Pill, User, Mail, ChevronRight, Lock, Shield } from 'lucide-react';

const MANAGER_USERS = [
  {email: 'admin', pass: '123', name: 'Priya', role: 'Manager'}
];

const Login = ({ onLoginSuccess }) => {
  const [loginMode, setLoginMode] = useState('customer'); // 'customer' or 'manager'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleManualLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (loginMode === 'manager') {
        if (!email || !password) throw new Error("Email and password required.");
        const user = MANAGER_USERS.find(u => u.email === email && u.pass === password);
        if (user) {
          await onLoginSuccess(user);
        } else {
          throw new Error('Invalid manager credentials.');
        }
      } else {
        if (!name || !email) throw new Error("Name and email required.");
        const mockUser = { name, email, role: 'Customer', isGuest: true };
        await onLoginSuccess(mockUser);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo-wrapper">
            <Pill size={36} className="login-logo" />
          </div>
          <h2>Nexus Pharmacy</h2>
          <p>Please enter your details to sign in.</p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'rgba(15, 23, 42, 0.6)', padding: '0.25rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <button 
            type="button" 
            onClick={() => { setLoginMode('customer'); setError(null); }}
            style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', border: 'none', background: loginMode === 'customer' ? '#6366f1' : 'transparent', color: loginMode === 'customer' ? '#fff' : '#94a3b8', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 500 }}
          >
            <User size={16} /> Customer
          </button>
          <button 
            type="button" 
            onClick={() => { setLoginMode('manager'); setError(null); }}
            style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', border: 'none', background: loginMode === 'manager' ? '#6366f1' : 'transparent', color: loginMode === 'manager' ? '#fff' : '#94a3b8', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 500 }}
          >
            <Shield size={16} /> Manager
          </button>
        </div>

        {error && <div className="login-error">{error}</div>}

        <form className="login-form" onSubmit={handleManualLogin}>
          {loginMode === 'customer' && (
            <div className="form-group">
              <label>Full Name</label>
              <div className="input-with-icon">
                <User size={18} className="input-icon" />
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required 
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Email</label>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input 
                type="text" 
                className="form-control" 
                placeholder={loginMode === 'manager' ? 'admin' : 'john@example.com'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
          </div>

          {loginMode === 'manager' && (
            <div className="form-group">
              <label>Password</label>
              <div className="input-with-icon">
                <Lock size={18} className="input-icon" />
                <input 
                  type="password" 
                  className="form-control" 
                  placeholder="123"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </div>
            </div>
          )}
          
          <div className="login-actions" style={{ justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Processing...' : (
                <>Sign In <ChevronRight size={18} /></>
              )}
            </button>
          </div>
        </form>

        {loginMode === 'manager' && (
          <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(30, 41, 59, 0.5)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.85rem' }}>
            <p style={{ margin: '0 0 0.5rem 0', color: '#94a3b8', fontWeight: 'bold' }}>Manager Credentials:</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <span style={{ color: '#cbd5e1' }}>Admin:</span>
              <code style={{ background: '#0f172a', padding: '2px 6px', borderRadius: '4px', color: '#34d399' }}>admin / 123</code>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
