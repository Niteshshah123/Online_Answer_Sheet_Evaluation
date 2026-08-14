import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

function resolvePdfUrl(url) {
  if (!url) return null;
  if (/^(https?:)?\/\//.test(url)) return url;
  if (window.location.port === '5173') {
    return `http://localhost:3000${url}`;
  }
  return url;
}

export default function StudentReportPage() {
  const { sheetId } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const response = await axios.get(`/api/student/reports/${sheetId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('studentToken')}` }
        });
        setReport(response.data.data || null);
      } catch (error) {
        setMessage(error.response?.data?.message || 'Unable to load report');
      }
    };

    load();
  }, [sheetId]);

  const sheetPreviewUrl = useMemo(() => resolvePdfUrl(report?.sheetPdfUrl), [report]);
  const answerKeyPreviewUrl = useMemo(() => resolvePdfUrl(report?.answerKeyUrl), [report]);

  return (
    <div>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Result Report</h2>
          <p className="muted">View your marks, feedback, and the scanned copy of the paper.</p>
        </div>
        <button className="secondary" onClick={() => navigate('/student/dashboard')}>Back to Dashboard</button>
      </div>
      {message && <p className="muted" style={{ marginTop: '8px' }}>{message}</p>}
      {!report ? <p className="muted">Loading report...</p> : (
        <>
          <div className="card" style={{ marginTop: '16px' }}>
            <h3>{report.examName}</h3>
            <p className="muted">{report.examContext}</p>
            <div className="grid grid-3" style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              <div className="metric">
                <h3>Raw Marks</h3>
                <p>{report.marksObtained} / {report.fullMarks}</p>
              </div>
              <div className="metric" style={{ background: '#f0f9ff', borderColor: '#bae6fd' }}>
                <h3 style={{ color: '#0369a1' }}>Converted Total ({report.convertedScale || 30} Scale)</h3>
                <p style={{ color: '#0284c7' }}>{report.convertedMarks} / {report.convertedScale || 30}</p>
              </div>
              <div className="metric">
                <h3>Paper Status</h3>
                <p>{report.evaluations?.every((e) => e.status === 'LOCKED') ? 'Fully Evaluated' : 'In Progress'}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-2" style={{ marginTop: '16px' }}>
            <div className="card">
              <h3>Scanned Paper</h3>
              {sheetPreviewUrl ? (
                <iframe title="Student Paper" src={sheetPreviewUrl} style={{ width: '100%', height: '100%', border: 'none' }} />
              ) : (
                <p className="muted">No paper PDF available.</p>
              )}
            </div>
             <div className="card" style={{ marginTop: '16px' }}>
            <h3>Question-wise Review</h3>
            {report.evaluations.map((item) => (
              <div key={item.questionNumber} style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px', marginTop: '12px' }}>
                <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong>Q{item.questionNumber}</strong>
                  <span className="badge">{item.status}</span>
                </div>
                <p className="muted" style={{ marginTop: '8px' }}>
                  Marks: {item.marksObtained ?? 'Pending'} / {item.maxMark ?? 'N/A'}
                </p>
                <p className="muted">Review: {item.review || 'No review provided yet.'}</p>
                <p className="muted">Checked by: {item.facultyName || 'Pending'}</p>
              </div>
            ))}
          </div>
          </div>

          
        </>
      )}
    </div>
  );
}
