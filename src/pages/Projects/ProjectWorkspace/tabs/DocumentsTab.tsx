import { useState } from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import DataTable, { type Column } from '../../../../components/ui/DataTable';
import StatusBadge from '../../../../components/ui/StatusBadge';
import EmptyState from '../../../../components/ui/EmptyState';
import ConfirmModal from '../../../../components/ui/ConfirmModal';
import { useData } from '../../../../store/DataContext';
import { useAuth } from '../../../../store/AuthContext';
import { formatDate, genId } from '../../../../utils/format';
import type { Project, ProjectDocument } from '../../../../types';

const CATEGORIES: ProjectDocument['category'][] = ['Contract', 'Drawing', 'Plan', 'Permit', 'Report', 'Photo', 'Purchase', 'Billing'];

export default function DocumentsTab({ project }: { project: Project }) {
  const { documents, addDocument } = useData();
  const { currentUser, can } = useAuth();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<ProjectDocument | null>(null);
  const [form, setForm] = useState({ name: '', category: 'Report' as ProjectDocument['category'] });

  const projectDocs = documents.filter(d => d.projectId === project.id).filter(d => {
    if (category && d.category !== category) return false;
    if (search.trim() && !d.name.toLowerCase().includes(search.trim().toLowerCase())) return false;
    return true;
  });

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    addDocument({
      id: genId('doc'), projectId: project.id, name: form.name, category: form.category,
      version: '1.0', uploadedBy: currentUser.name, uploadedDate: new Date().toISOString().slice(0, 10),
      approvalStatus: 'Pending', sizeKb: Math.floor(200 + Math.random() * 4000),
    });
    setShowUpload(false);
    setForm({ name: '', category: 'Report' });
  };

  const columns: Column<ProjectDocument>[] = [
    { key: 'name', label: 'Document', sortable: true, accessor: d => d.name, render: d => (
      <button className="btn btn-link p-0 text-start fw-semibold" onClick={() => setPreviewDoc(d)}>
        <i className="bi bi-file-earmark-text me-1" />{d.name}
      </button>
    ) },
    { key: 'category', label: 'Category', accessor: d => d.category },
    { key: 'version', label: 'Version', accessor: d => d.version },
    { key: 'uploadedBy', label: 'Uploaded By', accessor: d => d.uploadedBy },
    { key: 'uploadedDate', label: 'Upload Date', sortable: true, accessor: d => d.uploadedDate, render: d => formatDate(d.uploadedDate) },
    { key: 'approvalStatus', label: 'Approval', render: d => <StatusBadge status={d.approvalStatus} /> },
    { key: 'size', label: 'Size', accessor: d => d.sizeKb, render: d => d.sizeKb > 1024 ? `${(d.sizeKb / 1024).toFixed(1)} MB` : `${d.sizeKb} KB` },
  ];

  return (
    <div>
      <div className="section-card p-3 mb-3">
        <Row className="g-2 align-items-end">
          <Col xs={12} md={6}>
            <Form.Label className="small mb-1">Search documents</Form.Label>
            <Form.Control placeholder="Document name..." value={search} onChange={e => setSearch(e.target.value)} />
          </Col>
          <Col xs={8} md={4}>
            <Form.Label className="small mb-1">Category</Form.Label>
            <Form.Select value={category} onChange={e => setCategory(e.target.value)}>
              <option value="">All categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </Form.Select>
          </Col>
          <Col xs={4} md={2} className="d-flex justify-content-end">
            {can('documents.upload') && (
              <Button variant="primary" onClick={() => setShowUpload(true)} className="w-100"><i className="bi bi-upload me-1" /> Upload</Button>
            )}
          </Col>
        </Row>
      </div>

      {projectDocs.length === 0 ? (
        <EmptyState icon="bi-folder2-open" title="No documents found" message="Upload contracts, drawings, permits, or reports for this project." />
      ) : (
        <DataTable columns={columns} rows={projectDocs} keyField={d => d.id} pageSize={8} />
      )}

      <Modal show={showUpload} onHide={() => setShowUpload(false)} centered>
        <Form onSubmit={handleUpload}>
          <Modal.Header closeButton><Modal.Title as="h5">Upload Document</Modal.Title></Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3" controlId={`fld-1`}>
              <Form.Label className="form-required">File Name</Form.Label>
              <Form.Control required placeholder="e.g. Site Survey Report.pdf" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </Form.Group>
            <Form.Group controlId={`fld-2`}>
              <Form.Label>Category</Form.Label>
              <Form.Select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as ProjectDocument['category'] }))}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </Form.Select>
            </Form.Group>
            <Form.Text>This demo simulates file uploads — no file is actually transferred.</Form.Text>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowUpload(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Upload</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <ConfirmModal
        show={previewDoc !== null}
        title={previewDoc?.name || ''}
        body={
          previewDoc ? (
            <div>
              <div className="d-flex justify-content-center align-items-center bg-light rounded mb-3" style={{ height: 160 }}>
                <i className="bi bi-file-earmark-richtext" style={{ fontSize: '3rem', color: '#9aa4af' }} />
              </div>
              <div className="small d-flex flex-column gap-1">
                <span><strong>Category:</strong> {previewDoc.category}</span>
                <span><strong>Version:</strong> {previewDoc.version}</span>
                <span><strong>Uploaded by:</strong> {previewDoc.uploadedBy} on {formatDate(previewDoc.uploadedDate)}</span>
                <span><strong>Approval status:</strong> {previewDoc.approvalStatus}</span>
              </div>
            </div>
          ) : null
        }
        confirmLabel="Close"
        onConfirm={() => setPreviewDoc(null)}
        onCancel={() => setPreviewDoc(null)}
      />
    </div>
  );
}
