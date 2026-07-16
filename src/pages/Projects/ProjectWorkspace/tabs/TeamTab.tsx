import { useState } from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import EmptyState from '../../../../components/ui/EmptyState';
import { useData } from '../../../../store/DataContext';
import { useAuth } from '../../../../store/AuthContext';
import { genId } from '../../../../utils/format';
import type { Project, ProjectContact } from '../../../../types';

const GROUPS: { type: ProjectContact['type']; label: string; icon: string }[] = [
  { type: 'Internal', label: 'Internal Team', icon: 'bi-person-badge' },
  { type: 'Client', label: 'Client Contacts', icon: 'bi-person-lines-fill' },
  { type: 'Consultant', label: 'Consultants', icon: 'bi-easel' },
  { type: 'Contractor', label: 'Contractors', icon: 'bi-tools' },
  { type: 'Supplier', label: 'Suppliers', icon: 'bi-truck' },
];

export default function TeamTab({ project }: { project: Project }) {
  const { updateProject } = useData();
  const { currentUser } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', role: '', company: '', type: 'Internal' as ProjectContact['type'], email: '', phone: '' });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.role.trim()) return;
    const newContact: ProjectContact = { id: genId('c'), ...form };
    updateProject(project.id, { contacts: [...project.contacts, newContact] }, currentUser.name);
    setShowForm(false);
    setForm({ name: '', role: '', company: '', type: 'Internal', email: '', phone: '' });
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="fw-bold mb-0">Project Manager: <span className="fw-normal">{project.projectManager}</span></h6>
        <Button size="sm" variant="primary" onClick={() => setShowForm(true)}><i className="bi bi-plus-lg me-1" /> Add Contact</Button>
      </div>
      <Row className="g-3">
        {GROUPS.map(group => {
          const items = project.contacts.filter(c => c.type === group.type);
          return (
            <Col xs={12} md={6} key={group.type}>
              <div className="section-card p-3 h-100">
                <h6 className="fw-bold mb-2"><i className={`bi ${group.icon} me-2`} />{group.label}</h6>
                {items.length === 0 ? (
                  <EmptyState icon={group.icon} title={`No ${group.label.toLowerCase()} added`} />
                ) : (
                  <ul className="list-unstyled mb-0 d-flex flex-column gap-3">
                    {items.map(c => (
                      <li key={c.id} className="d-flex justify-content-between align-items-start border-bottom pb-2">
                        <div>
                          <div className="fw-semibold small">{c.name}</div>
                          <div className="text-secondary small">{c.role}{c.company ? ` • ${c.company}` : ''}</div>
                        </div>
                        <div className="text-end small">
                          <div>{c.email}</div>
                          <div className="text-secondary">{c.phone}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Col>
          );
        })}
      </Row>

      <Modal show={showForm} onHide={() => setShowForm(false)} centered>
        <Form onSubmit={handleAdd}>
          <Modal.Header closeButton><Modal.Title as="h5">Add Contact</Modal.Title></Modal.Header>
          <Modal.Body>
            <Row className="g-3">
              <Col xs={6}>
                <Form.Group controlId={`fld-1`}>
                  <Form.Label className="form-required">Name</Form.Label>
                  <Form.Control required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </Form.Group>
              </Col>
              <Col xs={6}>
                <Form.Group controlId={`fld-2`}>
                  <Form.Label className="form-required">Role</Form.Label>
                  <Form.Control required value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} />
                </Form.Group>
              </Col>
              <Col xs={6}>
                <Form.Group controlId={`fld-3`}>
                  <Form.Label>Category</Form.Label>
                  <Form.Select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as ProjectContact['type'] }))}>
                    {GROUPS.map(g => <option key={g.type} value={g.type}>{g.label}</option>)}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col xs={6}>
                <Form.Group controlId={`fld-4`}>
                  <Form.Label>Company</Form.Label>
                  <Form.Control value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
                </Form.Group>
              </Col>
              <Col xs={6}>
                <Form.Group controlId={`fld-5`}>
                  <Form.Label>Email</Form.Label>
                  <Form.Control type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </Form.Group>
              </Col>
              <Col xs={6}>
                <Form.Group controlId={`fld-6`}>
                  <Form.Label>Phone</Form.Label>
                  <Form.Control value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Add Contact</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}
