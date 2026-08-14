import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function StudentDashboardPage() {
  const navigate = useNavigate();
  const [papers, setPapers] = useState([]);
  const [studentName, setStudentName] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const response = await axios.get('/api/student/dashboard', {
          headers: { Authorization: `Bearer ${localStorage.getItem('studentToken')}` }
        });
        const data = response.data.data || {};
        setStudentName(data.studentName || 'Student');
        setPapers(data.papers || []);
      } catch (error) {
        setMessage(error.response?.data?.message || 'Unable to load dashboard');
      }
    };

    load();
  }, []);

  return (
    <div>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Welcome, {studentName}</h2>
          <p className="muted">Your semester papers and evaluation reports are listed below.</p>
        </div>
        <button className="secondary" onClick={() => navigate('/student/password')}>Change Password</button>
      </div>
      {message && <p className="muted" style={{ marginTop: '8px' }}>{message}</p>}
      <div className="grid grid-2" style={{ marginTop: '16px' }}>
        {papers.length === 0 ? (
          <div className="card">No papers have been assigned to you yet.</div>
        ) : papers.map((paper) => (
          <div className="card" key={paper.sheetId}>
            <h3>{paper.examName}</h3>
            <p className="muted">{paper.examContext}</p>
            <div style={{ marginTop: '8px' }}>
              <span
                style={{
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  background: paper.isPublished ? '#dcfce7' : '#fffbe6',
                  color: paper.isPublished ? '#15803d' : '#b45309',
                  border: `1px solid ${paper.isPublished ? '#86efac' : '#fde68a'}`
                }}
              >
                {paper.status}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
              <button
                disabled={!paper.isPublished}
                onClick={() => navigate(`/student/report/${paper.sheetId}`)}
                style={{
                  background: !paper.isPublished ? '#cbd5e1' : '#2563eb',
                  cursor: !paper.isPublished ? 'not-allowed' : 'pointer'
                }}
              >
                {paper.isPublished ? 'View Full Report' : 'Result Pending'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
