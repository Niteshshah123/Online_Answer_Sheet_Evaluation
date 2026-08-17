import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function StudentPasswordPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ oldPassword: '', newPassword: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setMessage(''); setError('');
    try {
      await axios.post('/api/student/change-password', form, {
        headers: { Authorization: `Bearer ${localStorage.getItem('studentToken')}` }
      });
      setMessage('Password updated successfully.');
      setForm({ oldPassword: '', newPassword: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to change password.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ maxWidth: '420px' }}>
      <div className="card">
        <div className="card-header"><h2>Change Password</h2></div>
        <div className="card-body">
          {message && <div className="alert alert-success">{message}</div>}
          {error   && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input className="form-input" type="password" placeholder="Enter current password"
                value={form.oldPassword} onChange={e => setForm({ ...form, oldPassword: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input className="form-input" type="password" placeholder="Enter new password"
                value={form.newPassword} onChange={e => setForm({ ...form, newPassword: e.target.value })} required />
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 1 }}>
                {loading ? 'Updating...' : 'Update Password'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => navigate('/student/dashboard')}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
