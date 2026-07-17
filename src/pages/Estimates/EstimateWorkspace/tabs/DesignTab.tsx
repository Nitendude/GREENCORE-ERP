import { useState } from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import EmptyState from '../../../../components/ui/EmptyState';
import FloorPlanViewer from './FloorPlanViewer';
import { useData } from '../../../../store/DataContext';
import { useAuth } from '../../../../store/AuthContext';
import { formatDate, genId } from '../../../../utils/format';
import type { Estimate, DesignDrawing, DesignRevisionEntry } from '../../../../types';

const CATEGORIES: DesignDrawing['category'][] = ['Plan', 'Perspective', 'Specification', 'Elevation', 'Section', 'Detail'];

function nextVersion(v: string): string {
  if (/^[A-Z]$/i.test(v) && v.toUpperCase() !== 'Z') return String.fromCharCode(v.toUpperCase().charCodeAt(0) + 1);
  if (/^\d+$/.test(v)) return String(Number(v) + 1);
  return 'B';
}

export default function DesignTab({ estimate }: { estimate: Estimate }) {
  const { updateEstimate } = useData();
  const { can, currentUser } = useAuth();
  const canManage = can('estimates.manage');
  const [showUpload, setShowUpload] = useState(false);
  const [showRev, setShowRev] = useState(false);

  const addDrawing = (name: string, category: DesignDrawing['category'], note: string) => {
    const drawing: DesignDrawing = { id: genId('dw'), name, category, version: 'A', uploadedBy: currentUser.name, uploadedDate: new Date().toISOString().slice(0, 10), note: note || undefined };
    updateEstimate(estimate.id, { drawings: [...estimate.drawings, drawing] });
  };
  const reviseDrawing = (id: string) => {
    updateEstimate(estimate.id, { drawings: estimate.drawings.map(d => d.id === id ? { ...d, version: nextVersion(d.version), uploadedBy: currentUser.name, uploadedDate: new Date().toISOString().slice(0, 10) } : d) });
  };
  const addRevision = (entry: Omit<DesignRevisionEntry, 'id'>) => {
    updateEstimate(estimate.id, { designRevisions: [...estimate.designRevisions, { ...entry, id: genId('dr') }] });
  };

  return (
    <Row className="g-3">
      <Col xs={12} lg={7}>
        <div className="section-card p-3 mb-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h6 className="fw-bold mb-0">Drawing &amp; File Repository</h6>
            {canManage && <Button size="sm" variant="primary" onClick={() => setShowUpload(true)}><i className="bi bi-upload me-1" /> Upload</Button>}
          </div>
          {estimate.drawings.length === 0 ? <EmptyState icon="bi-rulers" title="No drawings uploaded" message="Add plans, perspectives, and specifications for this estimate." /> : (
            <div className="table-responsive-wrapper" style={{ border: 'none' }}>
              <table className="table app-table mb-0">
                <thead><tr><th>Drawing</th><th>Category</th><th className="text-center">Ver.</th><th>Uploaded</th>{canManage && <th></th>}</tr></thead>
                <tbody>
                  {estimate.drawings.map(d => (
                    <tr key={d.id}>
                      <td className="fw-semibold"><i className="bi bi-file-earmark-ruled me-1" />{d.name}</td>
                      <td>{d.category}</td>
                      <td className="text-center"><span className="badge text-bg-light border">Rev {d.version}</span></td>
                      <td className="small text-secondary">{formatDate(d.uploadedDate)} · {d.uploadedBy}</td>
                      {canManage && <td className="text-end"><Button size="sm" variant="outline-secondary" title="Upload new version" onClick={() => reviseDrawing(d.id)}><i className="bi bi-arrow-up-circle me-1" />New Version</Button></td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="section-card p-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h6 className="fw-bold mb-0">Design Revision Log</h6>
            {canManage && <Button size="sm" variant="outline-primary" onClick={() => setShowRev(true)}><i className="bi bi-plus-lg me-1" /> Log Change</Button>}
          </div>
          <p className="text-secondary small mb-2">Design changes are linked to quotation revisions — a change flagged as re-estimate signals the BOQ needs updating.</p>
          {estimate.designRevisions.length === 0 ? <EmptyState icon="bi-clock-history" title="No design changes logged" /> : (
            <ul className="list-unstyled mb-0 d-flex flex-column gap-2">
              {[...estimate.designRevisions].reverse().map(r => (
                <li key={r.id} className="border-bottom pb-2">
                  <div className="d-flex justify-content-between align-items-start gap-2">
                    <div><div className="small fw-semibold">{r.description}</div><div className="text-secondary small">{formatDate(r.date)} · {r.author}</div></div>
                    <div className="text-end">
                      {r.linkedQuotationRev && <span className="badge text-bg-light border">{r.linkedQuotationRev}</span>}
                      {r.triggersReEstimate && <span className="badge text-bg-warning ms-1"><i className="bi bi-arrow-repeat me-1" />Re-estimate</span>}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Col>

      <Col xs={12} lg={5}>
        <div className="section-card p-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h6 className="fw-bold mb-0">3D Floor Plan Viewer</h6>
            <span className="badge text-bg-light border">Three.js integration point</span>
          </div>
          <FloorPlanViewer seed={estimate.id} area={estimate.grossFloorArea} />
          <p className="text-secondary small mb-0 mt-2">
            Live mount point for the company's existing Three.js floor-plan viewer. The lightweight preview above stands in for it — wire the real viewer to this container and feed it the plan geometry.
          </p>
        </div>
      </Col>

      <UploadModal show={showUpload} onClose={() => setShowUpload(false)} onSave={(name, cat, note) => { addDrawing(name, cat, note); setShowUpload(false); }} />
      <RevisionLogModal show={showRev} quotationRevs={estimate.quotationRevisions.map(r => r.label)} currentRev={estimate.currentRevision} onClose={() => setShowRev(false)} onSave={entry => { addRevision(entry); setShowRev(false); }} author={currentUser.name} />
    </Row>
  );
}

function UploadModal({ show, onClose, onSave }: { show: boolean; onClose: () => void; onSave: (name: string, cat: DesignDrawing['category'], note: string) => void }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<DesignDrawing['category']>('Plan');
  const [note, setNote] = useState('');
  return (
    <Modal show={show} onHide={onClose} centered onEntered={() => { setName(''); setCategory('Plan'); setNote(''); }}>
      <Modal.Header closeButton><Modal.Title as="h5">Upload Drawing</Modal.Title></Modal.Header>
      <Modal.Body>
        <Form.Group controlId="dw-name" className="mb-3"><Form.Label className="form-required">File Name</Form.Label><Form.Control value={name} onChange={e => setName(e.target.value)} placeholder="Ground Floor Plan.pdf" /></Form.Group>
        <Form.Group controlId="dw-cat" className="mb-3"><Form.Label>Category</Form.Label><Form.Select value={category} onChange={e => setCategory(e.target.value as DesignDrawing['category'])}>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</Form.Select></Form.Group>
        <Form.Group controlId="dw-note"><Form.Label>Note</Form.Label><Form.Control value={note} onChange={e => setNote(e.target.value)} /></Form.Group>
        <Form.Text>Demo upload — starts at Rev A. Use "New Version" to bump revisions.</Form.Text>
      </Modal.Body>
      <Modal.Footer><Button variant="outline-secondary" onClick={onClose}>Cancel</Button><Button variant="primary" disabled={!name.trim()} onClick={() => onSave(name.trim(), category, note)}>Upload</Button></Modal.Footer>
    </Modal>
  );
}

function RevisionLogModal({ show, quotationRevs, currentRev, onClose, onSave, author }: { show: boolean; quotationRevs: string[]; currentRev: string; onClose: () => void; onSave: (e: Omit<DesignRevisionEntry, 'id'>) => void; author: string }) {
  const [description, setDescription] = useState('');
  const [linked, setLinked] = useState(currentRev);
  const [reEstimate, setReEstimate] = useState(false);
  const options = Array.from(new Set([currentRev, ...quotationRevs]));
  return (
    <Modal show={show} onHide={onClose} centered onEntered={() => { setDescription(''); setLinked(currentRev); setReEstimate(false); }}>
      <Modal.Header closeButton><Modal.Title as="h5">Log Design Change</Modal.Title></Modal.Header>
      <Modal.Body>
        <Form.Group controlId="drl-desc" className="mb-3"><Form.Label className="form-required">Description</Form.Label><Form.Control as="textarea" rows={2} value={description} onChange={e => setDescription(e.target.value)} /></Form.Group>
        <Form.Group controlId="drl-link" className="mb-3"><Form.Label>Linked Quotation Revision</Form.Label><Form.Select value={linked} onChange={e => setLinked(e.target.value)}>{options.map(o => <option key={o} value={o}>{o}</option>)}</Form.Select></Form.Group>
        <Form.Check type="checkbox" id="drl-reest" label="This change triggers a re-estimate (BOQ needs updating)" checked={reEstimate} onChange={e => setReEstimate(e.target.checked)} />
      </Modal.Body>
      <Modal.Footer><Button variant="outline-secondary" onClick={onClose}>Cancel</Button><Button variant="primary" disabled={!description.trim()} onClick={() => onSave({ date: new Date().toISOString().slice(0, 10), author, description: description.trim(), linkedQuotationRev: linked, triggersReEstimate: reEstimate })}>Log Change</Button></Modal.Footer>
    </Modal>
  );
}
