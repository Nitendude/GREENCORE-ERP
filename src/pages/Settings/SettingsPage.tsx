import { useState } from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Breadcrumbs from '../../components/layout/Breadcrumbs';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { useAuth } from '../../store/AuthContext';
import { useData } from '../../store/DataContext';
import { getPermissions } from '../../utils/permissions';

const PROJECT_STATUSES = ['Planning', 'Mobilization', 'In Progress', 'On Hold', 'Delayed', 'For Inspection', 'Completed', 'Closed', 'Cancelled'];
const BID_STAGES = [
  'Lead / Opportunity', 'For Review', 'Go/No-Go Decision', 'Preparing Requirements', 'Cost Estimation',
  'Internal Review', 'For Approval', 'Ready for Submission', 'Submitted', 'Under Evaluation',
  'Negotiation', 'Awarded', 'Lost', 'Withdrawn', 'Cancelled',
];

export default function SettingsPage() {
  const { currentUser, can } = useAuth();
  const { resetToSeed } = useData();
  const [showReset, setShowReset] = useState(false);
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [inAppNotifs, setInAppNotifs] = useState(true);

  const permissions = getPermissions(currentUser.role);

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Settings' }]} />
      <h4 className="fw-bold mt-2 mb-3">Settings</h4>

      <Row className="g-3">
        <Col xs={12} lg={6}>
          <div className="section-card p-3 mb-3">
            <h6 className="fw-bold mb-3">My Profile</h6>
            <div className="d-flex align-items-center gap-3 mb-3">
              <span className="avatar-circle" style={{ width: 56, height: 56, fontSize: '1.1rem', background: currentUser.avatarColor }}>
                {currentUser.name.split(' ').map(p => p[0]).join('').slice(0, 2)}
              </span>
              <div>
                <div className="fw-bold">{currentUser.name}</div>
                <div className="text-secondary small">{currentUser.title}</div>
                <div className="text-secondary small">{currentUser.email}</div>
              </div>
            </div>
            <div className="small"><strong>Current Role:</strong> {currentUser.role}</div>
            <Form.Text>Use the account menu in the top-right corner to switch roles for demo purposes.</Form.Text>
          </div>

          <div className="section-card p-3 mb-3">
            <h6 className="fw-bold mb-3">Notification Preferences</h6>
            <Form.Check type="switch" className="mb-2" label="In-app notifications" checked={inAppNotifs} onChange={e => setInAppNotifs(e.target.checked)} />
            <Form.Check type="switch" label="Email digest notifications" checked={emailNotifs} onChange={e => setEmailNotifs(e.target.checked)} />
            <Form.Text>Preferences are stored locally for this demo session.</Form.Text>
          </div>

          {can('settings.manage') && (
            <div className="section-card p-3 border-warning">
              <h6 className="fw-bold mb-2 text-warning-emphasis">Demo Data</h6>
              <p className="small text-secondary">Reset all projects, bids, tasks, and other records back to their original seeded state. This clears any changes made during this session.</p>
              <Button variant="outline-danger" size="sm" onClick={() => setShowReset(true)}>Reset Demo Data</Button>
            </div>
          )}
        </Col>

        <Col xs={12} lg={6}>
          <div className="section-card p-3 mb-3">
            <h6 className="fw-bold mb-2">My Permissions ({currentUser.role})</h6>
            <div className="d-flex flex-wrap gap-2">
              {permissions.filter(p => !p.startsWith('nav.')).map(p => (
                <span key={p} className="badge text-bg-light border">{p}</span>
              ))}
            </div>
          </div>

          <div className="section-card p-3 mb-3">
            <h6 className="fw-bold mb-2">Project Status Workflow</h6>
            <div className="d-flex flex-wrap gap-2">
              {PROJECT_STATUSES.map((s, i) => (
                <span key={s} className="small">{s}{i < PROJECT_STATUSES.length - 1 && <i className="bi bi-arrow-right mx-1 text-secondary" />}</span>
              ))}
            </div>
            <Form.Text>Statuses are configurable by administrators. On Hold, Cancelled, Completed, and Closed require confirmation and remarks.</Form.Text>
          </div>

          <div className="section-card p-3">
            <h6 className="fw-bold mb-2">Bid Stage Workflow</h6>
            <div className="d-flex flex-wrap gap-2">
              {BID_STAGES.map((s, i) => (
                <span key={s} className="small">{s}{i < BID_STAGES.length - 1 && <i className="bi bi-arrow-right mx-1 text-secondary" />}</span>
              ))}
            </div>
            <Form.Text>Awarded, Lost, Withdrawn, and Cancelled require confirmation and remarks.</Form.Text>
          </div>
        </Col>
      </Row>

      <ConfirmModal
        show={showReset}
        title="Reset Demo Data"
        body="This will permanently discard all changes made during this session and restore the original seeded data. This cannot be undone."
        confirmLabel="Reset Data"
        variant="danger"
        onConfirm={() => { resetToSeed(); setShowReset(false); }}
        onCancel={() => setShowReset(false)}
      />
    </div>
  );
}
