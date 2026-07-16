import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import DataTable, { type Column } from '../../../../components/ui/DataTable';
import EmptyState from '../../../../components/ui/EmptyState';
import { useData } from '../../../../store/DataContext';
import { useAuth } from '../../../../store/AuthContext';
import { formatDate, genId } from '../../../../utils/format';
import type { Bid, BidDocument } from '../../../../types';

const CATEGORIES: BidDocument['category'][] = [
  'Invitation to Bid', 'Terms of Reference', 'Scope of Work', 'Drawings', 'Bill of Quantities',
  'Eligibility', 'Technical Proposal', 'Financial Proposal', 'Submission', 'Acknowledgment',
];

export default function DocumentsTab({ bid }: { bid: Bid }) {
  const { updateBid } = useData();
  const { currentUser, can } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', category: 'Technical Proposal' as BidDocument['category'] });

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    const doc: BidDocument = { id: genId('bd'), bidId: bid.id, name: form.name, category: form.category, version: '1.0', uploadedBy: currentUser.name, uploadedDate: new Date().toISOString().slice(0, 10) };
    updateBid(bid.id, { documents: [doc, ...bid.documents] }, currentUser.name);
    setShowForm(false);
    setForm({ name: '', category: 'Technical Proposal' });
  };

  const columns: Column<BidDocument>[] = [
    { key: 'name', label: 'Document', sortable: true, accessor: d => d.name, render: d => <span className="fw-semibold"><i className="bi bi-file-earmark-text me-1" />{d.name}</span> },
    { key: 'category', label: 'Category', accessor: d => d.category },
    { key: 'version', label: 'Version', accessor: d => d.version },
    { key: 'uploadedBy', label: 'Uploaded By', accessor: d => d.uploadedBy },
    { key: 'uploadedDate', label: 'Upload Date', sortable: true, accessor: d => d.uploadedDate, render: d => formatDate(d.uploadedDate) },
  ];

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="fw-bold mb-0">Bid Documents</h6>
        {can('documents.upload') && <Button size="sm" variant="primary" onClick={() => setShowForm(true)}><i className="bi bi-upload me-1" /> Upload</Button>}
      </div>
      {bid.documents.length === 0 ? (
        <EmptyState icon="bi-folder2-open" title="No documents uploaded" />
      ) : (
        <DataTable columns={columns} rows={bid.documents} keyField={d => d.id} pageSize={10} />
      )}

      <Modal show={showForm} onHide={() => setShowForm(false)} centered>
        <Form onSubmit={handleUpload}>
          <Modal.Header closeButton><Modal.Title as="h5">Upload Bid Document</Modal.Title></Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3" controlId={`fld-1`}>
              <Form.Label className="form-required">File Name</Form.Label>
              <Form.Control required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </Form.Group>
            <Form.Group controlId={`fld-2`}>
              <Form.Label>Category</Form.Label>
              <Form.Select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as BidDocument['category'] }))}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Upload</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}
