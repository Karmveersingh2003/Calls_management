import React, { useContext, useState, useRef, useEffect, useCallback } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const NAV = [
  { to: '/dashboard', icon: '📊', label: 'Dashboard' },
  { to: '/admin-calls', icon: '🖥️', label: 'Admin Calls' },
  { to: '/guest-calls', icon: '🏨', label: 'Guest Calls' },
  { to: '/master-data', icon: '🗂️', label: 'Master Data' },
  { to: '/import-export', icon: '📁', label: 'Import / Export' },
];
const ADMIN_NAV = { to: '/users', icon: '👥', label: 'User Management' };

const PAGE_TITLES = {
  '/dashboard': { title: 'Dashboard', sub: 'Overview of your workspace' },
  '/admin-calls': { title: 'Admin Calls', sub: 'Manage IT support calls' },
  '/guest-calls': { title: 'Guest Calls', sub: 'Manage guest support calls' },
  '/master-data': { title: 'Master Data', sub: 'Manage dropdown values for calls' },
  '/import-export': { title: 'Import / Export', sub: 'Bulk data operations' },
  '/users': { title: 'User Management', sub: 'Manage team members' },
};

const AppLayout = () => {
  const { user, isImpersonating, exitSwitch, logout, saveBranding } = useContext(AuthContext);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [brandingOpen, setBrandingOpen] = useState(false);
  const [brandName, setBrandName] = useState('');
  const [brandLogo, setBrandLogo] = useState('');
  const [brandSaving, setBrandSaving] = useState(false);
  const profileRef = useRef();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const page = PAGE_TITLES[location.pathname] || { title: 'CallLog Pro', sub: '' };
  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'U';

  /* Single toggle used by hamburger + edge handle:
     mobile → slide drawer open/close, desktop → collapse/expand.
     Both states always have a visible way back. */
  const toggleSidebar = useCallback(() => {
    if (window.innerWidth <= 900) setMobileOpen(o => !o);
    else setCollapsed(c => !c);
  }, []);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  useEffect(() => {
    const handler = (e) => { if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false); };
    const esc = (e) => { if (e.key === 'Escape') { setProfileOpen(false); setMobileOpen(false); } };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', handler); document.removeEventListener('keydown', esc); };
  }, []);

  useEffect(() => { setMobileOpen(false); setProfileOpen(false); }, [location.pathname]);

  /* Keep collapsed state in sync when crossing the mobile breakpoint */
  useEffect(() => {
    const onResize = () => { if (window.innerWidth > 900) setMobileOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const go = (to) => { navigate(to); setProfileOpen(false); };

  const openBranding = () => {
    setBrandName(user?.companyName || '');
    setBrandLogo(user?.logo || '');
    setProfileOpen(false);
    setBrandingOpen(true);
  };

  const onLogoFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/^image\/(png|jpe?g|gif)$/.test(file.type)) { toast('Logo must be PNG, JPG or GIF', 'error'); return; }
    if (file.size > 2.5 * 1024 * 1024) { toast('Logo must be under 2.5 MB', 'error'); return; }
    const reader = new FileReader();
    reader.onload = () => setBrandLogo(String(reader.result));
    reader.readAsDataURL(file);
  };

  const saveBrand = async (e) => {
    e.preventDefault();
    setBrandSaving(true);
    try {
      await saveBranding({ companyName: brandName, logo: brandLogo });
      toast('Branding saved — it will appear on your Excel exports');
      setBrandingOpen(false);
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to save branding', 'error');
    } finally {
      setBrandSaving(false);
    }
  };

  return (
    <div className="layout-container">
      <div className={`sidebar-overlay${mobileOpen ? ' visible' : ''}`} onClick={closeMobile} />

      <aside className={`sidebar${collapsed ? ' collapsed' : ''}${mobileOpen ? ' mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">📋</div>
          <span className="sidebar-title">CallLog Pro</span>
        </div>

        {/* Always-visible edge handle: works even when collapsed (desktop only) */}
        {/* <div className="sidebar-collapse-hint" onClick={toggleSidebar} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          {collapsed ? '»' : '«'}
        </div> */}

        <div className="nav-section">Main Menu</div>
        <ul className="nav-links">
          {NAV.map(n => (
            <li key={n.to}>
              <NavLink to={n.to} title={collapsed ? n.label : ''}>
                <span className="nav-icon">{n.icon}</span>
                <span className="nav-label">{n.label}</span>
              </NavLink>
            </li>
          ))}
          {user?.role === 'admin' && (
            <li>
              <NavLink to={ADMIN_NAV.to} title={collapsed ? ADMIN_NAV.label : ''}>
                <span className="nav-icon">{ADMIN_NAV.icon}</span>
                <span className="nav-label">{ADMIN_NAV.label}</span>
              </NavLink>
            </li>
          )}
        </ul>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{initials}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.name}</div>
              <div className="sidebar-user-role">{user?.role}</div>
            </div>
          </div>
          <div className="sidebar-credit">
            <span className="sidebar-credit-label">Made by</span>
            <strong>Karamveer Singh</strong>
            <div className="sidebar-credit-links">
              <a href="https://example.com" target="_blank" rel="noreferrer">Website</a>
              <a href="tel:+910000000000">+91 00000 00000</a>
            </div>
          </div>
        </div>
      </aside>
      {/* Main */}
      <div className={`main-wrapper${collapsed ? ' sidebar-collapsed' : ''}`}>
        {isImpersonating && (
          <div className="impersonation-banner">
            <span>👁️ Viewing workspace of <strong>{user?.name}</strong></span>
            <button className="btn btn-secondary btn-sm" onClick={exitSwitch}>Exit View</button>
          </div>
        )}

        <header className="topbar">
          <div className="topbar-left">
            {/* Hamburger — ALWAYS visible: opens/closes sidebar on mobile, collapses/expands on desktop */}
            <button
              className={`hamburger-btn${mobileOpen ? ' open' : ''}`}
              onClick={toggleSidebar}
              aria-label="Toggle sidebar"
              title="Toggle sidebar"
            >
              <span className="bar" />
            </button>
            <div>
              <div className="topbar-title">{page.title}</div>
              {page.sub && <div className="topbar-subtitle">{page.sub}</div>}
            </div>
          </div>

          <div className="topbar-right">
            <div style={{ position: 'relative' }} ref={profileRef}>
              <button className="profile-btn" onClick={() => setProfileOpen(o => !o)}>
                <div className="profile-avatar">{initials}</div>
                <div style={{ textAlign: 'left' }}>
                  <div className="profile-name">{user?.name}</div>
                  <div className="profile-role">{user?.role}</div>
                </div>
                <span className={`profile-chevron${profileOpen ? ' up' : ''}`}>▼</span>
              </button>

              {profileOpen && (
                <div className="profile-dropdown">
                  <div className="profile-dropdown-header">
                    <div className="profile-avatar">{initials}</div>
                    <div style={{ minWidth: 0 }}>
                      <div className="profile-dropdown-name">{user?.name}</div>
                      <div className="profile-dropdown-email">{user?.email || user?.username}</div>
                    </div>
                  </div>
                  <button className="dropdown-item" onClick={() => go('/dashboard')}>
                    <span>📊</span> Dashboard
                  </button>
                  <button className="dropdown-item" onClick={() => { setProfileOpen(false); }}>
                    <span>👤</span> My Profile
                  </button>
                  <button className="dropdown-item" onClick={() => { setProfileOpen(false); }}>
                    <span>🔒</span> Change Password
                  </button>
                  <button className="dropdown-item" onClick={openBranding}>
                    <span>🏢</span> Company Branding
                  </button>
                  {user?.role === 'admin' && (
                    <button className="dropdown-item" onClick={() => go('/users')}>
                      <span>👥</span> User Management
                    </button>
                  )}
                  <div className="dropdown-divider" />
                  <button className="dropdown-item danger" onClick={logout}>
                    <span>🚪</span> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="content-area">
          <Outlet />
        </main>
      </div>

      {/* ── COMPANY BRANDING MODAL (name + logo used in Excel exports) ── */}
      {brandingOpen && (
        <div className="modal-overlay" onClick={() => setBrandingOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">🏢 Company Branding</span>
              <button className="modal-close" onClick={() => setBrandingOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
              <form onSubmit={saveBrand}>
                <div className="form-group">
                  <label className="form-label">Hotel / Company Name</label>
                  <input value={brandName} onChange={e => setBrandName(e.target.value)} placeholder="e.g. IBIS Bengaluru Hebbal" maxLength={120} />
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>Shown as “Hotel Name : …” in exported Excel files.</div>
                </div>
                <div className="form-group">
                  <label className="form-label">Logo (PNG / JPG / GIF, max 2.5 MB)</label>
                  <input type="file" accept="image/png,image/jpeg,image/gif" onChange={onLogoFile} />
                  {brandLogo && (
                    <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 14 }}>
                      <img src={brandLogo} alt="Logo preview" style={{ maxWidth: 120, maxHeight: 60, objectFit: 'contain', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 6 }} />
                      <button type="button" className="btn btn-danger btn-sm" onClick={() => setBrandLogo('')}>Remove</button>
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>Appears top-left in exported Excel files (like the sample).</div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setBrandingOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={brandSaving}>{brandSaving ? 'Saving…' : 'Save Branding'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      </div>
  );
};

export default AppLayout;