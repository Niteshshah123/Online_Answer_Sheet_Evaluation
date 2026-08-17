import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const statusBadge = (s) => {
  if (s === 'LOCKED') return 'badge-green';
  if (s === 'DRAFT') return 'badge-amber';
  return 'badge-gray';
};

const ArrowIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);

export default function FacultyAssignmentsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('/api/faculty/assignments', {
      headers: { Authorization: `Bearer ${localStorage.getItem('facultyToken')}` }
    }).then(r => setItems(r.data.data || [])).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1>Assigned Papers</h1>
        <p>Select an answer sheet to open the evaluation workspace.</p>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Evaluation Queue</h2>
          <span className="badge badge-gray">{items.length} assignments</span>
        </div>

        {loading ? (
          <div className="empty-state"><p>Loading assigned sheets...</p></div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
            </svg>
            <p>No evaluation tasks currently assigned to you.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Examination</th>
                <th>Assigned Questions</th>
                <th>Status</th>
                <th>Breakdown</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.sheetId}>
                  <td>
                    <strong>{item.studentName}</strong>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px', fontFamily: 'monospace' }}>
                      {item.registrationNumber}
                    </div>
                  </td>
                  <td>
                    <strong>{item.examName}</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{item.examContext}</div>
                  </td>
                  <td>
                    <span className="badge badge-maroon">{item.questionRange}</span>
                  </td>
                  <td>
                    <span className={`badge ${statusBadge(item.status)}`}>{item.status}</span>
                  </td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {Object.entries(item.evaluationSummary || {}).map(([s, c]) => `${s}: ${c}`).join(' · ')}
                  </td>
                  <td>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => navigate(`/faculty/evaluate/${item.sheetId}`)}
                    >
                      Open <ArrowIcon />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
