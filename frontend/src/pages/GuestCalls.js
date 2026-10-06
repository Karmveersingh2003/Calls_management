import React, { useEffect, useState, useRef } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import MasterSelect from '../components/MasterSelect';
import CallHistoryModal from '../components/CallHistoryModal';

const nowTime = () => new Date().toTimeString().slice(0, 5);
const plusFive = (t) => {
  const [h, m] = t.split(':').map(Number);
  const d = new Date(); d.setHours(h, m + 5);
  return d.toTimeString().slice(0, 5);
};
const emptyForm = () => {
  const t = nowTime();
  return { roomNo: '', issue: '', solution: '', timeStart: t, timeEnd: plusFive(t), category: 'WiFi', byWho: '' };
};
// Map free-text category to a known badge class (falls back to wifi)
const catBadge = (cat) => {
  const c = (cat || '').toLowerCase();
  return `badge badge-${['wifi', 'hardware', 'software'].includes(c) ? c : 'wifi'}`;
};

const SuggestInput = ({ value, onChange, suggestions, placeholder, required }) => {
  const [show, setShow] = useState(false);
  const ref = useRef();
  const filtered = [...new Set(suggestions.filter(s => s && s.toLowerCase().includes(value.toLowerCase()) && s !== value))];
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setShow(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <input required={required} value={value} placeholder={placeholder}
        onChange={e => { onChange(e.target.value); setShow(true); }}
        onFocus={() => setShow(true)} />
      {show && filtered.length > 0 && (
        <div className="suggest-list">
          {filtered.map((s, i) => (
            <div key={i} className="suggest-item" onMouseDown={() => { onChange(s); setShow(false); }}>{s}</div>
          ))}
        </div>
      )}
    </div>
  );
};

const GuestCalls = () => {
  const [calls, setCalls] = useState([]);
  const [issues, setIssues] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [historyCall, setHistoryCall] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const { toast } = useToast();

  const solutionSuggestions = [...new Set(calls.map(c => c.solution).filter(Boolean))];

  const load = () => api.get('/guest-calls').then(res => setCalls(res.data.data));
  useEffect(() => {
    load();
    api.get('/masters?type=issue').then(res => setIssues(res.data.data)).catch(() => {});
  }, []);

  const openNew = () => { setEditing(null); setForm(emptyForm()); setOpen(true); };
  const openEdit = (c) => {
    setEditing(c._id);
    setForm({ roomNo: c.roomNo || '', issue: c.issue || '', solution: c.solution || '', timeStart: c.timeStart || nowTime(), timeEnd: c.timeEnd || plusFive(c.timeStart || nowTime()), category: c.category || 'WiFi', byWho: c.byWho || '' });
    setOpen(true);
  };

  const set = (k, v) => setForm(f => { const n = { ...f, [k]: v }; if (k === 'timeStart') n.timeEnd = plusFive(v); return n; });

  const save = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await api.put(`/guest-calls/${editing}`, form); toast('Guest call updated successfully'); }
      else { await api.post('/guest-calls', form); toast('Guest call created successfully'); }
      setOpen(false); load();
    } catch { toast('Failed to save record', 'error'); }
  };

  const remove = async (id) => {
    if (window.confirm('Delete this record?')) {
      try { await api.delete('/guest-calls/' + id); toast('Record deleted', 'warning'); load(); }
      catch { toast('Failed to delete', 'error'); }
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Guest Calls</div>
          <div className="page-subtitle">{calls.length} records total</div>
        </div>
        <button className="btn btn-primary" onClick={openNew}>＋ New Guest Call</button>
      </div>

      <div className="table-container call-table-container">
        {calls.length === 0 ? (
          <div className="table-empty">No guest calls yet. Click "+ New Guest Call" to add one.</div>
        ) : (
          <table className="call-record-table guest-call-table">
            <thead>
              <tr>
                <th>#</th><th>Room No</th><th>Issue</th><th>Solution</th>
                <th>Time Start</th><th>Time End</th><th>Category</th><th>By Who</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {calls.map((c, i) => (
                <tr key={c._id}>
                  <td style={{ color: '#475569', fontWeight: 600 }}>{i + 1}</td>
                  <td style={{ fontWeight: 600, color: '#1e293b' }}>{c.roomNo}</td>
                  <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.issue}</td>
                  <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.solution}</td>
                  <td>{c.timeStart}</td>
                  <td>{c.timeEnd}</td>
                  <td><span className={catBadge(c.category)}>{c.category}</span></td>
                  <td>{c.byWho}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(c)}>✏️ Edit</button>
                      <button className="btn btn-secondary btn-sm" onClick={() => setHistoryCall(c)} title="View call history" aria-label={`View history for room ${c.roomNo} call`}>🕘 History</button>
                      <button className="btn btn-danger btn-sm" onClick={() => remove(c._id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {open && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <span className="modal-title">{editing ? '✏️ Edit Guest Call' : '＋ New Guest Call'}</span>
              <button className="modal-close" onClick={() => setOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
              <form onSubmit={save}>
                <div className="form-group">
                  <label className="form-label">Room No</label>
                  <input required value={form.roomNo} onChange={e => set('roomNo', e.target.value)} placeholder="e.g. 101" />
                </div>
                <div className="form-group">
                  <label className="form-label">Issue</label>
                  {issues.length > 0 ? (
                    <select required value={form.issue} onChange={e => set('issue', e.target.value)}>
                      <option value="">Select Issue</option>
                      {issues.map(i => <option key={i._id} value={i.name}>{i.name}</option>)}
                    </select>
                  ) : (
                    <input required value={form.issue} onChange={e => set('issue', e.target.value)} placeholder="Enter issue" />
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Solution</label>
                  <SuggestInput required value={form.solution} onChange={v => set('solution', v)} suggestions={solutionSuggestions} placeholder="Type or pick from previous solutions" />
                </div>
                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Time Start</label>
                    <input type="time" required value={form.timeStart} onChange={e => set('timeStart', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Time End</label>
                    <input type="time" required value={form.timeEnd} onChange={e => set('timeEnd', e.target.value)} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <input value={form.category} onChange={e => set('category', e.target.value)} placeholder="WiFi" />
                </div>
                <MasterSelect
                  type="byWho"
                  label="By Who"
                  required
                  value={form.byWho}
                  onChange={v => set('byWho', v)}
                  placeholder="Select"
                />
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Save'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {historyCall && (
        <CallHistoryModal
          endpoint="/guest-calls"
          callId={historyCall._id}
          title={`Room ${historyCall.roomNo || ''} history`}
          onClose={() => setHistoryCall(null)}
        />
      )}
    </div>
  );
};

export default GuestCalls;
