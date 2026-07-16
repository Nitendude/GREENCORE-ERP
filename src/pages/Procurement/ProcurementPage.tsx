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
import { formatCurrency, formatDate } from '../../utils/format';
import type { PurchaseOrder } from '../../types';

const STATUSES: PurchaseOrder['status'][] = ['Requested', 'Approved', 'Ordered', 'Delivered', 'Rejected'];

export default function ProcurementPage() {
  const { purchaseOrders, projects } = useData();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [projectId, setProjectId] = useState('');

  const filtered = useMemo(() => {
    let list = purchaseOrders;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(po => po.poNumber.toLowerCase().includes(q) || po.supplier.toLowerCase().includes(q) || po.items.toLowerCase().includes(q));
    }
    if (status) list = list.filter(po => po.status === status);
    if (projectId) list = list.filter(po => po.projectId === projectId);
    return [...list].sort((a, b) => b.requestedDate.localeCompare(a.requestedDate));
  }, [purchaseOrders, search, status, projectId]);

  const columns: Column<PurchaseOrder>[] = [
    { key: 'poNumber', label: 'PO Number', sortable: true, accessor: po => po.poNumber },
    { key: 'project', label: 'Project', accessor: po => projects.find(p => p.id === po.projectId)?.name || '—' },
    { key: 'supplier', label: 'Supplier', sortable: true, accessor: po => po.supplier },
    { key: 'items', label: 'Items', accessor: po => po.items },
    { key: 'amount', label: 'Amount', sortable: true, accessor: po => po.amount, render: po => formatCurrency(po.amount) },
    { key: 'deliveryDate', label: 'Delivery', sortable: true, accessor: po => po.deliveryDate, render: po => formatDate(po.deliveryDate) },
    { key: 'status', label: 'Status', render: po => <StatusBadge status={po.status} /> },
  ];

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Procurement' }]} />
      <h4 className="fw-bold mt-2 mb-3">Procurement Across Projects</h4>
      <div className="section-card p-3 mb-3">
        <Row className="g-2 align-items-end">
          <Col xs={12} md={5}>
            <Form.Label className="small mb-1">Search</Form.Label>
            <Form.Control placeholder="PO number, supplier, items..." value={search} onChange={e => setSearch(e.target.value)} />
          </Col>
          <Col xs={6} md={4}>
            <Form.Label className="small mb-1">Project</Form.Label>
            <Form.Select value={projectId} onChange={e => setProjectId(e.target.value)}>
              <option value="">All projects</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Form.Select>
          </Col>
          <Col xs={6} md={3}>
            <Form.Label className="small mb-1">Status</Form.Label>
            <Form.Select value={status} onChange={e => setStatus(e.target.value)}>
              <option value="">All statuses</option>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </Form.Select>
          </Col>
        </Row>
      </div>
      {filtered.length === 0 ? (
        <EmptyState icon="bi-cart-check" title="No purchase orders found" />
      ) : (
        <DataTable columns={columns} rows={filtered} keyField={po => po.id} onRowClick={po => navigate(`/projects/${po.projectId}/procurement`)} pageSize={12} />
      )}
    </div>
  );
}
