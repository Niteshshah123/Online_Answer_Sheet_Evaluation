import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const auth = () => ({ Authorization: `Bearer ${localStorage.getItem('adminToken')}` });

const LockIcon = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

export default function UnlockPage() {
  const [requests, setRequests] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(null);
  const navigate = useNavigate();

  const fetchRequests = async () => {
    try {
      const res = await axios.get('/api/admin/evaluation/unlock/requests', { headers: auth() });
      setRequests(res.data.data || []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (!localStorage.getItem('adminToken')) return navigate('/login');
    fetchRequests();
  }, []);

  const handleApprove = async (r) => {
    const key = `${r.sheetId}_${r.facultyId}`;
    setProcessing(key); setMessage(''); setError('');
    try {
      await axios.post('/api/admin/evaluation/unlock', { sheetId: r.sheetId, facultyId: r.facultyId }, { headers: auth() });
      setMessage(`Unlock approved for ${r.studentName} (${r.registrationNumber}).`);
      await fetchRequests();
    } catch (err) {
      setError(err.response?.data?.message || 'Approval failed.');
    } finally { setProcessing(null); }
  };

  const handleReject = async (r) => {
    const key = `${r.sheetId}_${r.facultyId}`;
    setProcessing(key); setMessage(''); setError('');
    try {
      await axios.post('/api/admin/evaluation/unlock/reject', { sheetId: r.sheetId, facultyId: r.facultyId }, { headers: auth() });
      setMessage(`Unlock request rejected for ${r.studentName}.`);
      await fetchRequests();
    } catch (err) {
      setError(err.response?.data?.message || 'Rejection failed.');
    } finally { setProcessing(null); }
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Unlock Requests</h1>
          <p>Review and approve faculty requests to re-evaluate locked answer sheets.</p>
        </div>
        {requests.length > 0 && (
          <span className="badge badge-amber" style={{ marginTop: '4px' }}>{requests.length} pending</span>
        )}
      </div>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <div className="card-header"><h2>Pending Requests</h2></div>

        {requests.length === 0 ? (
          <div className="empty-state">
            <LockIcon />
            <p>No pending unlock requests. All evaluations are currently locked.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Examination</th>
                <th>Faculty</th>
                <th>Questions</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(r => {
                const key = `${r.sheetId}_${r.facultyId}`;
                return (
                  <tr key={key}>
                    <td>
                      <strong>{r.studentName}</strong>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px', fontFamily: 'monospace' }}>
                        {r.registrationNumber}
                      </div>
                    </td>
                    <td>{r.examName || '—'}</td>
                    <td>
                      <strong>{r.facultyName}</strong>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>{r.facultyEmail}</div>
                    </td>
                    <td>
                      <span className="badge badge-gray">Q{r.questionNumbers?.join(', Q')}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-success btn-sm" onClick={() => handleApprove(r)} disabled={!!processing}>
                          Approve
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleReject(r)} disabled={!!processing}>
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
