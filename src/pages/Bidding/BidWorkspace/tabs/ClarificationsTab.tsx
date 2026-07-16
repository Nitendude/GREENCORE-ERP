import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import EmptyState from '../../../../components/ui/EmptyState';
import { useData } from '../../../../store/DataContext';
import { useAuth } from '../../../../store/AuthContext';
import { formatDate, genId } from '../../../../utils/format';
import type { Bid, ClarificationEntry } from '../../../../types';

const TYPES: ClarificationEntry['type'][] = ['Client Question', 'Company Response', 'Pre-bid Meeting', 'Site Visit', 'Addendum', 'Internal Note'];
const TYPE_ICON: Record<ClarificationEntry['type'], string> = {
  'Client Question': 'bi-question-circle', 'Company Response': 'bi-reply', 'Pre-bid Meeting': 'bi-people',
  'Site Visit': 'bi-geo-alt', Addendum: 'bi-file-earmark-plus', 'Internal Note': 'bi-sticky',
};

export default function ClarificationsTab({ bid }: { bid: Bid }) {
  const { updateBid } = useData();
  const { currentUser } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: 'Internal Note' as ClarificationEntry['type'], content: '', followUpDate: '' });

  const sorted = [...bid.clarifications].sort((a, b) => b.date.localeCompare(a.date));

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.content.trim()) return;
    const entry: ClarificationEntry = {
      id: genId('cl'), bidId: bid.id, type: form.type, date: new Date().toISOString().slice(0, 10),
      author: currentUser.name, content: form.content, followUpDate: form.followUpDate || undefined,
    };
    updateBid(bid.id, { clarifications: [entry, ...bid.clarifications] }, currentUser.name);
    setShowForm(false);
    setForm({ type: 'Internal Note', content: '', followUpDate: '' });
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="fw-bold mb-0">Clarifications & Activities</h6>
        <Button size="sm" variant="primary" onClick={() => setShowForm(true)}><i className="bi bi-plus-lg me-1" /> Log Activity</Button>
      </div>
      {sorted.length === 0 ? (
        <EmptyState icon="bi-chat-left-text" title="No activity logged yet" />
      ) : (
        <div className="d-flex flex-column gap-2">
          {sorted.map(c => (
            <div key={c.id} className="section-card p-3">
              <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-1">
                <span className="fw-semibold small"><i className={`bi ${TYPE_ICON[c.type]} me-2`} />{c.type}</span>
                <span className="text-secondary small">{formatDate(c.date)} • {c.author}</span>
              </div>
              <p className="small mb-0">{c.content}</p>
              {c.followUpDate && <div className="small text-warning-emphasis mt-1"><i className="bi bi-calendar-event me-1" />Follow up by {formatDate(c.followUpDate)}</div>}
            </div>
          ))}
        </div>
      )}

      <Modal show={showForm} onHide={() => setShowForm(false)} centered>
        <Form onSubmit={handleAdd}>
          <Modal.Header closeButton><Modal.Title as="h5">Log Activity</Modal.Title></Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3" controlId={`fld-1`}>
              <Form.Label>Type</Form.Label>
              <Form.Select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as ClarificationEntry['type'] }))}>
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3" controlId={`fld-2`}>
              <Form.Label className="form-required">Details</Form.Label>
              <Form.Control required as="textarea" rows={3} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} />
            </Form.Group>
            <Form.Group controlId={`fld-3`}>
              <Form.Label>Follow-up Date (optional)</Form.Label>
              <Form.Control type="date" value={form.followUpDate} onChange={e => setForm(f => ({ ...f, followUpDate: e.target.value }))} />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Log Activity</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}
