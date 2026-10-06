import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

const TYPES = [
  { key: 'byWho', label: 'By Who', icon: '👤' },
  { key: 'location', label: 'Location', icon: '📍' },
  { key: 'issue', label: 'Issue', icon: '⚠️' },
  { key: 'solution', label: 'Solution', icon: '✅' },
  { key: 'guestIssue', label: 'Guest Issue', icon: '🏨' },
  { key: 'guestCategory', label: 'Guest Category', icon: '📂' },
];

const MasterData = () => {
  const [active, setActive] = useState('byWho');
  const [lists, setLists] = useState({});
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  const loadAll = async () => {
    const promises = TYPES.map(t =>
      api.get(`/masters?type=${t.key}`).then(res => {
        setLists(prev => ({ ...prev, [t.key]: res.data.data || [] }));
      }).catch(() => {
        setLists(prev => ({ ...prev, [t.key]: [] }));
      })
    );
    await Promise.all(promises);
  };

  useEffect(() => { loadAll(); }, []);

  const confirmAdd = async () => {
    const name = newName.trim();
    if (!name || busy) return;
    setBusy(true);
    try {
      const res = await api.post('/masters', { type: active, name });
      const created = res.data.data;
      setLists(prev => ({
        ...prev,
        [active]: [...(prev[active] || []), created].sort((a, b) => a.name.localeCompare(b.name))
      }));
      setNewName('');
      setAdding(false);
      toast(`"${created.name}" added`);
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to add', 'error');
    } finally {
      setBusy(false);
    }
  };

  const deleteItem = async (item) => {
    if (!window.confirm(`Delete "${item.name}"?`)) return;
    setBusy(true);
    try {
      await api.delete('/masters/' + item._id);
      setLists(prev => ({
        ...prev,
        [active]: (prev[active] || []).filter(i => i._id !== item._id)
      }));
      toast(`"${item.name}" deleted`, 'warning');
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to delete', 'error');
    } finally {
      setBusy(false);
    }
  };

  const current = lists[active] || [];

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Master Data</div>
          <div className="page-subtitle">Manage dropdown values for calls</div>
        </div>
      </div>

      <div className="card master-data-card">
        <div className="master-tabs" role="tablist" aria-label="Master data types">
          {TYPES.map(t => (
            <button
              key={t.key}
              className={`master-tab${active === t.key ? ' active' : ''}`}
              role="tab"
              aria-selected={active === t.key}
              onClick={() => { setActive(t.key); setAdding(false); setNewName(''); }}
            >
              <span>{t.icon}</span>
              <span className="master-tab-label">{t.label}</span>
            </button>
          ))}
        </div>

        <div className="master-panel" role="tabpanel">
          <div style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
              {TYPES.find(t => t.key === active)?.label} Values
            </h3>
            <span style={{ fontSize: 12, color: '#64748b' }}>({current.length})</span>
          </div>

          {adding ? (
            <div className="master-add-form">
              <input
                autoFocus
                aria-label={`New ${TYPES.find(t => t.key === active)?.label} name`}
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') { e.preventDefault(); confirmAdd(); }
                  if (e.key === 'Escape') { setAdding(false); setNewName(''); }
                }}
                placeholder={`Enter ${TYPES.find(t => t.key === active)?.label} name`}
                maxLength={120}
              />
              <button className="btn btn-primary btn-sm" onClick={confirmAdd} disabled={busy || !newName.trim()}>Save</button>
              <button className="btn btn-secondary btn-sm" onClick={() => { setAdding(false); setNewName(''); }} disabled={busy}>Cancel</button>
            </div>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={() => setAdding(true)} style={{ marginBottom: 16 }}>
              ＋ Add New
            </button>
          )}

          <div className="master-list">
            {current.length === 0 ? (
              <div className="master-empty">
                No entries yet. Click "+ Add New" to create one.
              </div>
            ) : (
              current.map(item => (
                <div key={item._id} className="master-item">
                  <span className="master-item-name">{item.name}</span>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => deleteItem(item)}
                    disabled={busy}
                    title={`Delete ${item.name}`}
                    aria-label={`Delete ${item.name}`}
                  >🗑️ Delete</button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MasterData;
