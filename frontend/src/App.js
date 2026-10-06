import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminCalls from './pages/AdminCalls';
import GuestCalls from './pages/GuestCalls';
import MasterData from './pages/MasterData';
import UsersPage from './pages/UsersPage';
import ImportExport from './pages/ImportExport';
import './styles/App.css';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div>Loading workspace...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (requireAdmin && user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="admin-calls" element={<AdminCalls />} />
            <Route path="guest-calls" element={<GuestCalls />} />
            <Route path="master-data" element={<MasterData />} />
            <Route path="import-export" element={<ImportExport />} />
            <Route path="users" element={<ProtectedRoute requireAdmin={true}><UsersPage /></ProtectedRoute>} />
          </Route>
        </Routes>
      </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}