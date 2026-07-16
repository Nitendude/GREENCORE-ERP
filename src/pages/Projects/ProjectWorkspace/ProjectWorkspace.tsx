import { Suspense, lazy, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Dropdown from 'react-bootstrap/Dropdown';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import Breadcrumbs from '../../../components/layout/Breadcrumbs';
import StatusBadge from '../../../components/ui/StatusBadge';
import ConfirmModal from '../../../components/ui/ConfirmModal';
import EmptyState from '../../../components/ui/EmptyState';
import ProjectFormModal from '../ProjectFormModal';
import { useData } from '../../../store/DataContext';
import { useAuth } from '../../../store/AuthContext';
import { formatCurrency, formatDate } from '../../../utils/format';
import type { ProjectStatus } from '../../../types';

const OverviewTab = lazy(() => import('./tabs/OverviewTab'));
const TasksTab = lazy(() => import('./tabs/TasksTab'));
const ScheduleTab = lazy(() => import('./tabs/ScheduleTab'));
const TeamTab = lazy(() => import('./tabs/TeamTab'));
const DocumentsTab = lazy(() => import('./tabs/DocumentsTab'));
const FinancialsTab = lazy(() => import('./tabs/FinancialsTab'));
const ProcurementTab = lazy(() => import('./tabs/ProcurementTab'));
const MaterialsTab = lazy(() => import('./tabs/MaterialsTab'));
const IssuesTab = lazy(() => import('./tabs/IssuesTab'));
const DailyUpdatesTab = lazy(() => import('./tabs/DailyUpdatesTab'));
const AuditTrailTab = lazy(() => import('./tabs/AuditTrailTab'));

const TABS = [
  { key: 'overview', label: 'Overview', icon: 'bi-house' },
  { key: 'tasks', label: 'Tasks & Milestones', icon: 'bi-check2-square' },
  { key: 'schedule', label: 'Schedule', icon: 'bi-calendar3' },
  { key: 'team', label: 'Team & Stakeholders', icon: 'bi-people' },
  { key: 'documents', label: 'Documents', icon: 'bi-folder2-open' },
  { key: 'financials', label: 'Financials', icon: 'bi-cash-coin' },
  { key: 'procurement', label: 'Procurement', icon: 'bi-cart-check' },
  { key: 'materials', label: 'Materials', icon: 'bi-box-seam' },
  { key: 'issues', label: 'Issues & Risks', icon: 'bi-exclamation-diamond' },
  { key: 'daily-updates', label: 'Daily Updates', icon: 'bi-journal-text' },
  { key: 'audit-trail', label: 'Audit Trail', icon: 'bi-clock-history' },
];

const STATUS_FLOW: ProjectStatus[] = ['Planning', 'Mobilization', 'In Progress', 'On Hold', 'Delayed', 'For Inspection', 'Completed', 'Closed', 'Cancelled'];
const CONFIRM_REQUIRED_STATUSES: ProjectStatus[] = ['On Hold', 'Cancelled', 'Completed', 'Closed'];

export default function ProjectWorkspace() {
  const { projectId, tab = 'overview' } = useParams();
  const navigate = useNavigate();
  const { projects, changeProjectStatus, updateProject } = useData();
  const { can, currentUser } = useAuth();
  const [showEdit, setShowEdit] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<ProjectStatus | null>(null);

  const project = projects.find(p => p.id === projectId);

  if (!project) {
    return (
      <div>
        <Breadcrumbs items={[{ label: 'Projects', to: '/projects' }, { label: 'Not found' }]} />
        <EmptyState icon="bi-kanban" title="Project not found" message="This project may have been removed or the link is incorrect." actionLabel="Back to Projects" onAction={() => navigate('/projects')} />
      </div>
    );
  }

  const financialsAuthorized = can('projects.financials.view');
  const canEdit = can('projects.edit');

  const handleStatusSelect = (status: ProjectStatus) => {
    if (status === project.status) return;
    setPendingStatus(status);
  };

  const confirmStatusChange = (remarks: string) => {
    if (!pendingStatus) return;
    changeProjectStatus(project.id, pendingStatus, currentUser.name, remarks || `Status changed to ${pendingStatus}`);
    setPendingStatus(null);
  };

  const renderTab = () => {
    switch (tab) {
      case 'overview': return <OverviewTab project={project} />;
      case 'tasks': return <TasksTab project={project} />;
      case 'schedule': return <ScheduleTab project={project} />;
      case 'team': return <TeamTab project={project} />;
      case 'documents': return <DocumentsTab project={project} />;
      case 'financials': return <FinancialsTab project={project} />;
      case 'procurement': return <ProcurementTab project={project} />;
      case 'materials': return <MaterialsTab project={project} />;
      case 'issues': return <IssuesTab project={project} />;
      case 'daily-updates': return <DailyUpdatesTab project={project} />;
      case 'audit-trail': return <AuditTrailTab project={project} />;
      default: return <OverviewTab project={project} />;
    }
  };

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Projects', to: '/projects' }, { label: project.name }]} />

      <div className="workspace-header mt-2">
        <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
          <div className="min-w-0">
            <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
              <h4 className="mb-0 fw-bold">{project.name}</h4>
              <span className="text-secondary">{project.code}</span>
              <StatusBadge status={project.status} />
              <StatusBadge status={project.priority} />
            </div>
            <div className="workspace-header-meta">
              <span><strong>Client:</strong> {project.client}</span>
              <span><strong>Location:</strong> {project.location}</span>
              <span><strong>PM:</strong> {project.projectManager}</span>
              <span><strong>Start:</strong> {formatDate(project.startDate)}</span>
              <span><strong>Target:</strong> {formatDate(project.targetCompletionDate)}</span>
              {financialsAuthorized && <span><strong>Contract Value:</strong> {formatCurrency(project.contractValue)}</span>}
            </div>
          </div>
          <div className="d-flex align-items-center gap-2">
            {canEdit && (
              <Button variant="outline-primary" size="sm" onClick={() => setShowEdit(true)}>
                <i className="bi bi-pencil me-1" /> Edit Project
              </Button>
            )}
            <Dropdown align="end">
              <Dropdown.Toggle variant="primary" size="sm" id="project-more-actions">
                More Actions
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Header>Change Status</Dropdown.Header>
                {STATUS_FLOW.map(s => (
                  <Dropdown.Item key={s} active={s === project.status} disabled={!canEdit} onClick={() => handleStatusSelect(s)}>
                    {s}
                  </Dropdown.Item>
                ))}
                {project.sourceBidId && (
                  <>
                    <Dropdown.Divider />
                    <Dropdown.Item onClick={() => navigate(`/bidding/${project.sourceBidId}/overview`)}>
                      <i className="bi bi-briefcase me-2" /> View Source Bid
                    </Dropdown.Item>
                  </>
                )}
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </div>
        <div className="mt-3">
          <div className="d-flex justify-content-between small text-secondary mb-1">
            <span>Overall Progress</span>
            <span>{project.progress}%</span>
          </div>
          <div className="workspace-progress-track"><div className="workspace-progress-fill" style={{ width: `${project.progress}%` }} /></div>
        </div>
      </div>

      <div className="tab-scroll-nav">
        <ul className="nav nav-tabs">
          {TABS.map(t => (
            <li className="nav-item" key={t.key}>
              <button
                className={`nav-link ${tab === t.key ? 'active' : ''}`}
                onClick={() => navigate(`/projects/${project.id}/${t.key}`)}
              >
                <i className={`bi ${t.icon} me-1`} /> {t.label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <Suspense fallback={<div className="d-flex justify-content-center py-5"><Spinner animation="border" size="sm" /></div>}>
        {renderTab()}
      </Suspense>

      <ProjectFormModal
        show={showEdit}
        project={project}
        onClose={() => setShowEdit(false)}
        onSave={(updated) => {
          updateProject(project.id, updated, currentUser.name);
          setShowEdit(false);
        }}
      />

      <ConfirmModal
        show={pendingStatus !== null}
        title={`Change status to "${pendingStatus}"`}
        body={
          pendingStatus && CONFIRM_REQUIRED_STATUSES.includes(pendingStatus)
            ? <span>This is a significant status change. Please provide remarks explaining the reason.</span>
            : <span>Confirm changing project status from <strong>{project.status}</strong> to <strong>{pendingStatus}</strong>.</span>
        }
        confirmLabel="Change Status"
        variant={pendingStatus && CONFIRM_REQUIRED_STATUSES.includes(pendingStatus) ? 'warning' : 'primary'}
        requireRemarks={pendingStatus ? CONFIRM_REQUIRED_STATUSES.includes(pendingStatus) : false}
        onConfirm={confirmStatusChange}
        onCancel={() => setPendingStatus(null)}
      />
    </div>
  );
}
