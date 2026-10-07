import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const Login = () => {
  const [tab, setTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async (event) => {
    event.preventDefault();
    setMessage({ text: '', type: '' });
    setLoading(true);
    try {
      await login(identifier, password);
      navigate('/dashboard');
    } catch (error) {
      setMessage({ text: error.response?.data?.message || 'Unable to sign in. Check your details and try again.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (event) => {
    event.preventDefault();
    setMessage({ text: '', type: '' });
    setLoading(true);
    try {
      await api.post('/users/signup', { name, username, email, password: signupPassword });
      setMessage({ text: 'Your account is ready. Sign in to continue.', type: 'success' });
      setTab('login');
      setName('');
      setUsername('');
      setEmail('');
      setSignupPassword('');
    } catch (error) {
      setMessage({ text: error.response?.data?.message || 'Unable to create your account. Please try again.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (nextTab) => {
    setTab(nextTab);
    setMessage({ text: '', type: '' });
  };

  return (
    <main className="heritage-login">
      <section className="heritage-login-form" aria-label="Account sign in">
        <div className="login-form-inner">
          <a className="heritage-wordmark" href="/" aria-label="CallLog Pro home">
            <span className="heritage-wordmark-emblem" aria-hidden="true">क</span>
            <span>
              <strong>CallLog <span>Pro</span></strong>
              <small>Support, with a human touch</small>
            </span>
          </a>

          <div className="heritage-form-heading">
            <span className="heritage-eyebrow">YOUR WORKSPACE AWAITS</span>
            <h1>{tab === 'login' ? 'Welcome back' : 'Join the workspace'}</h1>
            <p>{tab === 'login' ? 'Sign in to continue where you left off.' : 'Create your account and get started.'}</p>
          </div>

          <div className="heritage-tabs" role="tablist" aria-label="Account options">
            <button type="button" role="tab" aria-selected={tab === 'login'} className={tab === 'login' ? 'active' : ''} onClick={() => switchTab('login')}>Sign in</button>
            <button type="button" role="tab" aria-selected={tab === 'signup'} className={tab === 'signup' ? 'active' : ''} onClick={() => switchTab('signup')}>Create account</button>
          </div>

          {message.text && (
            <div className={`heritage-message ${message.type}`} role="status">
              <span aria-hidden="true">{message.type === 'success' ? '✓' : '!'}</span>
              {message.text}
            </div>
          )}

          {tab === 'login' ? (
            <form className="heritage-auth-form" onSubmit={handleLogin}>
              <div className="heritage-field">
                <label htmlFor="login-identifier">Username or email</label>
                <input
                  id="login-identifier"
                  type="text"
                  autoComplete="username"
                  required
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  placeholder="Enter your username or email"
                />
              </div>
              <div className="heritage-field">
                <label htmlFor="login-password">Password</label>
                <div className="heritage-password-wrap">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                  />
                  <button type="button" className="heritage-password-toggle" onClick={() => setShowPassword((shown) => !shown)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              <button className="heritage-submit" type="submit" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign in to your workspace'}
                {!loading && <span aria-hidden="true">↗</span>}
              </button>
            </form>
          ) : (
            <form className="heritage-auth-form heritage-signup-form" onSubmit={handleSignup}>
              <div className="heritage-field">
                <label htmlFor="signup-name">Full name</label>
                <input id="signup-name" type="text" autoComplete="name" required value={name} onChange={(event) => setName(event.target.value)} placeholder="Your full name" />
              </div>
              <div className="heritage-field">
                <label htmlFor="signup-username">Username</label>
                <input id="signup-username" type="text" autoComplete="username" required value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Choose a username" />
              </div>
              <div className="heritage-field">
                <label htmlFor="signup-email">Email address</label>
                <input id="signup-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
              </div>
              <div className="heritage-field">
                <label htmlFor="signup-password">Password</label>
                <div className="heritage-password-wrap">
                  <input id="signup-password" type={showSignupPassword ? 'text' : 'password'} autoComplete="new-password" minLength="6" required value={signupPassword} onChange={(event) => setSignupPassword(event.target.value)} placeholder="At least 6 characters" />
                  <button type="button" className="heritage-password-toggle" onClick={() => setShowSignupPassword((shown) => !shown)} aria-label={showSignupPassword ? 'Hide password' : 'Show password'}>
                    {showSignupPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              <button className="heritage-submit" type="submit" disabled={loading}>
                {loading ? 'Creating account…' : 'Create your account'}
                {!loading && <span aria-hidden="true">↗</span>}
              </button>
              <p className="heritage-review-note">Your account will be reviewed by an administrator.</p>
            </form>
          )}

          <div className="heritage-mobile-credit">
            <span>Designed &amp; Developed by</span>
            <a href="https://karamveerportfolio.vercel.app/" target="_blank" rel="noreferrer">Karamveer Singh 🗡️</a>
          </div>
          <div className="heritage-form-footnote"><span aria-hidden="true">✦</span> A calmer way to keep every conversation in view</div>
        </div>
      </section>

      <aside className="heritage-login-art" aria-label="CallLog Pro welcome">
        <div className="heritage-art-grain" aria-hidden="true" />
        <div className="heritage-art-topline">
          <span className="heritage-art-brand"><span aria-hidden="true">क</span> CALLLOG PRO</span>
          <span>THE ART OF BEING THERE</span>
        </div>
        <div className="heritage-art-content">
          <div className="heritage-art-kicker"><span /> MADE FOR MEANINGFUL SUPPORT <span /></div>
          <h2>Care is in<br />the <em>details.</em></h2>
          <p>Thoughtfully bring every conversation, resolution and relationship into view.</p>
          <div className="heritage-art-rule"><span>✦</span></div>
          <div className="heritage-art-pillars">
            <div><span className="heritage-pillar-icon" aria-hidden="true">✧</span><span><strong>Every detail</strong><small>Kept in good hands</small></span></div>
            <div><span className="heritage-pillar-icon" aria-hidden="true">◈</span><span><strong>Clear insight</strong><small>Progress at a glance</small></span></div>
            <div><span className="heritage-pillar-icon" aria-hidden="true">❋</span><span><strong>One team</strong><small>Care, connected</small></span></div>
          </div>
        </div>

        <svg className="heritage-palace-art" viewBox="0 0 760 480" fill="none" aria-hidden="true">
          <circle cx="382" cy="275" r="164" fill="url(#desertSun)" />
          <circle cx="382" cy="275" r="146" stroke="#F0D49B" strokeOpacity=".28" />
          <circle cx="382" cy="275" r="133" stroke="#F0D49B" strokeOpacity=".14" strokeDasharray="2 8" />
          <path d="M0 420c112-36 191-10 282-32 112-27 188-5 260 4 74 9 143-3 218-27v115H0V420Z" fill="#321B22" fillOpacity=".48" />
          <path d="M28 480V328h38v-31h38v31h31v-84h48v84h25v-116h50v116h29v-78h43v78h25V252h47v76h32v-97h49v97h22v-131h49v131h28v-82h46v82h32v152H28Z" fill="url(#palace)" />
          <path d="M28 328h38m38 0h31m73 0h25m50 0h29m68 0h25m54 0h32m49 0h22m49 0h28m46 0h32" stroke="#F1D49C" strokeOpacity=".58" strokeWidth="2" />
          <path d="M136 480V381a35 35 0 0 1 70 0v99m176 0V376a43 43 0 0 1 86 0v104m149 0V382a35 35 0 0 1 70 0v98" stroke="#F1D49C" strokeOpacity=".65" strokeWidth="2.5" />
          <path d="M128 381h86m164-5h102m129 6h80" stroke="#F1D49C" strokeOpacity=".42" strokeWidth="2" />
          <path d="M24 297l23-31 23 31m33 0 24-32 24 32m52-32 28-41 28 41m54 0 24-31 24 31m71-16 25-33 25 33m35 0 24-34 24 34m47-50 27-36 27 36m26 0 23-31 23 31m28 0 24-33 24 33" stroke="#E8CA8B" strokeOpacity=".78" strokeWidth="2.5" />
          <path d="M382 250v-82m-13 13h26m-21-25h16m-32 85h48m-68 0h88" stroke="#E8CA8B" strokeOpacity=".58" strokeWidth="2" />
          <path d="M18 480h724M38 460h686" stroke="#E8CA8B" strokeOpacity=".38" strokeWidth="2" />
          <path d="M75 222h32m537-20h26M270 188h24m163 33h21m86-69h20" stroke="#F5E4C1" strokeOpacity=".62" strokeLinecap="round" strokeWidth="2" />
          <defs>
            <linearGradient id="palace" x1="380" y1="140" x2="380" y2="480" gradientUnits="userSpaceOnUse">
              <stop stopColor="#C9845B" stopOpacity=".76" />
              <stop offset="1" stopColor="#522B2C" stopOpacity=".76" />
            </linearGradient>
            <radialGradient id="desertSun" cx="0" cy="0" r="1" gradientTransform="translate(382 275) rotate(90) scale(164)" gradientUnits="userSpaceOnUse">
              <stop stopColor="#D4A866" stopOpacity=".54" />
              <stop offset=".7" stopColor="#BE7953" stopOpacity=".26" />
              <stop offset="1" stopColor="#BD7956" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>

        <div className="heritage-credit">
          <div className="heritage-credit-mark" aria-hidden="true">KS</div>
          <div className="heritage-credit-copy">
            <span>CRAFTED WITH CARE BY</span>
            <a href="https://karamveerportfolio.vercel.app/" target="_blank" rel="noreferrer">Karamveer Singh <span aria-hidden="true">🗡️</span></a>
            <small>Product-minded developer · India</small>
            <a className="heritage-credit-phone" href="tel:+917014018057"><span aria-hidden="true">☎</span> +91 7014018057</a>
          </div>
          <span className="heritage-credit-year" aria-hidden="true">✦</span>
        </div>
        <div className="heritage-art-corner" aria-hidden="true">HANDCRAFTED FOR CONNECTION</div>
      </aside>
    </main>
  );
};

export default Login;
