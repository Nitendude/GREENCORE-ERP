import { useState } from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import DataTable, { type Column } from '../../../../components/ui/DataTable';
import StatusBadge from '../../../../components/ui/StatusBadge';
import EmptyState from '../../../../components/ui/EmptyState';
import { useData } from '../../../../store/DataContext';
import { useAuth } from '../../../../store/AuthContext';
import { formatCurrency, formatDate, genId } from '../../../../utils/format';
import type { Project, PurchaseOrder } from '../../../../types';

const NEXT_STATUS: Record<PurchaseOrder['status'], PurchaseOrder['status'] | null> = {
  Requested: 'Approved', Approved: 'Ordered', Ordered: 'Delivered', Delivered: null, Rejected: null,
};

export default function ProcurementTab({ project }: { project: Project }) {
  const { purchaseOrders, addPurchaseOrder, updatePurchaseOrder } = useData();
  const { can } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ supplier: '', items: '', amount: '', deliveryDate: '', linkedPhase: '' });

  const projectPOs = purchaseOrders.filter(po => po.projectId === project.id);
  const canManage = can('procurement.manage');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.supplier.trim() || !form.items.trim() || !form.amount) return;
    addPurchaseOrder({
      id: genId('po'), projectId: project.id, poNumber: `PO-${Math.floor(1000 + Math.random() * 8999)}`,
      supplier: form.supplier, items: form.items, amount: Number(form.amount), status: 'Requested',
      requestedDate: new Date().toISOString().slice(0, 10), deliveryDate: form.deliveryDate || new Date().toISOString().slice(0, 10),
      linkedPhase: form.linkedPhase || undefined,
    });
    setShowForm(false);
    setForm({ supplier: '', items: '', amount: '', deliveryDate: '', linkedPhase: '' });
  };

  const columns: Column<PurchaseOrder>[] = [
    { key: 'poNumber', label: 'PO Number', sortable: true, accessor: p => p.poNumber, render: p => <span className="fw-semibold">{p.poNumber}</span> },
    { key: 'supplier', label: 'Supplier', sortable: true, accessor: p => p.supplier },
    { key: 'items', label: 'Items', accessor: p => p.items },
    { key: 'amount', label: 'Amount', sortable: true, accessor: p => p.amount, render: p => formatCurrency(p.amount) },
    { key: 'requestedDate', label: 'Requested', accessor: p => p.requestedDate, render: p => formatDate(p.requestedDate) },
    { key: 'deliveryDate', label: 'Delivery', sortable: true, accessor: p => p.deliveryDate, render: p => formatDate(p.deliveryDate) },
    { key: 'phase', label: 'Linked Phase', accessor: p => p.linkedPhase || '—' },
    { key: 'status', label: 'Status', render: p => <StatusBadge status={p.status} /> },
    ...(canManage ? [{
      key: 'actions', label: 'Actions', render: (p: PurchaseOrder) => {
        const next = NEXT_STATUS[p.status];
        return (
          <div className="d-flex gap-1">
            {next && <Button size="sm" variant="outline-primary" onClick={() => updatePurchaseOrder(p.id, { status: next })}>Mark {next}</Button>}
            {p.status === 'Requested' && <Button size="sm" variant="outline-danger" onClick={() => updatePurchaseOrder(p.id, { status: 'Rejected' })}>Reject</Button>}
          </div>
        );
      },
    } as Column<PurchaseOrder>] : []),
  ];

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="fw-bold mb-0">Purchase Requests & Orders</h6>
        {canManage && <Button size="sm" variant="primary" onClick={() => setShowForm(true)}><i className="bi bi-plus-lg me-1" /> New Purchase Request</Button>}
      </div>

      {projectPOs.length === 0 ? (
        <EmptyState icon="bi-cart-check" title="No purchase orders" message="Create a purchase request for materials or equipment needed on this project." />
      ) : (
        <DataTable columns={columns} rows={projectPOs} keyField={p => p.id} pageSize={8} />
      )}

      <Modal show={showForm} onHide={() => setShowForm(false)} centered>
        <Form onSubmit={handleAdd}>
          <Modal.Header closeButton><Modal.Title as="h5">New Purchase Request</Modal.Title></Modal.Header>
          <Modal.Body>
            <Row className="g-3">
              <Col xs={12}>
                <Form.Group controlId={`fld-1`}>
                  <Form.Label className="form-required">Supplier</Form.Label>
                  <Form.Control required value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))} />
                </Form.Group>
              </Col>
              <Col xs={12}>
                <Form.Group controlId={`fld-2`}>
                  <Form.Label className="form-required">Requested Items</Form.Label>
                  <Form.Control required value={form.items} onChange={e => setForm(f => ({ ...f, items: e.target.value }))} />
                </Form.Group>
              </Col>
              <Col xs={6}>
                <Form.Group controlId={`fld-3`}>
                  <Form.Label className="form-required">Amount (PHP)</Form.Label>
                  <Form.Control required type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
                </Form.Group>
              </Col>
              <Col xs={6}>
                <Form.Group controlId={`fld-4`}>
                  <Form.Label>Expected Delivery</Form.Label>
                  <Form.Control type="date" value={form.deliveryDate} onChange={e => setForm(f => ({ ...f, deliveryDate: e.target.value }))} />
                </Form.Group>
              </Col>
              <Col xs={12}>
                <Form.Group controlId={`fld-5`}>
                  <Form.Label>Linked Phase (optional)</Form.Label>
                  <Form.Select value={form.linkedPhase} onChange={e => setForm(f => ({ ...f, linkedPhase: e.target.value }))}>
                    <option value="">None</option>
                    {project.phases.map(ph => <option key={ph.id} value={ph.name}>{ph.name}</option>)}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Submit Request</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}
