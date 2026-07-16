import { useState } from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import StatusBadge from '../../../../components/ui/StatusBadge';
import EmptyState from '../../../../components/ui/EmptyState';
import { useData } from '../../../../store/DataContext';
import { useAuth } from '../../../../store/AuthContext';
import { formatCurrency } from '../../../../utils/format';
import type { Bid } from '../../../../types';

const TERMINAL_STAGES = ['Awarded', 'Lost', 'Withdrawn', 'Cancelled'];

export default function ResultTab({ bid }: { bid: Bid }) {
  const { updateBid } = useData();
  const { currentUser, can } = useAuth();
  const canEdit = can('bidding.manage');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    finalAmount: String(bid.result?.finalAmount ?? bid.estimatedValue),
    winningAmount: String(bid.result?.winningAmount ?? ''),
    competitorInfo: bid.result?.competitorInfo ?? '',
    reason: bid.result?.reason ?? '',
    lessonsLearned: bid.result?.lessonsLearned ?? '',
  });

  if (!TERMINAL_STAGES.includes(bid.stage) && !bid.result) {
    return <EmptyState icon="bi-award" title="No result yet" message="This bid is still active. Results and lessons learned will appear once the bid reaches a final stage (Awarded, Lost, Withdrawn, or Cancelled)." />;
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateBid(bid.id, {
      result: {
        outcome: bid.stage as 'Awarded' | 'Lost' | 'Withdrawn' | 'Cancelled',
        finalAmount: Number(form.finalAmount) || undefined,
        winningAmount: form.winningAmount ? Number(form.winningAmount) : undefined,
        competitorInfo: form.competitorInfo || undefined,
        reason: form.reason || undefined,
        lessonsLearned: form.lessonsLearned || undefined,
      },
    }, currentUser.name);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="section-card p-3">
        <Form onSubmit={handleSave}>
          <Row className="g-3">
            <Col md={6}>
              <Form.Group controlId={`fld-1`}>
                <Form.Label>Final Proposed Amount</Form.Label>
                <Form.Control type="number" value={form.finalAmount} onChange={e => setForm(f => ({ ...f, finalAmount: e.target.value }))} />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId={`fld-2`}>
                <Form.Label>Winning Amount (if known)</Form.Label>
                <Form.Control type="number" value={form.winningAmount} onChange={e => setForm(f => ({ ...f, winningAmount: e.target.value }))} />
              </Form.Group>
            </Col>
            <Col md={12}>
              <Form.Group controlId={`fld-3`}>
                <Form.Label>Competitor Information</Form.Label>
                <Form.Control as="textarea" rows={2} value={form.competitorInfo} onChange={e => setForm(f => ({ ...f, competitorInfo: e.target.value }))} />
              </Form.Group>
            </Col>
            <Col md={12}>
              <Form.Group controlId={`fld-4`}>
                <Form.Label>Reason Won / Lost</Form.Label>
                <Form.Control as="textarea" rows={2} value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} />
              </Form.Group>
            </Col>
            <Col md={12}>
              <Form.Group controlId={`fld-5`}>
                <Form.Label>Lessons Learned</Form.Label>
                <Form.Control as="textarea" rows={2} value={form.lessonsLearned} onChange={e => setForm(f => ({ ...f, lessonsLearned: e.target.value }))} />
              </Form.Group>
            </Col>
          </Row>
          <div className="d-flex justify-content-end gap-2 mt-3">
            <Button variant="outline-secondary" onClick={() => setEditing(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Save Result</Button>
          </div>
        </Form>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="fw-bold mb-0">Result & Lessons Learned</h6>
        {canEdit && <Button size="sm" variant="outline-primary" onClick={() => setEditing(true)}>{bid.result ? 'Edit Result' : 'Record Result'}</Button>}
      </div>
      {!bid.result ? (
        <EmptyState icon="bi-award" title="Result not yet recorded" message="Record the final outcome and lessons learned for this bid." />
      ) : (
        <Row className="g-3">
          <Col xs={12} md={6}>
            <div className="section-card p-3 h-100">
              <div className="mb-2"><StatusBadge status={bid.result.outcome} /></div>
              <div className="d-flex justify-content-between small mb-1"><span className="text-secondary">Final Proposed Amount</span><span>{formatCurrency(bid.result.finalAmount)}</span></div>
              {bid.result.winningAmount !== undefined && (
                <div className="d-flex justify-content-between small"><span className="text-secondary">Winning Amount</span><span>{formatCurrency(bid.result.winningAmount)}</span></div>
              )}
            </div>
          </Col>
          <Col xs={12} md={6}>
            <div className="section-card p-3 h-100">
              <h6 className="fw-bold small mb-1">Competitor Information</h6>
              <p className="small mb-0">{bid.result.competitorInfo || '—'}</p>
            </div>
          </Col>
          <Col xs={12} md={6}>
            <div className="section-card p-3 h-100">
              <h6 className="fw-bold small mb-1">Reason</h6>
              <p className="small mb-0">{bid.result.reason || '—'}</p>
            </div>
          </Col>
          <Col xs={12} md={6}>
            <div className="section-card p-3 h-100">
              <h6 className="fw-bold small mb-1">Lessons Learned</h6>
              <p className="small mb-0">{bid.result.lessonsLearned || '—'}</p>
            </div>
          </Col>
        </Row>
      )}
    </div>
  );
}
