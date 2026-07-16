import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Breadcrumbs from '../../components/layout/Breadcrumbs';
import SummaryCard from '../../components/ui/SummaryCard';
import DataTable, { type Column } from '../../components/ui/DataTable';
import EmptyState from '../../components/ui/EmptyState';
import { useData } from '../../store/DataContext';
import { formatCurrency, formatDate, isOverdue } from '../../utils/format';
import type { MaterialItem } from '../../types';

export default function InventoryPage() {
  const { materials, projects } = useData();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [projectId, setProjectId] = useState('');
  const [alertsOnly, setAlertsOnly] = useState(false);

  const lowStockCount = materials.filter(m => m.lowStock).length;
  const delayedCount = materials.filter(m => m.receivedQty < m.requestedQty && isOverdue(m.deliveryDate)).length;

  const filtered = useMemo(() => {
    let list = materials;
    if (search.trim()) list = list.filter(m => m.name.toLowerCase().includes(search.trim().toLowerCase()));
    if (projectId) list = list.filter(m => m.projectId === projectId);
    if (alertsOnly) list = list.filter(m => m.lowStock || (m.receivedQty < m.requestedQty && isOverdue(m.deliveryDate)));
    return list;
  }, [materials, search, projectId, alertsOnly]);

  const columns: Column<MaterialItem>[] = [
    { key: 'name', label: 'Material', sortable: true, accessor: m => m.name, render: m => (
      <span className="fw-semibold">{m.name}{m.lowStock && <i className="bi bi-exclamation-triangle-fill text-warning ms-2" title="Low stock" />}</span>
    ) },
    { key: 'project', label: 'Project', accessor: m => projects.find(p => p.id === m.projectId)?.name || '—' },
    { key: 'requestedQty', label: 'Requested', accessor: m => `${m.requestedQty} ${m.unit}` },
    { key: 'receivedQty', label: 'Received', accessor: m => `${m.receivedQty} ${m.unit}` },
    { key: 'issuedQty', label: 'Issued', accessor: m => `${m.issuedQty} ${m.unit}` },
    { key: 'storageLocation', label: 'Location', accessor: m => m.storageLocation },
    { key: 'supplier', label: 'Supplier', accessor: m => m.supplier },
    { key: 'unitCost', label: 'Unit Cost', sortable: true, accessor: m => m.unitCost, render: m => formatCurrency(m.unitCost) },
    { key: 'deliveryDate', label: 'Delivery', sortable: true, accessor: m => m.deliveryDate, render: m => (
      <span className={m.receivedQty < m.requestedQty && isOverdue(m.deliveryDate) ? 'text-danger fw-semibold' : ''}>{formatDate(m.deliveryDate)}</span>
    ) },
  ];

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Materials' }]} />
      <h4 className="fw-bold mt-2 mb-3">Materials & Inventory</h4>

      <Row className="g-3 mb-3">
        <Col xs={12} sm={6} lg={4}><SummaryCard label="Tracked Materials" value={materials.length} icon="bi-box-seam" variant="primary" /></Col>
        <Col xs={12} sm={6} lg={4}><SummaryCard label="Low Stock Alerts" value={lowStockCount} icon="bi-exclamation-triangle" variant="warning" /></Col>
        <Col xs={12} sm={6} lg={4}><SummaryCard label="Delayed Deliveries" value={delayedCount} icon="bi-truck" variant="danger" /></Col>
      </Row>

      <div className="section-card p-3 mb-3">
        <Row className="g-2 align-items-end">
          <Col xs={12} md={5}>
            <Form.Label className="small mb-1">Search</Form.Label>
            <Form.Control placeholder="Material name..." value={search} onChange={e => setSearch(e.target.value)} />
          </Col>
          <Col xs={7} md={4}>
            <Form.Label className="small mb-1">Project</Form.Label>
            <Form.Select value={projectId} onChange={e => setProjectId(e.target.value)}>
              <option value="">All projects</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Form.Select>
          </Col>
          <Col xs={5} md={3} className="d-flex align-items-center">
            <Form.Check type="switch" label="Alerts only" checked={alertsOnly} onChange={e => setAlertsOnly(e.target.checked)} />
          </Col>
        </Row>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="bi-box-seam" title="No materials found" />
      ) : (
        <DataTable columns={columns} rows={filtered} keyField={m => m.id} onRowClick={m => navigate(`/projects/${m.projectId}/materials`)} pageSize={12} />
      )}
    </div>
  );
}
