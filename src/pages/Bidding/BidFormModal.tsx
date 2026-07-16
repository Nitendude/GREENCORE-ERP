import { useEffect, useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import type { Bid } from '../../types';
import { useAuth } from '../../store/AuthContext';
import { genId } from '../../utils/format';

interface FormState {
  title: string; client: string; clientContact: string; location: string; description: string;
  source: string; bidOwner: string; estimatedValue: string; submissionDeadline: string; probability: string;
}

const EMPTY: FormState = {
  title: '', client: '', clientContact: '', location: '', description: '',
  source: 'Direct Invitation', bidOwner: '', estimatedValue: '', submissionDeadline: '', probability: '30',
};

const SOURCES = ['Direct Invitation', 'Public Tender', 'Referral', 'Repeat Client'];

interface BidFormModalProps {
  show: boolean;
  onClose: () => void;
  onSave: (bid: Bid) => void;
}

export default function BidFormModal({ show, onClose, onSave }: BidFormModalProps) {
  const { currentUser, allUsers } = useAuth();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const bidOwners = allUsers.filter(u => u.role === 'Bidding Manager' || u.role === 'Estimator');

  useEffect(() => {
    if (show) {
      setForm({ ...EMPTY, bidOwner: bidOwners[0]?.name || currentUser.name });
      setErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  const update = (field: keyof FormState, value: string) => setForm(f => ({ ...f, [field]: value }));

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.title.trim()) next.title = 'Opportunity title is required.';
    if (!form.client.trim()) next.client = 'Client is required.';
    if (!form.location.trim()) next.location = 'Location is required.';
    if (!form.submissionDeadline) next.submissionDeadline = 'Submission deadline is required.';
    if (!form.estimatedValue || Number.isNaN(Number(form.estimatedValue)) || Number(form.estimatedValue) <= 0) {
      next.estimatedValue = 'Enter a valid estimated value.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const now = new Date().toISOString();
    const id = genId('b');
    onSave({
      id,
      reference: `BID-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 899)}`,
      title: form.title, client: form.client, clientContact: form.clientContact, location: form.location,
      description: form.description, source: form.source, bidOwner: form.bidOwner,
      estimatedValue: Number(form.estimatedValue), submissionDeadline: form.submissionDeadline,
      stage: 'Lead / Opportunity', probability: Number(form.probability), competitors: [],
      nextAction: 'Initial review and go/no-go scheduling',
      requirements: [], costEstimates: [], documents: [], assignments: [{ id: genId('a'), bidId: id, role: 'Bid Manager', person: form.bidOwner }],
      clarifications: [], approvals: [],
      stageHistory: [{ id: genId('sh'), previousStatus: 'Lead / Opportunity', newStatus: 'Lead / Opportunity', updatedBy: currentUser.name, timestamp: now, reason: 'Opportunity logged' }],
      createdAt: now, updatedAt: now, createdBy: currentUser.name,
    });
  };

  return (
    <Modal show={show} onHide={onClose} size="lg" centered>
      <Form onSubmit={handleSubmit} noValidate>
        <Modal.Header closeButton>
          <Modal.Title as="h5">Log New Bid Opportunity</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-3">
            <Col md={8}>
              <Form.Group controlId={`fld-1`}>
                <Form.Label className="form-required">Opportunity / Project Name</Form.Label>
                <Form.Control value={form.title} onChange={e => update('title', e.target.value)} isInvalid={!!errors.title} />
                <Form.Control.Feedback type="invalid">{errors.title}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId={`fld-2`}>
                <Form.Label>Source</Form.Label>
                <Form.Select value={form.source} onChange={e => update('source', e.target.value)}>
                  {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
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
                <Form.Label>Bid Owner</Form.Label>
                <Form.Select value={form.bidOwner} onChange={e => update('bidOwner', e.target.value)}>
                  {bidOwners.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={12}>
              <Form.Group controlId={`fld-7`}>
                <Form.Label>Opportunity Description</Form.Label>
                <Form.Control as="textarea" rows={2} value={form.description} onChange={e => update('description', e.target.value)} />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId={`fld-8`}>
                <Form.Label className="form-required">Estimated Value (USD)</Form.Label>
                <Form.Control type="number" min={0} value={form.estimatedValue} onChange={e => update('estimatedValue', e.target.value)} isInvalid={!!errors.estimatedValue} />
                <Form.Control.Feedback type="invalid">{errors.estimatedValue}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId={`fld-9`}>
                <Form.Label className="form-required">Submission Deadline</Form.Label>
                <Form.Control type="date" value={form.submissionDeadline} onChange={e => update('submissionDeadline', e.target.value)} isInvalid={!!errors.submissionDeadline} />
                <Form.Control.Feedback type="invalid">{errors.submissionDeadline}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId={`fld-10`}>
                <Form.Label>Win Probability (%)</Form.Label>
                <Form.Control type="number" min={0} max={100} value={form.probability} onChange={e => update('probability', e.target.value)} />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit">Log Opportunity</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
