import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Mail, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    const res = await login(email, password, rememberMe);
    if (res.success) {
      navigate('/dashboard');
    } else {
      setErrorMsg(res.message || 'Invalid email or password');
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card glass-panel animate-fadeIn">
        <div className="auth-brand">
          <div className="brand-icon">
            <Sparkles size={24} color="#ffffff" />
          </div>
          <h2 className="gradient-text">Welcome Back</h2>
          <p className="auth-subtitle">Sign in to track your habits and maintain streaks</p>
        </div>

        {errorMsg && (
          <div style={{ color: '#ef4444', fontSize: '0.85rem', textAlign: 'center', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.6rem 0.8rem', borderRadius: '8px' }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className="input-icon-wrapper">
              <Mail size={18} className="input-icon" />
              <input 
                type="email" 
                className="form-input with-icon"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-icon-wrapper">
              <Lock size={18} className="input-icon" />
              <input 
                type="password" 
                className="form-input with-icon"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="auth-options">
            <label className="remember-me">
              <input 
                type="checkbox" 
                checked={rememberMe} 
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Remember Me</span>
            </label>
            <a href="#forgot" className="forgot-link" onClick={(e) => { e.preventDefault(); alert('Demo password reset link sent!'); }}>
              Forgot Password?
            </a>
          </div>

          <button type="submit" className="btn btn-primary auth-submit-btn">
            <span>Sign In to Dashboard</span>
            <ArrowRight size={18} />
          </button>
        </form>

        <div className="auth-footer">
          <span>Don't have an account?</span>
          <Link to="/signup" className="auth-link">Create Account</Link>
        </div>
      </div>

      <style>{`
        .auth-page-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          background: radial-gradient(circle at top right, rgba(139, 92, 246, 0.15), transparent 40%),
                      radial-gradient(circle at bottom left, rgba(59, 130, 246, 0.15), transparent 40%);
        }

        .auth-card {
          width: 100%;
          max-width: 440px;
          padding: 2.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.75rem;
        }

        .auth-brand {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 0.5rem;
        }

        .auth-brand h2 {
          font-size: 1.75rem;
          font-weight: 800;
        }

        .auth-subtitle {
          font-size: 0.88rem;
          color: var(--text-secondary);
        }

        .input-icon-wrapper {
          position: relative;
        }

        .input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
        }

        .form-input.with-icon {
          padding-left: 2.6rem;
        }

        .auth-options {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.85rem;
          margin-bottom: 0.5rem;
        }

        .remember-me {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--text-secondary);
          cursor: pointer;
        }

        .forgot-link {
          color: var(--accent-purple);
          text-decoration: none;
          font-weight: 600;
        }

        .auth-submit-btn {
          width: 100%;
          padding: 0.85rem;
          font-size: 1rem;
        }

        .auth-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          font-size: 0.88rem;
          color: var(--text-secondary);
          border-top: 1px solid var(--border-color);
          padding-top: 1.25rem;
        }

        .auth-link {
          color: var(--accent-purple);
          font-weight: 700;
          text-decoration: none;
        }
      `}</style>
    </div>
  );
};
