import { useEffect, useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import type { Project, Priority, ProjectStatus } from '../../types';
import { useAuth } from '../../store/AuthContext';
import { genId } from '../../utils/format';

const STATUSES: ProjectStatus[] = ['Planning', 'Mobilization', 'In Progress', 'On Hold', 'Delayed', 'For Inspection', 'Completed', 'Closed', 'Cancelled'];
const PRIORITIES: Priority[] = ['Low', 'Medium', 'High', 'Critical'];

interface FormState {
  name: string;
  client: string;
  clientContact: string;
  location: string;
  description: string;
  scope: string;
  projectManager: string;
  status: ProjectStatus;
  priority: Priority;
  startDate: string;
  targetCompletionDate: string;
  contractValue: string;
}

const EMPTY: FormState = {
  name: '', client: '', clientContact: '', location: '', description: '', scope: '',
  projectManager: '', status: 'Planning', priority: 'Medium', startDate: '', targetCompletionDate: '', contractValue: '',
};

interface ProjectFormModalProps {
  show: boolean;
  project?: Project | null;
  onClose: () => void;
  onSave: (project: Project) => void;
}

export default function ProjectFormModal({ show, project, onClose, onSave }: ProjectFormModalProps) {
  const { currentUser, allUsers } = useAuth();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const projectManagers = allUsers.filter(u => u.role === 'Project Manager' || u.role === 'Management');

  useEffect(() => {
    if (show) {
      if (project) {
        setForm({
          name: project.name, client: project.client, clientContact: project.clientContact,
          location: project.location, description: project.description, scope: project.scope,
          projectManager: project.projectManager, status: project.status, priority: project.priority,
          startDate: project.startDate, targetCompletionDate: project.targetCompletionDate,
          contractValue: String(project.contractValue),
        });
      } else {
        setForm({ ...EMPTY, projectManager: projectManagers[0]?.name || '' });
      }
      setErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, project]);

  const update = (field: keyof FormState, value: string) => setForm(f => ({ ...f, [field]: value }));

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) next.name = 'Project name is required.';
    if (!form.client.trim()) next.client = 'Client is required.';
    if (!form.location.trim()) next.location = 'Location is required.';
    if (!form.projectManager) next.projectManager = 'Project manager is required.';
    if (!form.startDate) next.startDate = 'Start date is required.';
    if (!form.targetCompletionDate) next.targetCompletionDate = 'Target completion date is required.';
    if (form.startDate && form.targetCompletionDate && form.targetCompletionDate < form.startDate) {
      next.targetCompletionDate = 'Target completion must be after the start date.';
    }
    if (!form.contractValue || Number.isNaN(Number(form.contractValue)) || Number(form.contractValue) <= 0) {
      next.contractValue = 'Enter a valid contract value.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const now = new Date().toISOString();
    if (project) {
      onSave({
        ...project,
        name: form.name, client: form.client, clientContact: form.clientContact, location: form.location,
        description: form.description, scope: form.scope, projectManager: form.projectManager,
        status: form.status, priority: form.priority, startDate: form.startDate,
        targetCompletionDate: form.targetCompletionDate, contractValue: Number(form.contractValue),
        updatedAt: now,
      });
    } else {
      const id = genId('p');
      onSave({
        id,
        code: `GB-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 899)}`,
        name: form.name, client: form.client, clientContact: form.clientContact, location: form.location,
        description: form.description, scope: form.scope, projectManager: form.projectManager,
        status: form.status, priority: form.priority, startDate: form.startDate,
        targetCompletionDate: form.targetCompletionDate, currentPhase: 'Pre-Construction', progress: 0,
        contractValue: Number(form.contractValue),
        health: { cost: 'Good', schedule: 'Good', quality: 'Good', safety: 'Good' },
        phases: [], milestones: [], contacts: [],
        financials: {
          contractValue: Number(form.contractValue), approvedBudget: Number(form.contractValue) * 0.95,
          committedCost: 0, actualExpenses: 0, billed: 0, paymentsReceived: 0, retentionPct: 10, changeOrders: [],
        },
        statusHistory: [{ id: genId('sh'), previousStatus: 'Planning', newStatus: form.status, updatedBy: currentUser.name, timestamp: now, reason: 'Project created' }],
        blockers: [], createdAt: now, updatedAt: now, createdBy: currentUser.name, archived: false,
      });
    }
  };

  return (
    <Modal show={show} onHide={onClose} size="lg" centered>
      <Form onSubmit={handleSubmit} noValidate>
        <Modal.Header closeButton>
          <Modal.Title as="h5">{project ? 'Edit Project' : 'Create Project'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-3">
            <Col md={8}>
              <Form.Group controlId={`fld-1`}>
                <Form.Label className="form-required">Project Name</Form.Label>
                <Form.Control value={form.name} onChange={e => update('name', e.target.value)} isInvalid={!!errors.name} />
                <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId={`fld-2`}>
                <Form.Label>Priority</Form.Label>
                <Form.Select value={form.priority} onChange={e => update('priority', e.target.value)}>
                  {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId={`fld-3`}>
                <Form.Label className="form-required">Client</Form.Label>
                <Form.Control value={form.client} onChange={e => update('client', e.target.value)} isInvalid={!!errors.client} />
                <Form.Control.Feedback type="invalid">{errors.client}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId={`fld-4`}>
                <Form.Label>Client Contact</Form.Label>
                <Form.Control value={form.clientContact} onChange={e => update('clientContact', e.target.value)} placeholder="Name — Title" />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId={`fld-5`}>
                <Form.Label className="form-required">Location</Form.Label>
                <Form.Control value={form.location} onChange={e => update('location', e.target.value)} isInvalid={!!errors.location} />
                <Form.Control.Feedback type="invalid">{errors.location}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId={`fld-6`}>
                <Form.Label className="form-required">Project Manager</Form.Label>
                <Form.Select value={form.projectManager} onChange={e => update('projectManager', e.target.value)} isInvalid={!!errors.projectManager}>
                  <option value="">Select a project manager</option>
                  {projectManagers.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                </Form.Select>
                <Form.Control.Feedback type="invalid">{errors.projectManager}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={12}>
              <Form.Group controlId={`fld-7`}>
                <Form.Label>Description / Scope</Form.Label>
                <Form.Control as="textarea" rows={2} value={form.description} onChange={e => update('description', e.target.value)} />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId={`fld-8`}>
                <Form.Label className="form-required">Start Date</Form.Label>
                <Form.Control type="date" value={form.startDate} onChange={e => update('startDate', e.target.value)} isInvalid={!!errors.startDate} />
                <Form.Control.Feedback type="invalid">{errors.startDate}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId={`fld-9`}>
                <Form.Label className="form-required">Target Completion</Form.Label>
                <Form.Control type="date" value={form.targetCompletionDate} onChange={e => update('targetCompletionDate', e.target.value)} isInvalid={!!errors.targetCompletionDate} />
                <Form.Control.Feedback type="invalid">{errors.targetCompletionDate}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId={`fld-10`}>
                <Form.Label className="form-required">Contract Value (USD)</Form.Label>
                <Form.Control type="number" min={0} value={form.contractValue} onChange={e => update('contractValue', e.target.value)} isInvalid={!!errors.contractValue} />
                <Form.Control.Feedback type="invalid">{errors.contractValue}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            {project && (
              <Col md={6}>
                <Form.Group controlId={`fld-11`}>
                  <Form.Label>Status</Form.Label>
                  <Form.Select value={form.status} onChange={e => update('status', e.target.value)}>
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </Form.Select>
                  <Form.Text>To record a status change with history and remarks, use "Change Status" from the project workspace instead.</Form.Text>
                </Form.Group>
              </Col>
            )}
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit">{project ? 'Save Changes' : 'Create Project'}</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
