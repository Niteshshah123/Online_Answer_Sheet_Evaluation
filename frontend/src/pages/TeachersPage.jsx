import { useEffect, useState } from 'react';
import axios from 'axios';

const auth = () => ({ Authorization: `Bearer ${localStorage.getItem('adminToken')}` });

export default function TeachersPage() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ email: '', name: '', password: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      const res = await axios.get('/api/admin/teachers', { headers: auth() });
      setList(res.data.data || []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true); setMessage(''); setError('');
    try {
      await axios.post('/api/admin/teachers', form, { headers: auth() });
      setMessage(`Faculty account created for ${form.name}.`);
      setForm({ email: '', name: '', password: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create faculty account.');
    } finally { setLoading(false); }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete faculty account for "${name}"? This action cannot be undone.`)) return;
    try {
      await axios.delete(`/api/admin/teachers/${id}`, { headers: auth() });
      setMessage(`Faculty account for "${name}" has been removed.`);
      load();
    } catch { setError('Failed to delete faculty account.'); }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Faculty Accounts</h1>
        <p>Create and manage faculty accounts for the evaluation system.</p>
      </div>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px', alignItems: 'start' }}>

        {/* Create form */}
        <div className="card">
          <div className="card-header"><h2>Add Faculty Account</h2></div>
          <div className="card-body">
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" type="text" placeholder="Dr. Jane Smith" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input className="form-input" type="email" placeholder="faculty@amrita.edu" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">
                  Password <span className="form-label-optional">(optional)</span>
                </label>
                <input className="form-input" type="password" placeholder="Leave blank for default" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
              </div>
              <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                {loading ? 'Creating...' : 'Create Account'}
              </button>
            </form>
          </div>
        </div>

        {/* Table */}
        <div className="card">
          <div className="card-header">
            <h2>Registered Faculty</h2>
            <span className="badge badge-gray">{list.length} accounts</span>
          </div>
          {list.length === 0 ? (
            <div className="empty-state">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              </svg>
              <p>No faculty accounts found. Add one using the form.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email Address</th>
                  <th>Created On</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {list.map(t => (
                  <tr key={t._id}>
                    <td><strong>{t.name}</strong></td>
                    <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '0.78rem' }}>{t.email}</td>
                    <td style={{ color: 'var(--text-muted)' }}>
                      {new Date(t.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(t._id, t.name)}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  );
}
