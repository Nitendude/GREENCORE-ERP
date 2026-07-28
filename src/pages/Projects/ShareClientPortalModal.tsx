import { useEffect, useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import InputGroup from 'react-bootstrap/InputGroup';
import Form from 'react-bootstrap/Form';
import type { Project } from '../../types';
import { createClientInvite } from '../../utils/clientInvite';

interface ShareClientPortalModalProps {
  show: boolean;
  project: Project | null;
  onClose: () => void;
}

export default function ShareClientPortalModal({ show, project, onClose }: ShareClientPortalModalProps) {
  const [copied, setCopied] = useState(false);
  const [portalUrl, setPortalUrl] = useState('');
  const [hours, setHours] = useState(72);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!show || !project) return;
    setCopied(false);
    setPortalUrl('');
    setGenerating(true);
    createClientInvite(project.id, hours)
      .then(token => setPortalUrl(
        `${window.location.origin}${import.meta.env.BASE_URL}client/${token}`,
      ))
      .finally(() => setGenerating(false));
  }, [show, project, hours]);

  if (!project) return null;

  const handleCopy = async () => {
    if (!portalUrl) return;
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
        <p className="small text-secondary">This link opens a read-only view of <strong>{project.name}</strong>. It does not expose financial, procurement, or internal records.</p>
        <div className="client-share-safety mb-3">
          <i className="bi bi-shield-check" />
          <div><strong>Project-scoped and expiring</strong><div className="small">Only send it to the intended client. Generate a new link when access should be extended.</div></div>
        </div>
        <Form.Group className="mb-3">
          <Form.Label className="small mb-1">Link expires after</Form.Label>
          <Form.Select value={hours} onChange={event => setHours(Number(event.target.value))}>
            <option value={24}>24 hours</option>
            <option value={72}>3 days</option>
            <option value={168}>7 days</option>
          </Form.Select>
        </Form.Group>
        <Form.Label className="small mb-1">Portal link</Form.Label>
        <InputGroup>
          <Form.Control readOnly value={generating ? 'Generating secure demo link…' : portalUrl} />
          <Button disabled={generating || !portalUrl} variant={copied ? 'success' : 'outline-primary'} onClick={handleCopy}>
            <i className={`bi ${copied ? 'bi-check-lg' : 'bi-clipboard'} me-1`} />{copied ? 'Copied' : 'Copy'}
          </Button>
        </InputGroup>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onClose}>Close</Button>
        <Button disabled={generating || !portalUrl} variant="primary" onClick={() => window.open(portalUrl, '_blank', 'noopener,noreferrer')}>
          <i className="bi bi-box-arrow-up-right me-1" /> Open Portal
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
