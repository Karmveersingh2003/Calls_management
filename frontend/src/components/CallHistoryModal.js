import React, { useEffect, useState } from 'react';
import api from '../services/api';

const ACTION_LABELS = {
  CREATE: 'Call created',
  UPDATE: 'Call updated',
  DELETE: 'Call deleted',
};

const CallHistoryModal = ({ endpoint, callId, title, onClose }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let current = true;
    api.get(`${endpoint}/${callId}/history`)
      .then(res => { if (current) setHistory(res.data.data || []); })
      .catch(() => { if (current) setError('Could not load call history.'); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [endpoint, callId]);

  return (
    <div className="modal-overlay history-overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <section className="modal-content history-modal" role="dialog" aria-modal="true" aria-labelledby="call-history-title">
        <div className="modal-header history-modal-header">
          <div>
            <h2 className="modal-title" id="call-history-title">Call History</h2>
            <div className="history-subtitle">{title}</div>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close call history">✕</button>
        </div>
        <div className="history-list" aria-live="polite">
          {loading ? (
            <div className="history-message">Loading history...</div>
          ) : error ? (
            <div className="history-message history-error">{error}</div>
          ) : history.length === 0 ? (
            <div className="history-message">No history is available for this call.</div>
          ) : history.map((event, index) => (
            <article className="history-event" key={`${event.createdAt}-${event.action}-${index}`}>
              <div className="history-event-heading">
                <div className="history-event-actor">
                  <strong>{event.actorName}</strong>
                  <span className={`history-action history-action-${event.action.toLowerCase()}`}>
                    {ACTION_LABELS[event.action] || event.action}
                  </span>
                </div>
                <time dateTime={event.createdAt}>{new Date(event.createdAt).toLocaleString()}</time>
              </div>
              {event.metadata?.summary && <p className="history-summary">{event.metadata.summary}</p>}
              {event.metadata?.changes?.length > 0 && (
                <div className="history-changes">
                  {event.metadata.changes.map((change, changeIndex) => (
                    <div className="history-change" key={`${change.field}-${changeIndex}`}>
                      <strong>{change.field.replace(/([A-Z])/g, ' $1')}</strong>
                      <span><del>{change.from || '(empty)'}</del><span aria-hidden="true"> → </span><ins>{change.to || '(empty)'}</ins></span>
                    </div>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

export default CallHistoryModal;