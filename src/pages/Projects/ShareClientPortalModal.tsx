import { useEffect, useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import InputGroup from 'react-bootstrap/InputGroup';
import Form from 'react-bootstrap/Form';
import type { Project } from '../../types';

interface ShareClientPortalModalProps {
  show: boolean;
  project: Project | null;
  onClose: () => void;
}

export default function ShareClientPortalModal({ show, project, onClose }: ShareClientPortalModalProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (show) setCopied(false);
  }, [show, project?.id]);

  if (!project) return null;

  const portalUrl = `${window.location.origin}/client/${project.id}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(portalUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton><Modal.Title as="h5">Share Client Portal</Modal.Title></Modal.Header>
      <Modal.Body>
        <p className="small text-secondary">
          Anyone with this link can view a read-only summary of <strong>{project.name}</strong> — overall progress,
          milestones, recent site updates, and key contacts. No financial, procurement, or internal data is shown.
        </p>
        <Form.Label className="small mb-1">Portal link</Form.Label>
        <InputGroup>
          <Form.Control readOnly value={portalUrl} />
          <Button variant={copied ? 'success' : 'outline-primary'} onClick={handleCopy}>
            <i className={`bi ${copied ? 'bi-check-lg' : 'bi-clipboard'} me-1`} />{copied ? 'Copied' : 'Copy'}
          </Button>
        </InputGroup>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onClose}>Close</Button>
        <Button variant="primary" onClick={() => window.open(portalUrl, '_blank', 'noopener,noreferrer')}>
          <i className="bi bi-box-arrow-up-right me-1" /> Open Portal
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
