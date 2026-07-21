import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function UnlockPage() {
  const [sheetId, setSheetId] = useState('');
  const [facultyId, setFacultyId] = useState('');
  const [evaluationId, setEvaluationId] = useState('');
  const [message, setMessage] = useState('');
  const [requests, setRequests] = useState([]);

  const fetchRequests = async () => {
    try {
      const res = await axios.get('/api/admin/evaluation/unlock/requests', {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      setRequests(res.data.data || []);
    } catch (err) {
      // ignore
    }
  };

  const navigate = useNavigate();
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) return navigate('/login');
    fetchRequests();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const payload = {};
      if (evaluationId) {
        payload.evaluationId = evaluationId;
      } else {
        if (sheetId) payload.sheetId = sheetId;
        if (facultyId) payload.facultyId = facultyId;
      }
      const response = await axios.post('/api/admin/evaluation/unlock', payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      setMessage(`Unlocked: ${JSON.stringify(response.data.data)}`);
      setSheetId('');
      setFacultyId('');
      setEvaluationId('');
      await fetchRequests();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unlock failed.');
    }
  };

  const handleUnlockRequest = async (r) => {
    try {
      await axios.post('/api/admin/evaluation/unlock', { sheetId: r.sheetId, facultyId: r.facultyId }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      setMessage(`Unlocked sheet ${r.sheetId}`);
      await fetchRequests();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Unlock failed.');
    }
  };

  return (
    <div>
      <h2>Unlock Evaluation Requests</h2>
      <p className="muted">Review faculty unlock requests and approve them.</p>

      <div className="card" style={{ marginTop: '16px' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Evaluation ID (optional)</label>
            <input value={evaluationId} onChange={(e) => setEvaluationId(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Sheet ID (optional)</label>
            <input value={sheetId} onChange={(e) => setSheetId(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Faculty ID (optional)</label>
            <input value={facultyId} onChange={(e) => setFacultyId(e.target.value)} />
          </div>
          <button type="submit">Unlock</button>
        </form>
        {message && <p className="muted" style={{ marginTop: '12px' }}>{message}</p>}
      </div>

      <div className="card" style={{ marginTop: '16px' }}>
        <h3>Pending Requests</h3>
        {requests.length === 0 ? <p className="muted">No pending requests.</p> : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {requests.map((r) => (
              <div key={`${r.sheetId}_${r.facultyId}`} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <div><strong>Sheet:</strong> {r.sheetId}</div>
                    <div><strong>Questions:</strong> {r.questionNumbers?.join(', ')}</div>
                    <div><strong>Student:</strong> {r.studentName} ({r.registrationNumber})</div>
                    <div><strong>Exam:</strong> {r.examName}</div>
                    <div><strong>Faculty:</strong> {r.facultyName} &lt;{r.facultyEmail}&gt;</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button className="secondary" onClick={() => handleUnlockRequest(r)}>Approve Unlock</button>
                    <button style={{ marginTop: '8px' }} onClick={async () => {
                      try {
                        await axios.post('/api/admin/evaluation/unlock/reject', { sheetId: r.sheetId, facultyId: r.facultyId }, { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } });
                        setMessage('Rejected unlock');
                        await fetchRequests();
                      } catch (err) {
                        setMessage(err.response?.data?.message || 'Reject failed');
                      }
                    }}>Reject</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
