import { useEffect, useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import type { Estimate } from '../../types';
import { useAuth } from '../../store/AuthContext';
import { genId } from '../../utils/format';

interface Props {
  show: boolean;
  onClose: () => void;
  onSave: (e: Estimate) => void;
}

const EMPTY = { projectName: '', client: '', clientContact: '', location: '', grossFloorArea: '' };

export default function EstimateFormModal({ show, onClose, onSave }: Props) {
  const { currentUser, effectiveBranch } = useAuth();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => { if (show) { setForm(EMPTY); setErrors({}); } }, [show]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!form.projectName.trim()) next.projectName = 'Project name is required.';
    if (!form.client.trim()) next.client = 'Client is required.';
    if (!form.location.trim()) next.location = 'Location is required.';
    setErrors(next);
    if (Object.keys(next).length) return;

    const now = new Date().toISOString();
    const id = genId('est');
    onSave({
      id,
      code: `EST-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 899)}`,
      projectName: form.projectName.trim(), client: form.client.trim(), clientContact: form.clientContact.trim(),
      location: form.location.trim(), grossFloorArea: Number(form.grossFloorArea) || 0,
      status: 'Draft', currentRevision: 'Rev A',
      boqItems: [], boqRevisions: [],
      costing: {
        indirects: [
          { id: genId('ic'), label: 'OCM (Overhead, Contingencies, Misc.)', type: 'percent', value: 8 },
          { id: genId('ic'), label: 'Mobilization / Demobilization', type: 'amount', value: 50000 },
          { id: genId('ic'), label: 'Safety & Health', type: 'percent', value: 3 },
        ],
        profitMarginPct: 12, vatPct: 12, contingencyPct: 3,
      },
      quotation: {
        detailLevel: 'Per Division', validityDays: 30,
        paymentSchedule: '15% downpayment; progress billing per accomplishment; 10% retention.',
        termsAndConditions: 'Prices valid for the stated period, subject to material price changes. Scope changes require a variation order and re-estimate.',
        exclusions: 'Building permits, government fees, and works not listed in the BOQ.',
      },
      quotationRevisions: [], drawings: [], designRevisions: [],
      estimator: currentUser.name, createdAt: now, updatedAt: now, createdBy: currentUser.name,
      branchId: effectiveBranch?.id,
    });
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Form onSubmit={submit} noValidate>
        <Modal.Header closeButton><Modal.Title as="h5">New Estimate</Modal.Title></Modal.Header>
        <Modal.Body>
          <Row className="g-3">
            <Col xs={12}><Form.Group controlId="ne-name"><Form.Label className="form-required">Project Name</Form.Label><Form.Control value={form.projectName} onChange={e => setForm(f => ({ ...f, projectName: e.target.value }))} isInvalid={!!errors.projectName} /><Form.Control.Feedback type="invalid">{errors.projectName}</Form.Control.Feedback></Form.Group></Col>
            <Col xs={6}><Form.Group controlId="ne-client"><Form.Label className="form-required">Client</Form.Label><Form.Control value={form.client} onChange={e => setForm(f => ({ ...f, client: e.target.value }))} isInvalid={!!errors.client} /><Form.Control.Feedback type="invalid">{errors.client}</Form.Control.Feedback></Form.Group></Col>
            <Col xs={6}><Form.Group controlId="ne-contact"><Form.Label>Client Contact</Form.Label><Form.Control value={form.clientContact} onChange={e => setForm(f => ({ ...f, clientContact: e.target.value }))} /></Form.Group></Col>
            <Col xs={8}><Form.Group controlId="ne-loc"><Form.Label className="form-required">Location</Form.Label><Form.Control value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} isInvalid={!!errors.location} /><Form.Control.Feedback type="invalid">{errors.location}</Form.Control.Feedback></Form.Group></Col>
            <Col xs={4}><Form.Group controlId="ne-gfa"><Form.Label>Floor Area (sqm)</Form.Label><Form.Control type="number" value={form.grossFloorArea} onChange={e => setForm(f => ({ ...f, grossFloorArea: e.target.value }))} /></Form.Group></Col>
          </Row>
          <Form.Text>Starts as a Draft with default OCM, margin, and 12% VAT — you can refine everything in the workspace.</Form.Text>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit">Create Estimate</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
