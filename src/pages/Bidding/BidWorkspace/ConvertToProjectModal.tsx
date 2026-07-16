import { useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import type { Bid, ID } from '../../../types';
import { useData } from '../../../store/DataContext';
import { useAuth } from '../../../store/AuthContext';
import { formatCurrency } from '../../../utils/format';

interface ConvertToProjectModalProps {
  show: boolean;
  bid: Bid;
  onClose: () => void;
  onConverted: (projectId: ID) => void;
}

export default function ConvertToProjectModal({ show, bid, onClose, onConverted }: ConvertToProjectModalProps) {
  const { convertBidToProject } = useData();
  const { currentUser } = useAuth();
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (bid.convertedProjectId) {
      setError('This bid has already been converted to a project.');
      return;
    }
    const project = convertBidToProject(bid.id, currentUser.name);
    if (!project) {
      setError('Unable to convert this bid. It may have already been converted.');
      return;
    }
    onConverted(project.id);
    onClose();
  };

  const proposedPrice = bid.costEstimates.length ? bid.costEstimates[bid.costEstimates.length - 1].proposedPrice : bid.estimatedValue;
  const contractValue = bid.result?.winningAmount ?? bid.result?.finalAmount ?? proposedPrice;

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton><Modal.Title as="h5">Convert Bid to Project</Modal.Title></Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        <p>You're about to convert the awarded bid <strong>{bid.reference}</strong> into an active project. This action:</p>
        <ul className="small">
          <li>Creates a new project record with a permanent link back to this bid</li>
          <li>Copies client, location, scope, contacts, key dates, and awarded contract amount ({formatCurrency(contractValue)})</li>
          <li>Copies bid documents, team assignments, and notes as reference</li>
          <li>Preserves this bid's full history — it is not deleted or modified beyond the link</li>
          <li>Cannot be undone or repeated for the same bid</li>
        </ul>
        <p className="small text-secondary mb-0">Recorded as converted by <strong>{currentUser.name}</strong> at the current date and time.</p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onClose}>Cancel</Button>
        <Button variant="success" onClick={handleConfirm}>Confirm Conversion</Button>
      </Modal.Footer>
    </Modal>
  );
}
