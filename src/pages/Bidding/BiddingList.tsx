import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import Breadcrumbs from '../../components/layout/Breadcrumbs';
import SummaryCard from '../../components/ui/SummaryCard';
import DataTable, { type Column } from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import BidFormModal from './BidFormModal';
import { useData } from '../../store/DataContext';
import { useAuth } from '../../store/AuthContext';
import { formatCompactCurrency, formatCurrency, formatDate, daysUntil } from '../../utils/format';
import type { Bid, BidStage } from '../../types';

const ALL_STAGES: BidStage[] = [
  'Lead / Opportunity', 'For Review', 'Go/No-Go Decision', 'Preparing Requirements', 'Cost Estimation',
  'Internal Review', 'For Approval', 'Ready for Submission', 'Submitted', 'Under Evaluation',
  'Negotiation', 'Awarded', 'Lost', 'Withdrawn', 'Cancelled',
];
const ACTIVE_STAGES = ALL_STAGES.filter(s => !['Awarded', 'Lost', 'Withdrawn', 'Cancelled'].includes(s));
const SORT_OPTIONS = [
  { value: 'updated', label: 'Recently Updated' },
  { value: 'deadline', label: 'Deadline' },
  { value: 'value', label: 'Estimated Value' },
  { value: 'probability', label: 'Probability' },
];

export default function BiddingList() {
  const { bids, createBid } = useData();
  const { can } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [search, setSearch] = useState('');
  const [stage, setStage] = useState(searchParams.get('stage') || '');
  const [dueSoonOnly] = useState(searchParams.get('dueSoon') === '1');
  const [sortBy, setSortBy] = useState('updated');
  const [view, setView] = useState<'table' | 'kanban'>('table');
  const [showForm, setShowForm] = useState(false);

  const activeBids = bids.filter(b => ACTIVE_STAGES.includes(b.stage));
  const bidsDueSoon = activeBids.filter(b => daysUntil(b.submissionDeadline) <= 7 && daysUntil(b.submissionDeadline) >= 0);
  const awarded = bids.filter(b => b.stage === 'Awarded');
  const lost = bids.filter(b => b.stage === 'Lost');
  const withdrawn = bids.filter(b => b.stage === 'Withdrawn');
  const underEvaluation = bids.filter(b => b.stage === 'Under Evaluation');
  const totalPotentialValue = activeBids.reduce((s, b) => s + b.estimatedValue, 0);
  const winRate = (awarded.length + lost.length) > 0 ? Math.round((awarded.length / (awarded.length + lost.length)) * 100) : 0;

  const filtered = useMemo(() => {
    let list = [...bids];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(b => b.title.toLowerCase().includes(q) || b.reference.toLowerCase().includes(q) || b.client.toLowerCase().includes(q));
    }
    if (stage) list = list.filter(b => b.stage === stage);
    if (dueSoonOnly) list = list.filter(b => ACTIVE_STAGES.includes(b.stage) && daysUntil(b.submissionDeadline) <= 7 && daysUntil(b.submissionDeadline) >= 0);

    switch (sortBy) {
      case 'deadline': list.sort((a, b) => a.submissionDeadline.localeCompare(b.submissionDeadline)); break;
      case 'value': list.sort((a, b) => b.estimatedValue - a.estimatedValue); break;
      case 'probability': list.sort((a, b) => b.probability - a.probability); break;
      default: list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    }
    return list;
  }, [bids, search, stage, dueSoonOnly, sortBy]);

  const columns: Column<Bid>[] = [
    { key: 'reference', label: 'Reference', sortable: true, accessor: b => b.reference, render: b => <span className="fw-semibold">{b.reference}</span> },
    { key: 'title', label: 'Opportunity', sortable: true, accessor: b => b.title, render: b => (
      <div className="min-w-0"><div className="fw-semibold text-truncate" style={{ maxWidth: 220 }}>{b.title}</div><div className="text-secondary small text-truncate" style={{ maxWidth: 220 }}>{b.client}</div></div>
    ) },
    { key: 'location', label: 'Location', accessor: b => b.location },
    { key: 'source', label: 'Source', accessor: b => b.source },
    { key: 'bidOwner', label: 'Bid Owner', accessor: b => b.bidOwner },
    { key: 'estimatedValue', label: 'Est. Value', sortable: true, accessor: b => b.estimatedValue, render: b => formatCurrency(b.estimatedValue) },
    { key: 'deadline', label: 'Deadline', sortable: true, accessor: b => b.submissionDeadline, render: b => {
      const days = daysUntil(b.submissionDeadline);
      const isActive = ACTIVE_STAGES.includes(b.stage);
      return (
        <span className={isActive && days <= 3 && days >= 0 ? 'text-danger fw-semibold' : ''}>
          {formatDate(b.submissionDeadline)}
          {isActive && days <= 3 && days >= 0 && <i className="bi bi-alarm-fill ms-1" title="Deadline approaching" />}
        </span>
      );
    } },
    { key: 'stage', label: 'Stage', render: b => <StatusBadge status={b.stage} /> },
    { key: 'probability', label: 'Probability', sortable: true, accessor: b => b.probability, render: b => `${b.probability}%` },
    { key: 'updatedAt', label: 'Last Activity', sortable: true, accessor: b => b.updatedAt, render: b => formatDate(b.updatedAt) },
  ];

  const kanbanColumns = ALL_STAGES.map(s => ({ stage: s, items: filtered.filter(b => b.stage === s) }));

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Bidding' }]} />
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mt-2 mb-3">
        <h4 className="mb-0 fw-bold">Bidding Pipeline</h4>
        {can('bidding.manage') && (
          <Button variant="primary" onClick={() => setShowForm(true)}><i className="bi bi-plus-lg me-1" /> Log New Bid</Button>
        )}
      </div>

      <Row className="g-3 mb-4">
        <Col xs={12} sm={6} lg={3}><SummaryCard label="Active Opportunities" value={activeBids.length} icon="bi-briefcase" variant="primary" /></Col>
        <Col xs={12} sm={6} lg={3}><SummaryCard label="Bids Due Soon" value={bidsDueSoon.length} icon="bi-alarm" variant="warning" /></Col>
        <Col xs={12} sm={6} lg={3}><SummaryCard label="Under Evaluation" value={underEvaluation.length} icon="bi-search" variant="info" /></Col>
        <Col xs={12} sm={6} lg={3}><SummaryCard label="Awarded" value={awarded.length} icon="bi-trophy" variant="success" /></Col>
        <Col xs={12} sm={6} lg={3}><SummaryCard label="Lost" value={lost.length} icon="bi-x-circle" variant="danger" /></Col>
        <Col xs={12} sm={6} lg={3}><SummaryCard label="Withdrawn" value={withdrawn.length} icon="bi-arrow-return-left" variant="secondary" /></Col>
        <Col xs={12} sm={6} lg={3}><SummaryCard label="Total Potential Value" value={formatCompactCurrency(totalPotentialValue)} icon="bi-cash-stack" variant="primary" /></Col>
        <Col xs={12} sm={6} lg={3}><SummaryCard label="Win Rate" value={`${winRate}%`} icon="bi-graph-up-arrow" variant="success" hint={`${awarded.length} awarded of ${awarded.length + lost.length} decided`} /></Col>
      </Row>

      <div className="section-card p-3 mb-3">
        <Row className="g-2 align-items-end">
          <Col xs={12} md={5}>
            <Form.Label className="small mb-1">Search</Form.Label>
            <Form.Control placeholder="Reference, title, or client..." value={search} onChange={e => setSearch(e.target.value)} />
          </Col>
          <Col xs={6} md={3}>
            <Form.Label className="small mb-1">Stage</Form.Label>
            <Form.Select value={stage} onChange={e => setStage(e.target.value)}>
              <option value="">All stages</option>
              {ALL_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
            </Form.Select>
          </Col>
          <Col xs={6} md={2}>
            <Form.Label className="small mb-1">Sort By</Form.Label>
            <Form.Select value={sortBy} onChange={e => setSortBy(e.target.value)}>
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Form.Select>
          </Col>
          <Col xs={12} md={2} className="d-flex justify-content-end">
            <ButtonGroup size="sm" className="w-100">
              <Button variant={view === 'table' ? 'primary' : 'outline-secondary'} onClick={() => setView('table')}><i className="bi bi-table" /> Table</Button>
              <Button variant={view === 'kanban' ? 'primary' : 'outline-secondary'} onClick={() => setView('kanban')}><i className="bi bi-kanban" /> Pipeline</Button>
            </ButtonGroup>
          </Col>
        </Row>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="bi-briefcase" title="No bids found" message="Try adjusting your search or filters." />
      ) : view === 'table' ? (
        <DataTable columns={columns} rows={filtered} keyField={b => b.id} onRowClick={b => navigate(`/bidding/${b.id}`)} pageSize={8} />
      ) : (
        <div className="kanban-board">
          {kanbanColumns.map(col => (
            <div key={col.stage} className="kanban-column">
              <div className="kanban-column-header"><span>{col.stage}</span><span>{col.items.length}</span></div>
              {col.items.map(b => (
                <div key={b.id} className="kanban-card" onClick={() => navigate(`/bidding/${b.id}`)}>
                  <div className="kanban-card-title text-truncate">{b.title}</div>
                  <div className="kanban-card-meta"><span>{b.client}</span><span>{formatCompactCurrency(b.estimatedValue)}</span></div>
                  <div className="kanban-card-meta mt-1"><span>Due {formatDate(b.submissionDeadline)}</span><span>{b.probability}%</span></div>
                </div>
              ))}
              {col.items.length === 0 && <div className="text-secondary small text-center py-3">No bids</div>}
            </div>
          ))}
        </div>
      )}

      <BidFormModal
        show={showForm}
        onClose={() => setShowForm(false)}
        onSave={(bid) => { createBid(bid); setShowForm(false); navigate(`/bidding/${bid.id}`); }}
      />
    </div>
  );
}
