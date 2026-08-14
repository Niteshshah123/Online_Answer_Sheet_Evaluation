import { useEffect, useState } from 'react';
import axios from 'axios';

export default function ExamsPage() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const fetchExams = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/exams', {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      setExams(res.data.data || []);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to load exams list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleTogglePublish = async (examId, currentStatus) => {
    try {
      setMessage('');
      setErrorMessage('');
      const res = await axios.post(
        `/api/admin/exams/${examId}/publish`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } }
      );
      const isPublished = res.data.data?.isPublished;
      setMessage(isPublished ? 'Results published! Students can now view their marks.' : 'Results unpublished. Student access restricted.');
      await fetchExams();
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to update publishing status');
    }
  };

  return (
    <div>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Exams & Result Publishing</h2>
          <p className="muted">Manage examination configurations and control when students can access evaluated results.</p>
        </div>
      </div>

      {message && (
        <div style={{ marginTop: '12px', padding: '10px 14px', background: '#f0fdf4', color: '#166534', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
          ✓ {message}
        </div>
      )}
      {errorMessage && (
        <div style={{ marginTop: '12px', padding: '10px 14px', background: '#fef2f2', color: '#991b1b', borderRadius: '8px', border: '1px solid #fecaca' }}>
          ⚠ {errorMessage}
        </div>
      )}

      <div className="card" style={{ marginTop: '16px' }}>
        <h3>Configured Examinations</h3>
        {loading ? (
          <p className="muted">Loading exams...</p>
        ) : exams.length === 0 ? (
          <p className="muted">No examination records found. Import an Excel sheet or seed the database to populate exams.</p>
        ) : (
          <div style={{ display: 'grid', gap: '16px', marginTop: '12px' }}>
            {exams.map((exam) => {
              const totalRawMarks = (exam.questionWeightage || []).reduce((a, b) => a + b, 0);
              return (
                <div
                  key={exam._id}
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '16px',
                    background: '#f8fafc',
                    display: 'flex',
                    justify: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '16px'
                  }}
                >
                  <div>
                    <h4 style={{ margin: '0 0 6px 0', fontSize: '1.05rem', color: '#0f172a' }}>
                      {exam.course} - {exam.subject} ({exam.semester} {exam.section})
                    </h4>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', fontSize: '0.85rem', color: '#475569' }}>
                      <span><strong>Type:</strong> {exam.examType}</span>
                      <span>•</span>
                      <span><strong>Questions:</strong> {(exam.questionWeightage || []).length} Qs</span>
                      <span>•</span>
                      <span><strong>Raw Total:</strong> {totalRawMarks} Marks</span>
                      <span>•</span>
                      <span><strong>Target Scale:</strong> {exam.convertedScale || 30} Marks</span>
                    </div>
                    <div style={{ marginTop: '6px', fontSize: '0.8rem', color: '#64748b' }}>
                      Question Weightages: <code>[{(exam.questionWeightage || []).join(', ')}]</code>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span
                      style={{
                        padding: '4px 12px',
                        borderRadius: '16px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        background: exam.isPublished ? '#dcfce7' : '#fef3c7',
                        color: exam.isPublished ? '#15803d' : '#b45309',
                        border: `1px solid ${exam.isPublished ? '#86efac' : '#fde68a'}`
                      }}
                    >
                      {exam.isPublished ? 'PUBLISHED' : 'UNPUBLISHED'}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleTogglePublish(exam._id, exam.isPublished)}
                      style={{
                        padding: '8px 16px',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        background: exam.isPublished ? '#dc2626' : '#16a34a',
                        color: '#ffffff'
                      }}
                    >
                      {exam.isPublished ? 'Unpublish Results' : 'Publish Results'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
