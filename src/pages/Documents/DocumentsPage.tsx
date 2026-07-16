import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Breadcrumbs from '../../components/layout/Breadcrumbs';
import DataTable, { type Column } from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import { useData } from '../../store/DataContext';
import { formatDate } from '../../utils/format';
import type { ProjectDocument } from '../../types';

const CATEGORIES: ProjectDocument['category'][] = ['Contract', 'Drawing', 'Plan', 'Permit', 'Report', 'Photo', 'Purchase', 'Billing'];

export default function DocumentsPage() {
  const { documents, projects } = useData();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [projectId, setProjectId] = useState('');

  const filtered = useMemo(() => {
    let list = documents;
    if (search.trim()) list = list.filter(d => d.name.toLowerCase().includes(search.trim().toLowerCase()));
    if (category) list = list.filter(d => d.category === category);
    if (projectId) list = list.filter(d => d.projectId === projectId);
    return [...list].sort((a, b) => b.uploadedDate.localeCompare(a.uploadedDate));
  }, [documents, search, category, projectId]);

  const columns: Column<ProjectDocument>[] = [
    { key: 'name', label: 'Document', sortable: true, accessor: d => d.name },
    { key: 'project', label: 'Project', accessor: d => projects.find(p => p.id === d.projectId)?.name || '—' },
    { key: 'category', label: 'Category', accessor: d => d.category },
    { key: 'version', label: 'Version', accessor: d => d.version },
    { key: 'uploadedBy', label: 'Uploaded By', accessor: d => d.uploadedBy },
    { key: 'uploadedDate', label: 'Date', sortable: true, accessor: d => d.uploadedDate, render: d => formatDate(d.uploadedDate) },
    { key: 'approvalStatus', label: 'Approval', render: d => <StatusBadge status={d.approvalStatus} /> },
  ];

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Documents' }]} />
      <h4 className="fw-bold mt-2 mb-3">Documents Across Projects</h4>
      <div className="section-card p-3 mb-3">
        <Row className="g-2 align-items-end">
          <Col xs={12} md={5}>
            <Form.Label className="small mb-1">Search</Form.Label>
            <Form.Control placeholder="Document name..." value={search} onChange={e => setSearch(e.target.value)} />
          </Col>
          <Col xs={6} md={4}>
            <Form.Label className="small mb-1">Project</Form.Label>
            <Form.Select value={projectId} onChange={e => setProjectId(e.target.value)}>
              <option value="">All projects</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Form.Select>
          </Col>
          <Col xs={6} md={3}>
            <Form.Label className="small mb-1">Category</Form.Label>
            <Form.Select value={category} onChange={e => setCategory(e.target.value)}>
              <option value="">All categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </Form.Select>
          </Col>
        </Row>
      </div>
      {filtered.length === 0 ? (
        <EmptyState icon="bi-folder2-open" title="No documents found" />
      ) : (
        <DataTable columns={columns} rows={filtered} keyField={d => d.id} onRowClick={d => navigate(`/projects/${d.projectId}/documents`)} pageSize={12} />
      )}
    </div>
  );
}
