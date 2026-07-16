import { useState } from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import EmptyState from '../../../../components/ui/EmptyState';
import { useData } from '../../../../store/DataContext';
import { useAuth } from '../../../../store/AuthContext';
import { formatDate, genId } from '../../../../utils/format';
import type { Project } from '../../../../types';

export default function DailyUpdatesTab({ project }: { project: Project }) {
  const { dailyLogs, addDailyLog } = useData();
  const { currentUser } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    workCompleted: '', workforceCount: '', materialsUsed: '', equipmentUsed: '',
    weather: '', problems: '', nextActivities: '',
  });

  const logs = dailyLogs.filter(l => l.projectId === project.id).sort((a, b) => b.date.localeCompare(a.date));

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.workCompleted.trim()) return;
    addDailyLog({
      id: genId('dl'), projectId: project.id, date: new Date().toISOString().slice(0, 10), submittedBy: currentUser.name,
      workCompleted: form.workCompleted, workforceCount: Number(form.workforceCount) || 0,
      materialsUsed: form.materialsUsed, equipmentUsed: form.equipmentUsed, weather: form.weather,
      problems: form.problems || undefined, nextActivities: form.nextActivities, photos: 0,
    });
    setShowForm(false);
    setForm({ workCompleted: '', workforceCount: '', materialsUsed: '', equipmentUsed: '', weather: '', problems: '', nextActivities: '' });
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="fw-bold mb-0">Daily Updates & Accomplishments</h6>
        <Button size="sm" variant="primary" onClick={() => setShowForm(true)}><i className="bi bi-journal-plus me-1" /> Log Daily Update</Button>
      </div>

      {logs.length === 0 ? (
        <EmptyState icon="bi-journal-text" title="No daily updates logged" />
      ) : (
        <div className="d-flex flex-column gap-3">
          {logs.map(log => (
            <div key={log.id} className="section-card p-3">
              <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-2">
                <div>
                  <span className="fw-bold">{formatDate(log.date)}</span>
                  <span className="text-secondary small ms-2">Submitted by {log.submittedBy}</span>
                </div>
                <span className="text-secondary small"><i className="bi bi-cloud me-1" />{log.weather} • <i className="bi bi-people ms-1 me-1" />{log.workforceCount} workers • <i className="bi bi-camera ms-1 me-1" />{log.photos} photos</span>
              </div>
              <Row className="g-2 small">
                <Col xs={12}><strong>Work Completed:</strong> {log.workCompleted}</Col>
                <Col xs={12} md={6}><strong>Materials Used:</strong> {log.materialsUsed}</Col>
                <Col xs={12} md={6}><strong>Equipment Used:</strong> {log.equipmentUsed}</Col>
                {log.problems && <Col xs={12} className="text-danger"><strong>Problems / Delays:</strong> {log.problems}</Col>}
                <Col xs={12}><strong>Next Planned Activities:</strong> {log.nextActivities}</Col>
              </Row>
            </div>
          ))}
        </div>
      )}

      <Modal show={showForm} onHide={() => setShowForm(false)} centered size="lg">
        <Form onSubmit={handleAdd}>
          <Modal.Header closeButton><Modal.Title as="h5">Log Daily Update</Modal.Title></Modal.Header>
          <Modal.Body>
            <Row className="g-3">
              <Col xs={12}>
                <Form.Group controlId={`fld-1`}>
                  <Form.Label className="form-required">Work Completed</Form.Label>
                  <Form.Control required as="textarea" rows={2} value={form.workCompleted} onChange={e => setForm(f => ({ ...f, workCompleted: e.target.value }))} />
                </Form.Group>
              </Col>
              <Col xs={6}>
                <Form.Group controlId={`fld-2`}>
                  <Form.Label>Workforce Count</Form.Label>
                  <Form.Control type="number" min={0} value={form.workforceCount} onChange={e => setForm(f => ({ ...f, workforceCount: e.target.value }))} />
                </Form.Group>
              </Col>
              <Col xs={6}>
                <Form.Group controlId={`fld-3`}>
                  <Form.Label>Weather</Form.Label>
                  <Form.Control placeholder="e.g. Clear, 70°F" value={form.weather} onChange={e => setForm(f => ({ ...f, weather: e.target.value }))} />
                </Form.Group>
              </Col>
              <Col xs={6}>
                <Form.Group controlId={`fld-4`}>
                  <Form.Label>Materials Used</Form.Label>
                  <Form.Control value={form.materialsUsed} onChange={e => setForm(f => ({ ...f, materialsUsed: e.target.value }))} />
                </Form.Group>
              </Col>
              <Col xs={6}>
                <Form.Group controlId={`fld-5`}>
                  <Form.Label>Equipment Used</Form.Label>
                  <Form.Control value={form.equipmentUsed} onChange={e => setForm(f => ({ ...f, equipmentUsed: e.target.value }))} />
                </Form.Group>
              </Col>
              <Col xs={12}>
                <Form.Group controlId={`fld-6`}>
                  <Form.Label>Problems / Delays (optional)</Form.Label>
                  <Form.Control as="textarea" rows={2} value={form.problems} onChange={e => setForm(f => ({ ...f, problems: e.target.value }))} />
                </Form.Group>
              </Col>
              <Col xs={12}>
                <Form.Group controlId={`fld-7`}>
                  <Form.Label>Next Planned Activities</Form.Label>
                  <Form.Control as="textarea" rows={2} value={form.nextActivities} onChange={e => setForm(f => ({ ...f, nextActivities: e.target.value }))} />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Submit Log</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}
