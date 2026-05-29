import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Pill, User, Mail, ChevronRight, Lock, Shield, BadgeCheck, CheckSquare, Square, Briefcase } from 'lucide-react';

const MANAGER_USERS = [
  {email: 'admin', pass: '123', name: 'Priya', role: 'Manager'}
];

const Login = ({ onLoginSuccess }) => {
  const [loginMode, setLoginMode] = useState('employee'); // 'employee' or 'manager'
  const [isSignUp, setIsSignUp] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [empRole, setEmpRole] = useState('Cashier');
  
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
          // Try to find the manager's employee record
          let { data: empRecord } = await supabase
            .from('employees')
            .select('employee_id')
            .eq('employee_name', user.name)
            .maybeSingle();
          await onLoginSuccess({ ...user, employee_id: empRecord?.employee_id || null, rememberMe });
        } else {
          throw new Error('Invalid manager credentials.');
        }
      } else {
        // Employee Auth
        if (!email || !password) throw new Error("Email and password required.");
        
        if (isSignUp) {
          if (!name) throw new Error("Full Name is required for Sign Up.");
          
          // Check if employee with this email already exists
          let { data: existingEmp } = await supabase
            .from('employees')
            .select('employee_id')
            .eq('email', email)
            .maybeSingle();
            
          if (existingEmp) {
            throw new Error("Email already registered. Please Sign In.");
          }
          
          const password_hash = btoa(password);
          
          let { data: newEmp, error: insertErr } = await supabase.from('employees').insert({
            employee_name: name,
            role: empRole || 'Cashier',
            salary: 0,
            email: email,
            password_hash: password_hash
          }).select().single();
          
          if (insertErr) {
            if (insertErr.message && insertErr.message.includes('password_hash')) {
              throw new Error("Database needs updating. Please ask your manager to run the ALTER TABLE SQL to add email and password_hash columns to the employees table.");
            }
            throw insertErr;
          }
          
          await onLoginSuccess({ 
            name: newEmp.employee_name, 
            email: newEmp.email, 
            role: 'Employee', 
            employee_id: newEmp.employee_id, 
            rememberMe 
          });
          
        } else {
          // Sign In
          let { data: emp, error: checkErr } = await supabase
            .from('employees')
            .select('*')
            .eq('email', email)
            .maybeSingle();
          
          if (!emp) {
            throw new Error("Account not found. Please Sign Up first.");
          }
          
          if (emp.password_hash !== btoa(password)) {
            throw new Error("Invalid email or password.");
          }
          
          await onLoginSuccess({ 
            name: emp.employee_name, 
            email: emp.email, 
            role: 'Employee', 
            employee_id: emp.employee_id, 
            rememberMe 
          });
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
          <p>Please enter your details to {loginMode === 'employee' && isSignUp ? 'create an account' : 'sign in'}.</p>
        </div>

        <div style={{ display: 'flex', gap: '2px', marginBottom: '1.5rem', background: '#161B26', padding: '3px', borderRadius: '8px' }}>
          <button 
            type="button" 
            onClick={() => { setLoginMode('employee'); setError(null); }}
            style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', border: loginMode === 'employee' ? 'none' : '1px solid rgba(255,255,255,0.07)', background: loginMode === 'employee' ? '#0d9488' : 'transparent', color: loginMode === 'employee' ? '#fff' : '#64748B', cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontWeight: 500, fontSize: '0.86rem' }}
          >
            <BadgeCheck size={16} /> Employee
          </button>
          <button 
            type="button" 
            onClick={() => { setLoginMode('manager'); setError(null); }}
            style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', border: loginMode === 'manager' ? 'none' : '1px solid rgba(255,255,255,0.07)', background: loginMode === 'manager' ? '#0d9488' : 'transparent', color: loginMode === 'manager' ? '#fff' : '#64748B', cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontWeight: 500, fontSize: '0.86rem' }}
          >
            <Shield size={16} /> Manager
          </button>
        </div>

        {error && <div className="login-error">{error}</div>}

        <form className="login-form" onSubmit={handleAuth}>
          {loginMode === 'employee' && isSignUp && (
            <>
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
              <div className="form-group">
                <label>Role / Position</label>
                <div className="input-with-icon">
                  <Briefcase size={18} className="input-icon" />
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. Cashier, Pharmacist"
                    value={empRole}
                    onChange={(e) => setEmpRole(e.target.value)}
                    required
                  />
                </div>
              </div>
            </>
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
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0 }}
            >
              {rememberMe ? <CheckSquare size={16} color="#0d9488" /> : <Square size={16} />}
              <span style={{ fontSize: '0.86rem' }}>Remember Me</span>
            </button>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginBottom: '1rem' }}>
            {loading ? 'Processing...' : (
              <>{loginMode === 'employee' && isSignUp ? 'Create Account' : 'Sign In'} <ChevronRight size={18} /></>
            )}
          </button>
        </form>

        {loginMode === 'employee' && (
          <div style={{ textAlign: 'center', fontSize: '0.86rem', color: '#64748B' }}>
            {isSignUp ? "Already have an account? " : "Don't have an account? "}
            <button onClick={() => { setIsSignUp(!isSignUp); setError(null); }} className="btn-text" style={{ color: '#14b8a6' }}>
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </div>
        )}

        {loginMode === 'manager' && (
          <div style={{ marginTop: '1.25rem', padding: '0.75rem 0.85rem', background: 'rgba(13, 148, 136, 0.08)', borderRadius: '8px', border: '1px solid rgba(13, 148, 136, 0.15)', fontSize: '0.8rem' }}>
            <p style={{ margin: '0 0 0.35rem 0', color: '#CBD5E1', fontWeight: 600 }}>Manager Credentials:</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#64748B' }}>Admin:</span>
              <code style={{ background: '#161B26', padding: '2px 8px', borderRadius: '4px', color: '#0d9488', fontWeight: 600, fontSize: '0.82rem' }}>admin / 123</code>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
