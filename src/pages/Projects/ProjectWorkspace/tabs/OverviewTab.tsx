import { useNavigate } from 'react-router-dom';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import StatusBadge from '../../../../components/ui/StatusBadge';
import EmptyState from '../../../../components/ui/EmptyState';
import { useData } from '../../../../store/DataContext';
import { useAuth } from '../../../../store/AuthContext';
import { formatCurrency, formatDate, formatDateTime } from '../../../../utils/format';
import type { Project } from '../../../../types';

function HealthPill({ label, value }: { label: string; value: 'Good' | 'Watch' | 'Critical' }) {
  return (
    <div className="health-pill">
      <span className={`health-dot health-dot-${value}`} aria-hidden="true" />
      <span>{label}: <strong>{value}</strong></span>
    </div>
  );
}

export default function OverviewTab({ project }: { project: Project }) {
  const navigate = useNavigate();
  const { auditLog } = useData();
  const { can } = useAuth();
  const financialsAuthorized = can('projects.financials.view');

  const upcomingMilestones = project.milestones.filter(m => m.status !== 'Completed').slice(0, 4);
  const recentActivity = auditLog.filter(a => a.entityType === 'project' && a.entityId === project.id).slice(0, 5);

  return (
    <Row className="g-3">
      <Col xs={12} lg={8}>
        <div className="section-card p-3 mb-3">
          <h6 className="fw-bold mb-2">Description & Scope</h6>
          <p className="mb-2">{project.description}</p>
          <p className="text-secondary small mb-0"><strong>Scope:</strong> {project.scope}</p>
        </div>

        <div className="section-card p-3 mb-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h6 className="fw-bold mb-0">Health Indicators</h6>
            <span className="text-secondary small">Current phase: <strong>{project.currentPhase}</strong></span>
          </div>
          <div className="d-flex flex-wrap gap-2">
            <HealthPill label="Cost" value={project.health.cost} />
            <HealthPill label="Schedule" value={project.health.schedule} />
            <HealthPill label="Quality" value={project.health.quality} />
            <HealthPill label="Safety" value={project.health.safety} />
          </div>
        </div>

        <Row className="g-3 mb-3">
          <Col xs={12} md={6}>
            <div className="section-card p-3 h-100">
              <h6 className="fw-bold mb-2">Schedule Summary</h6>
              <div className="d-flex justify-content-between small mb-1"><span className="text-secondary">Start Date</span><span>{formatDate(project.startDate)}</span></div>
              <div className="d-flex justify-content-between small mb-1"><span className="text-secondary">Target Completion</span><span>{formatDate(project.targetCompletionDate)}</span></div>
              <div className="d-flex justify-content-between small mb-2"><span className="text-secondary">Overall Progress</span><span>{project.progress}%</span></div>
              <div className="workspace-progress-track"><div className="workspace-progress-fill" style={{ width: `${project.progress}%` }} /></div>
            </div>
          </Col>
          <Col xs={12} md={6}>
            <div className="section-card p-3 h-100">
              <h6 className="fw-bold mb-2">Budget Summary</h6>
              {financialsAuthorized ? (
                <>
                  <div className="d-flex justify-content-between small mb-1"><span className="text-secondary">Contract Value</span><span>{formatCurrency(project.financials.contractValue)}</span></div>
                  <div className="d-flex justify-content-between small mb-1"><span className="text-secondary">Approved Budget</span><span>{formatCurrency(project.financials.approvedBudget)}</span></div>
                  <div className="d-flex justify-content-between small mb-1"><span className="text-secondary">Actual Expenses</span><span>{formatCurrency(project.financials.actualExpenses)}</span></div>
                  <div className="d-flex justify-content-between small"><span className="text-secondary">Remaining Budget</span><span>{formatCurrency(project.financials.approvedBudget - project.financials.actualExpenses)}</span></div>
                </>
              ) : (
                <p className="text-secondary small mb-0">You don't have permission to view financial details for this project.</p>
              )}
            </div>
          </Col>
        </Row>

        <div className="section-card p-3">
          <h6 className="fw-bold mb-2">Recent Activity</h6>
          {recentActivity.length === 0 ? (
            <EmptyState icon="bi-clock-history" title="No recent activity" />
          ) : (
            <ul className="list-unstyled mb-0 d-flex flex-column gap-2">
              {recentActivity.map(a => (
                <li key={a.id} className="d-flex justify-content-between border-bottom pb-2 flex-wrap gap-1">
                  <span className="small"><strong>{a.user}</strong> — {a.action}</span>
                  <span className="text-secondary small">{formatDateTime(a.timestamp)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Col>

      <Col xs={12} lg={4}>
        <div className="section-card p-3 mb-3">
          <h6 className="fw-bold mb-2">Quick Actions</h6>
          <div className="d-grid gap-2">
            <Button size="sm" variant="outline-primary" onClick={() => navigate(`/projects/${project.id}/tasks`)}><i className="bi bi-plus-lg me-1" /> Add Task</Button>
            <Button size="sm" variant="outline-primary" onClick={() => navigate(`/projects/${project.id}/daily-updates`)}><i className="bi bi-journal-plus me-1" /> Log Daily Update</Button>
            <Button size="sm" variant="outline-primary" onClick={() => navigate(`/projects/${project.id}/documents`)}><i className="bi bi-upload me-1" /> Upload Document</Button>
            <Button size="sm" variant="outline-primary" onClick={() => navigate(`/projects/${project.id}/issues`)}><i className="bi bi-exclamation-diamond me-1" /> Report Issue</Button>
          </div>
        </div>

        <div className="section-card p-3 mb-3">
          <h6 className="fw-bold mb-2">Upcoming Milestones</h6>
          {upcomingMilestones.length === 0 ? (
            <EmptyState icon="bi-flag" title="No upcoming milestones" />
          ) : (
            <ul className="list-unstyled mb-0 d-flex flex-column gap-2">
              {upcomingMilestones.map(m => (
                <li key={m.id} className="d-flex justify-content-between align-items-center">
                  <div className="min-w-0">
                    <div className="small fw-semibold text-truncate">{m.name}</div>
                    <div className="text-secondary small">{formatDate(m.dueDate)}</div>
                  </div>
                  <StatusBadge status={m.status} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="section-card p-3 mb-3">
          <h6 className="fw-bold mb-2">Current Blockers</h6>
          {project.blockers.length === 0 ? (
            <EmptyState icon="bi-check-circle" title="No active blockers" />
          ) : (
            <ul className="mb-0 ps-3 small">
              {project.blockers.map((b, idx) => <li key={idx} className="mb-1">{b}</li>)}
            </ul>
          )}
        </div>

        <div className="section-card p-3">
          <h6 className="fw-bold mb-2">Key Contacts</h6>
          {project.contacts.length === 0 ? (
            <EmptyState icon="bi-person" title="No contacts added" />
          ) : (
            <ul className="list-unstyled mb-0 d-flex flex-column gap-2">
              {project.contacts.slice(0, 4).map(c => (
                <li key={c.id}>
                  <div className="small fw-semibold">{c.name} <span className="text-secondary fw-normal">— {c.role}</span></div>
                  <div className="text-secondary small">{c.email}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Col>
    </Row>
  );
}
