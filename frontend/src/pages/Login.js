import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const FEATURES = [
  { icon: '🖥️', label: 'Admin Calls' },
  { icon: '🏨', label: 'Guest Calls' },
  { icon: '📈', label: 'Analytics' },
  { icon: '👥', label: 'Team' },
];

const Login = () => {
  const [id, setId] = useState('');
  const [pass, setPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      await login(id, pass);
      navigate('/dashboard');
    } catch (error) {
      setErr(error.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Left — brand + form */}
      <div className="login-left">
        <div className="login-brand">
          <div className="login-logo">📋</div>
          <div>
            <div className="login-brand-name">CallLog Pro</div>
            <div className="login-brand-tag">IT Support Management</div>
          </div>
        </div>

        <div className="login-form-box">
          <div className="login-heading">Welcome back 👋</div>
          <div className="login-sub">Sign in to your workspace to continue</div>

          {err && (
            <div className="login-error">
              <span>⚠️</span> {err}
            </div>
          )}

          <form onSubmit={submit}>
            <div>
              <label className="form-label">Username or Email</label>
              <div className="login-input-wrap">
                <span className="login-input-icon">👤</span>
                <input
                  className="login-input"
                  type="text"
                  required
                  value={id}
                  onChange={e => setId(e.target.value)}
                  placeholder="admin or admin@company.com"
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="form-label">Password</label>
              <div className="login-input-wrap">
                <span className="login-input-icon">🔒</span>
                <input
                  className="login-input"
                  type={showPass ? 'text' : 'password'}
                  required
                  value={pass}
                  onChange={e => setPass(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  style={{ paddingRight: 46 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 16 }}
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button className="login-btn" type="submit" disabled={loading}>
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                  Signing in...
                </span>
              ) : 'Sign In →'}
            </button>
          </form>

          <div style={{ marginTop: 22, padding: 14, background: '#eef2ff', borderRadius: 13, border: '1px solid #e0e7ff' }}>
            <div style={{ fontSize: 10.5, color: '#6366f1', fontWeight: 800, marginBottom: 7, textTransform: 'uppercase', letterSpacing: '.7px' }}>Demo Credentials</div>
            <div style={{ fontSize: 12.5, color: '#64748b' }}>Admin: <span style={{ color: '#4f46e5', fontWeight: 700 }}>admin</span> / <span style={{ color: '#4f46e5', fontWeight: 700 }}>Admin@123</span></div>
            <div style={{ fontSize: 12.5, color: '#64748b', marginTop: 4 }}>User: <span style={{ color: '#4f46e5', fontWeight: 700 }}>aman</span> / <span style={{ color: '#4f46e5', fontWeight: 700 }}>User@123</span></div>
          </div>
        </div>
      </div>

      {/* Right — gradient showcase */}
      <div className="login-right">
        <span className="orb o1" />
        <span className="orb o2" />
        <span className="orb o3" />
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1, maxWidth: 460 }}>
          <div style={{ fontSize: 64, marginBottom: 22 }}>📊</div>
          <h2 style={{ fontSize: 30, fontWeight: 800, color: '#fff', marginBottom: 14, letterSpacing: '-.6px' }}>
            Track Every Call,<br />Resolve Faster.
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,.85)', lineHeight: 1.75, marginBottom: 34 }}>
            Manage IT support calls, track issues, monitor resolutions and generate reports — all in one beautiful workspace.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
            {FEATURES.map(f => (
              <div key={f.label} className="login-feature">
                <div className="f-icon">{f.icon}</div>
                <div className="f-label">{f.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;