import { useEffect, useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import type { Branch, BranchType } from '../../types';
import { useAuth } from '../../store/AuthContext';
import { useData } from '../../store/DataContext';
import { genId } from '../../utils/format';

interface BranchFormModalProps {
  show: boolean;
  branch?: Branch | null;
  onClose: () => void;
  onSaved?: (branch: Branch) => void;
}

interface FormState {
  name: string;
  code: string;
  type: BranchType;
  location: string;
  manager: string;
  email: string;
  phone: string;
  established: string;
  status: 'Active' | 'Inactive';
}

const EMPTY: FormState = {
  name: '', code: '', type: 'Branch', location: '', manager: '', email: '', phone: '',
  established: new Date().toISOString().slice(0, 10), status: 'Active',
};

export default function BranchFormModal({ show, branch, onClose, onSaved }: BranchFormModalProps) {
  const { currentUser, allUsers } = useAuth();
  const { branches, addBranch, updateBranch } = useData();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const managers = allUsers.filter(u => u.role === 'Management' || u.role === 'Project Manager' || u.role === 'Administrator');

  useEffect(() => {
    if (!show) return;
    if (branch) {
      setForm({
        name: branch.name, code: branch.code, type: branch.type, location: branch.location,
        manager: branch.manager, email: branch.email, phone: branch.phone,
        established: branch.established, status: branch.status,
      });
    } else {
      setForm({ ...EMPTY, manager: managers[0]?.name || '' });
    }
    setErrors({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, branch]);

  const update = (field: keyof FormState, value: string) => setForm(f => ({ ...f, [field]: value }));

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) next.name = 'Branch name is required.';
    if (!form.code.trim()) next.code = 'Branch code is required.';
    else if (branches.some(b => b.code.toLowerCase() === form.code.trim().toLowerCase() && b.id !== branch?.id)) {
      next.code = 'That branch code is already in use.';
    }
    if (!form.location.trim()) next.location = 'Location is required.';
    if (!form.manager) next.manager = 'A branch manager is required.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (branch) {
      updateBranch(branch.id, {
        name: form.name.trim(), code: form.code.trim().toUpperCase(), type: form.type, location: form.location.trim(),
        manager: form.manager, email: form.email.trim(), phone: form.phone.trim(),
        established: form.established, status: form.status,
      });
      onSaved?.({ ...branch, ...form, code: form.code.trim().toUpperCase() });
    } else {
      const created: Branch = {
        id: genId('br'), name: form.name.trim(), code: form.code.trim().toUpperCase(), type: form.type,
        location: form.location.trim(), manager: form.manager, email: form.email.trim(), phone: form.phone.trim(),
        established: form.established, status: form.status,
        createdAt: new Date().toISOString(), createdBy: currentUser.name,
      };
      addBranch(created);
      onSaved?.(created);
    }
    onClose();
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Form onSubmit={handleSubmit} noValidate>
        <Modal.Header closeButton><Modal.Title as="h5">{branch ? 'Edit Branch' : 'Add Branch'}</Modal.Title></Modal.Header>
        <Modal.Body>
          <Row className="g-3">
            <Col md={8}>
              <Form.Group controlId="branch-name">
                <Form.Label className="form-required">Branch Name</Form.Label>
                <Form.Control value={form.name} onChange={e => update('name', e.target.value)} isInvalid={!!errors.name} placeholder="e.g. Olympia Branch" />
                <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId="branch-code">
                <Form.Label className="form-required">Code</Form.Label>
                <Form.Control value={form.code} onChange={e => update('code', e.target.value)} isInvalid={!!errors.code} placeholder="BR-OLY" />
                <Form.Control.Feedback type="invalid">{errors.code}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="branch-type">
                <Form.Label>Type</Form.Label>
                <Form.Select value={form.type} onChange={e => update('type', e.target.value)}>
                  <option value="Branch">Branch</option>
                  <option value="Headquarters">Headquarters</option>
                </Form.Select>
                <Form.Text>Headquarters is the central system and sees all branches' data.</Form.Text>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="branch-location">
                <Form.Label className="form-required">Location</Form.Label>
                <Form.Control value={form.location} onChange={e => update('location', e.target.value)} isInvalid={!!errors.location} placeholder="City, State" />
                <Form.Control.Feedback type="invalid">{errors.location}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="branch-manager">
                <Form.Label className="form-required">Branch Manager</Form.Label>
                <Form.Select value={form.manager} onChange={e => update('manager', e.target.value)} isInvalid={!!errors.manager}>
                  <option value="">Select a manager</option>
                  {managers.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                </Form.Select>
                <Form.Control.Feedback type="invalid">{errors.manager}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="branch-established">
                <Form.Label>Established</Form.Label>
                <Form.Control type="date" value={form.established} onChange={e => update('established', e.target.value)} />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="branch-email">
                <Form.Label>Email</Form.Label>
                <Form.Control type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="branch@greencore.com" />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="branch-phone">
                <Form.Label>Phone</Form.Label>
                <Form.Control value={form.phone} onChange={e => update('phone', e.target.value)} />
              </Form.Group>
            </Col>
            {branch && (
              <Col md={6}>
                <Form.Group controlId="branch-status">
                  <Form.Label>Status</Form.Label>
                  <Form.Select value={form.status} onChange={e => update('status', e.target.value)}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            )}
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit">{branch ? 'Save Changes' : 'Add Branch'}</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
