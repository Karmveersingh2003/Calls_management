import React, { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [recentAdmin, setRecentAdmin] = useState([]);
  const [recentGuest, setRecentGuest] = useState([]);

  useEffect(() => {
    api.get('/dashboard/stats').then(res => setStats(res.data.data)).catch(() => {});
    api.get('/admin-calls').then(res => setRecentAdmin(res.data.data.slice(0, 5))).catch(() => {});
    api.get('/guest-calls').then(res => setRecentGuest(res.data.data.slice(0, 5))).catch(() => {});
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  const STATS = stats ? [
    { label: 'Total Admin Calls', value: stats.totalAdminCalls, icon: '🖥️', color: 'blue' },
    { label: 'Total Guest Calls', value: stats.totalGuestCalls, icon: '🏨', color: 'purple' },
    { label: 'Pending Calls', value: stats.pendingCalls, icon: '⏳', color: 'yellow' },
    { label: 'Completed Calls', value: stats.completedCalls, icon: '✅', color: 'green' },
    { label: 'Total Calls', value: stats.todayTotalCalls, icon: '📊', color: 'red' },
  ] : [];

  const resolved = (stats?.completedCalls || 0);
  const pending = (stats?.pendingCalls || 0);
  const totalTracked = resolved + pending;
  const pct = totalTracked > 0 ? Math.round((resolved / totalTracked) * 100) : 0;
  const doneAngle = totalTracked > 0 ? (resolved / totalTracked) * 360 : 0;

  return (
    <div>
      {/* ── HERO ── */}
      <div className="dash-hero">
        <div className="dash-hero-left">
          <div className="dash-hero-chip">📅 {today}</div>
          <h1>{greeting}, {user?.name?.split(' ')[0]} 👋</h1>
          <p>Here's what's happening in your workspace today.</p>
        </div>
        <div className="dash-hero-right">
          <Link to="/admin-calls" className="hero-quick">
            <span className="hq-icon">➕</span>
            <span className="hq-label">Admin Call</span>
          </Link>
          <Link to="/guest-calls" className="hero-quick">
            <span className="hq-icon">🏨</span>
            <span className="hq-label">Guest Call</span>
          </Link>
          <Link to="/import-export" className="hero-quick">
            <span className="hq-icon">📁</span>
            <span className="hq-label">Import / Export</span>
          </Link>
        </div>
      </div>
      {/* ── STAT CARDS ── */}
      {!stats ? (
        <div className="card" style={{ textAlign: 'center', padding: 44, color: '#64748b' }}>
          <span style={{ display: 'inline-block', width: 22, height: 22, border: '3px solid #e2e8f0', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
          <div style={{ marginTop: 12, fontSize: 13 }}>Loading statistics…</div>
        </div>
      ) : (
        <>
          <div className="stat-grid">
            {STATS.map(s => (
              <div key={s.label} className={`stat-card ${s.color}`}>
                <div className={`stat-icon ${s.color}`}>{s.icon}</div>
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {/* ── COMPLETION DONUT ── */}
          <div className="donut-card">
            <div
              className="donut"
              style={{ background: `conic-gradient(#6366f1 0deg ${doneAngle}deg, #e2e8f0 ${doneAngle}deg 360deg)` }}
            >
              <div className="donut-center">
                <div className="dv">{pct}%</div>
                <div className="dl">Done</div>
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div className="donut-title">Resolution Overview</div>
              <div className="donut-sub">{totalTracked} tracked call{totalTracked === 1 ? '' : 's'} across admin and guest workspaces.</div>
              <div className="donut-legend">
                <div className="legend-row"><span className="legend-dot" style={{ background: '#6366f1' }} /> {resolved} completed ({pct}%)</div>
                <div className="legend-row"><span className="legend-dot" style={{ background: '#e2e8f0' }} /> {pending} pending ({100 - pct}%)</div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── RECENT TABLES ── */}
      <div className="recent-grid">
        <div className="recent-table-card">
          <div className="recent-table-header">
            <span className="recent-table-title">🖥️ Recent Admin Calls</span>
            <Link to="/admin-calls" className="view-all-link">View all →</Link>
          </div>
          <table>
            <thead>
              <tr><th>Location</th><th>Issue</th><th>Status</th></tr>
            </thead>
            <tbody>
              {recentAdmin.length === 0 ? (
                <tr><td colSpan={3} className="table-empty">No records yet</td></tr>
              ) : recentAdmin.map(c => (
                <tr key={c._id}>
                  <td style={{ fontWeight: 600, color: '#1e293b' }}>{c.location}</td>
                  <td style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.issue}</td>
                  <td><span className={`badge badge-${c.status}`}>{c.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="recent-table-card">
          <div className="recent-table-header">
            <span className="recent-table-title">🏨 Recent Guest Calls</span>
            <Link to="/guest-calls" className="view-all-link">View all →</Link>
          </div>
          <table>
            <thead>
              <tr><th>Room</th><th>Issue</th><th>By Who</th></tr>
            </thead>
            <tbody>
              {recentGuest.length === 0 ? (
                <tr><td colSpan={3} className="table-empty">No records yet</td></tr>
              ) : recentGuest.map(c => (
                <tr key={c._id}>
                  <td style={{ fontWeight: 600, color: '#1e293b' }}>{c.roomNo}</td>
                  <td style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.issue}</td>
                  <td>{c.byWho}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;