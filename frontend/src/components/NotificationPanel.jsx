import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function formatRelativeTime(dateString) {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDays = Math.floor(diffHour / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

export default function NotificationPanel({ tokenKey = 'token', onClose, onNavigate }) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'UNREAD'
  const [actionLoading, setActionLoading] = useState(null); // id of item being modified

  const getHeaders = useCallback(() => {
    const token = localStorage.getItem(tokenKey);
    return { Authorization: `Bearer ${token}` };
  }, [tokenKey]);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/notifications', { headers: getHeaders() });
      const data = res.data.data || {};
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleMarkRead = async (e, id) => {
    e.stopPropagation();
    try {
      setActionLoading(id);
      await axios.put(`/api/notifications/${id}/read`, {}, { headers: getHeaders() });
      setNotifications(prev =>
        prev.map(n => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount(c => Math.max(0, c - 1));
    } catch (err) {
      console.error('Failed to mark read:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkUnread = async (e, id) => {
    e.stopPropagation();
    try {
      setActionLoading(id);
      await axios.put(`/api/notifications/${id}/unread`, {}, { headers: getHeaders() });
      setNotifications(prev =>
        prev.map(n => (n._id === id ? { ...n, isRead: false } : n))
      );
      setUnreadCount(c => c + 1);
    } catch (err) {
      console.error('Failed to mark unread:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setLoading(true);
      await axios.put('/api/notifications/read-all', {}, { headers: getHeaders() });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all read:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      setActionLoading(id);
      await axios.delete(`/api/notifications/${id}`, { headers: getHeaders() });
      const removed = notifications.find(n => n._id === id);
      if (removed && !removed.isRead) {
        setUnreadCount(c => Math.max(0, c - 1));
      }
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (err) {
      console.error('Failed to delete notification:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleClearRead = async () => {
    try {
      setLoading(true);
      await axios.delete('/api/notifications/clear-read', { headers: getHeaders() });
      setNotifications(prev => prev.filter(n => !n.isRead));
    } catch (err) {
      console.error('Failed to clear read notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = async (notif) => {
    if (!notif.isRead) {
      try {
        await axios.put(`/api/notifications/${notif._id}/read`, {}, { headers: getHeaders() });
        setNotifications(prev =>
          prev.map(n => (n._id === notif._id ? { ...n, isRead: true } : n))
        );
        setUnreadCount(c => Math.max(0, c - 1));
      } catch (err) {
        // ignore
      }
    }

    if (onClose) onClose();
    if (notif.link) {
      if (onNavigate) {
        onNavigate(notif.link);
      } else {
        navigate(notif.link);
      }
    }
  };

  const filteredNotifs = notifications.filter(n => {
    if (activeTab === 'UNREAD') return !n.isRead;
    return true;
  });

  const getIconConfig = (type) => {
    switch (type) {
      case 'DOUBT_RAISED':
        return { icon: '✋', bg: 'var(--warning-bg)', color: 'var(--warning)' };
      case 'DOUBT_REPLIED':
        return { icon: '💬', bg: 'var(--success-bg)', color: 'var(--success)' };
      case 'RESULT_PUBLISHED':
        return { icon: '📊', bg: 'rgba(56, 189, 248, 0.15)', color: 'var(--text-accent, #38bdf8)' };
      default:
        return { icon: '🔔', bg: 'var(--bg-subtle)', color: 'var(--text-secondary)' };
    }
  };

  return (
    <div
      className="topbar-dropdown notif-dropdown-panel"
      style={{
        position: 'absolute',
        top: 'calc(100% + 8px)',
        right: 0,
        width: '380px',
        maxWidth: '92vw',
        maxHeight: '520px',
        borderRadius: '14px',
        background: 'var(--bg-white)',
        border: '1px solid var(--border)',
        boxShadow: '0 12px 30px -4px rgba(0,0,0,0.18), 0 6px 12px -4px rgba(0,0,0,0.1)',
        zIndex: 1100,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
      onClick={e => e.stopPropagation()}
    >
      {/* ── Top Header ── */}
      <div style={{
        padding: '14px 16px 10px 16px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-subtle)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
              Notifications
            </span>
            {unreadCount > 0 && (
              <span style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '12px',
                background: '#EF4444',
                color: '#FFFFFF'
              }}>
                {unreadCount} new
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={fetchNotifications}
              title="Refresh"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.8rem',
                color: 'var(--text-muted)'
              }}
            >
              🔄
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                title="Close"
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  color: 'var(--text-muted)'
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* ── Tabs & Quick Actions Bar ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.74rem' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-white)', padding: '2px', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <button
              type="button"
              onClick={() => setActiveTab('ALL')}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '0.72rem',
                fontWeight: activeTab === 'ALL' ? 700 : 500,
                background: activeTab === 'ALL' ? 'var(--amrita-maroon, #A01B2D)' : 'transparent',
                color: activeTab === 'ALL' ? '#FFFFFF' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.12s ease'
              }}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('UNREAD')}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '0.72rem',
                fontWeight: activeTab === 'UNREAD' ? 700 : 500,
                background: activeTab === 'UNREAD' ? 'var(--amrita-maroon, #A01B2D)' : 'transparent',
                color: activeTab === 'UNREAD' ? '#FFFFFF' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.12s ease'
              }}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Quick Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  color: 'var(--amrita-maroon, #A01B2D)'
                }}
                title="Mark all as read"
              >
                ✓ Mark all read
              </button>
            )}
            {notifications.some(n => n.isRead) && (
              <button
                type="button"
                onClick={handleClearRead}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.72rem',
                  fontWeight: 500,
                  color: 'var(--text-muted)'
                }}
                title="Clear read notifications"
              >
                Clear read
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Notification List Body ── */}
      <div style={{ flex: 1, overflowY: 'auto', maxHeight: '380px', padding: '4px 0' }}>
        {loading && notifications.length === 0 ? (
          <div style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
            <div className="dash-loading-spinner" style={{ margin: '0 auto 8px auto' }} />
            Loading notifications...
          </div>
        ) : filteredNotifs.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>✨</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {activeTab === 'UNREAD' ? 'No Unread Notifications' : 'No Notifications Yet'}
            </div>
            <p style={{ fontSize: '0.75rem', maxWidth: '280px', margin: '4px auto 0 auto' }}>
              {activeTab === 'UNREAD'
                ? "You're all caught up! There are no unread alerts."
                : 'Updates regarding doubts, clarifications, and exam marks will appear here.'}
            </p>
          </div>
        ) : (
          filteredNotifs.map((n) => {
            const { icon, bg, color } = getIconConfig(n.type);
            const timeAgo = formatRelativeTime(n.createdAt);

            return (
              <div
                key={n._id}
                onClick={() => handleCardClick(n)}
                style={{
                  padding: '11px 14px',
                  borderBottom: '1px solid var(--border)',
                  borderLeft: `4px solid ${!n.isRead ? '#EF4444' : 'transparent'}`,
                  background: !n.isRead ? 'rgba(239, 68, 68, 0.04)' : 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '11px',
                  transition: 'background 0.12s ease',
                  position: 'relative'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
                onMouseLeave={e => e.currentTarget.style.background = !n.isRead ? 'rgba(239, 68, 68, 0.04)' : 'transparent'}
              >
                {/* Type Icon */}
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: bg,
                  color: color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.95rem',
                  flexShrink: 0
                }}>
                  {icon}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '6px' }}>
                    <span style={{
                      fontSize: '0.82rem',
                      fontWeight: !n.isRead ? 800 : 600,
                      color: 'var(--text-primary)',
                      lineHeight: 1.3
                    }}>
                      {n.title}
                    </span>
                    <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                      {timeAgo}
                    </span>
                  </div>

                  <div style={{
                    fontSize: '0.74rem',
                    color: 'var(--text-secondary)',
                    marginTop: '3px',
                    lineHeight: 1.4
                  }}>
                    {n.message}
                  </div>

                  {/* Actions Row */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: '6px',
                    fontSize: '0.68rem',
                    color: 'var(--text-muted)'
                  }}>
                    <span style={{ fontStyle: 'italic' }}>
                      {n.link ? 'Click to open ➔' : ''}
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }} onClick={e => e.stopPropagation()}>
                      {n.isRead ? (
                        <button
                          type="button"
                          onClick={(e) => handleMarkUnread(e, n._id)}
                          disabled={actionLoading === n._id}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            fontSize: '0.68rem',
                            padding: 0
                          }}
                          title="Mark as unread"
                        >
                          Mark unread
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => handleMarkRead(e, n._id)}
                          disabled={actionLoading === n._id}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--amrita-maroon, #A01B2D)',
                            fontWeight: 700,
                            cursor: 'pointer',
                            fontSize: '0.68rem',
                            padding: 0
                          }}
                          title="Mark as read"
                        >
                          ✓ Read
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, n._id)}
                        disabled={actionLoading === n._id}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#EF4444',
                          cursor: 'pointer',
                          fontSize: '0.72rem',
                          padding: 0
                        }}
                        title="Delete notification"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
