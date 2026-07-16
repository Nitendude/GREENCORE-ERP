import { useState } from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import EmptyState from '../../../../components/ui/EmptyState';
import { useData } from '../../../../store/DataContext';
import { useAuth } from '../../../../store/AuthContext';
import { formatCurrency, formatDate, genId } from '../../../../utils/format';
import type { Bid, CostEstimateLine } from '../../../../types';

const CATEGORIES: CostEstimateLine['category'][] = ['Labor', 'Materials', 'Equipment', 'Subcontractors', 'Logistics', 'Overhead', 'Taxes', 'Contingency', 'Markup'];

export default function CostEstimateTab({ bid }: { bid: Bid }) {
  const { updateBid } = useData();
  const { currentUser, can } = useAuth();
  const canEdit = can('bidding.estimate.edit');
  const [showForm, setShowForm] = useState(false);
  const latest = bid.costEstimates[bid.costEstimates.length - 1];
  const [lines, setLines] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    CATEGORIES.forEach(c => { init[c] = String(latest?.lines.find(l => l.category === c)?.amount || 0); });
    return init;
  });

  const openForm = () => {
    const init: Record<string, string> = {};
    CATEGORIES.forEach(c => { init[c] = String(latest?.lines.find(l => l.category === c)?.amount || 0); });
    setLines(init);
    setShowForm(true);
  };

  const total = CATEGORIES.reduce((sum, c) => sum + (Number(lines[c]) || 0), 0);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newLines: CostEstimateLine[] = CATEGORIES.map(c => ({ id: genId('l'), category: c, amount: Number(lines[c]) || 0 }));
    updateBid(bid.id, {
      costEstimates: [...bid.costEstimates, {
        id: genId('ce'), version: bid.costEstimates.length + 1, date: new Date().toISOString().slice(0, 10),
        lines: newLines, proposedPrice: total, updatedBy: currentUser.name,
      }],
    }, currentUser.name);
    setShowForm(false);
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="fw-bold mb-0">Cost Estimate</h6>
        {canEdit && <Button size="sm" variant="primary" onClick={openForm}><i className="bi bi-plus-lg me-1" /> New Version</Button>}
      </div>

      {!latest ? (
        <EmptyState icon="bi-calculator" title="No cost estimate yet" message="Create the first version of the cost estimate." actionLabel={canEdit ? 'Create Estimate' : undefined} onAction={canEdit ? openForm : undefined} />
      ) : (
        <Row className="g-3">
          <Col xs={12} lg={7}>
            <div className="section-card p-3">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold mb-0">Version {latest.version} Breakdown</h6>
                <span className="text-secondary small">Updated {formatDate(latest.date)} by {latest.updatedBy}</span>
              </div>
              <table className="table app-table mb-0">
                <tbody>
                  {latest.lines.map(l => (
                    <tr key={l.id}><td>{l.category}</td><td className="text-end">{formatCurrency(l.amount)}</td></tr>
                  ))}
                  <tr className="fw-bold"><td>Proposed Price</td><td className="text-end">{formatCurrency(latest.proposedPrice)}</td></tr>
                </tbody>
              </table>
            </div>
          </Col>
          <Col xs={12} lg={5}>
            <div className="section-card p-3">
              <h6 className="fw-bold mb-2">Version History</h6>
              <ul className="list-unstyled mb-0 d-flex flex-column gap-2">
                {[...bid.costEstimates].reverse().map(v => (
                  <li key={v.id} className="d-flex justify-content-between border-bottom pb-2">
                    <div>
                      <div className="small fw-semibold">Version {v.version}</div>
                      <div className="text-secondary small">{formatDate(v.date)} by {v.updatedBy}</div>
                    </div>
                    <div className="fw-semibold small">{formatCurrency(v.proposedPrice)}</div>
                  </li>
                ))}
              </ul>
            </div>
          </Col>
        </Row>
      )}

      <Modal show={showForm} onHide={() => setShowForm(false)} size="lg" centered>
        <Form onSubmit={handleSave}>
          <Modal.Header closeButton><Modal.Title as="h5">New Cost Estimate Version</Modal.Title></Modal.Header>
          <Modal.Body>
            <Row className="g-3">
              {CATEGORIES.map(c => (
                <Col xs={6} md={4} key={c}>
                  <Form.Group controlId={`fld-1`}>
                    <Form.Label className="small">{c}</Form.Label>
                    <Form.Control type="number" min={0} value={lines[c]} onChange={e => setLines(l => ({ ...l, [c]: e.target.value }))} />
                  </Form.Group>
                </Col>
              ))}
            </Row>
            <div className="section-card p-2 mt-3 d-flex justify-content-between px-3">
              <span className="fw-semibold">Proposed Price</span>
              <span className="fw-bold">{formatCurrency(total)}</span>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Save Version</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}
