import { useMemo, useState } from 'react';
import Alert from 'react-bootstrap/Alert';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import { DEMO_MODULES, useDemoConfig, type FeatureRequest } from '../../store/DemoConfigContext';

const STATUSES: FeatureRequest['status'][] = ['Requested', 'In review', 'Accepted'];

export default function DemoWorkshopPage() {
  const {
    enabledModules, featureRequests, setModuleEnabled, addFeatureRequest,
    updateFeatureRequest, removeFeatureRequest, resetWorkshop,
  } = useDemoConfig();
  const [showAdd, setShowAdd] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [title, setTitle] = useState('');
  const [moduleId, setModuleId] = useState(DEMO_MODULES[0].id);
  const [notes, setNotes] = useState('');
  const enabledCount = useMemo(
    () => DEMO_MODULES.filter(module => enabledModules[module.id] !== false).length,
    [enabledModules],
  );

  const submitRequest = (event: React.FormEvent) => {
    event.preventDefault();
    addFeatureRequest({ title: title.trim(), moduleId, notes: notes.trim(), status: 'Requested' });
    setTitle('');
    setNotes('');
    setShowAdd(false);
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap mb-4">
        <div>
          <div className="text-uppercase small fw-bold text-primary mb-1">Scope discovery</div>
          <h2 className="mb-1">Demo Workshop</h2>
          <p className="text-secondary mb-0">Shape the prototype with employees and clients before committing to a full ERP build.</p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-secondary" onClick={() => setShowReset(true)}><i className="bi bi-arrow-counterclockwise me-1" />Reset</Button>
          <Button onClick={() => setShowAdd(true)}><i className="bi bi-plus-lg me-1" />Add feature request</Button>
        </div>
      </div>

      <Alert variant="info" className="d-flex gap-3 align-items-start">
        <i className="bi bi-info-circle-fill mt-1" />
        <div><strong>{enabledCount} of {DEMO_MODULES.length} modules are in this demo.</strong> Turning a module off removes it from navigation and blocks its page. Changes are saved only in this browser.</div>
      </Alert>

      <div className="row g-3 mb-4">
        {DEMO_MODULES.map(module => {
          const enabled = enabledModules[module.id] !== false;
          return (
            <div className="col-12 col-md-6 col-xl-4" key={module.id}>
              <div className={`module-scope-card ${enabled ? '' : 'module-scope-card-off'}`}>
                <div className="d-flex justify-content-between gap-3">
                  <span className="summary-card-icon bg-success-subtle text-success"><i className={`bi ${module.icon}`} /></span>
                  <Form.Check
                    type="switch"
                    checked={enabled}
                    disabled={module.locked}
                    onChange={event => setModuleEnabled(module.id, event.target.checked)}
                    aria-label={`${enabled ? 'Remove' : 'Add'} ${module.label}`}
                  />
                </div>
                <h6 className="fw-bold mt-3 mb-1">{module.label}</h6>
                <p className="text-secondary small mb-0">{module.description}</p>
                {module.locked && <span className="badge text-bg-light border mt-3"><i className="bi bi-lock me-1" />Required</span>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="section-card overflow-hidden">
        <div className="p-3 border-bottom d-flex justify-content-between align-items-center">
          <div>
            <h5 className="mb-1">Feature request board</h5>
            <div className="text-secondary small">Capture what stakeholders want; acceptance here does not mean it is built.</div>
          </div>
          <Badge bg="secondary">{featureRequests.length}</Badge>
        </div>
        {featureRequests.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><i className="bi bi-lightbulb" /></div>
            <h6 className="mt-2">No feature requests yet</h6>
            <p className="mb-3">Add an idea during a walkthrough so it stays attached to the demo scope.</p>
            <Button size="sm" onClick={() => setShowAdd(true)}>Add the first request</Button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table app-table align-middle mb-0">
              <thead><tr><th>Feature</th><th>Module</th><th>Status</th><th className="text-end">Action</th></tr></thead>
              <tbody>
                {featureRequests.map(request => (
                  <tr key={request.id}>
                    <td>
                      <div className="fw-semibold">{request.title}</div>
                      {request.notes && <div className="text-secondary small text-truncate-2">{request.notes}</div>}
                    </td>
                    <td>{DEMO_MODULES.find(module => module.id === request.moduleId)?.label ?? 'General'}</td>
                    <td>
                      <Form.Select
                        size="sm"
                        value={request.status}
                        onChange={event => updateFeatureRequest(request.id, { status: event.target.value as FeatureRequest['status'] })}
                        style={{ minWidth: 130 }}
                      >
                        {STATUSES.map(status => <option key={status}>{status}</option>)}
                      </Form.Select>
                    </td>
                    <td className="text-end">
                      <Button variant="outline-danger" size="sm" onClick={() => removeFeatureRequest(request.id)} aria-label={`Remove ${request.title}`}>
                        <i className="bi bi-trash" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal show={showAdd} onHide={() => setShowAdd(false)} centered>
        <Form onSubmit={submitRequest}>
          <Modal.Header closeButton><Modal.Title as="h5">Add feature request</Modal.Title></Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Feature name</Form.Label>
              <Form.Control value={title} onChange={event => setTitle(event.target.value)} required autoFocus />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Related module</Form.Label>
              <Form.Select value={moduleId} onChange={event => setModuleId(event.target.value)}>
                {DEMO_MODULES.map(module => <option key={module.id} value={module.id}>{module.label}</option>)}
              </Form.Select>
            </Form.Group>
            <Form.Group>
              <Form.Label>Discovery notes</Form.Label>
              <Form.Control as="textarea" rows={3} value={notes} onChange={event => setNotes(event.target.value)} placeholder="Why is this needed? Who uses it? What would success look like?" />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button type="submit">Add request</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal show={showReset} onHide={() => setShowReset(false)} centered>
        <Modal.Header closeButton><Modal.Title as="h5">Reset workshop?</Modal.Title></Modal.Header>
        <Modal.Body>This will enable every module and remove all feature requests stored in this browser.</Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowReset(false)}>Cancel</Button>
          <Button variant="danger" onClick={() => { resetWorkshop(); setShowReset(false); }}>Reset workshop</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
