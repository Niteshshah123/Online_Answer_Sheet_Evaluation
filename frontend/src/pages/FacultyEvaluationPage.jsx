import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const STATUS_BADGE = {
  LOCKED: 'badge-red',
  UNLOCK_REQUESTED: 'badge-amber',
  DRAFT: 'badge-blue',
  PENDING: 'badge-gray',
};

const PdfControls = ({ label, zoom, onZoomIn, onZoomOut, onRotate }) => (
  <div style={{
    padding: '8px 14px',
    background: 'var(--bg-subtle)',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexShrink: 0,
  }}>
    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {label}
    </span>
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      <button onClick={onZoomOut} style={ctrlBtn}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </button>
      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', minWidth: '36px', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{zoom}%</span>
      <button onClick={onZoomIn} style={ctrlBtn}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </button>
      <button onClick={onRotate} style={{ ...ctrlBtn, marginLeft: '4px' }} title="Rotate 90°">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
        </svg>
      </button>
    </div>
  </div>
);

const ctrlBtn = {
  width: '24px', height: '24px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
  background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: 'var(--text-secondary)',
};

export default function FacultyEvaluationPage() {
  const { sheetId } = useParams();
  const navigate = useNavigate();
  const containerRef = useRef(null);

  const [rows, setRows] = useState([]);
  const [sheetPdfUrl, setSheetPdfUrl] = useState(null);
  const [answerKeyUrl, setAnswerKeyUrl] = useState(null);
  const [targetScale, setTargetScale] = useState(30);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const [panelWidths, setPanelWidths] = useState({ left: 35, center: 35, right: 30 });
  const [isDragging, setIsDragging] = useState(null);

  const [sheetZoom, setSheetZoom] = useState(100);
  const [sheetRotate, setSheetRotate] = useState(0);
  const [keyZoom, setKeyZoom] = useState(100);
  const [keyRotate, setKeyRotate] = useState(0);

  const load = async () => {
    try {
      setLoading(true); setErrorMessage('');
      const res = await axios.get(`/api/faculty/evaluations?sheetId=${sheetId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('facultyToken')}` }
      });
      const data = res.data.data || {};
      setRows(data.evaluations || []);
      setSheetPdfUrl(data.sheetPdfUrl || null);
      setAnswerKeyUrl(data.answerKeyUrl || null);
      if (data.convertedScale) setTargetScale(data.convertedScale);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Unable to load evaluation sheet.');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [sheetId]);

  const statusSummary = useMemo(() => {
    if (!rows.length) return 'PENDING';
    if (rows.some(r => r.status === 'LOCKED')) return 'LOCKED';
    if (rows.some(r => r.status === 'UNLOCK_REQUESTED')) return 'UNLOCK_REQUESTED';
    if (rows.some(r => r.status === 'DRAFT')) return 'DRAFT';
    return 'PENDING';
  }, [rows]);

  const isLockedOrRequested = statusSummary === 'LOCKED' || statusSummary === 'UNLOCK_REQUESTED';

  const resolvePdfUrl = (url) => {
    if (!url) return null;
    if (/^(https?:)?\/\//.test(url)) return url;
    return window.location.port === '5173' ? `http://localhost:3000${url}` : url;
  };

  const sheetPreviewUrl = useMemo(() => resolvePdfUrl(sheetPdfUrl), [sheetPdfUrl]);
  const answerKeyPreviewUrl = useMemo(() => resolvePdfUrl(answerKeyUrl), [answerKeyUrl]);

  const updateRow = (evaluationId, field, value) => {
    setRows(cur => cur.map(r => r.evaluationId === evaluationId ? { ...r, [field]: value } : r));
  };

  const validationErrors = useMemo(() => {
    const errors = {};
    rows.forEach(row => {
      if (row.marksObtained !== null && row.marksObtained !== undefined && row.marksObtained !== '') {
        const val = Number(row.marksObtained);
        if (Number.isNaN(val)) errors[row.evaluationId] = 'Must be a valid number';
        else if (val < 0) errors[row.evaluationId] = 'Cannot be negative';
        else if (row.maxMark != null && val > row.maxMark) errors[row.evaluationId] = `Cannot exceed ${row.maxMark}`;
      }
    });
    return errors;
  }, [rows]);

  const hasErrors = Object.keys(validationErrors).length > 0;
  const allEvaluated = useMemo(() => rows.length > 0 && rows.every(r => r.marksObtained !== null && r.marksObtained !== undefined && r.marksObtained !== ''), [rows]);

  const totals = useMemo(() => {
    let rawObtained = 0, rawMax = 0;
    rows.forEach(r => {
      if (r.maxMark != null) rawMax += Number(r.maxMark);
      if (r.marksObtained != null && r.marksObtained !== '') rawObtained += Number(r.marksObtained);
    });
    const scale = Number(targetScale) || 30;
    return { rawObtained, rawMax, scale, convertedScore: rawMax > 0 ? ((rawObtained / rawMax) * scale).toFixed(2) : '0.00' };
  }, [rows, targetScale]);

  const handleDraft = async () => {
    if (hasErrors) { setErrorMessage('Fix validation errors before saving.'); return; }
    try {
      setMessage(''); setErrorMessage('');
      await axios.put(`/api/faculty/evaluations/sheet/${sheetId}/draft`,
        { updates: rows.map(r => ({ evaluationId: r.evaluationId, marksObtained: r.marksObtained, review: r.review })) },
        { headers: { Authorization: `Bearer ${localStorage.getItem('facultyToken')}` } }
      );
      setMessage('Draft saved successfully.');
      await load();
    } catch (err) { setErrorMessage(err.response?.data?.message || 'Unable to save draft.'); }
  };

  const handleSubmit = async () => {
    if (!allEvaluated) { setErrorMessage('All questions must be marked before submitting.'); return; }
    if (hasErrors) { setErrorMessage('Fix validation errors before submitting.'); return; }
    try {
      setMessage(''); setErrorMessage('');
      await axios.put(`/api/faculty/evaluations/sheet/${sheetId}/submit`,
        { updates: rows.map(r => ({ evaluationId: r.evaluationId, marksObtained: r.marksObtained, review: r.review })) },
        { headers: { Authorization: `Bearer ${localStorage.getItem('facultyToken')}` } }
      );
      setMessage('Evaluation submitted and locked successfully.');
      await load();
    } catch (err) { setErrorMessage(err.response?.data?.message || 'Unable to submit evaluation.'); }
  };

  const handleUnlock = async () => {
    try {
      setMessage(''); setErrorMessage('');
      await axios.post(`/api/faculty/evaluations/sheet/${sheetId}/request-unlock`, {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('facultyToken')}` } }
      );
      setMessage('Unlock request submitted to the Examination Cell.');
      await load();
    } catch (err) { setErrorMessage(err.response?.data?.message || 'Unable to request unlock.'); }
  };

  useEffect(() => {
    const onMove = (e) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const xPct = Math.min(Math.max(((e.clientX - rect.left) / rect.width) * 100, 10), 90);
      if (isDragging === 'left') {
        const newLeft = Math.min(Math.max(xPct, 20), 50);
        const remaining = 100 - newLeft - panelWidths.right;
        if (remaining > 15) setPanelWidths(p => ({ ...p, left: newLeft, center: remaining }));
      } else {
        const newRight = Math.min(Math.max(100 - xPct, 20), 50);
        const remaining = 100 - panelWidths.left - newRight;
        if (remaining > 15) setPanelWidths(p => ({ ...p, center: remaining, right: newRight }));
      }
    };
    const onUp = () => setIsDragging(null);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
  }, [isDragging, panelWidths]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)', background: 'var(--bg-page)' }}>

      {/* Workspace header bar */}
      <div style={{
        padding: '0 20px', height: '48px', background: 'white',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => navigate('/faculty/assignments')}
            style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
            Back
          </button>
          <div style={{ width: '1px', height: '20px', background: 'var(--border)' }} />
          <div>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Evaluation Workspace
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: '8px', fontFamily: 'monospace' }}>
              {sheetId}
            </span>
          </div>
        </div>
        <span className={`badge ${STATUS_BADGE[statusSummary] || 'badge-gray'}`}>
          {statusSummary}
        </span>
      </div>

      {/* Notification bar */}
      {message && (
        <div style={{ padding: '8px 20px', background: 'var(--success-bg)', color: 'var(--success)', borderBottom: '1px solid var(--success-border)', fontSize: '0.8rem', fontWeight: 500, flexShrink: 0 }}>
          {message}
        </div>
      )}
      {errorMessage && (
        <div style={{ padding: '8px 20px', background: 'var(--error-bg)', color: 'var(--error)', borderBottom: '1px solid var(--error-border)', fontSize: '0.8rem', fontWeight: 500, flexShrink: 0 }}>
          {errorMessage}
        </div>
      )}

      {/* 3-panel layout */}
      <div
        ref={containerRef}
        style={{
          display: 'grid',
          gridTemplateColumns: `${panelWidths.left}% 5px ${panelWidths.center}% 5px ${panelWidths.right}%`,
          flex: 1,
          overflow: 'hidden',
        }}
      >
        {/* Panel 1 — Student Answer Sheet */}
        <div style={{ display: 'flex', flexDirection: 'column', background: 'white', overflow: 'hidden', borderRight: '1px solid var(--border)' }}>
          <PdfControls
            label="Student Answer Sheet"
            zoom={sheetZoom}
            onZoomIn={() => setSheetZoom(z => Math.min(z + 15, 200))}
            onZoomOut={() => setSheetZoom(z => Math.max(z - 15, 50))}
            onRotate={() => setSheetRotate(r => (r + 90) % 360)}
          />
          <div style={{ flex: 1, overflow: 'auto', background: '#3d3d3d', display: 'flex', justifyContent: 'center', padding: '8px' }}>
            {sheetPreviewUrl ? (
              <iframe
                title="Student Answer Sheet"
                src={sheetPreviewUrl}
                style={{ width: `${sheetZoom}%`, minHeight: '600px', border: 'none', transform: `rotate(${sheetRotate}deg)`, transition: 'transform 0.2s' }}
              />
            ) : (
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem', padding: '40px', textAlign: 'center', alignSelf: 'center' }}>
                No answer sheet PDF available
              </div>
            )}
          </div>
        </div>

        {/* Resizer 1 */}
        <div
          onMouseDown={() => setIsDragging('left')}
          style={{ cursor: 'col-resize', background: isDragging === 'left' ? 'var(--amrita-maroon)' : 'var(--border)', transition: 'background 0.15s' }}
        />

        {/* Panel 2 — Answer Key */}
        <div style={{ display: 'flex', flexDirection: 'column', background: 'white', overflow: 'hidden', borderRight: '1px solid var(--border)' }}>
          <PdfControls
            label="Official Answer Key"
            zoom={keyZoom}
            onZoomIn={() => setKeyZoom(z => Math.min(z + 15, 200))}
            onZoomOut={() => setKeyZoom(z => Math.max(z - 15, 50))}
            onRotate={() => setKeyRotate(r => (r + 90) % 360)}
          />
          <div style={{ flex: 1, overflow: 'auto', background: '#3d3d3d', display: 'flex', justifyContent: 'center', padding: '8px' }}>
            {answerKeyPreviewUrl ? (
              <iframe
                title="Official Answer Key"
                src={answerKeyPreviewUrl}
                style={{ width: `${keyZoom}%`, minHeight: '600px', border: 'none', transform: `rotate(${keyRotate}deg)`, transition: 'transform 0.2s' }}
              />
            ) : (
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem', padding: '40px', textAlign: 'center', alignSelf: 'center' }}>
                No answer key PDF available
              </div>
            )}
          </div>
        </div>

        {/* Resizer 2 */}
        <div
          onMouseDown={() => setIsDragging('right')}
          style={{ cursor: 'col-resize', background: isDragging === 'right' ? 'var(--amrita-maroon)' : 'var(--border)', transition: 'background 0.15s' }}
        />

        {/* Panel 3 — Evaluation form */}
        <div style={{ display: 'flex', flexDirection: 'column', background: 'white', overflow: 'hidden' }}>
          {/* Panel header */}
          <div style={{ padding: '8px 14px', background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Question Evaluation
            </span>
          </div>

          {/* Scrollable form area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px' }}>
            {loading ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Loading questions...</p>
            ) : rows.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>No assigned questions found.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {rows.map(row => {
                  const err = validationErrors[row.evaluationId];
                  return (
                    <div
                      key={row.evaluationId}
                      style={{
                        border: `1px solid ${err ? 'var(--error-border)' : 'var(--border)'}`,
                        borderRadius: 'var(--radius-md)',
                        padding: '12px',
                        background: err ? 'var(--error-bg)' : 'var(--bg-subtle)',
                        borderLeft: `3px solid ${err ? 'var(--error)' : 'var(--amrita-maroon)'}`,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          Question {row.questionNumber}
                        </span>
                        <span className="badge badge-gray">Max: {row.maxMark ?? 'N/A'}</span>
                      </div>

                      <div className="form-group" style={{ marginBottom: '8px' }}>
                        <label className="form-label" style={{ fontSize: '0.72rem' }}>Marks Obtained</label>
                        <input
                          className="form-input"
                          type="number"
                          value={row.marksObtained ?? ''}
                          placeholder={`0 – ${row.maxMark ?? 'max'}`}
                          onChange={e => updateRow(row.evaluationId, 'marksObtained', e.target.value === '' ? null : Number(e.target.value))}
                          disabled={isLockedOrRequested}
                          min={0}
                          max={row.maxMark ?? undefined}
                          step="0.5"
                          style={{
                            borderColor: err ? 'var(--error)' : undefined,
                            background: isLockedOrRequested ? 'var(--bg-subtle)' : 'white',
                            fontSize: '0.875rem',
                            padding: '7px 10px',
                          }}
                        />
                        {err && (
                          <span style={{ fontSize: '0.72rem', color: 'var(--error)', marginTop: '3px', display: 'block' }}>
                            {err}
                          </span>
                        )}
                      </div>

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.72rem' }}>
                          Remarks <span className="form-label-optional">(optional)</span>
                        </label>
                        <textarea
                          className="form-input"
                          value={row.review || ''}
                          onChange={e => updateRow(row.evaluationId, 'review', e.target.value)}
                          disabled={isLockedOrRequested}
                          placeholder="Evaluator notes..."
                          rows={2}
                          style={{
                            resize: 'none',
                            fontSize: '0.8rem',
                            background: isLockedOrRequested ? 'var(--bg-subtle)' : 'white',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Score summary + actions — fixed at bottom */}
          {rows.length > 0 && (
            <div style={{ borderTop: '1px solid var(--border)', padding: '14px', flexShrink: 0, background: 'white' }}>

              {/* Score summary */}
              <div style={{ background: 'var(--accent-light)', border: '1px solid var(--accent-border)', borderRadius: 'var(--radius-md)', padding: '12px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--amrita-maroon)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Raw Score
                  </span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                    {totals.rawObtained} / {totals.rawMax}
                  </span>
                </div>

                {/* Target scale selector */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Scale</span>
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    {[20, 30, 50].map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setTargetScale(s)}
                        style={{
                          padding: '3px 8px', fontSize: '0.72rem', fontWeight: 600,
                          border: '1px solid', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                          background: targetScale === s ? 'var(--amrita-maroon)' : 'white',
                          color: targetScale === s ? 'white' : 'var(--text-secondary)',
                          borderColor: targetScale === s ? 'var(--amrita-maroon)' : 'var(--border)',
                        }}
                      >
                        {s}
                      </button>
                    ))}
                    <input
                      type="number"
                      value={targetScale}
                      onChange={e => setTargetScale(Number(e.target.value))}
                      style={{ width: '48px', padding: '3px 6px', fontSize: '0.72rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', textAlign: 'center', outline: 'none' }}
                    />
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--accent-border)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--amrita-maroon)' }}>Converted Score</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--amrita-maroon)', fontVariantNumeric: 'tabular-nums' }}>
                    {totals.convertedScore} / {totals.scale}
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              {!isLockedOrRequested ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <button
                    className="btn btn-primary btn-full"
                    onClick={handleSubmit}
                    disabled={hasErrors || !allEvaluated}
                    style={{ opacity: hasErrors || !allEvaluated ? 0.5 : 1 }}
                  >
                    Submit &amp; Lock Evaluation
                  </button>
                  {!allEvaluated && (
                    <p style={{ fontSize: '0.72rem', color: 'var(--warning)', textAlign: 'center', margin: 0 }}>
                      All questions must be marked before submitting.
                    </p>
                  )}
                  <button className="btn btn-ghost btn-full" onClick={handleDraft} disabled={hasErrors}>
                    Save as Draft
                  </button>
                </div>
              ) : statusSummary === 'LOCKED' ? (
                <button
                  className="btn btn-full"
                  onClick={handleUnlock}
                  style={{ background: 'var(--warning-bg)', color: 'var(--warning)', border: '1px solid var(--warning-border)' }}
                >
                  Request Unlock from Admin
                </button>
              ) : (
                <div style={{ textAlign: 'center', padding: '10px', background: 'var(--warning-bg)', border: '1px solid var(--warning-border)', borderRadius: 'var(--radius)', fontSize: '0.78rem', color: 'var(--warning)', fontWeight: 500 }}>
                  Unlock request pending admin approval.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
