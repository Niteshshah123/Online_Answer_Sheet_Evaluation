import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function FacultyLoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await axios.post('/api/faculty/login', form);
      localStorage.setItem('facultyToken', response.data.data.token);
      navigate('/faculty/dashboard');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to sign in.');
    }
  };

  return (
    <div className="auth-card">
      <h2>Faculty Sign In</h2>
      <p className="muted">View assigned answer sheets, mark questions, and submit evaluations.</p>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Email</label>
          <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </div>
        <div className="form-group">
          <label>Password</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            <button type="button" className="secondary" onClick={() => setShowPassword((prev) => !prev)}>
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>
        <button type="submit">Login</button>
      </form>
      {message && <p className="muted" style={{ marginTop: '12px' }}>{message}</p>}
    </div>
  );
}
