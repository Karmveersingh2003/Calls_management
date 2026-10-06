import React, { useEffect, useState, useRef } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import MasterSelect from '../components/MasterSelect';
import CallHistoryModal from '../components/CallHistoryModal';

const today = () => new Date().toISOString().slice(0, 10);
const nowTime = () => new Date().toTimeString().slice(0, 5);
const plusFive = (t) => {
  const [h, m] = t.split(':').map(Number);
  const d = new Date(); d.setHours(h, m + 5);
  return d.toTimeString().slice(0, 5);
};
const emptyForm = () => {
  const t = nowTime();
  return { location: '', issue: '', solution: '', startDate: today(), endDate: today(), timeStart: t, timeEnd: plusFive(t), category: 'hardware', status: 'done' };
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

const AdminCalls = () => {
  const [calls, setCalls] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [historyCall, setHistoryCall] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const { toast } = useToast();

  const issueSuggestions = [...new Set(calls.map(c => c.issue).filter(Boolean))];
  const solutionSuggestions = [...new Set(calls.map(c => c.solution).filter(Boolean))];

  const load = () => api.get('/admin-calls').then(res => setCalls(res.data.data));
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm(emptyForm()); setOpen(true); };
  const openEdit = (c) => {
    setEditing(c._id);
    setForm({ location: c.location || '', issue: c.issue || '', solution: c.solution || '', startDate: c.startDate ? c.startDate.slice(0, 10) : today(), endDate: c.endDate ? c.endDate.slice(0, 10) : today(), timeStart: c.timeStart || nowTime(), timeEnd: c.timeEnd || plusFive(c.timeStart || nowTime()), category: c.category || 'hardware', status: c.status || 'done' });
    setOpen(true);
  };

  const set = (k, v) => setForm(f => { const n = { ...f, [k]: v }; if (k === 'timeStart') n.timeEnd = plusFive(v); return n; });

  const save = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, locationName: form.location };
      if (editing) { await api.put(`/admin-calls/${editing}`, payload); toast('Admin call updated successfully'); }
      else { await api.post('/admin-calls', payload); toast('Admin call created successfully'); }
      setOpen(false); load();
    } catch { toast('Failed to save record', 'error'); }
  };

  const remove = async (id) => {
    if (window.confirm('Delete this record?')) {
      try { await api.delete('/admin-calls/' + id); toast('Record deleted', 'warning'); load(); }
      catch { toast('Failed to delete', 'error'); }
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Admin Calls</div>
          <div className="page-subtitle">{calls.length} records total</div>
        </div>
        <button className="btn btn-primary" onClick={openNew}>＋ New Call</button>
      </div>

      <div className="table-container call-table-container">
        {calls.length === 0 ? (
          <div className="table-empty">No admin calls yet. Click "+ New Call" to add one.</div>
        ) : (
          <table className="call-record-table admin-call-table">
            <thead>
              <tr>
                <th>#</th><th>Location</th><th>Issue</th><th>Solution</th>
                <th>Start Date</th><th>End Date</th><th>Time Start</th><th>Time End</th>
                <th>Category</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {calls.map((c, i) => (
                <tr key={c._id}>
                  <td style={{ color: '#475569', fontWeight: 600 }}>{i + 1}</td>
                  <td style={{ fontWeight: 600, color: '#1e293b' }}>{c.location}</td>
                  <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.issue}</td>
                  <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.solution}</td>
                  <td>{c.startDate ? c.startDate.slice(0, 10) : '-'}</td>
                  <td>{c.endDate ? c.endDate.slice(0, 10) : '-'}</td>
                  <td>{c.timeStart}</td>
                  <td>{c.timeEnd}</td>
                  <td><span className={`badge badge-${c.category}`}>{c.category}</span></td>
                  <td><span className={`badge badge-${c.status}`}>{c.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(c)}>✏️ Edit</button>
                      <button className="btn btn-secondary btn-sm" onClick={() => setHistoryCall(c)} title="View call history" aria-label={`View history for ${c.location} call`}>🕘 History</button>
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
              <span className="modal-title">{editing ? '✏️ Edit Admin Call' : '＋ New Admin Call'}</span>
              <button className="modal-close" onClick={() => setOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
              <form onSubmit={save}>
                <MasterSelect
                  type="location"
                  label="Location"
                  required
                  value={form.location}
                  onChange={v => set('location', v)}
                  placeholder="Select Location"
                />
                <div className="form-group">
                  <label className="form-label">Issue</label>
                  <SuggestInput required value={form.issue} onChange={v => set('issue', v)} suggestions={issueSuggestions} placeholder="Type or pick from previous issues" />
                </div>
                <div className="form-group">
                  <label className="form-label">Solution</label>
                  <SuggestInput required value={form.solution} onChange={v => set('solution', v)} suggestions={solutionSuggestions} placeholder="Type or pick from previous solutions" />
                </div>
                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Start Date</label>
                    <input type="date" required value={form.startDate} onChange={e => set('startDate', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Date</label>
                    <input type="date" required value={form.endDate} onChange={e => set('endDate', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Time Start</label>
                    <input type="time" required value={form.timeStart} onChange={e => set('timeStart', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Time End</label>
                    <input type="time" required value={form.timeEnd} onChange={e => set('timeEnd', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select value={form.category} onChange={e => set('category', e.target.value)}>
                      <option value="hardware">Hardware</option>
                      <option value="software">Software</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select value={form.status} onChange={e => set('status', e.target.value)}>
                      <option value="pending">Pending</option>
                      <option value="done">Done</option>
                    </select>
                  </div>
                </div>
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
          endpoint="/admin-calls"
          callId={historyCall._id}
          title={`${historyCall.location || 'Admin call'} history`}
          onClose={() => setHistoryCall(null)}
        />
      )}
    </div>
  );
};

export default AdminCalls;
