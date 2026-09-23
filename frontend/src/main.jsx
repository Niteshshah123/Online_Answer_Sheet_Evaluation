import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import App from './App';
import './index.css';
import { ThemeProvider } from './context/ThemeContext';

// Auto-redirect on expired/invalid token (401 Unauthorized only)
axios.interceptors.response.use(
  res => res,
  err => {
    // Only redirect to login when session is actually unauthenticated / expired (401)
    // 403 Forbidden errors are business/permission errors and should be handled by components
    if (err.response?.status === 401) {
      const url = err.config?.url || '';
      if (url.includes('/api/faculty/')) {
        localStorage.removeItem('facultyToken');
        if (!window.location.pathname.startsWith('/faculty/login')) window.location.href = '/faculty/login';
      } else if (url.includes('/api/admin/')) {
        localStorage.removeItem('adminToken');
        if (!window.location.pathname.startsWith('/login')) window.location.href = '/login';
      } else if (url.includes('/api/student/')) {
        localStorage.removeItem('studentToken');
        if (!window.location.pathname.startsWith('/student/login')) window.location.href = '/student/login';
      }
    }
    return Promise.reject(err);
  }
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
