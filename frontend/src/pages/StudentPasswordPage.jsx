import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function StudentPasswordPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ oldPassword: '', newPassword: '' });
  const [message, setMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await axios.post('/api/student/change-password', form, {
        headers: { Authorization: `Bearer ${localStorage.getItem('studentToken')}` }
      });
      setMessage('Password changed successfully');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to change password');
    }
  };

  return (
    <div className="card" style={{ maxWidth: '480px' }}>
      <h2>Change Password</h2>
      <p className="muted">Update your password anytime from the student portal.</p>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Current Password</label>
          <input type="password" value={form.oldPassword} onChange={(e) => setForm({ ...form, oldPassword: e.target.value })} required />
        </div>
        <div className="form-group">
          <label>New Password</label>
          <input type="password" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} required />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="submit">Save</button>
          <button type="button" className="secondary" onClick={() => navigate('/student/dashboard')}>Cancel</button>
        </div>
      </form>
      {message && <p className="muted" style={{ marginTop: '12px' }}>{message}</p>}
    </div>
  );
}
