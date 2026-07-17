import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Breadcrumbs from '../../components/layout/Breadcrumbs';
import SummaryCard from '../../components/ui/SummaryCard';
import DataTable, { type Column } from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import EstimateFormModal from './EstimateFormModal';
import { useData } from '../../store/DataContext';
import { useAuth } from '../../store/AuthContext';
import { computeCosting } from '../../utils/estimation';
import { formatCompactCurrency, formatCurrency, formatDate } from '../../utils/format';
import type { Estimate, QuotationStatus } from '../../types';

const STATUSES: QuotationStatus[] = ['Draft', 'Sent', 'Negotiating', 'Won', 'Lost'];

export default function EstimatesList() {
  const { estimates: allEstimates, addEstimate } = useData();
  const { can, scopeByBranch } = useAuth();
  const estimates = scopeByBranch(allEstimates);
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [showForm, setShowForm] = useState(false);

  const priced = useMemo(() => estimates.map(e => ({ e, contract: computeCosting(e).contractPrice })), [estimates]);

  const filtered = useMemo(() => {
    let list = priced;
    if (search.trim()) { const q = search.trim().toLowerCase(); list = list.filter(({ e }) => (e.projectName + e.code + e.client).toLowerCase().includes(q)); }
    if (status) list = list.filter(({ e }) => e.status === status);
    return [...list].sort((a, b) => b.e.updatedAt.localeCompare(a.e.updatedAt));
  }, [priced, search, status]);

  const activeCount = estimates.filter(e => e.status === 'Draft' || e.status === 'Sent' || e.status === 'Negotiating').length;
  const wonCount = estimates.filter(e => e.status === 'Won').length;
  const pipelineValue = priced.filter(({ e }) => e.status !== 'Lost').reduce((s, { contract }) => s + contract, 0);
  const decided = estimates.filter(e => e.status === 'Won' || e.status === 'Lost').length;
  const winRate = decided > 0 ? Math.round((wonCount / decided) * 100) : 0;

  const columns: Column<{ e: Estimate; contract: number }>[] = [
    { key: 'code', label: 'Code', sortable: true, accessor: r => r.e.code, render: r => <span className="fw-semibold">{r.e.code}</span> },
    { key: 'project', label: 'Project', sortable: true, accessor: r => r.e.projectName, render: r => (
      <div className="min-w-0"><div className="fw-semibold text-truncate" style={{ maxWidth: 240 }}>{r.e.projectName}</div><div className="text-secondary small text-truncate" style={{ maxWidth: 240 }}>{r.e.client}</div></div>
    ) },
    { key: 'location', label: 'Location', accessor: r => r.e.location },
    { key: 'gfa', label: 'Area', accessor: r => r.e.grossFloorArea, render: r => r.e.grossFloorArea ? `${r.e.grossFloorArea} sqm` : '—' },
    { key: 'rev', label: 'Rev', accessor: r => r.e.currentRevision },
    { key: 'contract', label: 'Contract Price', sortable: true, accessor: r => r.contract, render: r => can('projects.financials.view') || can('estimates.view') ? <span className="fw-semibold">{formatCurrency(r.contract)}</span> : '—' },
    { key: 'status', label: 'Status', render: r => <StatusBadge status={r.e.status} /> },
    { key: 'updated', label: 'Updated', sortable: true, accessor: r => r.e.updatedAt, render: r => formatDate(r.e.updatedAt) },
  ];

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Estimates' }]} />
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mt-2 mb-3">
        <div><h4 className="fw-bold mb-1">Estimates &amp; Quotations</h4><p className="text-secondary small mb-0">Pre-construction estimates — BOQ, BOM, costing, and client quotations.</p></div>
        {can('estimates.manage') && <Button variant="primary" onClick={() => setShowForm(true)}><i className="bi bi-plus-lg me-1" /> New Estimate</Button>}
      </div>

      <Row className="g-3 mb-3">
        <Col xs={6} lg={3}><SummaryCard label="Active Estimates" value={activeCount} icon="bi-calculator" variant="primary" /></Col>
        <Col xs={6} lg={3}><SummaryCard label="Won" value={wonCount} icon="bi-trophy" variant="success" /></Col>
        <Col xs={6} lg={3}><SummaryCard label="Pipeline Value" value={formatCompactCurrency(pipelineValue)} icon="bi-cash-stack" variant="info" /></Col>
        <Col xs={6} lg={3}><SummaryCard label="Win Rate" value={`${winRate}%`} icon="bi-graph-up-arrow" variant="secondary" hint={`${wonCount} of ${decided} decided`} /></Col>
      </Row>

      <div className="section-card p-3 mb-3">
        <Row className="g-2 align-items-end">
          <Col xs={12} md={8}><Form.Label className="small mb-1">Search</Form.Label><Form.Control placeholder="Project, code, or client…" value={search} onChange={e => setSearch(e.target.value)} /></Col>
          <Col xs={12} md={4}><Form.Label className="small mb-1">Status</Form.Label><Form.Select value={status} onChange={e => setStatus(e.target.value)}><option value="">All statuses</option>{STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</Form.Select></Col>
        </Row>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="bi-calculator" title="No estimates found" message="Create a new estimate to start a BOQ and quotation." />
      ) : (
        <DataTable columns={columns} rows={filtered} keyField={r => r.e.id} onRowClick={r => navigate(`/estimates/${r.e.id}`)} pageSize={10} />
      )}

      <EstimateFormModal show={showForm} onClose={() => setShowForm(false)} onSave={e => { addEstimate(e); setShowForm(false); navigate(`/estimates/${e.id}`); }} />
    </div>
  );
}
