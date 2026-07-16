import { useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Alert from 'react-bootstrap/Alert';

interface ConfirmModalProps {
  show: boolean;
  title: string;
  body: React.ReactNode;
  confirmLabel?: string;
  variant?: 'primary' | 'danger' | 'warning' | 'success';
  requireRemarks?: boolean;
  onConfirm: (remarks: string) => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  show, title, body, confirmLabel = 'Confirm', variant = 'primary',
  requireRemarks = false, onConfirm, onCancel,
}: ConfirmModalProps) {
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState(false);

  const handleConfirm = () => {
    if (requireRemarks && !remarks.trim()) {
      setError(true);
      return;
    }
    onConfirm(remarks);
    setRemarks('');
    setError(false);
  };

  const handleCancel = () => {
    setRemarks('');
    setError(false);
    onCancel();
  };

  return (
    <Modal show={show} onHide={handleCancel} centered>
      <Modal.Header closeButton>
        <Modal.Title as="h5">{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="mb-3">{body}</div>
        {requireRemarks && (
          <Form.Group controlId={`fld-1`}>
            <Form.Label>Remarks {requireRemarks && <span className="text-danger">*</span>}</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={remarks}
              onChange={e => { setRemarks(e.target.value); setError(false); }}
              placeholder="Explain the reason for this change..."
              isInvalid={error}
            />
            <Form.Control.Feedback type="invalid">
              Remarks are required for this action.
            </Form.Control.Feedback>
          </Form.Group>
        )}
        {error && !requireRemarks && <Alert variant="danger">Please complete the required fields.</Alert>}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={handleCancel}>Cancel</Button>
        <Button variant={variant} onClick={handleConfirm}>{confirmLabel}</Button>
      </Modal.Footer>
    </Modal>
  );
}
