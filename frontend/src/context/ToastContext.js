import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

const ICONS = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
const TITLES = { success: 'Success', error: 'Error', info: 'Info', warning: 'Warning' };

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((message, type = 'success', title) => {
    const id = Date.now() + Math.random();
    setToasts(p => [...p, { id, message, type, title: title || TITLES[type] }]);
    setTimeout(() => {
      setToasts(p => p.map(t => t.id === id ? { ...t, removing: true } : t));
      setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 320);
    }, 3500);
  }, []);

  const remove = (id) => {
    setToasts(p => p.map(t => t.id === id ? { ...t, removing: true } : t));
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 320);
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}${t.removing ? ' removing' : ''}`} style={{ position: 'relative', overflow: 'hidden' }}>
            <span className="toast-icon">{ICONS[t.type]}</span>
            <div className="toast-body">
              <div className="toast-title">{t.title}</div>
              <div className="toast-msg">{t.message}</div>
            </div>
            <button className="toast-close" onClick={() => remove(t.id)}>✕</button>
            <div className="toast-progress" />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
