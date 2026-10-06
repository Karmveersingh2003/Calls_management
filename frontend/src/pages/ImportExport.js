import React, { useState } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

const iso = (d) => {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
const shift = (months = 0, days = 0) => {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  d.setDate(d.getDate() - days);
  return iso(d);
};

const RANGES = [
  { label: 'Last 1 Month', from: shift(1), to: iso(new Date()) },
  { label: 'Last 7 Days', from: shift(0, 7), to: iso(new Date()) },
  { label: 'Last 3 Months', from: shift(3), to: iso(new Date()) },
  { label: 'All Time', from: '', to: '' }
];

const ImportExport = () => {
  const { toast } = useToast();
  const [kind, setKind] = useState('admin');            // which dataset: admin | guest
  const [file, setFile] = useState(null);
  const [from, setFrom] = useState(RANGES[0].from);     // default: last 1 month
  const [to, setTo] = useState(RANGES[0].to);
  const [activeRange, setActiveRange] = useState(RANGES[0].label);

  const applyRange = (r) => { setFrom(r.from); setTo(r.to); setActiveRange(r.label); };
  const touchDate = () => setActiveRange('Custom');

  const upload = async (e) => {
    e.preventDefault();
    if (!file) return toast('Choose an Excel file first', 'warning');
    const data = new FormData();
    data.append('file', file);
    try {
      const res = await api.post(`/import-export/import-${kind}`, data);
      toast(res.data.message);
      setFile(null);
      e.target.reset();
    } catch (err) {
      toast(err.response?.data?.message || 'Import failed', 'error');
    }
  };

  const download = (url, name) => {
    api.get(url, { responseType: 'blob' }).then(res => {
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(new Blob([res.data]));
      link.download = name;
      link.click();
      window.URL.revokeObjectURL(link.href);
      toast(`${name} downloaded`);
    }).catch(() => toast('Download failed', 'error'));
  };

  const exportCalls = () => {
    if (from && to && from > to) return toast('From date must be before To date', 'error');
    const url = kind === 'admin' ? '/import-export/export-admin' : '/import-export/export-guest';
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const qs = params.toString();
    const range = (from || to) ? `_${from || 'start'}_to_${to || 'end'}` : '_AllTime';
    download(`${url}${qs ? '?' + qs : ''}`, `${kind === 'admin' ? 'AdminCalls' : 'GuestCalls'}_Export${range}.xlsx`);
  };

  const kindLabel = kind === 'admin' ? 'Admin Calls' : 'Guest Calls';

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Import & Export</div>
          <div className="page-subtitle">Excel samples, bulk upload and date-filtered export</div>
        </div>
      </div>

      <div className="import-export-grid">

        {/* ── EXPORT WITH DATE RANGE ── */}
        <div className="card import-export-export-card">
          <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>⬇ Export {kindLabel}</div>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 14 }}>
            Pick a quick range or choose from-date → to-date in the calendar.
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <button className={`btn btn-sm ${kind === 'admin' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setKind('admin')}>🖥️ Admin</button>
            <button className={`btn btn-sm ${kind === 'guest' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setKind('guest')}>🏨 Guest</button>
            <span style={{ width: 1, background: '#e2e8f0', margin: '0 4px' }} />
            {RANGES.map(r => (
              <button key={r.label} className={`btn btn-sm ${activeRange === r.label ? 'btn-primary' : 'btn-secondary'}`} onClick={() => applyRange(r)}>{r.label}</button>
            ))}
          </div>

          <div className="form-grid-2" style={{ maxWidth: 480 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">From Date</label>
              <input type="date" value={from} max={to || undefined} onChange={e => { setFrom(e.target.value); touchDate(); }} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">To Date</label>
              <input type="date" value={to} min={from || undefined} onChange={e => { setTo(e.target.value); touchDate(); }} />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 18, flexWrap: 'wrap' }}>
            <span className="badge badge-hardware">
              {from && to ? `${from} → ${to}` : (from ? `From ${from}` : (to ? `Until ${to}` : 'All time'))}
            </span>
            <div style={{ flex: 1 }} />
            <button className="btn btn-primary" onClick={exportCalls}>⬇ Export {kindLabel} ({activeRange})</button>
          </div>
        </div>

        {/* ── SAMPLE TEMPLATES ── */}
        <div className="card">
          <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>📄 Sample Templates</div>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 14 }}>
            Column layout matches the current fields exactly.
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={() => download('/import-export/admin-template', 'AdminSample.xlsx')}>🖥️ Admin Sample</button>
            <button className="btn btn-secondary" onClick={() => download('/import-export/guest-template', 'GuestSample.xlsx')}>🏨 Guest Sample</button>
          </div>
        </div>

        {/* ── BULK UPLOAD ── */}
        <div className="card">
          <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>⬆ Bulk Upload</div>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 14 }}>
            Upload into {kindLabel}. Headers must match the sample.
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <button className={`btn btn-sm ${kind === 'admin' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setKind('admin')}>🖥️ Admin</button>
            <button className={`btn btn-sm ${kind === 'guest' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setKind('guest')}>🏨 Guest</button>
          </div>
          <form onSubmit={upload}>
            <input type="file" accept=".xlsx, .xls" onChange={e => setFile(e.target.files[0])} />
            <div style={{ marginTop: 14 }}>
              <button className="btn btn-primary" disabled={!file}>⬆ Import into {kindLabel}</button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};
export default ImportExport;