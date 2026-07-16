import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Dropdown from 'react-bootstrap/Dropdown';
import Form from 'react-bootstrap/Form';
import Badge from 'react-bootstrap/Badge';
import { useAuth } from '../../store/AuthContext';
import { useData } from '../../store/DataContext';
import { formatDateTime } from '../../utils/format';
import { getNotificationLink } from '../../utils/notificationLink';
import type { Role } from '../../types';

const ROLES: Role[] = [
  'Administrator', 'Management', 'Project Manager', 'Bidding Manager',
  'Estimator', 'Finance', 'Procurement', 'Project Staff', 'Viewer',
];

interface TopbarProps {
  onToggleSidebar: () => void;
  onToggleMobileSidebar: () => void;
}

export default function Topbar({ onToggleSidebar, onToggleMobileSidebar }: TopbarProps) {
  const { currentUser, allUsers, switchUser } = useAuth();
  const { notifications, markNotificationRead, markAllNotificationsRead, tasks, documents, purchaseOrders, projects, bids } = useData();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim().toLowerCase();
    if (!q) return;
    const project = projects.find(p => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q));
    if (project) { navigate(`/projects/${project.id}`); setQuery(''); return; }
    const bid = bids.find(b => b.title.toLowerCase().includes(q) || b.reference.toLowerCase().includes(q));
    if (bid) { navigate(`/bidding/${bid.id}`); setQuery(''); return; }
    navigate(`/projects?search=${encodeURIComponent(query.trim())}`);
    setQuery('');
  };

  const usersByRole = ROLES.map(role => ({ role, users: allUsers.filter(u => u.role === role) }));

  return (
    <header className="app-topbar">
      <button className="topbar-icon-btn d-none d-lg-inline-flex" onClick={onToggleSidebar} aria-label="Toggle sidebar">
        <i className="bi bi-layout-sidebar-inset" />
      </button>
      <button className="topbar-icon-btn d-lg-none" onClick={onToggleMobileSidebar} aria-label="Open menu">
        <i className="bi bi-list" />
      </button>

      <Form className="topbar-search" onSubmit={handleSearchSubmit} role="search">
        <i className="bi bi-search topbar-search-icon" aria-hidden="true" />
        <Form.Control
          type="search"
          placeholder="Search projects, bids, codes..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          aria-label="Global search"
        />
      </Form>

      <div className="topbar-actions">
        <Dropdown align="end">
          <Dropdown.Toggle as="button" className="topbar-icon-btn topbar-bell" aria-label="Notifications">
            <i className="bi bi-bell" />
            {unreadCount > 0 && <Badge bg="danger" pill className="topbar-bell-badge">{unreadCount}</Badge>}
          </Dropdown.Toggle>
          <Dropdown.Menu className="notification-menu">
            <div className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom">
              <strong className="small">Notifications</strong>
              {unreadCount > 0 && (
                <button className="btn btn-link btn-sm p-0" onClick={markAllNotificationsRead}>Mark all read</button>
              )}
            </div>
            {notifications.length === 0 && <div className="px-3 py-4 text-center text-secondary small">No notifications</div>}
            {notifications.slice(0, 8).map(n => (
              <Dropdown.Item
                key={n.id}
                className={`notification-item ${!n.read ? 'notification-unread' : ''}`}
                onClick={() => {
                  markNotificationRead(n.id);
                  navigate(getNotificationLink(n, { tasks, documents, purchaseOrders }));
                }}
              >
                <div className="d-flex justify-content-between gap-2">
                  <span className="fw-semibold small">{n.title}</span>
                  {!n.read && <span className="notification-dot" aria-label="Unread" />}
                </div>
                <div className="small text-secondary">{n.message}</div>
                <div className="notification-time">{formatDateTime(n.timestamp)}</div>
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        </Dropdown>

        <Dropdown align="end">
          <Dropdown.Toggle as="button" className="topbar-user-btn">
            <span className="avatar-circle" style={{ background: currentUser.avatarColor }}>
              {currentUser.name.split(' ').map(p => p[0]).join('').slice(0, 2)}
            </span>
            <span className="d-none d-md-flex flex-column align-items-start lh-sm">
              <span className="fw-semibold small">{currentUser.name}</span>
              <span className="text-secondary" style={{ fontSize: '0.75rem' }}>{currentUser.role}</span>
            </span>
            <i className="bi bi-chevron-down small" />
          </Dropdown.Toggle>
          <Dropdown.Menu>
            <Dropdown.Header>Switch role (demo)</Dropdown.Header>
            {usersByRole.map(({ role, users }) => users.map(u => (
              <Dropdown.Item
                key={u.id}
                active={u.id === currentUser.id}
                onClick={() => switchUser(u.id)}
              >
                <span className="avatar-circle avatar-circle-sm me-2" style={{ background: u.avatarColor }}>
                  {u.name.split(' ').map(p => p[0]).join('').slice(0, 2)}
                </span>
                {u.name} <span className="text-secondary small">— {role}</span>
              </Dropdown.Item>
            )))}
            <Dropdown.Divider />
            <Dropdown.Item onClick={() => navigate('/settings')}>
              <i className="bi bi-gear me-2" /> Settings
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>
    </header>
  );
}
