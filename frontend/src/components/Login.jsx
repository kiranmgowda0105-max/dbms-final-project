import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Pill, User, Mail, ChevronRight, Lock, Shield, CheckSquare, Square } from 'lucide-react';

const MANAGER_USERS = [
  {email: 'admin', pass: '123', name: 'Priya', role: 'Manager'}
];

const Login = ({ onLoginSuccess }) => {
  const [loginMode, setLoginMode] = useState('customer'); // 'customer' or 'manager'
  const [isSignUp, setIsSignUp] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      if (loginMode === 'manager') {
        if (!email || !password) throw new Error("Email and password required.");
        const user = MANAGER_USERS.find(u => u.email === email && u.pass === password);
        if (user) {
          await onLoginSuccess({ ...user, rememberMe });
        } else {
          throw new Error('Invalid manager credentials.');
        }
      } else {
        // Customer Auth
        if (!email || !password) throw new Error("Email and password required.");
        
        if (isSignUp) {
          if (!name) throw new Error("Full Name is required for Sign Up.");
          
          // Check if exists
          let { data: existingCust, error: checkErr } = await supabase
            .from('customers')
            .select('*')
            .eq('email', email)
            .single();
            
          if (checkErr && checkErr.code === '42P01') {
            const res = await supabase.from('Customers').select('*').eq('email', email).single();
            existingCust = res.data;
          }
          
          if (existingCust) {
            throw new Error("Email already registered. Please Sign In.");
          }
          
          // Hash password (basic hash for demo purposes, normally backend handles this securely)
          const password_hash = btoa(password); // Very basic base64 just to populate the column
          
          let { data: newCust, error: insertErr } = await supabase.from('customers').insert({
            customer_name: name,
            email: email,
            phone: '',
            password_hash: password_hash
          }).select().single();
          
          if (insertErr && insertErr.code === '42P01') {
            const res = await supabase.from('Customers').insert({ 
              customer_name: name, email: email, phone: '', password_hash: password_hash 
            }).select().single();
            newCust = res.data;
            insertErr = res.error;
          }
          
          if (insertErr) {
            if (insertErr.code === '42703' && insertErr.message.includes('password_hash')) {
              throw new Error("SYSTEM ERROR: Please run the SQL command in pgAdmin to add the password_hash column!");
            }
            throw insertErr;
          }
          
          await onLoginSuccess({ name: newCust.customer_name, email: newCust.email, role: 'Customer', customer_id: newCust.customer_id, rememberMe });
          
        } else {
          // Sign In
          let { data: cust, error: checkErr } = await supabase
            .from('customers')
            .select('*')
            .eq('email', email)
            .single();
            
          if (checkErr && checkErr.code === '42P01') {
            const res = await supabase.from('Customers').select('*').eq('email', email).single();
            cust = res.data;
            checkErr = res.error;
          }
          
          if (!cust) {
            throw new Error("Account not found. Please Sign Up.");
          }
          
          // Verify password
          if (cust.password_hash !== btoa(password)) {
             throw new Error("Invalid email or password.");
          }
          
          await onLoginSuccess({ name: cust.customer_name, email: cust.email, role: 'Customer', customer_id: cust.customer_id, rememberMe });
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setError("Google Auth not configured in Supabase yet. Please use manual Sign In.");
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo-wrapper">
            <Pill size={36} className="login-logo" />
          </div>
          <h2>Nexus Pharmacy</h2>
          <p>Please enter your details to {loginMode === 'customer' && isSignUp ? 'create an account' : 'sign in'}.</p>
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

        <form className="login-form" onSubmit={handleAuth}>
          {loginMode === 'customer' && isSignUp && (
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
                  required={isSignUp}
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

          <div className="form-group">
            <label>Password</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input 
                type="password" 
                className="form-control" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <button 
              type="button" 
              onClick={() => setRememberMe(!rememberMe)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}
            >
              {rememberMe ? <CheckSquare size={16} color="#6366f1" /> : <Square size={16} />}
              <span style={{ fontSize: '0.9rem' }}>Remember Me</span>
            </button>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginBottom: '1rem' }}>
            {loading ? 'Processing...' : (
              <>{loginMode === 'customer' && isSignUp ? 'Create Account' : 'Sign In'} <ChevronRight size={18} /></>
            )}
          </button>
        </form>

        <div style={{ position: 'relative', textAlign: 'center', margin: '1.5rem 0' }}>
          <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
          <span style={{ position: 'relative', background: '#0f172a', padding: '0 1rem', color: '#64748b', fontSize: '0.85rem' }}>OR</span>
        </div>

        <button type="button" onClick={handleGoogleLogin} className="btn" style={{ width: '100%', background: '#fff', color: '#1e293b', display: 'flex', justifyContent: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Sign in with Google
        </button>

        {loginMode === 'customer' && (
          <div style={{ textAlign: 'center', fontSize: '0.9rem', color: '#94a3b8' }}>
            {isSignUp ? "Already have an account? " : "Don't have an account? "}
            <button onClick={() => { setIsSignUp(!isSignUp); setError(null); }} className="btn-text" style={{ color: '#6366f1' }}>
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </div>
        )}

        {loginMode === 'manager' && (
          <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(30, 41, 59, 0.5)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.85rem' }}>
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
