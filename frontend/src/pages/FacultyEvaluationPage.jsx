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
  const [targetScale, setTargetScale] = useState(30);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(true);

  // Layout width split percentages (Panel 1: Student Sheet, Panel 2: Answer Key, Panel 3: Form)
  const [panelWidths, setPanelWidths] = useState({ left: 35, center: 35, right: 30 });
  const [isDragging, setIsDragging] = useState(null); // 'left' or 'right'

  // PDF Viewer controls state
  const [sheetZoom, setSheetZoom] = useState(100);
  const [sheetRotate, setSheetRotate] = useState(0);
  const [keyZoom, setKeyZoom] = useState(100);
  const [keyRotate, setKeyRotate] = useState(0);

  const load = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      const response = await axios.get(`/api/faculty/evaluations?sheetId=${sheetId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('facultyToken')}` }
      });
      const data = response.data.data || {};
      setRows(data.evaluations || []);
      setSheetPdfUrl(data.sheetPdfUrl || null);
      setAnswerKeyUrl(data.answerKeyUrl || null);
      if (data.convertedScale) {
        setTargetScale(data.convertedScale);
      }
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Unable to load evaluation sheet');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [sheetId]);

  const statusSummary = useMemo(() => {
    if (!rows.length) return 'PENDING';
    if (rows.some((r) => r.status === 'LOCKED')) return 'LOCKED';
    if (rows.some((r) => r.status === 'UNLOCK_REQUESTED')) return 'UNLOCK_REQUESTED';
    if (rows.some((r) => r.status === 'DRAFT')) return 'DRAFT';
    return 'PENDING';
  }, [rows]);

  const isLockedOrRequested = statusSummary === 'LOCKED' || statusSummary === 'UNLOCK_REQUESTED';

  const resolvePdfUrl = (url) => {
    if (!url) return null;
    if (/^(https?:)?\/\//.test(url)) return url;
    if (window.location.port === '5173') {
      return `http://localhost:3000${url}`;
    }
    return url;
  };

  const sheetPreviewUrl = useMemo(() => resolvePdfUrl(sheetPdfUrl), [sheetPdfUrl]);
  const answerKeyPreviewUrl = useMemo(() => resolvePdfUrl(answerKeyUrl), [answerKeyUrl]);

  // Update specific evaluation row strictly by evaluationId
  const updateRowById = (evaluationId, field, value) => {
    setRows((current) =>
      current.map((row) =>
        row.evaluationId === evaluationId ? { ...row, [field]: value } : row
      )
    );
  };

  // Validation logic
  const validationErrors = useMemo(() => {
    const errors = {};
    rows.forEach((row) => {
      if (row.marksObtained !== null && row.marksObtained !== undefined && row.marksObtained !== '') {
        const val = Number(row.marksObtained);
        if (Number.isNaN(val)) {
          errors[row.evaluationId] = 'Must be a valid number';
        } else if (val < 0) {
          errors[row.evaluationId] = 'Marks cannot be negative';
        } else if (row.maxMark != null && val > row.maxMark) {
          errors[row.evaluationId] = `Marks cannot exceed maximum mark (${row.maxMark})`;
        }
      }
    });
    return errors;
  }, [rows]);

  const hasValidationErrors = Object.keys(validationErrors).length > 0;

  // Check if all assigned questions have marks entered
  const allQuestionsEvaluated = useMemo(() => {
    if (!rows.length) return false;
    return rows.every(
      (r) => r.marksObtained !== null && r.marksObtained !== undefined && r.marksObtained !== ''
    );
  }, [rows]);

  // Running totals & scale conversion
  const totals = useMemo(() => {
    let rawObtained = 0;
    let rawMax = 0;
    rows.forEach((r) => {
      if (r.maxMark != null) rawMax += Number(r.maxMark);
      if (r.marksObtained != null && r.marksObtained !== '') rawObtained += Number(r.marksObtained);
    });

    const scale = Number(targetScale) || 30;
    const convertedScore = rawMax > 0 ? ((rawObtained / rawMax) * scale).toFixed(2) : '0.00';

    return { rawObtained, rawMax, scale, convertedScore };
  }, [rows, targetScale]);

  // Save Draft
  const handleDraft = async () => {
    if (hasValidationErrors) {
      setErrorMessage('Please fix mark validation errors before saving draft.');
      return;
    }
    try {
      setMessage('');
      setErrorMessage('');
      await axios.put(
        `/api/faculty/evaluations/sheet/${sheetId}/draft`,
        {
          updates: rows.map((r) => ({
            evaluationId: r.evaluationId,
            marksObtained: r.marksObtained,
            review: r.review
          }))
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem('facultyToken')}` } }
      );
      setMessage('Saved as draft');
      await load();
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Unable to save draft');
    }
  };

  // Submit Evaluation
  const handleSubmit = async () => {
    if (!allQuestionsEvaluated) {
      setErrorMessage('All assigned questions must be marked before submitting.');
      return;
    }
    if (hasValidationErrors) {
      setErrorMessage('Please fix mark validation errors before submitting.');
      return;
    }
    try {
      setMessage('');
      setErrorMessage('');
      await axios.put(
        `/api/faculty/evaluations/sheet/${sheetId}/submit`,
        {
          updates: rows.map((r) => ({
            evaluationId: r.evaluationId,
            marksObtained: r.marksObtained,
            review: r.review
          }))
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem('facultyToken')}` } }
      );
      setMessage('Submitted successfully. Evaluation is now locked.');
      await load();
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Unable to submit evaluation');
    }
  };

  // Request Unlock
  const handleUnlock = async () => {
    try {
      setMessage('');
      setErrorMessage('');
      await axios.post(
        `/api/faculty/evaluations/sheet/${sheetId}/request-unlock`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('facultyToken')}` } }
      );
      setMessage('Unlock request sent to Examination Cell admin.');
      await load();
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Unable to request unlock');
    }
  };

  // Resizable panel dragging logic
  const handleMouseDown = (divider) => {
    setIsDragging(divider);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const xPct = Math.min(Math.max(((e.clientX - rect.left) / rect.width) * 100, 10), 90);

      if (isDragging === 'left') {
        const newLeft = Math.min(Math.max(xPct, 20), 50);
        const remaining = 100 - newLeft - panelWidths.right;
        if (remaining > 15) {
          setPanelWidths({ left: newLeft, center: remaining, right: panelWidths.right });
        }
      } else if (isDragging === 'right') {
        const newRight = Math.min(Math.max(100 - xPct, 20), 50);
        const remaining = 100 - panelWidths.left - newRight;
        if (remaining > 15) {
          setPanelWidths({ left: panelWidths.left, center: remaining, right: newRight });
        }
      }
    };

    const handleMouseUp = () => {
      if (isDragging) setIsDragging(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, panelWidths]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 70px)' }}>
      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          padding: '12px 18px',
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0'
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: '#0f172a' }}>
            Faculty Answer Sheet Evaluation
          </h2>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Sheet ID: <code>{sheetId}</code>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span
            style={{
              padding: '4px 10px',
              borderRadius: '12px',
              fontSize: '0.75rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              background:
                statusSummary === 'LOCKED'
                  ? '#fef2f2'
                  : statusSummary === 'UNLOCK_REQUESTED'
                  ? '#fffbebeb'
                  : statusSummary === 'DRAFT'
                  ? '#eff6ff'
                  : '#f8fafc',
              color:
                statusSummary === 'LOCKED'
                  ? '#dc2626'
                  : statusSummary === 'UNLOCK_REQUESTED'
                  ? '#d97706'
                  : statusSummary === 'DRAFT'
                  ? '#2563eb'
                  : '#64748b',
              border: `1px solid ${
                statusSummary === 'LOCKED'
                  ? '#fecaca'
                  : statusSummary === 'UNLOCK_REQUESTED'
                  ? '#fde68a'
                  : statusSummary === 'DRAFT'
                  ? '#bfdbfe'
                  : '#e2e8f0'
              }`
            }}
          >
            Status: {statusSummary}
          </span>
          <button className="secondary" style={{ padding: '6px 14px', fontSize: '0.85rem' }} onClick={() => navigate('/faculty/assignments')}>
            Back to Assignments
          </button>
        </div>
      </div>

      {/* Notifications */}
      {message && (
        <div style={{ padding: '8px 18px', background: '#f0fdf4', color: '#166534', borderBottom: '1px solid #bbf7d0', fontSize: '0.85rem' }}>
          ✓ {message}
        </div>
      )}
      {errorMessage && (
        <div style={{ padding: '8px 18px', background: '#fef2f2', color: '#991b1b', borderBottom: '1px solid #fecaca', fontSize: '0.85rem' }}>
          ⚠ {errorMessage}
        </div>
      )}

      {/* 3-Panel Main Layout Container */}
      <div
        ref={containerRef}
        style={{
          display: 'grid',
          gridTemplateColumns: `${panelWidths.left}% 6px ${panelWidths.center}% 6px ${panelWidths.right}%`,
          flex: 1,
          overflow: 'hidden',
          background: '#f1f5f9'
        }}
      >
        {/* PANEL 1: Student Answer Sheet PDF Viewer */}
        <div style={{ display: 'flex', flexDirection: 'column', background: '#ffffff', overflow: 'hidden', borderRight: '1px solid #cbd5e1' }}>
          <div style={{ padding: '8px 12px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#334155' }}>📄 Student Answer Sheet</span>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button style={{ padding: '2px 8px', fontSize: '0.75rem' }} onClick={() => setSheetZoom((z) => Math.max(z - 15, 50))}>-</button>
              <span style={{ fontSize: '0.75rem', alignSelf: 'center' }}>{sheetZoom}%</span>
              <button style={{ padding: '2px 8px', fontSize: '0.75rem' }} onClick={() => setSheetZoom((z) => Math.min(z + 15, 200))}>+</button>
              <button style={{ padding: '2px 8px', fontSize: '0.75rem' }} onClick={() => setSheetRotate((r) => (r + 90) % 360)}>↻</button>
            </div>
          </div>
          <div style={{ flex: 1, padding: '8px', overflow: 'auto', display: 'flex', justifyContent: 'center', background: '#475569' }}>
            {sheetPreviewUrl ? (
              <iframe
                title="Student Answer Sheet"
                src={sheetPreviewUrl}
                style={{
                  width: `${sheetZoom}%`,
                  height: '100%',
                  minHeight: '600px',
                  border: 'none',
                  borderRadius: '4px',
                  transform: `rotate(${sheetRotate}deg)`,
                  transition: 'transform 0.2s ease'
                }}
              />
            ) : (
              <div style={{ padding: '40px', color: '#ffffff', textAlign: 'center' }}>No Answer Sheet PDF Available</div>
            )}
          </div>
        </div>

        {/* Resizer Handle 1 */}
        <div
          onMouseDown={() => handleMouseDown('left')}
          style={{ cursor: 'col-resize', background: isDragging === 'left' ? '#3b82f6' : '#cbd5e1', transition: 'background 0.15s' }}
        />

        {/* PANEL 2: Official Answer Key PDF Viewer */}
        <div style={{ display: 'flex', flexDirection: 'column', background: '#ffffff', overflow: 'hidden', borderRight: '1px solid #cbd5e1' }}>
          <div style={{ padding: '8px 12px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#334155' }}>🔑 Official Answer Key</span>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button style={{ padding: '2px 8px', fontSize: '0.75rem' }} onClick={() => setKeyZoom((z) => Math.max(z - 15, 50))}>-</button>
              <span style={{ fontSize: '0.75rem', alignSelf: 'center' }}>{keyZoom}%</span>
              <button style={{ padding: '2px 8px', fontSize: '0.75rem' }} onClick={() => setKeyZoom((z) => Math.min(z + 15, 200))}>+</button>
              <button style={{ padding: '2px 8px', fontSize: '0.75rem' }} onClick={() => setKeyRotate((r) => (r + 90) % 360)}>↻</button>
            </div>
          </div>
          <div style={{ flex: 1, padding: '8px', overflow: 'auto', display: 'flex', justifyContent: 'center', background: '#475569' }}>
            {answerKeyPreviewUrl ? (
              <iframe
                title="Official Answer Key"
                src={answerKeyPreviewUrl}
                style={{
                  width: `${keyZoom}%`,
                  height: '100%',
                  minHeight: '600px',
                  border: 'none',
                  borderRadius: '4px',
                  transform: `rotate(${keyRotate}deg)`,
                  transition: 'transform 0.2s ease'
                }}
              />
            ) : (
              <div style={{ padding: '40px', color: '#ffffff', textAlign: 'center' }}>No Answer Key PDF Available</div>
            )}
          </div>
        </div>

        {/* Resizer Handle 2 */}
        <div
          onMouseDown={() => handleMouseDown('right')}
          style={{ cursor: 'col-resize', background: isDragging === 'right' ? '#3b82f6' : '#cbd5e1', transition: 'background 0.15s' }}
        />

        {/* PANEL 3: Evaluation Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', background: '#ffffff', overflowY: 'auto', padding: '16px' }}>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', color: '#0f172a' }}>Assigned Question Evaluation</h3>
          <p style={{ margin: '0 0 16px 0', fontSize: '0.8rem', color: '#64748b' }}>
            Enter marks for questions assigned to you. Values are strictly validated.
          </p>

          {loading ? (
            <p className="muted">Loading assigned questions...</p>
          ) : rows.length === 0 ? (
            <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              No assigned questions found for this sheet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
              {rows.map((row) => {
                const error = validationErrors[row.evaluationId];
                return (
                  <div
                    key={row.evaluationId}
                    style={{
                      border: `1px solid ${error ? '#fca5a5' : '#e2e8f0'}`,
                      borderRadius: '8px',
                      padding: '12px',
                      background: error ? '#fff5f5' : '#f8fafc'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '0.95rem', color: '#1e293b' }}>Question {row.questionNumber}</strong>
                      <span className="badge" style={{ background: '#e2e8f0', color: '#334155', fontSize: '0.75rem', fontWeight: 600 }}>
                        Max Mark: {row.maxMark ?? 'N/A'}
                      </span>
                    </div>

                    <div className="form-group" style={{ marginTop: '10px' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Marks Obtained</label>
                      <input
                        type="number"
                        value={row.marksObtained ?? ''}
                        placeholder={`0 to ${row.maxMark ?? 'max'}`}
                        onChange={(e) => updateRowById(row.evaluationId, 'marksObtained', e.target.value === '' ? null : Number(e.target.value))}
                        disabled={isLockedOrRequested}
                        min={0}
                        max={row.maxMark ?? undefined}
                        step="0.5"
                        style={{
                          borderColor: error ? '#ef4444' : '#cbd5e1',
                          background: isLockedOrRequested ? '#f1f5f9' : '#ffffff'
                        }}
                      />
                      {error && <span style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>⚠ {error}</span>}
                    </div>

                    <div className="form-group" style={{ marginTop: '8px' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Review Remarks (Optional)</label>
                      <textarea
                        value={row.review || ''}
                        onChange={(e) => updateRowById(row.evaluationId, 'review', e.target.value)}
                        disabled={isLockedOrRequested}
                        placeholder="Add evaluator notes..."
                        rows={2}
                        style={{ fontSize: '0.85rem', background: isLockedOrRequested ? '#f1f5f9' : '#ffffff' }}
                      />
                    </div>
                  </div>
                );
              })}

              {/* Real-time Mark Conversion & Summary Card */}
              <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '2px solid #e2e8f0' }}>
                <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', padding: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#0369a1', marginBottom: '8px' }}>
                    <span>Raw Assigned Total:</span>
                    <strong>
                      {totals.rawObtained} / {totals.rawMax}
                    </strong>
                  </div>

                  {/* Target Scale Controls */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginTop: '8px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0369a1' }}>Target Scale:</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <button
                        type="button"
                        style={{ padding: '2px 8px', fontSize: '0.75rem', background: targetScale === 20 ? '#0284c7' : '#e0f2fe', color: targetScale === 20 ? '#fff' : '#0369a1' }}
                        onClick={() => setTargetScale(20)}
                      >
                        20 (Midsem)
                      </button>
                      <button
                        type="button"
                        style={{ padding: '2px 8px', fontSize: '0.75rem', background: targetScale === 30 ? '#0284c7' : '#e0f2fe', color: targetScale === 30 ? '#fff' : '#0369a1' }}
                        onClick={() => setTargetScale(30)}
                      >
                        30 (Endsem)
                      </button>
                      <input
                        type="number"
                        value={targetScale}
                        onChange={(e) => setTargetScale(Number(e.target.value))}
                        style={{ width: '60px', padding: '4px', fontSize: '0.8rem', textAlign: 'center' }}
                      />
                    </div>
                  </div>

                  {/* Calculated Converted Total */}
                  <div
                    style={{
                      marginTop: '12px',
                      paddingTop: '10px',
                      borderTop: '1px dashed #7dd3fc',
                      display: 'flex',
                      justify: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0c4a6e' }}>Converted Total:</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0284c7' }}>
                      {totals.convertedScore} / {totals.scale}
                    </span>
                  </div>
                </div>

                {/* Submit & Action Controls */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '14px' }}>
                  {!isLockedOrRequested ? (
                    <>
                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={hasValidationErrors || !allQuestionsEvaluated}
                        style={{
                          width: '100%',
                          padding: '10px',
                          background: (hasValidationErrors || !allQuestionsEvaluated) ? '#cbd5e1' : '#2563eb',
                          color: '#ffffff',
                          fontWeight: 600,
                          borderRadius: '6px',
                          cursor: (hasValidationErrors || !allQuestionsEvaluated) ? 'not-allowed' : 'pointer'
                        }}
                      >
                        Submit & Lock Evaluation
                      </button>
                      {!allQuestionsEvaluated && (
                        <span style={{ fontSize: '0.75rem', color: '#d97706', textAlign: 'center', display: 'block' }}>
                          ⚠ All assigned questions must be marked before submitting.
                        </span>
                      )}
                      <button
                        type="button"
                        className="secondary"
                        onClick={handleDraft}
                        disabled={hasValidationErrors}
                        style={{ width: '100%', padding: '8px', fontSize: '0.85rem' }}
                      >
                        Save as Draft
                      </button>
                    </>
                  ) : statusSummary === 'LOCKED' ? (
                    <button
                      type="button"
                      className="secondary"
                      onClick={handleUnlock}
                      style={{ width: '100%', padding: '10px', background: '#fffbe6', color: '#b45309', border: '1px solid #fde68a' }}
                    >
                      Request Unlock from Admin
                    </button>
                  ) : (
                    <div style={{ textAlign: 'center', fontSize: '0.85rem', color: '#d97706', padding: '8px', background: '#fffbe6', borderRadius: '6px' }}>
                      Unlock requested. Waiting for admin approval.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

