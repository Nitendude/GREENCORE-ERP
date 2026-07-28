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
    workshopName, workshopNotes, setWorkshopName, setWorkshopNotes,
    enabledModules, featureRequests, setModuleEnabled, addFeatureRequest,
    updateFeatureRequest, removeFeatureRequest, resetWorkshop,
  } = useDemoConfig();
  const [showAdd, setShowAdd] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [showSubmit, setShowSubmit] = useState(false);
  const [title, setTitle] = useState('');
  const [moduleId, setModuleId] = useState(DEMO_MODULES[0].id);
  const [notes, setNotes] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submittedReference, setSubmittedReference] = useState('');
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

  const sendRequirements = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError('');
    setIsSending(true);

    try {
      const response = await fetch('/api/demo-discovery-requests', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workshop_name: workshopName.trim(),
          system_goal: workshopNotes.trim(),
          contact_name: contactName.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
          company: company.trim() || null,
          enabled_modules: DEMO_MODULES
            .filter(module => enabledModules[module.id] !== false)
            .map(module => module.id),
          feature_requests: featureRequests.map(request => ({
            title: request.title,
            module_id: request.moduleId,
            notes: request.notes,
          })),
          consent,
          website,
        }),
      });
      const data = await response.json().catch(() => ({})) as {
        message?: string;
        reference?: string;
        errors?: Record<string, string[]>;
      };

      if (!response.ok) {
        const validationMessage = Object.values(data.errors ?? {}).flat()[0];
        throw new Error(validationMessage ?? data.message ?? 'The requirements could not be sent. Please try again.');
      }

      setSubmittedReference(data.reference ?? '');
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'The requirements could not be sent. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap mb-4">
        <div>
          <div className="text-uppercase small fw-bold text-primary mb-1">Editable scope discovery</div>
          <h2 className="mb-1">Customize Demo</h2>
          <p className="text-secondary mb-0">Add or remove modules and capture requested features before committing to a full ERP build.</p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-secondary" onClick={() => setShowReset(true)}><i className="bi bi-arrow-counterclockwise me-1" />Reset</Button>
          <Button onClick={() => setShowAdd(true)}><i className="bi bi-plus-lg me-1" />Add feature request</Button>
          <Button variant="success" onClick={() => { setSubmitError(''); setSubmittedReference(''); setShowSubmit(true); }}>
            <i className="bi bi-send me-1" />Send to Nexii
          </Button>
        </div>
      </div>

      <Alert variant="info" className="d-flex gap-3 align-items-start">
        <i className="bi bi-info-circle-fill mt-1" />
        <div><strong>{enabledCount} of {DEMO_MODULES.length} modules are in this demo.</strong> Turning a module off removes it from navigation and blocks its page. Draft changes stay in this browser until you send them to Nexii for review and quotation.</div>
      </Alert>

      <div className="section-card p-3 p-lg-4 mb-4">
        <div className="row g-3">
          <Form.Group className="col-12 col-lg-5">
            <Form.Label className="fw-semibold">Client or workshop name</Form.Label>
            <Form.Control
              value={workshopName}
              onChange={event => setWorkshopName(event.target.value)}
              placeholder="Example: ABC Construction discovery"
            />
            <Form.Text>Use a different name for each browser-based client walkthrough.</Form.Text>
          </Form.Group>
          <Form.Group className="col-12 col-lg-7">
            <Form.Label className="fw-semibold">What should this system solve?</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={workshopNotes}
              onChange={event => setWorkshopNotes(event.target.value)}
              placeholder="Describe the client's workflow, pain points, approvals, and reporting needs."
            />
          </Form.Group>
        </div>
      </div>

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

      <Modal show={showSubmit} onHide={() => !isSending && setShowSubmit(false)} centered size="lg">
        {submittedReference ? (
          <>
            <Modal.Header closeButton><Modal.Title as="h5">Requirements sent</Modal.Title></Modal.Header>
            <Modal.Body className="text-center py-5">
              <div className="submit-success-icon mx-auto mb-3"><i className="bi bi-check-lg" /></div>
              <h4>Nexii received this ERP scope</h4>
              <p className="text-secondary mb-2">Our team can now review the selected modules and feature requests, then prepare a proper quotation.</p>
              <div className="fw-bold text-primary">Reference: {submittedReference}</div>
            </Modal.Body>
            <Modal.Footer><Button onClick={() => setShowSubmit(false)}>Done</Button></Modal.Footer>
          </>
        ) : (
          <Form onSubmit={sendRequirements}>
            <Modal.Header closeButton><Modal.Title as="h5">Send requirements to Nexii</Modal.Title></Modal.Header>
            <Modal.Body>
              <Alert variant="light" className="border small">
                <strong>Scope summary:</strong> {enabledCount} modules and {featureRequests.length} custom feature {featureRequests.length === 1 ? 'request' : 'requests'}.
                Nexii employees will receive this inside the company system and use it to prepare your quotation.
              </Alert>
              {submitError && <Alert variant="danger">{submitError}</Alert>}
              <div className="row g-3">
                <Form.Group className="col-12 col-md-6">
                  <Form.Label>Contact name</Form.Label>
                  <Form.Control value={contactName} onChange={event => setContactName(event.target.value)} required autoFocus />
                </Form.Group>
                <Form.Group className="col-12 col-md-6">
                  <Form.Label>Work email</Form.Label>
                  <Form.Control type="email" value={email} onChange={event => setEmail(event.target.value)} required />
                </Form.Group>
                <Form.Group className="col-12 col-md-6">
                  <Form.Label>Company</Form.Label>
                  <Form.Control value={company} onChange={event => setCompany(event.target.value)} placeholder="Optional" />
                </Form.Group>
                <Form.Group className="col-12 col-md-6">
                  <Form.Label>Phone</Form.Label>
                  <Form.Control value={phone} onChange={event => setPhone(event.target.value)} placeholder="Optional" />
                </Form.Group>
                <div className="d-none" aria-hidden="true">
                  <Form.Label>Website</Form.Label>
                  <Form.Control value={website} onChange={event => setWebsite(event.target.value)} tabIndex={-1} autoComplete="off" />
                </div>
                <div className="col-12">
                  <Form.Check
                    checked={consent}
                    onChange={event => setConsent(event.target.checked)}
                    required
                    label="I agree that Nexii may store these requirements and contact me about this ERP project and quotation."
                  />
                </div>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="outline-secondary" onClick={() => setShowSubmit(false)} disabled={isSending}>Cancel</Button>
              <Button variant="success" type="submit" disabled={isSending || !workshopName.trim() || !workshopNotes.trim()}>
                {isSending
                  ? <><span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />Sending…</>
                  : <><i className="bi bi-send me-1" />Send requirements</>}
              </Button>
            </Modal.Footer>
          </Form>
        )}
      </Modal>
    </div>
  );
}
