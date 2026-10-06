import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user')) || null);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (localStorage.getItem('token')) {
      api.get('/auth/me')
        .then(res => { setUser(res.data.user); setIsImpersonating(res.data.impersonated); })
        .catch(() => localStorage.clear())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (identifier, password) => {
    const res = await api.post('/auth/login', { identifier, password });
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    setIsImpersonating(false);
  };

  /* Persist company branding (name + logo) and refresh the cached user */
  const saveBranding = async (payload) => {
    const res = await api.put('/auth/me/branding', payload);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    window.location.href = '/login';
  };

  const switchUser = async (targetUserId) => {
    const res = await api.post('/auth/switch-user', { targetUserId });
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    setIsImpersonating(true);
  };

  const exitSwitch = async () => {
    const res = await api.post('/auth/exit-switch');
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    setIsImpersonating(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, isImpersonating, login, logout, switchUser, exitSwitch, saveBranding }}>
      {children}
    </AuthContext.Provider>
  );
};