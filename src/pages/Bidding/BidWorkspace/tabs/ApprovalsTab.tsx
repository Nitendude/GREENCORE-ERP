import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import StatusBadge from '../../../../components/ui/StatusBadge';
import EmptyState from '../../../../components/ui/EmptyState';
import { useData } from '../../../../store/DataContext';
import { useAuth } from '../../../../store/AuthContext';
import { formatDate } from '../../../../utils/format';
import type { Bid, ApprovalEntry } from '../../../../types';

export default function ApprovalsTab({ bid }: { bid: Bid }) {
  const { updateBid } = useData();
  const { currentUser, can } = useAuth();
  const canApprove = can('bidding.approve');
  const [target, setTarget] = useState<ApprovalEntry | null>(null);
  const [remarks, setRemarks] = useState('');

  const handleDecision = (decision: 'Approved' | 'Rejected') => {
    if (!target) return;
    updateBid(bid.id, {
      approvals: bid.approvals.map(a => a.id === target.id ? { ...a, decision, remarks, date: new Date().toISOString().slice(0, 10), approver: currentUser.name } : a),
    }, currentUser.name);
    setTarget(null);
    setRemarks('');
  };

  return (
    <div>
      <h6 className="fw-bold mb-3">Approvals</h6>
      {bid.approvals.length === 0 ? (
        <EmptyState icon="bi-check2-circle" title="No approvals required yet" />
      ) : (
        <div className="table-responsive-wrapper">
          <table className="table app-table mb-0">
            <thead><tr><th>Type</th><th>Approver</th><th>Date</th><th>Decision</th><th>Remarks</th><th></th></tr></thead>
            <tbody>
              {bid.approvals.map(a => (
                <tr key={a.id}>
                  <td>{a.type}</td>
                  <td>{a.approver}</td>
                  <td>{a.date ? formatDate(a.date) : '—'}</td>
                  <td><StatusBadge status={a.decision} /></td>
                  <td className="small">{a.remarks || '—'}</td>
                  <td>
                    {canApprove && a.decision === 'Pending' && (
                      <Button size="sm" variant="outline-primary" onClick={() => { setTarget(a); setRemarks(''); }}>Review</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal show={target !== null} onHide={() => setTarget(null)} centered>
        <Modal.Header closeButton><Modal.Title as="h5">{target?.type} Approval</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form.Group controlId={`fld-1`}>
            <Form.Label>Remarks</Form.Label>
            <Form.Control as="textarea" rows={3} value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Optional remarks for this decision..." />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setTarget(null)}>Cancel</Button>
          <Button variant="outline-danger" onClick={() => handleDecision('Rejected')}>Reject</Button>
          <Button variant="success" onClick={() => handleDecision('Approved')}>Approve</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
