import { useState } from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import EmptyState from '../../../../components/ui/EmptyState';
import { useData } from '../../../../store/DataContext';
import { useAuth } from '../../../../store/AuthContext';
import { formatDate, genId } from '../../../../utils/format';
import type { Bid, BidAssignment } from '../../../../types';

const ROLES: BidAssignment['role'][] = ['Bid Manager', 'Estimator', 'Technical Team', 'Approver'];

export default function TeamTab({ bid }: { bid: Bid }) {
  const { updateBid } = useData();
  const { currentUser, allUsers, can } = useAuth();
  const canEdit = can('bidding.manage');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ role: 'Estimator' as BidAssignment['role'], person: allUsers[0]?.name || '', assignedRequirement: '', dueDate: '' });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const assignment: BidAssignment = { id: genId('a'), bidId: bid.id, role: form.role, person: form.person, assignedRequirement: form.assignedRequirement || undefined, dueDate: form.dueDate || undefined };
    updateBid(bid.id, { assignments: [...bid.assignments, assignment] }, currentUser.name);
    setShowForm(false);
    setForm({ role: 'Estimator', person: allUsers[0]?.name || '', assignedRequirement: '', dueDate: '' });
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="fw-bold mb-0">Team & Assignments</h6>
        {canEdit && <Button size="sm" variant="primary" onClick={() => setShowForm(true)}><i className="bi bi-plus-lg me-1" /> Add Assignment</Button>}
      </div>
      {bid.assignments.length === 0 ? (
        <EmptyState icon="bi-people" title="No team members assigned" />
      ) : (
        <Row className="g-3">
          {ROLES.map(role => {
            const items = bid.assignments.filter(a => a.role === role);
            if (items.length === 0) return null;
            return (
              <Col xs={12} md={6} key={role}>
                <div className="section-card p-3 h-100">
                  <h6 className="fw-bold mb-2">{role}{role !== 'Bid Manager' ? 's' : ''}</h6>
                  <ul className="list-unstyled mb-0 d-flex flex-column gap-2">
                    {items.map(a => (
                      <li key={a.id} className="border-bottom pb-2">
                        <div className="fw-semibold small">{a.person}</div>
                        {a.assignedRequirement && <div className="text-secondary small">Assigned: {a.assignedRequirement}</div>}
                        {a.dueDate && <div className="text-secondary small">Due {formatDate(a.dueDate)}</div>}
                      </li>
                    ))}
                  </ul>
                </div>
              </Col>
            );
          })}
        </Row>
      )}

      <Modal show={showForm} onHide={() => setShowForm(false)} centered>
        <Form onSubmit={handleAdd}>
          <Modal.Header closeButton><Modal.Title as="h5">Add Assignment</Modal.Title></Modal.Header>
          <Modal.Body>
            <Row className="g-3">
              <Col xs={6}>
                <Form.Group controlId={`fld-1`}>
                  <Form.Label>Role</Form.Label>
                  <Form.Select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as BidAssignment['role'] }))}>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col xs={6}>
                <Form.Group controlId={`fld-2`}>
                  <Form.Label>Person</Form.Label>
                  <Form.Select value={form.person} onChange={e => setForm(f => ({ ...f, person: e.target.value }))}>
                    {allUsers.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col xs={8}>
                <Form.Group controlId={`fld-3`}>
                  <Form.Label>Assigned Requirement (optional)</Form.Label>
                  <Form.Control value={form.assignedRequirement} onChange={e => setForm(f => ({ ...f, assignedRequirement: e.target.value }))} />
                </Form.Group>
              </Col>
              <Col xs={4}>
                <Form.Group controlId={`fld-4`}>
                  <Form.Label>Due Date</Form.Label>
                  <Form.Control type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
                </Form.Group>
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
