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
