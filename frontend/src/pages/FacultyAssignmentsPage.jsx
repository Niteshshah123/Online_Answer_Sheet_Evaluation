import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function FacultyAssignmentsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/faculty/assignments', {
        headers: { Authorization: `Bearer ${localStorage.getItem('facultyToken')}` }
      });
      setItems(response.data.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '1.4rem', color: '#0f172a' }}>
            Assigned Evaluation Tasks
          </h2>
          <p className="muted" style={{ margin: 0 }}>
            Select an assigned answer sheet to open the split-panel grading workspace.
          </p>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <p className="muted">Loading assigned sheets...</p>
        ) : items.length === 0 ? (
          <p className="muted">No evaluation tasks currently assigned to you.</p>
        ) : (
          <table className="table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Student Name & Reg No.</th>
                <th>Course & Examination</th>
                <th>Assigned Qs</th>
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
                    <br />
                    <code style={{ fontSize: '0.78rem', color: '#64748b' }}>{item.registrationNumber}</code>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, color: '#0f172a' }}>{item.examName}</span>
                    <br />
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{item.examContext}</span>
                  </td>
                  <td>
                    <span
                      style={{
                        padding: '2px 8px',
                        background: '#e0f2fe',
                        color: '#0369a1',
                        borderRadius: '6px',
                        fontWeight: 700,
                        fontSize: '0.82rem'
                      }}
                    >
                      {item.questionRange}
                    </span>
                  </td>
                  <td>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        background:
                          item.status === 'LOCKED'
                            ? '#dcfce7'
                            : item.status === 'DRAFT'
                              ? '#fffbe6'
                              : '#f1f5f9',
                        color:
                          item.status === 'LOCKED'
                            ? '#15803d'
                            : item.status === 'DRAFT'
                              ? '#b45309'
                              : '#475569',
                        border: `1px solid ${
                          item.status === 'LOCKED'
                            ? '#86efac'
                            : item.status === 'DRAFT'
                              ? '#fde68a'
                              : '#cbd5e1'
                        }`
                      }}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: '#475569' }}>
                    {Object.entries(item.evaluationSummary || {})
                      .map(([status, count]) => `${status}: ${count}`)
                      .join(' | ')}
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => navigate(`/faculty/evaluate/${item.sheetId}`)}
                      style={{
                        padding: '6px 14px',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        background: '#2563eb',
                        color: '#ffffff'
                      }}
                    >
                      Open Sheet ➔
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

