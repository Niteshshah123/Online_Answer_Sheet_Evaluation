import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function FacultyAssignmentsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
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

  // Group items by examId for course handling controls
  const examGroups = items.reduce((acc, item) => {
    const key = item.examId || 'unknown';
    if (!acc[key]) {
      acc[key] = {
        examId: item.examId,
        examName: item.examName,
        finalSubmittedToAdmin: item.finalSubmittedToAdmin,
        isPublished: item.isPublished,
        sheets: []
      };
    }
    acc[key].sheets.push(item);
    return acc;
  }, {});

  const handleFinalSubmit = async (examId) => {
    try {
      setActionMessage('');
      setErrorMessage('');
      const res = await axios.post(
        `/api/faculty/exams/${examId}/final-submit`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('facultyToken')}` } }
      );
      setActionMessage(res.data.data?.message || 'Final submission completed. Marks locked.');
      await load();
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Final submission failed.');
    }
  };

  const handleTogglePublish = async (examId) => {
    try {
      setActionMessage('');
      setErrorMessage('');
      const res = await axios.post(
        `/api/faculty/exams/${examId}/publish`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('facultyToken')}` } }
      );
      const pub = res.data.data?.isPublished;
      setActionMessage(pub ? 'Results published to students!' : 'Results unpublished.');
      await load();
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Publish toggle failed.');
    }
  };

  const handleExportAUMS = async (examId, examName) => {
    try {
      const res = await axios.get(`/api/faculty/exams/${examId}/export-aums`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('facultyToken')}` },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `AUMS_Export_${examName.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setErrorMessage('Failed to download AUMS Excel report.');
    }
  };

  return (
    <div>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '1.4rem', color: '#0f172a' }}>
            Assigned Evaluation Tasks & Course In-Charge Controls
          </h2>
          <p className="muted" style={{ margin: 0 }}>
            Manage paper valuations, perform Final Submit to Admin, publish results, and download AUMS Excel reports.
          </p>
        </div>
      </div>

      {actionMessage && (
        <div style={{ marginBottom: '16px', padding: '10px 14px', background: '#f0fdf4', color: '#166534', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
          ✓ {actionMessage}
        </div>
      )}
      {errorMessage && (
        <div style={{ marginBottom: '16px', padding: '10px 14px', background: '#fef2f2', color: '#991b1b', borderRadius: '8px', border: '1px solid #fecaca' }}>
          ⚠ {errorMessage}
        </div>
      )}

      {loading ? (
        <p className="muted">Loading assigned sheets...</p>
      ) : items.length === 0 ? (
        <div className="card"><p className="muted">No evaluation tasks currently assigned to you.</p></div>
      ) : (
        Object.values(examGroups).map((group) => (
          <div className="card" key={group.examId} style={{ marginBottom: '24px' }}>
            {/* Course In-Charge Header Controls Bar */}
            <div
              style={{
                display: 'flex',
                justify: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                paddingBottom: '14px',
                marginBottom: '14px',
                borderBottom: '1px solid #e2e8f0'
              }}
            >
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '1.15rem', color: '#0f172a' }}>
                  {group.examName}
                </h3>
                <div style={{ display: 'flex', gap: '8px', fontSize: '0.8rem' }}>
                  <span style={{ padding: '2px 8px', borderRadius: '12px', background: group.finalSubmittedToAdmin ? '#fef3c7' : '#e0f2fe', color: group.finalSubmittedToAdmin ? '#b45309' : '#0369a1', fontWeight: 600 }}>
                    {group.finalSubmittedToAdmin ? 'Submitted to Admin (Locked)' : 'Valuation In-Progress'}
                  </span>
                  <span style={{ padding: '2px 8px', borderRadius: '12px', background: group.isPublished ? '#dcfce7' : '#f1f5f9', color: group.isPublished ? '#15803d' : '#475569', fontWeight: 600 }}>
                    {group.isPublished ? 'Results Published' : 'Results Unpublished'}
                  </span>
                </div>
              </div>

              {/* Action Buttons for Course In-Charge */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => handleTogglePublish(group.examId)}
                  style={{
                    padding: '8px 14px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    background: group.isPublished ? '#d97706' : '#16a34a',
                    color: '#ffffff'
                  }}
                >
                  {group.isPublished ? 'Unpublish Results' : 'Publish Results to Students'}
                </button>

                <button
                  type="button"
                  onClick={() => handleFinalSubmit(group.examId)}
                  disabled={group.finalSubmittedToAdmin}
                  style={{
                    padding: '8px 14px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    background: group.finalSubmittedToAdmin ? '#cbd5e1' : '#2563eb',
                    color: '#ffffff',
                    cursor: group.finalSubmittedToAdmin ? 'not-allowed' : 'pointer'
                  }}
                >
                  {group.finalSubmittedToAdmin ? 'Final Submitted to Admin' : 'Final Submit to Admin 🔒'}
                </button>

                <button
                  type="button"
                  onClick={() => handleExportAUMS(group.examId, group.examName)}
                  style={{
                    padding: '8px 14px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    background: '#0f172a',
                    color: '#ffffff'
                  }}
                >
                  Export AUMS Excel (.xlsx) 📥
                </button>
              </div>
            </div>

            {/* Answer Sheets Table */}
            <table className="table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Student Name & Reg No.</th>
                  <th>Assigned Qs</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {group.sheets.map((item) => (
                  <tr key={item.sheetId}>
                    <td>
                      <strong>{item.studentName}</strong>
                      <br />
                      <code style={{ fontSize: '0.78rem', color: '#64748b' }}>{item.registrationNumber}</code>
                    </td>
                    <td>
                      <span style={{ padding: '2px 8px', background: '#e0f2fe', color: '#0369a1', borderRadius: '6px', fontWeight: 700, fontSize: '0.82rem' }}>
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
                          background: item.status === 'LOCKED' ? '#dcfce7' : item.status === 'DRAFT' ? '#fffbe6' : '#f1f5f9',
                          color: item.status === 'LOCKED' ? '#15803d' : item.status === 'DRAFT' ? '#b45309' : '#475569',
                          border: `1px solid ${item.status === 'LOCKED' ? '#86efac' : item.status === 'DRAFT' ? '#fde68a' : '#cbd5e1'}`
                        }}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => navigate(`/faculty/evaluate/${item.sheetId}`)}
                        style={{ padding: '6px 14px', fontSize: '0.82rem', fontWeight: 600, background: '#2563eb', color: '#ffffff' }}
                      >
                        Open Sheet ➔
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  );
}
