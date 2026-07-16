import { Suspense, lazy, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Dropdown from 'react-bootstrap/Dropdown';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import Breadcrumbs from '../../../components/layout/Breadcrumbs';
import StatusBadge from '../../../components/ui/StatusBadge';
import ConfirmModal from '../../../components/ui/ConfirmModal';
import EmptyState from '../../../components/ui/EmptyState';
import BidFormEditModal from './BidFormEditModal';
import GoNoGoModal from './GoNoGoModal';
import ConvertToProjectModal from './ConvertToProjectModal';
import { useData } from '../../../store/DataContext';
import { useAuth } from '../../../store/AuthContext';
import { formatCurrency, formatDate, daysUntil } from '../../../utils/format';
import type { BidStage } from '../../../types';

const OverviewTab = lazy(() => import('./tabs/OverviewTab'));
const RequirementsTab = lazy(() => import('./tabs/RequirementsTab'));
const CostEstimateTab = lazy(() => import('./tabs/CostEstimateTab'));
const DocumentsTab = lazy(() => import('./tabs/DocumentsTab'));
const TeamTab = lazy(() => import('./tabs/TeamTab'));
const ClarificationsTab = lazy(() => import('./tabs/ClarificationsTab'));
const ApprovalsTab = lazy(() => import('./tabs/ApprovalsTab'));
const ResultTab = lazy(() => import('./tabs/ResultTab'));

const TABS = [
  { key: 'overview', label: 'Overview', icon: 'bi-house' },
  { key: 'requirements', label: 'Requirements & Checklist', icon: 'bi-clipboard-check' },
  { key: 'cost-estimate', label: 'Cost Estimate', icon: 'bi-calculator' },
  { key: 'documents', label: 'Documents', icon: 'bi-folder2-open' },
  { key: 'team', label: 'Team & Assignments', icon: 'bi-people' },
  { key: 'clarifications', label: 'Clarifications & Activities', icon: 'bi-chat-left-text' },
  { key: 'approvals', label: 'Approvals', icon: 'bi-check2-circle' },
  { key: 'result', label: 'Result & Lessons Learned', icon: 'bi-award' },
];

const ALL_STAGES: BidStage[] = [
  'Lead / Opportunity', 'For Review', 'Go/No-Go Decision', 'Preparing Requirements', 'Cost Estimation',
  'Internal Review', 'For Approval', 'Ready for Submission', 'Submitted', 'Under Evaluation',
  'Negotiation', 'Awarded', 'Lost', 'Withdrawn', 'Cancelled',
];
const CONFIRM_REQUIRED_STAGES: BidStage[] = ['Awarded', 'Lost', 'Withdrawn', 'Cancelled'];

export default function BidWorkspace() {
  const { bidId, tab = 'overview' } = useParams();
  const navigate = useNavigate();
  const { bids, changeBidStage } = useData();
  const { can, currentUser } = useAuth();
  const [showEdit, setShowEdit] = useState(false);
  const [showGoNoGo, setShowGoNoGo] = useState(false);
  const [showConvert, setShowConvert] = useState(false);
  const [pendingStage, setPendingStage] = useState<BidStage | null>(null);

  const bid = bids.find(b => b.id === bidId);

  if (!bid) {
    return (
      <div>
        <Breadcrumbs items={[{ label: 'Bidding', to: '/bidding' }, { label: 'Not found' }]} />
        <EmptyState icon="bi-briefcase" title="Bid not found" actionLabel="Back to Bidding" onAction={() => navigate('/bidding')} />
      </div>
    );
  }

  const canManage = can('bidding.manage');
  const canConvert = can('bidding.convert');
  const daysLeft = daysUntil(bid.submissionDeadline);

  const handleStageSelect = (stage: BidStage) => {
    if (stage === bid.stage) return;
    setPendingStage(stage);
  };

  const confirmStageChange = (remarks: string) => {
    if (!pendingStage) return;
    changeBidStage(bid.id, pendingStage, currentUser.name, remarks || `Stage changed to ${pendingStage}`);
    setPendingStage(null);
  };

  const renderTab = () => {
    switch (tab) {
      case 'overview': return <OverviewTab bid={bid} />;
      case 'requirements': return <RequirementsTab bid={bid} />;
      case 'cost-estimate': return <CostEstimateTab bid={bid} />;
      case 'documents': return <DocumentsTab bid={bid} />;
      case 'team': return <TeamTab bid={bid} />;
      case 'clarifications': return <ClarificationsTab bid={bid} />;
      case 'approvals': return <ApprovalsTab bid={bid} />;
      case 'result': return <ResultTab bid={bid} />;
      default: return <OverviewTab bid={bid} />;
    }
  };

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Bidding', to: '/bidding' }, { label: bid.title }]} />

      <div className="workspace-header mt-2">
        <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
          <div className="min-w-0">
            <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
              <h4 className="mb-0 fw-bold">{bid.title}</h4>
              <span className="text-secondary">{bid.reference}</span>
              <StatusBadge status={bid.stage} />
            </div>
            <div className="workspace-header-meta">
              <span><strong>Client:</strong> {bid.client}</span>
              <span><strong>Location:</strong> {bid.location}</span>
              <span><strong>Bid Owner:</strong> {bid.bidOwner}</span>
              <span><strong>Est. Value:</strong> {formatCurrency(bid.estimatedValue)}</span>
              <span><strong>Deadline:</strong> {formatDate(bid.submissionDeadline)}{daysLeft >= 0 ? ` (${daysLeft}d left)` : ' (past)'}</span>
              <span><strong>Win Probability:</strong> {bid.probability}%</span>
            </div>
          </div>
          <div className="d-flex align-items-center gap-2">
            {bid.stage === 'Awarded' && !bid.convertedProjectId && canConvert && (
              <Button variant="success" size="sm" onClick={() => setShowConvert(true)}>
                <i className="bi bi-arrow-right-circle me-1" /> Convert to Project
              </Button>
            )}
            {bid.convertedProjectId && (
              <Button variant="outline-success" size="sm" onClick={() => navigate(`/projects/${bid.convertedProjectId}`)}>
                <i className="bi bi-box-arrow-up-right me-1" /> View Project
              </Button>
            )}
            {canManage && (
              <Button variant="outline-primary" size="sm" onClick={() => setShowEdit(true)}>
                <i className="bi bi-pencil me-1" /> Edit Bid
              </Button>
            )}
            <Dropdown align="end">
              <Dropdown.Toggle variant="primary" size="sm" id="bid-more-actions">More Actions</Dropdown.Toggle>
              <Dropdown.Menu>
                {canManage && (
                  <Dropdown.Item onClick={() => setShowGoNoGo(true)}>
                    <i className="bi bi-signpost-split me-2" /> Go/No-Go Assessment
                  </Dropdown.Item>
                )}
                <Dropdown.Divider />
                <Dropdown.Header>Change Stage</Dropdown.Header>
                {ALL_STAGES.map(s => (
                  <Dropdown.Item key={s} active={s === bid.stage} disabled={!canManage} onClick={() => handleStageSelect(s)}>
                    {s}
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </div>
        <p className="text-secondary small mt-3 mb-1">{bid.description}</p>
        <div className="small"><strong>Next Action:</strong> {bid.nextAction}</div>
      </div>

      <div className="tab-scroll-nav">
        <ul className="nav nav-tabs">
          {TABS.map(t => (
            <li className="nav-item" key={t.key}>
              <button className={`nav-link ${tab === t.key ? 'active' : ''}`} onClick={() => navigate(`/bidding/${bid.id}/${t.key}`)}>
                <i className={`bi ${t.icon} me-1`} /> {t.label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <Suspense fallback={<div className="d-flex justify-content-center py-5"><Spinner animation="border" size="sm" /></div>}>
        {renderTab()}
      </Suspense>

      <BidFormEditModal show={showEdit} bid={bid} onClose={() => setShowEdit(false)} />
      <GoNoGoModal show={showGoNoGo} bid={bid} onClose={() => setShowGoNoGo(false)} />
      <ConvertToProjectModal show={showConvert} bid={bid} onClose={() => setShowConvert(false)} onConverted={(projectId) => navigate(`/projects/${projectId}`)} />

      <ConfirmModal
        show={pendingStage !== null}
        title={`Change stage to "${pendingStage}"`}
        body={
          pendingStage && CONFIRM_REQUIRED_STAGES.includes(pendingStage)
            ? <span>This is a final outcome stage. Please provide remarks explaining the reason.</span>
            : <span>Confirm changing bid stage from <strong>{bid.stage}</strong> to <strong>{pendingStage}</strong>.</span>
        }
        confirmLabel="Change Stage"
        variant={pendingStage && CONFIRM_REQUIRED_STAGES.includes(pendingStage) ? 'warning' : 'primary'}
        requireRemarks={pendingStage ? CONFIRM_REQUIRED_STAGES.includes(pendingStage) : false}
        onConfirm={confirmStageChange}
        onCancel={() => setPendingStage(null)}
      />
    </div>
  );
}
