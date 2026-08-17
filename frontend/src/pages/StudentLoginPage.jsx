import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthLayout from '../components/AuthLayout';

export default function StudentLoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await axios.post('/api/student/login', form);
      localStorage.setItem('studentToken', res.data.data.token);
      navigate('/student/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <AuthLayout
      roleTag="Student Portal"
      tagline="View your evaluated answer sheets, check question-wise marks, and access your final converted score reports after results are published."
      features={[
        'Access results only after official publication',
        'Question-wise marks breakdown per evaluator',
        'Converted scale marks as per exam configuration',
        'Secure login with institutional credentials',
      ]}
      hint="student1@gmail.com  ·  studen"
      links={[
        { href: '/login', label: 'Admin Login' },
        { href: '/faculty/login', label: 'Faculty Login' },
      ]}
    >
      <h2 className="auth-form-title">Student Sign In</h2>
      <p className="auth-form-sub">Enter your student credentials to view your results and reports.</p>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input
            className="form-input"
            type="email"
            placeholder="student@amrita.edu"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            required
            autoComplete="email"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <div className="input-wrapper">
            <input
              className="form-input"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
              autoComplete="current-password"
              style={{ paddingRight: '56px' }}
            />
            <button type="button" className="input-toggle" onClick={() => setShowPassword(p => !p)}>
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>
        <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ marginTop: '6px' }}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </AuthLayout>
  );
}
