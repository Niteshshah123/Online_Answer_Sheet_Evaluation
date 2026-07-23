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
            <p className="badge" style={{ marginTop: '8px' }}>{paper.status}</p>
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button onClick={() => navigate(`/student/report/${paper.sheetId}`)}>View Report</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
