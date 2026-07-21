import { useEffect, useState } from 'react';
import axios from 'axios';

export default function TeachersPage() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ email: '', name: '', password: '' });
  const [message, setMessage] = useState('');

  const load = async () => {
    try {
      const res = await axios.get('/api/admin/teachers', { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } });
      setList(res.data.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/admin/teachers', form, { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } });
      setMessage('Teacher created');
      setForm({ email: '', name: '', password: '' });
      load();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete teacher?')) return;
    try {
      await axios.delete(`/api/admin/teachers/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } });
      setMessage('Deleted');
      load();
    } catch (err) {
      setMessage('Delete failed');
    }
  };

  return (
    <div>
      <h2>Manage Teachers</h2>
      <p className="muted">Add, edit or remove faculty accounts.</p>
      {message && <p className="muted">{message}</p>}
      <div className="card" style={{ marginTop: '16px' }}>
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label>Email</label>
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="faculty123" />
          </div>
          <button type="submit">Create Teacher</button>
        </form>
      </div>

      <div className="card" style={{ marginTop: '16px' }}>
        <h3>Existing Teachers</h3>
        <table className="table">
          <thead>
            <tr><th>Email</th><th>Name</th><th>Created</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {list.map(t => (
              <tr key={t._id}>
                <td>{t.email}</td>
                <td>{t.name}</td>
                <td>{new Date(t.createdAt).toLocaleString()}</td>
                <td><button className="secondary" onClick={() => handleDelete(t._id)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
