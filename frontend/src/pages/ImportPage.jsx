import { useState } from 'react';
import axios from 'axios';

export default function ImportPage() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) {
      setMessage('Please choose an Excel file.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('/api/admin/excel/upload', formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setMessage(`Imported successfully: ${response.data.data?.message || 'done'}`);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Import failed.');
    }
  };

  return (
    <div>
      <h2>Import Excel Data</h2>
      <p className="muted">Upload a workbook containing students, exams, answer sheets, answer keys, or evaluations.</p>
      <div className="card" style={{ marginTop: '16px' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Select Excel file</label>
            <input type="file" accept=".xlsx,.xls" onChange={(e) => setFile(e.target.files[0])} />
          </div>
          <button type="submit">Upload</button>
        </form>
        {message && <p className="muted" style={{ marginTop: '12px' }}>{message}</p>}
      </div>
    </div>
  );
}
