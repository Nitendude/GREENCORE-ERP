import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import Card from 'react-bootstrap/Card';
import Breadcrumbs from '../../components/layout/Breadcrumbs';
import DataTable, { type Column } from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import ProjectFormModal from './ProjectFormModal';
import ProjectProgressModal from './ProjectProgressModal';
import ProjectQuickViewModal from './ProjectQuickViewModal';
import { useData } from '../../store/DataContext';
import { useAuth } from '../../store/AuthContext';
import { formatCurrency, formatDate } from '../../utils/format';
import type { Project } from '../../types';

const STATUS_OPTIONS = ['Planning', 'Mobilization', 'In Progress', 'On Hold', 'Delayed', 'For Inspection', 'Completed', 'Closed', 'Cancelled'];
const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Critical'];
const SORT_OPTIONS = [
  { value: 'updated', label: 'Recently Updated' },
  { value: 'deadline', label: 'Deadline' },
  { value: 'progress', label: 'Progress' },
  { value: 'value', label: 'Contract Value' },
];

export default function ProjectsList() {
  const { projects: allProjects, branches, createProject } = useData();
  const { can, scopeByBranch, effectiveBranch } = useAuth();
  const projects = scopeByBranch(allProjects);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [pm, setPm] = useState(searchParams.get('pm') || '');
  const [priority, setPriority] = useState(searchParams.get('priority') || '');
  const [riskOnly] = useState(searchParams.get('risk') === '1');
  const [sortBy, setSortBy] = useState('updated');
  const [view, setView] = useState<'table' | 'card'>('table');
  const [showForm, setShowForm] = useState(false);
  const [progressProject, setProgressProject] = useState<Project | null>(null);
  const [quickViewProject, setQuickViewProject] = useState<Project | null>(null);

  const projectManagers = Array.from(new Set(projects.map(p => p.projectManager))).sort();

  const filtered = useMemo(() => {
    let list = projects.filter(p => !p.archived);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q) ||
        p.client.toLowerCase().includes(q) || p.location.toLowerCase().includes(q));
    }
    if (status) list = list.filter(p => p.status === status);
    if (pm) list = list.filter(p => p.projectManager === pm);
    if (priority) list = list.filter(p => p.priority === priority);
    if (riskOnly) list = list.filter(p => p.health.cost !== 'Good' || p.health.schedule !== 'Good');

    const sorted = [...list];
    switch (sortBy) {
      case 'deadline': sorted.sort((a, b) => a.targetCompletionDate.localeCompare(b.targetCompletionDate)); break;
      case 'progress': sorted.sort((a, b) => b.progress - a.progress); break;
      case 'value': sorted.sort((a, b) => b.contractValue - a.contractValue); break;
      default: sorted.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    }
    return sorted;
  }, [projects, search, status, pm, priority, riskOnly, sortBy]);

  const clearFilters = () => {
    setSearch(''); setStatus(''); setPm(''); setPriority('');
    setSearchParams({});
  };

  const columns: Column<Project>[] = [
    { key: 'code', label: 'Code', sortable: true, accessor: p => p.code, render: p => <span className="fw-semibold">{p.code}</span> },
    { key: 'name', label: 'Project', sortable: true, accessor: p => p.name, render: p => (
      <div className="min-w-0">
        <div className="fw-semibold text-truncate" style={{ maxWidth: 220 }}>{p.name}</div>
        <div className="text-secondary small text-truncate" style={{ maxWidth: 220 }}>{p.client}</div>
      </div>
    ) },
    { key: 'location', label: 'Location', accessor: p => p.location },
    ...(effectiveBranch ? [] : [{ key: 'branch', label: 'Branch', accessor: (p: Project) => branches.find(b => b.id === p.branchId)?.code || '—', render: (p: Project) => {
      const branch = branches.find(b => b.id === p.branchId);
      return branch ? <span className="badge text-bg-light border">{branch.code}</span> : <span className="text-secondary">—</span>;
    } } as Column<Project>]),
    { key: 'pm', label: 'Project Manager', accessor: p => p.projectManager },
    { key: 'dates', label: 'Start → Target', render: p => <span className="small">{formatDate(p.startDate)} → {formatDate(p.targetCompletionDate)}</span> },
    { key: 'progress', label: 'Progress', sortable: true, accessor: p => p.progress, render: p => (
      <button
        type="button"
        className="btn btn-link p-0 text-decoration-none d-block"
        style={{ minWidth: 90 }}
        title="View progress details"
        onClick={e => { e.stopPropagation(); setProgressProject(p); }}
      >
        <div className="workspace-progress-track mb-1"><div className="workspace-progress-fill" style={{ width: `${p.progress}%` }} /></div>
        <span className="small text-secondary">{p.progress}%</span>
      </button>
    ) },
    { key: 'status', label: 'Status', render: p => <StatusBadge status={p.status} /> },
    { key: 'priority', label: 'Priority', render: p => <StatusBadge status={p.priority} /> },
    ...(can('projects.financials.view') ? [{ key: 'value', label: 'Contract Value', sortable: true, accessor: (p: Project) => p.contractValue, render: (p: Project) => formatCurrency(p.contractValue) } as Column<Project>] : []),
  ];

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Projects' }]} />
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mt-2 mb-3">
        <h4 className="mb-0 fw-bold">Projects</h4>
        {can('projects.create') && (
          <Button variant="primary" onClick={() => setShowForm(true)}>
            <i className="bi bi-plus-lg me-1" /> Create Project
          </Button>
        )}
      </div>

      <div className="section-card p-3 mb-3">
        <Row className="g-2 align-items-end">
          <Col xs={12} md={4}>
            <Form.Label className="small mb-1">Search</Form.Label>
            <Form.Control placeholder="Name, code, client, location..." value={search} onChange={e => setSearch(e.target.value)} />
          </Col>
          <Col xs={6} md={2}>
            <Form.Label className="small mb-1">Status</Form.Label>
            <Form.Select value={status} onChange={e => setStatus(e.target.value)}>
              <option value="">All statuses</option>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </Form.Select>
          </Col>
          <Col xs={6} md={2}>
            <Form.Label className="small mb-1">Manager</Form.Label>
            <Form.Select value={pm} onChange={e => setPm(e.target.value)}>
              <option value="">All managers</option>
              {projectManagers.map(m => <option key={m} value={m}>{m}</option>)}
            </Form.Select>
          </Col>
          <Col xs={6} md={2}>
            <Form.Label className="small mb-1">Priority</Form.Label>
            <Form.Select value={priority} onChange={e => setPriority(e.target.value)}>
              <option value="">All priorities</option>
              {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </Form.Select>
          </Col>
          <Col xs={6} md={2}>
            <Form.Label className="small mb-1">Sort By</Form.Label>
            <Form.Select value={sortBy} onChange={e => setSortBy(e.target.value)}>
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Form.Select>
          </Col>
        </Row>
        <div className="d-flex justify-content-between align-items-center mt-2">
          <button className="btn btn-link btn-sm px-0" onClick={clearFilters}>Clear filters</button>
          <ButtonGroup size="sm">
            <Button variant={view === 'table' ? 'primary' : 'outline-secondary'} onClick={() => setView('table')}>
              <i className="bi bi-table" /> Table
            </Button>
            <Button variant={view === 'card' ? 'primary' : 'outline-secondary'} onClick={() => setView('card')}>
              <i className="bi bi-grid-3x3-gap" /> Cards
            </Button>
          </ButtonGroup>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="bi-kanban" title="No projects found" message="Try adjusting your search or filters." />
      ) : view === 'table' ? (
        <DataTable columns={columns} rows={filtered} keyField={p => p.id} onRowClick={p => setQuickViewProject(p)} pageSize={8} />
      ) : (
        <Row className="g-3">
          {filtered.map(p => (
            <Col key={p.id} xs={12} sm={6} lg={4}>
              <Card className="section-card h-100 cursor-pointer" onClick={() => setQuickViewProject(p)}>
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start mb-1">
                    <span className="text-secondary small">{p.code}</span>
                    <StatusBadge status={p.priority} />
                  </div>
                  <Card.Title as="h6" className="mb-1">{p.name}</Card.Title>
                  <div className="text-secondary small mb-2">{p.client} • {p.location}</div>
                  <button
                    type="button"
                    className="btn btn-link p-0 text-decoration-none d-block w-100 text-start"
                    title="View progress details"
                    onClick={e => { e.stopPropagation(); setProgressProject(p); }}
                  >
                    <div className="workspace-progress-track mb-1"><div className="workspace-progress-fill" style={{ width: `${p.progress}%` }} /></div>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="small text-secondary">{p.progress}% complete <i className="bi bi-info-circle" /></span>
                      <StatusBadge status={p.status} />
                    </div>
                  </button>
                  <div className="small text-secondary">PM: {p.projectManager}</div>
                  <div className="small text-secondary">{formatDate(p.startDate)} → {formatDate(p.targetCompletionDate)}</div>
                  {can('projects.financials.view') && <div className="small fw-semibold mt-1">{formatCurrency(p.contractValue)}</div>}
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <ProjectProgressModal
        show={progressProject !== null}
        project={progressProject}
        onClose={() => setProgressProject(null)}
      />

      <ProjectQuickViewModal
        show={quickViewProject !== null}
        project={quickViewProject}
        onClose={() => setQuickViewProject(null)}
      />

      <ProjectFormModal
        show={showForm}
        project={null}
        onClose={() => setShowForm(false)}
        onSave={(project) => { createProject(project); setShowForm(false); navigate(`/projects/${project.id}`); }}
      />
    </div>
  );
}
