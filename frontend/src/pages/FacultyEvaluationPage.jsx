import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

export default function FacultyEvaluationPage() {
  const { sheetId } = useParams();
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const [rows, setRows] = useState([]);
  const [sheetPdfUrl, setSheetPdfUrl] = useState(null);
  const [answerKeyUrl, setAnswerKeyUrl] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sheetWidth, setSheetWidth] = useState(45);
  const [answerKeyWidth, setAnswerKeyWidth] = useState(45);
  const [isDragging, setIsDragging] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/faculty/evaluations?sheetId=${sheetId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('facultyToken')}` }
      });
      const data = response.data.data || {};
      console.log('Loaded evaluation data:', data);
      setRows(data.evaluations || []);
      setSheetPdfUrl(data.sheetPdfUrl || null);
      setAnswerKeyUrl(data.answerKeyUrl || null);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to load evaluation sheet');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [sheetId]);

  const canEdit = useMemo(() => rows.some((row) => row.status !== 'LOCKED' && row.status !== 'UNLOCK_REQUESTED'), [rows]);
  const anyLocked = useMemo(() => rows.some((r) => r.status === 'LOCKED'), [rows]);
  const hasLockOrRequest = useMemo(() => rows.some((r) => r.status === 'LOCKED' || r.status === 'UNLOCK_REQUESTED'), [rows]);
  const canEditAny = useMemo(() => rows.some((r) => r.status !== 'LOCKED' && r.status !== 'UNLOCK_REQUESTED'), [rows]);
  const hasDraft = useMemo(() => rows.some((r) => r.status === 'DRAFT'), [rows]);
  const resolvePdfUrl = (url) => {
    if (!url) return null;
    if (/^(https?:)?\/\//.test(url)) return url;
    if (window.location.port === '5173') {
      return `http://localhost:3000/${url}`;
    }
    return url;
  };

  const sheetPreviewUrl = useMemo(() => resolvePdfUrl(sheetPdfUrl), [sheetPdfUrl]);
  const answerKeyPreviewUrl = useMemo(() => resolvePdfUrl(answerKeyUrl), [answerKeyUrl]);

  const updateRow = (index, field, value) => {
    setRows((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, [field]: value } : row));
  };

  const handleDraft = async () => {
    try {
      await axios.put(`/api/faculty/evaluations/sheet/${sheetId}/draft`, {
        updates: rows.map((row) => ({ evaluationId: row.evaluationId, marksObtained: row.marksObtained, review: row.review }))
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('facultyToken')}` }
      });
      setMessage('Saved as draft');
      await load();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to save draft');
    }
  };

  const handleSubmit = async () => {
    try {
      await axios.put(`/api/faculty/evaluations/sheet/${sheetId}/submit`, {
        updates: rows.map((row) => ({ evaluationId: row.evaluationId, marksObtained: row.marksObtained, review: row.review }))
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('facultyToken')}` }
      });
      setMessage('Submitted successfully');
      await load();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to submit');
    }
  };

  const handleUnlock = async () => {
    try {
      await axios.post(`/api/faculty/evaluations/sheet/${sheetId}/request-unlock`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('facultyToken')}` }
      });
      setMessage('Unlock requested');
      await load();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to request unlock');
    }
  };

  const handleDragStart = () => {
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (event) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const offsetX = Math.min(Math.max(event.clientX - rect.left, 0), rect.width);
      const newSheetWidth = Math.min(Math.max((offsetX / rect.width) * 100, 25), 70);
      setSheetWidth(newSheetWidth);
      setAnswerKeyWidth(Math.max(100 - newSheetWidth - 8, 25));
    };

    const handleMouseUp = () => {
      if (isDragging) setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Faculty Evaluation Sheet</h2>
          <p className="muted">Review the student answer sheet and the answer key, then evaluate only the questions assigned to you.</p>
        </div>
        <button className="secondary" onClick={() => navigate('/faculty/assignments')}>Back to assignments</button>
      </div>

      {message && <p className="muted" style={{ marginTop: '8px' }}>{message}</p>}

      <div
        className="grid"
        ref={containerRef}
        style={{ gridTemplateColumns: `${sheetWidth}% 8px ${answerKeyWidth}%`, marginTop: '16px', alignItems: 'stretch' }}
      >
        <div className="card">
          <h3>Student Answer Sheet</h3>
          <p className="muted">Drag the divider to resize the preview.</p>
          <div style={{ minHeight: '240px', border: '1px dashed #cbd5e1', borderRadius: '8px', padding: '16px', background: '#f8fafc' }}>
            {sheetPreviewUrl ? (
              <iframe title="Student Answer Sheet" src={sheetPreviewUrl} style={{ width: '100%', height: '420px', border: 'none' }} />
            ) : (
              <div style={{ padding: '24px' }}>Answer sheet for sheet {sheetId}</div>
            )}
          </div>
        </div>
        <div className="resizer-handle" onMouseDown={handleDragStart} />
        <div className="card">
          <h3>Answer Key</h3>
          <p className="muted">Use the same width controls for the student sheet on the left.</p>
          <div style={{ minHeight: '240px', border: '1px dashed #cbd5e1', borderRadius: '8px', padding: '16px', background: '#f8fafc' }}>
            {answerKeyPreviewUrl ? (
              <iframe title="Answer Key" src={answerKeyPreviewUrl} style={{ width: '100%', height: '420px', border: 'none' }} />
            ) : (
              <div style={{ padding: '24px' }}>Answer key preview</div>
            )}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '16px' }}>
        <h3>Assigned Questions</h3>
        {loading ? <p className="muted">Loading...</p> : null}
        {!loading && rows.length === 0 ? <p className="muted">No assigned questions found for this sheet.</p> : null}
        {!loading && rows.length > 0 ? (
          <div style={{ display: 'grid', gap: '12px' }}>
            {rows.map((row, index) => (
              <div key={row.evaluationId} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                  <strong>Q{row.questionNumber}</strong>
                  <span className="badge">Max: {row.maxMark ?? 'N/A'}</span>
                </div>
                <div className="form-group" style={{ marginTop: '10px' }}>
                  <label>Marks</label>
                  <input
                    type="number"
                    value={row.marksObtained ?? ''}
                    onChange={(e) => {
                      console.log('marks input', index, e.target.value, Number(e.target.value));
                      updateRow(index, 'marksObtained', e.target.value === '' ? null : Number(e.target.value));
                    }}
                    disabled={row.status === 'LOCKED' || row.status === 'UNLOCK_REQUESTED'}
                    min={0}
                  />
                </div>
                <div className="form-group">
                  <label>Review</label>
                  <textarea
                    value={row.review || ''}
                    onChange={(e) => updateRow(index, 'review', e.target.value)}
                    disabled={row.status === 'LOCKED' || row.status === 'UNLOCK_REQUESTED'}
                    rows={3}
                  />
                </div>
                <p className="muted">Status: {row.status}</p>
              </div>
            ))}

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
              {!hasLockOrRequest ? (
                <>
                  <button onClick={handleDraft}>Save as Draft</button>
                  <button className="secondary" onClick={handleSubmit}>Submit</button>
                </>
              ) : null}
              {anyLocked && !rows.some((r) => r.status === 'UNLOCK_REQUESTED') ? (
                <button className="secondary" onClick={handleUnlock}>Request Unlock</button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
