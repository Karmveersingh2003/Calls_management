import React, { useEffect, useState, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const { switchUser } = useContext(AuthContext);
  const { toast } = useToast();
  const navigate = useNavigate();

  const load = () => api.get('/users').then(res => setUsers(res.data.data));
  useEffect(() => { load(); }, []);

  const handleSwitch = async (u) => {
    try {
      await switchUser(u._id);
      toast(`Switched to ${u.name}'s workspace`, 'info');
      navigate('/dashboard');
    } catch { toast('Failed to switch workspace', 'error'); }
  };

  const toggle = async (u) => {
    try {
      await api.patch('/users/' + u._id + '/status');
      toast(`${u.name} ${u.isActive ? 'disabled' : 'enabled'} successfully`, u.isActive ? 'warning' : 'success');
      load();
    } catch { toast('Failed to update status', 'error'); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">User Management</div>
          <div className="page-subtitle">{users.length} team members</div>
        </div>
      </div>

      <div className="table-container">
        <table className="user-management-table">
          <thead>
            <tr>
              <th>S.No</th><th>Name</th><th>Username</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr><td colSpan={7} className="table-empty">No users found</td></tr>
            ) : users.map((u, i) => (
              <tr key={u._id}>
                <td style={{ color: '#475569' }}>{i + 1}</td>
                <td style={{ fontWeight: 600, color: '#1e293b' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                      {u.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    {u.name}
                  </div>
                </td>
                <td style={{ color: '#64748b' }}>@{u.username}</td>
                <td style={{ color: '#64748b' }}>{u.email}</td>
                <td>
                  <span className={`badge ${u.role === 'admin' ? 'badge-hardware' : 'badge-software'}`}>
                    {u.role === 'admin' ? '👑' : '👤'} {u.role}
                  </span>
                </td>
                <td>
                  <span className={`badge ${u.isActive ? 'badge-done' : 'badge-pending'}`}>
                    {u.isActive ? '● Active' : '● Disabled'}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => handleSwitch(u)}>👁️ View</button>
                    <button className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-success'}`} onClick={() => toggle(u)}>
                      {u.isActive ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsersPage;
