import { useEffect, useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import type { Bid, GoNoGoAssessment } from '../../../types';
import { useData } from '../../../store/DataContext';
import { useAuth } from '../../../store/AuthContext';

const FACTORS: { key: keyof GoNoGoAssessment; label: string }[] = [
  { key: 'strategicFit', label: 'Strategic Fit' },
  { key: 'clientRelationship', label: 'Client Relationship' },
  { key: 'availableCapacity', label: 'Available Capacity' },
  { key: 'technicalCapability', label: 'Technical Capability' },
  { key: 'profitability', label: 'Profitability' },
  { key: 'competition', label: 'Competition (5 = low competition)' },
  { key: 'submissionTime', label: 'Submission Time Adequacy' },
  { key: 'commercialLegalRisk', label: 'Commercial & Legal Risk (5 = low risk)' },
];

export default function GoNoGoModal({ show, bid, onClose }: { show: boolean; bid: Bid; onClose: () => void }) {
  const { updateBid } = useData();
  const { currentUser } = useAuth();
  const existing = bid.goNoGo;
  const [scores, setScores] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (show) {
      const init: Record<string, number> = {};
      FACTORS.forEach(f => { init[f.key] = (existing?.[f.key] as number) ?? 3; });
      setScores(init);
      setNotes(existing?.notes || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  const average = FACTORS.reduce((sum, f) => sum + (scores[f.key] || 0), 0) / FACTORS.length;
  const suggestion: GoNoGoAssessment['recommendation'] = average >= 3.4 ? 'Go' : average >= 2.5 ? 'Undecided' : 'No-Go';

  const handleSave = (recommendation: GoNoGoAssessment['recommendation']) => {
    const assessment: GoNoGoAssessment = {
      strategicFit: scores.strategicFit, clientRelationship: scores.clientRelationship,
      availableCapacity: scores.availableCapacity, technicalCapability: scores.technicalCapability,
      profitability: scores.profitability, competition: scores.competition,
      submissionTime: scores.submissionTime, commercialLegalRisk: scores.commercialLegalRisk,
      recommendation, notes, assessedBy: currentUser.name, assessedDate: new Date().toISOString().slice(0, 10),
    };
    updateBid(bid.id, { goNoGo: assessment }, currentUser.name);
    onClose();
  };

  return (
    <Modal show={show} onHide={onClose} size="lg" centered>
      <Modal.Header closeButton><Modal.Title as="h5">Go/No-Go Assessment</Modal.Title></Modal.Header>
      <Modal.Body>
        <p className="text-secondary small">
          Score each factor from 1 (poor) to 5 (excellent). This is decision support only — management makes the final Go/No-Go call.
        </p>
        <Row className="g-3">
          {FACTORS.map(f => (
            <Col xs={12} md={6} key={f.key}>
              <Form.Group controlId={`fld-1`}>
                <div className="d-flex justify-content-between">
                  <Form.Label className="small mb-1">{f.label}</Form.Label>
                  <span className="small fw-semibold">{scores[f.key]}</span>
                </div>
                <Form.Range min={1} max={5} value={scores[f.key] || 3} onChange={e => setScores(s => ({ ...s, [f.key]: Number(e.target.value) }))} />
              </Form.Group>
            </Col>
          ))}
          <Col xs={12}>
            <Form.Group controlId={`fld-2`}>
              <Form.Label className="small mb-1">Notes</Form.Label>
              <Form.Control as="textarea" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Capacity constraints, capability gaps, strategic rationale..." />
            </Form.Group>
          </Col>
        </Row>
        <div className="section-card p-3 mt-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <div className="small text-secondary">System-suggested recommendation (average score: {average.toFixed(1)}/5)</div>
            <div className="fw-bold">{suggestion}</div>
          </div>
          <div className="text-secondary small">Final decision is yours to record below.</div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onClose}>Cancel</Button>
        <Button variant="outline-danger" onClick={() => handleSave('No-Go')}>Record No-Go</Button>
        <Button variant="outline-warning" onClick={() => handleSave('Undecided')}>Record Undecided</Button>
        <Button variant="success" onClick={() => handleSave('Go')}>Record Go</Button>
      </Modal.Footer>
    </Modal>
  );
}
