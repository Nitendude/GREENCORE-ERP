import { useState } from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import DataTable, { type Column } from '../../../../components/ui/DataTable';
import EmptyState from '../../../../components/ui/EmptyState';
import { useData } from '../../../../store/DataContext';
import { useAuth } from '../../../../store/AuthContext';
import { formatDate, genId, isOverdue } from '../../../../utils/format';
import type { Bid, BidRequirement } from '../../../../types';

export default function RequirementsTab({ bid }: { bid: Bid }) {
  const { updateBid } = useData();
  const { currentUser, can } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ requirement: '', responsible: currentUser.name, dueDate: '', requiredDocument: '', mandatory: true, remarks: '' });
  const canEdit = can('bidding.manage');

  const toggleComplete = (id: string) => {
    updateBid(bid.id, { requirements: bid.requirements.map(r => r.id === id ? { ...r, completed: !r.completed } : r) }, currentUser.name);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.requirement.trim() || !form.dueDate) return;
    const newReq: BidRequirement = { id: genId('r'), bidId: bid.id, requirement: form.requirement, responsible: form.responsible, dueDate: form.dueDate, completed: false, requiredDocument: form.requiredDocument || undefined, mandatory: form.mandatory, remarks: form.remarks || undefined };
    updateBid(bid.id, { requirements: [...bid.requirements, newReq] }, currentUser.name);
    setShowForm(false);
    setForm({ requirement: '', responsible: currentUser.name, dueDate: '', requiredDocument: '', mandatory: true, remarks: '' });
  };

  const columns: Column<BidRequirement>[] = [
    { key: 'completed', label: 'Done', render: r => (
      <Form.Check type="checkbox" checked={r.completed} disabled={!canEdit} onChange={() => toggleComplete(r.id)} />
    ) },
    { key: 'requirement', label: 'Requirement', accessor: r => r.requirement, render: r => (
      <span>{r.requirement} {r.mandatory && <span className="badge text-bg-light border ms-1">Mandatory</span>}</span>
    ) },
    { key: 'responsible', label: 'Responsible', accessor: r => r.responsible },
    { key: 'dueDate', label: 'Due Date', sortable: true, accessor: r => r.dueDate, render: r => (
      <span className={!r.completed && isOverdue(r.dueDate) ? 'text-danger fw-semibold' : ''}>{formatDate(r.dueDate)}</span>
    ) },
    { key: 'requiredDocument', label: 'Required Document', accessor: r => r.requiredDocument || '—' },
    { key: 'remarks', label: 'Remarks', accessor: r => r.remarks || '—' },
  ];

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="fw-bold mb-0">Requirements & Checklist</h6>
        {canEdit && <Button size="sm" variant="primary" onClick={() => setShowForm(true)}><i className="bi bi-plus-lg me-1" /> Add Requirement</Button>}
      </div>
      {bid.requirements.length === 0 ? (
        <EmptyState icon="bi-clipboard-check" title="No requirements added yet" />
      ) : (
        <DataTable columns={columns} rows={bid.requirements} keyField={r => r.id} pageSize={10} />
      )}

      <Modal show={showForm} onHide={() => setShowForm(false)} centered>
        <Form onSubmit={handleAdd}>
          <Modal.Header closeButton><Modal.Title as="h5">Add Requirement</Modal.Title></Modal.Header>
          <Modal.Body>
            <Row className="g-3">
              <Col xs={12}>
                <Form.Group controlId={`fld-1`}>
                  <Form.Label className="form-required">Requirement</Form.Label>
                  <Form.Control required value={form.requirement} onChange={e => setForm(f => ({ ...f, requirement: e.target.value }))} />
                </Form.Group>
              </Col>
              <Col xs={6}>
                <Form.Group controlId={`fld-2`}>
                  <Form.Label>Responsible</Form.Label>
                  <Form.Control value={form.responsible} onChange={e => setForm(f => ({ ...f, responsible: e.target.value }))} />
                </Form.Group>
              </Col>
              <Col xs={6}>
                <Form.Group controlId={`fld-3`}>
                  <Form.Label className="form-required">Due Date</Form.Label>
                  <Form.Control required type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
                </Form.Group>
              </Col>
              <Col xs={12}>
                <Form.Group controlId={`fld-4`}>
                  <Form.Label>Required Document (optional)</Form.Label>
                  <Form.Control value={form.requiredDocument} onChange={e => setForm(f => ({ ...f, requiredDocument: e.target.value }))} />
                </Form.Group>
              </Col>
              <Col xs={12}>
                <Form.Check type="checkbox" label="Mandatory requirement" checked={form.mandatory} onChange={e => setForm(f => ({ ...f, mandatory: e.target.checked }))} />
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Add</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}
