import { useState } from 'react';
import axios from 'axios';

const COLUMNS = [
  ['registrationNumber', 'RA2111003010001'],
  ['studentName', 'John Doe'],
  ['studentEmail', 'john@amrita.edu'],
  ['course', 'CSE'],
  ['subject', 'DBMS'],
  ['semester', 'Sem 4'],
  ['section', 'Sec A'],
  ['examType', 'Midsem / Endsem'],
  ['answerSheetPdfLink', '/uploads/sheets/s1.pdf'],
  ['answerKeyPdfLink', '/uploads/keys/k1.pdf'],
  ['questionMarks', '10, 10, 10, 5, 5'],
  ['facultyName', 'Dr. Alan Turing'],
  ['facultyEmail', 'alan@amrita.edu'],
];

const UploadIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);

export default function ImportPage() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);

  const handleFile = (f) => {
    if (f && (f.name.endsWith('.xlsx') || f.name.endsWith('.xls'))) {
      setFile(f); setError('');
    } else {
      setError('Only .xlsx or .xls files are accepted.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) { setError('Please select an Excel file.'); return; }
    setLoading(true); setMessage(''); setError('');
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await axios.post('/api/admin/excel/upload', fd, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}`, 'Content-Type': 'multipart/form-data' }
      });
      setMessage(res.data.data?.message || 'Import completed successfully.');
      setFile(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Import failed. Please verify the file format and column headers.');
    } finally { setLoading(false); }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Excel Import</h1>
        <p>Upload a structured Excel workbook to import students, examinations, answer sheets, and faculty assignments in bulk.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>

        {/* Upload card */}
        <div className="card">
          <div className="card-header"><h2>Upload Workbook</h2></div>
          <div className="card-body">
            {message && <div className="alert alert-success">{message}</div>}
            {error && <div className="alert alert-error">{error}</div>}

            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
              onClick={() => document.getElementById('fileInput').click()}
              style={{
                border: `1.5px dashed ${dragging ? 'var(--amrita-maroon)' : file ? '#16a34a' : 'var(--border-strong)'}`,
                borderRadius: 'var(--radius-md)',
                padding: '36px 20px',
                textAlign: 'center',
                cursor: 'pointer',
                background: dragging ? 'var(--accent-light)' : file ? '#f0fdf4' : 'var(--bg-subtle)',
                transition: 'all 0.15s',
                marginBottom: '16px',
                color: file ? '#166534' : 'var(--text-muted)',
              }}
            >
              <div style={{ marginBottom: '10px' }}>
                <UploadIcon />
              </div>
              {file ? (
                <>
                  <p style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '3px' }}>{file.name}</p>
                  <p style={{ fontSize: '0.75rem' }}>{(file.size / 1024).toFixed(1)} KB &nbsp;·&nbsp; Click to change file</p>
                </>
              ) : (
                <>
                  <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '3px' }}>
                    Drop file here or click to browse
                  </p>
                  <p style={{ fontSize: '0.75rem' }}>.xlsx and .xls files supported</p>
                </>
              )}
              <input id="fileInput" type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading || !file}
              className="btn btn-primary btn-full"
            >
              {loading ? 'Importing data...' : 'Upload & Import'}
            </button>
          </div>
        </div>

        {/* Schema reference */}
        <div className="card">
          <div className="card-header"><h2>Required Column Headers</h2></div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Column Name</th>
                <th>Example Value</th>
              </tr>
            </thead>
            <tbody>
              {COLUMNS.map(([col, ex]) => (
                <tr key={col}>
                  <td><code>{col}</code></td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{ex}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
