import { useState } from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import DataTable, { type Column } from '../../../../components/ui/DataTable';
import StatusBadge from '../../../../components/ui/StatusBadge';
import EmptyState from '../../../../components/ui/EmptyState';
import { useData } from '../../../../store/DataContext';
import { useAuth } from '../../../../store/AuthContext';
import { formatDate, genId } from '../../../../utils/format';
import type { Project, IssueRisk } from '../../../../types';

export default function IssuesTab({ project }: { project: Project }) {
  const { issues, addIssue, updateIssue } = useData();
  const { currentUser } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    type: 'Issue' as IssueRisk['type'], description: '', owner: currentUser.name,
    impact: 'Medium' as IssueRisk['impact'], severity: 'Medium' as IssueRisk['severity'], dueDate: '', mitigation: '',
  });

  const projectIssues = issues.filter(i => i.projectId === project.id);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description.trim() || !form.dueDate) return;
    addIssue({
      id: genId('i'), projectId: project.id, type: form.type, description: form.description,
      owner: form.owner, impact: form.impact, severity: form.severity, status: 'Open',
      dueDate: form.dueDate, mitigation: form.mitigation || undefined, attachments: [],
    });
    setShowForm(false);
    setForm({ type: 'Issue', description: '', owner: currentUser.name, impact: 'Medium', severity: 'Medium', dueDate: '', mitigation: '' });
  };

  const columns: Column<IssueRisk>[] = [
    { key: 'type', label: 'Type', accessor: i => i.type },
    { key: 'description', label: 'Description', accessor: i => i.description, render: i => <span className="d-inline-block text-truncate-2" style={{ maxWidth: 260 }}>{i.description}</span> },
    { key: 'owner', label: 'Owner', accessor: i => i.owner },
    { key: 'impact', label: 'Impact', render: i => <StatusBadge status={i.impact} /> },
    { key: 'severity', label: 'Severity', render: i => <StatusBadge status={i.severity} /> },
    { key: 'dueDate', label: 'Due', sortable: true, accessor: i => i.dueDate, render: i => formatDate(i.dueDate) },
    { key: 'status', label: 'Status', render: i => (
      <Form.Select size="sm" style={{ width: 130 }} value={i.status} onChange={e => updateIssue(i.id, { status: e.target.value as IssueRisk['status'] })}>
        {(['Open', 'In Progress', 'Mitigated', 'Closed'] as IssueRisk['status'][]).map(s => <option key={s} value={s}>{s}</option>)}
      </Form.Select>
    ) },
    { key: 'mitigation', label: 'Mitigation / Resolution', accessor: i => i.mitigation || '—' },
  ];

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="fw-bold mb-0">Issues, Risks & Change Orders</h6>
        <Button size="sm" variant="primary" onClick={() => setShowForm(true)}><i className="bi bi-plus-lg me-1" /> Report Issue / Risk</Button>
      </div>
      {projectIssues.length === 0 ? (
        <EmptyState icon="bi-exclamation-diamond" title="No issues or risks logged" />
      ) : (
        <DataTable columns={columns} rows={projectIssues} keyField={i => i.id} pageSize={8} />
      )}

      <Modal show={showForm} onHide={() => setShowForm(false)} centered>
        <Form onSubmit={handleAdd}>
          <Modal.Header closeButton><Modal.Title as="h5">Report Issue / Risk</Modal.Title></Modal.Header>
          <Modal.Body>
            <Row className="g-3">
              <Col xs={6}>
                <Form.Group controlId={`fld-1`}>
                  <Form.Label>Type</Form.Label>
                  <Form.Select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as IssueRisk['type'] }))}>
                    <option value="Issue">Issue</option>
                    <option value="Risk">Risk</option>
                    <option value="Change Order">Change Order</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col xs={6}>
                <Form.Group controlId={`fld-2`}>
                  <Form.Label className="form-required">Due Date</Form.Label>
                  <Form.Control required type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
                </Form.Group>
              </Col>
              <Col xs={12}>
                <Form.Group controlId={`fld-3`}>
                  <Form.Label className="form-required">Description</Form.Label>
                  <Form.Control required as="textarea" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </Form.Group>
              </Col>
              <Col xs={6}>
                <Form.Group controlId={`fld-4`}>
                  <Form.Label>Impact</Form.Label>
                  <Form.Select value={form.impact} onChange={e => setForm(f => ({ ...f, impact: e.target.value as IssueRisk['impact'] }))}>
                    <option>Low</option><option>Medium</option><option>High</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col xs={6}>
                <Form.Group controlId={`fld-5`}>
                  <Form.Label>Severity</Form.Label>
                  <Form.Select value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value as IssueRisk['severity'] }))}>
                    <option>Low</option><option>Medium</option><option>High</option><option>Critical</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col xs={12}>
                <Form.Group controlId={`fld-6`}>
                  <Form.Label>Mitigation Plan (optional)</Form.Label>
                  <Form.Control as="textarea" rows={2} value={form.mitigation} onChange={e => setForm(f => ({ ...f, mitigation: e.target.value }))} />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Submit</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}
