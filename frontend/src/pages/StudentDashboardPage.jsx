import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const statusCfg = (isPublished) => isPublished
  ? { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0', dot: '#16a34a', label: 'Published' }
  : { bg: '#fffbeb', color: '#92400e', border: '#fde68a', dot: '#d97706', label: 'Pending' };

export default function StudentDashboardPage() {
  const navigate = useNavigate();
  const [papers, setPapers] = useState([]);
  const [studentName, setStudentName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/student/dashboard', {
      headers: { Authorization: `Bearer ${localStorage.getItem('studentToken')}` }
    }).then(r => {
      const d = r.data.data || {};
      setStudentName(d.studentName || 'Student');
      setPapers(d.papers || []);
    }).catch(e => setError(e.response?.data?.message || 'Unable to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  const published = papers.filter(p => p.isPublished).length;
  const pending   = papers.filter(p => !p.isPublished).length;

  if (loading) return (
    <div className="dash-loading"><div className="dash-loading-spinner" /> Loading...</div>
  );

  return (
    <div className="dash-root">

      {error && <div className="alert alert-error">{error}</div>}

      {/* Stat cards */}
      {papers.length > 0 && (
        <div className="dash-stat-grid">
          <div className="dash-stat-card" style={{ '--accent-color': '#1E3A5F' }}>
            <div className="dash-stat-body">
              <div className="dash-stat-value">{papers.length}</div>
              <div className="dash-stat-label">Total Papers</div>
              <div className="dash-stat-sub">Assigned to you</div>
            </div>
          </div>
          <div className="dash-stat-card" style={{ '--accent-color': '#16a34a' }}>
            <div className="dash-stat-body">
              <div className="dash-stat-value">{published}</div>
              <div className="dash-stat-label">Results Published</div>
              <div className="dash-stat-sub">Available to view</div>
            </div>
          </div>
          <div className="dash-stat-card" style={{ '--accent-color': '#d97706' }}>
            <div className="dash-stat-body">
              <div className="dash-stat-value">{pending}</div>
              <div className="dash-stat-label">Awaiting Results</div>
              <div className="dash-stat-sub">Under evaluation</div>
            </div>
          </div>
          <div className="dash-stat-card" style={{ '--accent-color': '#7c3aed' }}>
            <div className="dash-stat-body">
              <div className="dash-stat-value">{papers.length > 0 ? Math.round((published / papers.length) * 100) : 0}%</div>
              <div className="dash-stat-label">Completion</div>
              <div className="dash-stat-sub">Results released</div>
            </div>
          </div>
        </div>
      )}

      {/* Papers */}
      <div className="card">
        <div className="card-header">
          <h2>My Answer Sheets</h2>
          <span className="badge badge-gray">{papers.length} papers</span>
        </div>

        {papers.length === 0 ? (
          <div className="empty-state">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
            </svg>
            <p>No papers have been assigned to you yet.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Examination</th>
                <th>Context</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {papers.map(paper => {
                const cfg = statusCfg(paper.isPublished);
                return (
                  <tr key={paper.sheetId}>
                    <td><strong>{paper.examName}</strong></td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{paper.examContext}</td>
                    <td>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                        padding: '3px 9px', borderRadius: '4px',
                        border: `1px solid ${cfg.border}`, background: cfg.bg, color: cfg.color,
                        fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
                      }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: cfg.dot }} />
                        {cfg.label}
                      </span>
                    </td>
                    <td>
                      <button
                        className={`btn btn-sm ${paper.isPublished ? 'btn-primary' : 'btn-ghost'}`}
                        disabled={!paper.isPublished}
                        onClick={() => navigate(`/student/report/${paper.sheetId}`)}
                        style={{ opacity: paper.isPublished ? 1 : 0.5 }}
                      >
                        {paper.isPublished ? (
                          <>View Report <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></>
                        ) : 'Result Pending'}
                      </button>
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
