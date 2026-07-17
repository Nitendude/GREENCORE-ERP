import { Link } from 'react-router-dom';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Breadcrumbs from '../../components/layout/Breadcrumbs';
import SummaryCard from '../../components/ui/SummaryCard';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import { useData } from '../../store/DataContext';
import { useAuth } from '../../store/AuthContext';
import { formatCompactCurrency, formatDate, formatDateTime, daysUntil, isOverdue } from '../../utils/format';

const ACTIVE_PROJECT_STATUSES = ['Planning', 'Mobilization', 'In Progress', 'On Hold', 'Delayed', 'For Inspection'];
const CLOSED_PROJECT_STATUSES = ['Completed', 'Closed'];
const ACTIVE_BID_STAGES = [
  'Lead / Opportunity', 'For Review', 'Go/No-Go Decision', 'Preparing Requirements', 'Cost Estimation',
  'Internal Review', 'For Approval', 'Ready for Submission', 'Submitted', 'Under Evaluation', 'Negotiation',
];

export default function Dashboard() {
  const { projects: allProjects, bids: allBids, tasks, auditLog } = useData();
  const { currentUser, can, scopeByBranch, effectiveBranch } = useAuth();
  const projects = scopeByBranch(allProjects);
  const bids = scopeByBranch(allBids);

  const activeProjects = projects.filter(p => ACTIVE_PROJECT_STATUSES.includes(p.status));
  const atRiskProjects = projects.filter(p =>
    ACTIVE_PROJECT_STATUSES.includes(p.status) &&
    (p.health.cost === 'Critical' || p.health.schedule === 'Critical' || p.health.cost === 'Watch' || p.health.schedule === 'Watch'));
  const delayedProjects = projects.filter(p => p.status === 'Delayed');
  const completedProjects = projects.filter(p => CLOSED_PROJECT_STATUSES.includes(p.status));

  const activeBids = bids.filter(b => ACTIVE_BID_STAGES.includes(b.stage));
  const bidsDueSoon = bids.filter(b => ACTIVE_BID_STAGES.includes(b.stage) && daysUntil(b.submissionDeadline) <= 7 && daysUntil(b.submissionDeadline) >= 0);
  const awardedBids = bids.filter(b => b.stage === 'Awarded');
  const lostBids = bids.filter(b => b.stage === 'Lost');

  const totalContractValue = [...activeProjects, ...completedProjects].reduce((sum, p) => sum + p.contractValue, 0);
  const projectExpenses = projects.reduce((sum, p) => sum + p.financials.actualExpenses, 0);
  const outstandingBillings = projects.reduce((sum, p) => sum + (p.financials.billed - p.financials.paymentsReceived), 0);

  const upcomingMilestones = projects
    .flatMap(p => p.milestones.filter(m => m.status !== 'Completed').map(m => ({ ...m, projectName: p.name, projectId: p.id })))
    .sort((a, b) => daysUntil(a.dueDate) - daysUntil(b.dueDate))
    .slice(0, 5);

  const upcomingBidDeadlines = activeBids
    .slice()
    .sort((a, b) => daysUntil(a.submissionDeadline) - daysUntil(b.submissionDeadline))
    .slice(0, 5);

  const scopedProjectIds = new Set(projects.map(p => p.id));
  const tasksNeedingAttention = tasks
    .filter(t => scopedProjectIds.has(t.projectId))
    .filter(t => t.status === 'Blocked' || (t.status !== 'Completed' && isOverdue(t.dueDate)))
    .slice(0, 6);

  const recentActivity = auditLog.slice(0, 8);

  const financialsAuthorized = can('projects.financials.view');

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Dashboard' }]} />
      <div className="d-flex justify-content-between align-items-end flex-wrap gap-2 mt-2 mb-4">
        <div>
          <h4 className="mb-0 fw-bold">Welcome back, {currentUser.name.split(' ')[0]}</h4>
          <p className="text-secondary mb-0">
            {effectiveBranch
              ? <>Viewing the <strong>{effectiveBranch.name}</strong> scope — {effectiveBranch.location}.</>
              : "Here's what's happening across every branch today."}
          </p>
        </div>
      </div>

      <h6 className="text-uppercase text-secondary small fw-bold mb-2">Projects</h6>
      <Row className="g-3 mb-4">
        <Col xs={12} sm={6} lg={3}>
          <SummaryCard label="Active Projects" value={activeProjects.length} icon="bi-kanban" variant="primary" to="/projects" />
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <SummaryCard label="Projects At Risk" value={atRiskProjects.length} icon="bi-exclamation-triangle" variant="warning" to="/projects?risk=1" />
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <SummaryCard label="Delayed Projects" value={delayedProjects.length} icon="bi-hourglass-split" variant="danger" to="/projects?status=Delayed" />
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <SummaryCard label="Completed Projects" value={completedProjects.length} icon="bi-check-circle" variant="success" to="/projects?status=Completed" />
        </Col>
      </Row>

      <h6 className="text-uppercase text-secondary small fw-bold mb-2">Bidding Pipeline</h6>
      <Row className="g-3 mb-4">
        <Col xs={12} sm={6} lg={3}>
          <SummaryCard label="Active Bids" value={activeBids.length} icon="bi-briefcase" variant="primary" to="/bidding" />
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <SummaryCard label="Bids Due Soon" value={bidsDueSoon.length} icon="bi-alarm" variant="warning" to="/bidding?dueSoon=1" />
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <SummaryCard label="Awarded Bids" value={awardedBids.length} icon="bi-trophy" variant="success" to="/bidding?stage=Awarded" />
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <SummaryCard label="Lost Bids" value={lostBids.length} icon="bi-x-circle" variant="danger" to="/bidding?stage=Lost" />
        </Col>
      </Row>

      {financialsAuthorized && (
        <>
          <h6 className="text-uppercase text-secondary small fw-bold mb-2">Financial Snapshot</h6>
          <Row className="g-3 mb-4">
            <Col xs={12} sm={6} lg={4}>
              <SummaryCard label="Total Contract Value" value={formatCompactCurrency(totalContractValue)} icon="bi-file-earmark-text" variant="primary" to="/financials" />
            </Col>
            <Col xs={12} sm={6} lg={4}>
              <SummaryCard label="Project Expenses" value={formatCompactCurrency(projectExpenses)} icon="bi-cash-stack" variant="info" to="/financials" />
            </Col>
            <Col xs={12} sm={6} lg={4}>
              <SummaryCard label="Outstanding Billings" value={formatCompactCurrency(outstandingBillings)} icon="bi-receipt" variant="warning" to="/financials" />
            </Col>
          </Row>
        </>
      )}

      <Row className="g-3">
        <Col xs={12} lg={6}>
          <div className="section-card h-100 p-3">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="mb-0 fw-bold">Upcoming Deadlines</h6>
            </div>
            {upcomingMilestones.length === 0 && upcomingBidDeadlines.length === 0 ? (
              <EmptyState icon="bi-calendar-check" title="No upcoming deadlines" />
            ) : (
              <ul className="list-unstyled mb-0 d-flex flex-column gap-2">
                {upcomingMilestones.map(m => (
                  <li key={`${m.projectId}-${m.id}`} className="d-flex justify-content-between align-items-center border-bottom pb-2">
                    <div className="min-w-0">
                      <Link to={`/projects/${m.projectId}/schedule`} className="fw-semibold text-decoration-none small d-block text-truncate">{m.name}</Link>
                      <span className="text-secondary small">{m.projectName}</span>
                    </div>
                    <StatusBadge status={m.status} />
                  </li>
                ))}
                {upcomingBidDeadlines.map(b => (
                  <li key={b.id} className="d-flex justify-content-between align-items-center border-bottom pb-2">
                    <div className="min-w-0">
                      <Link to={`/bidding/${b.id}/overview`} className="fw-semibold text-decoration-none small d-block text-truncate">{b.title}</Link>
                      <span className="text-secondary small">Due {formatDate(b.submissionDeadline)}</span>
                    </div>
                    <StatusBadge status={b.stage} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Col>
        <Col xs={12} lg={6}>
          <div className="section-card h-100 p-3">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="mb-0 fw-bold">Tasks Requiring Attention</h6>
              <Link to="/tasks" className="small">View all</Link>
            </div>
            {tasksNeedingAttention.length === 0 ? (
              <EmptyState icon="bi-check2-square" title="No urgent tasks" message="Nothing overdue or blocked right now." />
            ) : (
              <ul className="list-unstyled mb-0 d-flex flex-column gap-2">
                {tasksNeedingAttention.map(t => {
                  const project = projects.find(p => p.id === t.projectId);
                  return (
                    <li key={t.id} className="d-flex justify-content-between align-items-center border-bottom pb-2">
                      <div className="min-w-0">
                        <Link to={`/projects/${t.projectId}/tasks`} className="fw-semibold text-decoration-none small d-block text-truncate">{t.name}</Link>
                        <span className="text-secondary small">{project?.name} • {t.assignee}</span>
                      </div>
                      <StatusBadge status={t.status} />
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Col>
        <Col xs={12}>
          <div className="section-card p-3">
            <h6 className="mb-3 fw-bold">Recent Activity</h6>
            {recentActivity.length === 0 ? (
              <EmptyState icon="bi-clock-history" title="No recent activity" />
            ) : (
              <ul className="list-unstyled mb-0 d-flex flex-column gap-2">
                {recentActivity.map(a => (
                  <li key={a.id} className="d-flex justify-content-between align-items-start border-bottom pb-2 flex-wrap gap-1">
                    <span className="small"><strong>{a.user}</strong> — {a.action}</span>
                    <span className="text-secondary small">{formatDateTime(a.timestamp)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Col>
      </Row>
    </div>
  );
}
