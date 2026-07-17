import { Suspense, lazy, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Dropdown from 'react-bootstrap/Dropdown';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import Breadcrumbs from '../../../components/layout/Breadcrumbs';
import StatusBadge from '../../../components/ui/StatusBadge';
import EmptyState from '../../../components/ui/EmptyState';
import ConvertEstimateModal from './ConvertEstimateModal';
import { useData } from '../../../store/DataContext';
import { useAuth } from '../../../store/AuthContext';
import { computeCosting } from '../../../utils/estimation';
import { formatCurrency, formatRate, formatDate } from '../../../utils/format';
import type { QuotationStatus } from '../../../types';

const OverviewTab = lazy(() => import('./tabs/OverviewTab'));
const BoqTab = lazy(() => import('./tabs/BoqTab'));
const BomTab = lazy(() => import('./tabs/BomTab'));
const CostingTab = lazy(() => import('./tabs/CostingTab'));
const QuotationTab = lazy(() => import('./tabs/QuotationTab'));
const DesignTab = lazy(() => import('./tabs/DesignTab'));

const TABS = [
  { key: 'overview', label: 'Overview', icon: 'bi-house' },
  { key: 'boq', label: 'BOQ', icon: 'bi-list-columns-reverse' },
  { key: 'bom', label: 'BOM', icon: 'bi-boxes' },
  { key: 'costing', label: 'Costing & Markup', icon: 'bi-cash-coin' },
  { key: 'quotation', label: 'Quotation', icon: 'bi-file-earmark-text' },
  { key: 'design', label: 'Design', icon: 'bi-rulers' },
];

const STATUS_FLOW: QuotationStatus[] = ['Draft', 'Sent', 'Negotiating', 'Won', 'Lost'];

export default function EstimateWorkspace() {
  const { estimateId, tab = 'overview' } = useParams();
  const navigate = useNavigate();
  const { estimates, changeEstimateStatus } = useData();
  const { can, currentUser } = useAuth();
  const [showConvert, setShowConvert] = useState(false);

  const estimate = estimates.find(e => e.id === estimateId);
  if (!estimate) {
    return (
      <div>
        <Breadcrumbs items={[{ label: 'Estimates', to: '/estimates' }, { label: 'Not found' }]} />
        <EmptyState icon="bi-calculator" title="Estimate not found" actionLabel="Back to Estimates" onAction={() => navigate('/estimates')} />
      </div>
    );
  }

  const costing = computeCosting(estimate);
  const canManage = can('estimates.manage');
  const canConvert = can('estimates.convert');

  const renderTab = () => {
    switch (tab) {
      case 'overview': return <OverviewTab estimate={estimate} />;
      case 'boq': return <BoqTab estimate={estimate} />;
      case 'bom': return <BomTab estimate={estimate} />;
      case 'costing': return <CostingTab estimate={estimate} />;
      case 'quotation': return <QuotationTab estimate={estimate} onConvert={() => setShowConvert(true)} />;
      case 'design': return <DesignTab estimate={estimate} />;
      default: return <OverviewTab estimate={estimate} />;
    }
  };

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Estimates', to: '/estimates' }, { label: estimate.projectName }]} />

      <div className="workspace-header mt-2">
        <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
          <div className="min-w-0">
            <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
              <h4 className="mb-0 fw-bold">{estimate.projectName}</h4>
              <span className="text-secondary">{estimate.code}</span>
              <StatusBadge status={estimate.status} />
              <span className="badge text-bg-light border">{estimate.currentRevision}</span>
            </div>
            <div className="workspace-header-meta">
              <span><strong>Client:</strong> {estimate.client}</span>
              <span><strong>Location:</strong> {estimate.location}</span>
              <span><strong>Area:</strong> {estimate.grossFloorArea ? `${estimate.grossFloorArea} sqm` : '—'}</span>
              <span><strong>Estimator:</strong> {estimate.estimator}</span>
              <span><strong>Contract Price:</strong> {formatCurrency(costing.contractPrice)}</span>
              {estimate.grossFloorArea > 0 && <span><strong>≈ {formatRate(costing.perSqm)}/sqm</strong></span>}
            </div>
          </div>
          <div className="d-flex align-items-center gap-2">
            {estimate.status === 'Won' && !estimate.convertedProjectId && canConvert && (
              <Button variant="success" size="sm" onClick={() => setShowConvert(true)}><i className="bi bi-arrow-right-circle me-1" /> Convert to Project</Button>
            )}
            {estimate.convertedProjectId && (
              <Button variant="outline-success" size="sm" onClick={() => navigate(`/projects/${estimate.convertedProjectId}`)}><i className="bi bi-box-arrow-up-right me-1" /> View Project</Button>
            )}
            <Dropdown align="end">
              <Dropdown.Toggle variant="primary" size="sm" id="est-actions">Actions</Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Header>Quotation Status</Dropdown.Header>
                {STATUS_FLOW.map(s => (
                  <Dropdown.Item key={s} active={s === estimate.status} disabled={!canManage} onClick={() => changeEstimateStatus(estimate.id, s, currentUser.name)}>{s}</Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </div>
        <div className="estimate-header-strip mt-3">
          <div><span className="ehs-label">Direct Cost</span><span className="ehs-value">{formatCurrency(costing.directCost)}</span></div>
          <div><span className="ehs-label">Indirect + Cont.</span><span className="ehs-value">{formatCurrency(costing.indirectTotal + costing.contingency)}</span></div>
          <div><span className="ehs-label">Margin ({estimate.costing.profitMarginPct}%)</span><span className="ehs-value">{formatCurrency(costing.margin)}</span></div>
          <div><span className="ehs-label">VAT ({estimate.costing.vatPct}%)</span><span className="ehs-value">{formatCurrency(costing.vat)}</span></div>
          <div className="ehs-total"><span className="ehs-label">Contract Price</span><span className="ehs-value">{formatCurrency(costing.contractPrice)}</span></div>
        </div>
        {estimate.convertedProjectId && (
          <div className="small text-success mt-2"><i className="bi bi-check-circle-fill me-1" />Converted to a project on {formatDate(estimate.convertedAt || '')} — BOQ set as job-costing budget baseline.</div>
        )}
      </div>

      <div className="tab-scroll-nav">
        <ul className="nav nav-tabs">
          {TABS.map(t => (
            <li className="nav-item" key={t.key}>
              <button className={`nav-link ${tab === t.key ? 'active' : ''}`} onClick={() => navigate(`/estimates/${estimate.id}/${t.key}`)}>
                <i className={`bi ${t.icon} me-1`} /> {t.label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <Suspense fallback={<div className="d-flex justify-content-center py-5"><Spinner animation="border" size="sm" /></div>}>
        {renderTab()}
      </Suspense>

      <ConvertEstimateModal show={showConvert} estimate={estimate} onClose={() => setShowConvert(false)} onConverted={(projectId) => navigate(`/projects/${projectId}`)} />
    </div>
  );
}
