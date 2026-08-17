import { useState } from 'react';
import axios from 'axios';

export default function ProfileModal({ user, tokenKey, apiBase, onClose, onUpdated }) {
  const [tab, setTab] = useState('profile');
  const [name, setName] = useState(user.name || '');
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null); // { type: 'success'|'error', text }

  const token = localStorage.getItem(tokenKey);
  const headers = { Authorization: `Bearer ${token}` };

  async function saveProfile(e) {
    e.preventDefault();
    if (!name.trim()) return setMsg({ type: 'error', text: 'Name cannot be empty.' });
    setLoading(true); setMsg(null);
    try {
      await axios.put(`${apiBase}/profile`, { name }, { headers });
      onUpdated(name);
      setMsg({ type: 'success', text: 'Profile updated successfully.' });
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update profile.' });
    } finally { setLoading(false); }
  }

  async function changePassword(e) {
    e.preventDefault();
    if (newPwd !== confirmPwd) return setMsg({ type: 'error', text: 'Passwords do not match.' });
    if (newPwd.length < 6) return setMsg({ type: 'error', text: 'Password must be at least 6 characters.' });
    setLoading(true); setMsg(null);
    try {
      await axios.post(`${apiBase}/change-password`, { oldPassword: oldPwd, newPassword: newPwd }, { headers });
      setMsg({ type: 'success', text: 'Password changed successfully.' });
      setOldPwd(''); setNewPwd(''); setConfirmPwd('');
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to change password.' });
    } finally { setLoading(false); }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-left">
            <div className="modal-avatar">{(user.name || 'U').charAt(0).toUpperCase()}</div>
            <div>
              <div className="modal-user-name">{user.name}</div>
              <div className="modal-user-role">{user.role}</div>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="modal-tabs">
          <button className={`modal-tab${tab === 'profile' ? ' active' : ''}`} onClick={() => { setTab('profile'); setMsg(null); }}>
            Edit Profile
          </button>
          <button className={`modal-tab${tab === 'password' ? ' active' : ''}`} onClick={() => { setTab('password'); setMsg(null); }}>
            Change Password
          </button>
        </div>

        <div className="modal-body">
          {msg && <div className={`alert alert-${msg.type === 'success' ? 'success' : 'error'}`}>{msg.text}</div>}

          {tab === 'profile' && (
            <form onSubmit={saveProfile}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="Enter full name" />
              </div>
              <div className="form-group">
                <label className="form-label">Email <span className="form-label-optional">(read-only)</span></label>
                <input className="form-input" value={user.email || ''} disabled style={{ opacity: 0.6 }} />
              </div>
              <div className="form-group">
                <label className="form-label">Role <span className="form-label-optional">(read-only)</span></label>
                <input className="form-input" value={user.role || ''} disabled style={{ opacity: 0.6 }} />
              </div>
              <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          )}

          {tab === 'password' && (
            <form onSubmit={changePassword}>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input className="form-input" type="password" value={oldPwd} onChange={e => setOldPwd(e.target.value)} placeholder="Enter current password" />
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input className="form-input" type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="Min. 6 characters" />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input className="form-input" type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} placeholder="Repeat new password" />
              </div>
              <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
