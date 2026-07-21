import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function FacultyAssignmentsPage() {
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const load = async () => {
    try {
      const response = await axios.get('/api/faculty/assignments', {
        headers: { Authorization: `Bearer ${localStorage.getItem('facultyToken')}` }
      });
      setItems(response.data.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Assigned Evaluation Tasks</h2>
          <p className="muted">One student sheet per row. Open the sheet to evaluate assigned questions.</p>
        </div>
      </div>
      {message && <p className="muted">{message}</p>}
      <div className="card" style={{ marginTop: '16px' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Exam</th>
              <th>Question Range</th>
              <th>Status</th>
              <th>Counts</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.sheetId}>
                <td>{item.studentName} ({item.registrationNumber})</td>
                <td>{item.examName} {item.examContext}</td>
                <td>{item.questionRange}</td>
                <td>{item.status}</td>
                <td>{Object.entries(item.evaluationSummary || {}).map(([status, count]) => `${status}: ${count}`).join(', ')}</td>
                <td>
                  <button className="secondary" onClick={() => navigate(`/faculty/evaluate/${item.sheetId}`)}>Open Sheet</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
