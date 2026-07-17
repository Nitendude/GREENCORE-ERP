import { useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import type { Estimate, ID } from '../../../types';
import { useData } from '../../../store/DataContext';
import { useAuth } from '../../../store/AuthContext';
import { computeCosting } from '../../../utils/estimation';
import { formatCurrency } from '../../../utils/format';

interface Props {
  show: boolean;
  estimate: Estimate;
  onClose: () => void;
  onConverted: (projectId: ID) => void;
}

export default function ConvertEstimateModal({ show, estimate, onClose, onConverted }: Props) {
  const { convertEstimateToProject } = useData();
  const { currentUser } = useAuth();
  const [error, setError] = useState('');
  const costing = computeCosting(estimate);
  const budgetBaseline = Math.round(costing.subtotal);

  const confirm = () => {
    if (estimate.convertedProjectId) { setError('This estimate has already been converted.'); return; }
    const project = convertEstimateToProject(estimate.id, currentUser.name);
    if (!project) { setError('Unable to convert — it may already be converted.'); return; }
    onConverted(project.id);
    onClose();
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton><Modal.Title as="h5">Convert Quotation to Project</Modal.Title></Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        <p>Convert the won quotation <strong>{estimate.code}</strong> into an active project. This action:</p>
        <ul className="small">
          <li>Creates a project record for <strong>{estimate.projectName}</strong> ({estimate.client})</li>
          <li>Sets the contract value to <strong>{formatCurrency(costing.contractPrice)}</strong></li>
          <li>Sets the <strong>job-costing budget baseline</strong> to <strong>{formatCurrency(budgetBaseline)}</strong> (direct + indirect cost from the BOQ)</li>
          <li>Marks this quotation as Won and links it permanently to the new project</li>
          <li>Cannot be undone or repeated</li>
        </ul>
        <p className="small text-secondary mb-0">Recorded as converted by <strong>{currentUser.name}</strong>.</p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onClose}>Cancel</Button>
        <Button variant="success" onClick={confirm}>Confirm Conversion</Button>
      </Modal.Footer>
    </Modal>
  );
}
