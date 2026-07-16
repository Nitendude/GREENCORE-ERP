import { useEffect, useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import type { Bid } from '../../../types';
import { useData } from '../../../store/DataContext';
import { useAuth } from '../../../store/AuthContext';

interface BidFormEditModalProps {
  show: boolean;
  bid: Bid;
  onClose: () => void;
}

export default function BidFormEditModal({ show, bid, onClose }: BidFormEditModalProps) {
  const { updateBid } = useData();
  const { currentUser } = useAuth();
  const [form, setForm] = useState({
    title: bid.title, client: bid.client, clientContact: bid.clientContact, location: bid.location,
    description: bid.description, estimatedValue: String(bid.estimatedValue), submissionDeadline: bid.submissionDeadline,
    probability: String(bid.probability), nextAction: bid.nextAction, competitors: bid.competitors.join(', '),
  });

  useEffect(() => {
    if (show) {
      setForm({
        title: bid.title, client: bid.client, clientContact: bid.clientContact, location: bid.location,
        description: bid.description, estimatedValue: String(bid.estimatedValue), submissionDeadline: bid.submissionDeadline,
        probability: String(bid.probability), nextAction: bid.nextAction, competitors: bid.competitors.join(', '),
      });
    }
  }, [show, bid]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateBid(bid.id, {
      title: form.title, client: form.client, clientContact: form.clientContact, location: form.location,
      description: form.description, estimatedValue: Number(form.estimatedValue) || bid.estimatedValue,
      submissionDeadline: form.submissionDeadline, probability: Number(form.probability) || 0,
      nextAction: form.nextAction, competitors: form.competitors.split(',').map(c => c.trim()).filter(Boolean),
    }, currentUser.name);
    onClose();
  };

  return (
    <Modal show={show} onHide={onClose} size="lg" centered>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton><Modal.Title as="h5">Edit Bid</Modal.Title></Modal.Header>
        <Modal.Body>
          <Row className="g-3">
            <Col md={8}>
              <Form.Group controlId={`fld-1`}>
                <Form.Label>Title</Form.Label>
                <Form.Control value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId={`fld-2`}>
                <Form.Label>Win Probability (%)</Form.Label>
                <Form.Control type="number" min={0} max={100} value={form.probability} onChange={e => setForm(f => ({ ...f, probability: e.target.value }))} />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId={`fld-3`}>
                <Form.Label>Client</Form.Label>
                <Form.Control value={form.client} onChange={e => setForm(f => ({ ...f, client: e.target.value }))} />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId={`fld-4`}>
                <Form.Label>Client Contact</Form.Label>
                <Form.Control value={form.clientContact} onChange={e => setForm(f => ({ ...f, clientContact: e.target.value }))} />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId={`fld-5`}>
                <Form.Label>Location</Form.Label>
                <Form.Control value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId={`fld-6`}>
                <Form.Label>Competitors (comma separated)</Form.Label>
                <Form.Control value={form.competitors} onChange={e => setForm(f => ({ ...f, competitors: e.target.value }))} />
              </Form.Group>
            </Col>
            <Col md={12}>
              <Form.Group controlId={`fld-7`}>
                <Form.Label>Description</Form.Label>
                <Form.Control as="textarea" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId={`fld-8`}>
                <Form.Label>Estimated Value (PHP)</Form.Label>
                <Form.Control type="number" value={form.estimatedValue} onChange={e => setForm(f => ({ ...f, estimatedValue: e.target.value }))} />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId={`fld-9`}>
                <Form.Label>Submission Deadline</Form.Label>
                <Form.Control type="date" value={form.submissionDeadline} onChange={e => setForm(f => ({ ...f, submissionDeadline: e.target.value }))} />
              </Form.Group>
            </Col>
            <Col md={12}>
              <Form.Group controlId={`fld-10`}>
                <Form.Label>Next Action</Form.Label>
                <Form.Control value={form.nextAction} onChange={e => setForm(f => ({ ...f, nextAction: e.target.value }))} />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit">Save Changes</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
