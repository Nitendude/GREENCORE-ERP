import { useMemo, useState } from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Breadcrumbs from '../../components/layout/Breadcrumbs';
import SummaryCard from '../../components/ui/SummaryCard';
import DataTable, { type Column } from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import CadViewerModal from './CadViewerModal';
import { useData } from '../../store/DataContext';
import { useAuth } from '../../store/AuthContext';
import { formatDate, genId } from '../../utils/format';
import { saveCadPdf } from '../../utils/cadFileStorage';
import type { CadFile } from '../../types';

const DISCIPLINES: CadFile['discipline'][] = ['Architectural', 'Structural', 'Mechanical', 'Electrical', 'Plumbing', 'Civil', 'Landscape'];

export default function CadPage() {
  const { cadFiles, projects, addCadFile } = useData();
  const { currentUser, can } = useAuth();
  const [search, setSearch] = useState('');
  const [projectId, setProjectId] = useState('');
  const [discipline, setDiscipline] = useState('');
  const [viewerFile, setViewerFile] = useState<CadFile | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [form, setForm] = useState({ projectId: projects[0]?.id || '', name: '', sheet: '', discipline: 'Architectural' as CadFile['discipline'] });

  const canUpload = can('cad.upload');
  const pendingCount = cadFiles.filter(file => file.approvalStatus === 'Pending').length;
  const inReviewCount = cadFiles.filter(file => file.reviewStatus === 'In Review').length;

  const filtered = useMemo(() => {
    let list = cadFiles;
    if (search.trim()) list = list.filter(file => file.name.toLowerCase().includes(search.trim().toLowerCase()));
    if (projectId) list = list.filter(file => file.projectId === projectId);
    if (discipline) list = list.filter(file => file.discipline === discipline);
    return [...list].sort((a, b) => b.uploadedDate.localeCompare(a.uploadedDate));
  }, [cadFiles, search, projectId, discipline]);

  const handleUpload = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim() || !form.projectId || !uploadFile) return;
    if (uploadFile.type !== 'application/pdf' && !uploadFile.name.toLowerCase().endsWith('.pdf')) {
      setUploadError('Please choose a PDF file for the interactive review workspace.');
      return;
    }

    setUploading(true);
    setUploadError('');
    const id = genId('cad');
    const today = new Date().toISOString().slice(0, 10);
    try {
      await saveCadPdf(id, uploadFile);
      const newFile: CadFile = {
        id,
        projectId: form.projectId,
        name: form.name.trim(),
        sheet: form.sheet.trim() || undefined,
        discipline: form.discipline,
        fileType: 'PDF',
        version: '1',
        uploadedBy: currentUser.name,
        uploadedDate: today,
        approvalStatus: 'Pending',
        reviewStatus: 'Draft',
        units: 'Millimeters',
        layers: ['PDF Artwork'],
        sizeKb: Math.max(1, Math.ceil(uploadFile.size / 1024)),
        threads: [],
        markups: [],
        reviewHistory: [],
        versionHistory: [{ version: '1', date: today, uploadedBy: currentUser.name, notes: 'Initial PDF upload' }],
      };
      addCadFile(newFile);
      setShowUpload(false);
      setUploadFile(null);
      setForm({ projectId: projects[0]?.id || '', name: '', sheet: '', discipline: 'Architectural' });
      setViewerFile(newFile);
    } catch {
      setUploadError('The PDF could not be stored in this browser. Try a smaller file or check browser storage permissions.');
    } finally {
      setUploading(false);
    }
  };

  const columns: Column<CadFile>[] = [
    { key: 'name', label: 'Drawing', sortable: true, accessor: file => file.name, render: file => (
      <button className="btn btn-link p-0 text-start fw-semibold" onClick={() => setViewerFile(file)}>
        <i className={`bi ${file.fileType === 'PDF' ? 'bi-file-earmark-pdf' : 'bi-vector-pen'} me-1`} />{file.name}
      </button>
    ) },
    { key: 'project', label: 'Project', accessor: file => projects.find(project => project.id === file.projectId)?.name || '—' },
    { key: 'discipline', label: 'Discipline', sortable: true, accessor: file => file.discipline },
    { key: 'fileType', label: 'Type', accessor: file => file.fileType },
    { key: 'version', label: 'Rev', accessor: file => file.version },
    { key: 'reviewStatus', label: 'Review', render: file => <StatusBadge status={file.reviewStatus ?? 'Draft'} /> },
    { key: 'threads', label: 'Threads', accessor: file => file.threads?.length ?? 0, render: file => {
      const open = file.threads?.filter(thread => thread.status === 'Open').length ?? 0;
      return <span className={open ? 'text-warning-emphasis fw-semibold' : 'text-secondary'}>{open} open</span>;
    } },
    { key: 'uploadedDate', label: 'Date', sortable: true, accessor: file => file.uploadedDate, render: file => formatDate(file.uploadedDate) },
  ];

  return (
    <div>
      <Breadcrumbs items={[{ label: 'CAD' }]} />
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mt-2 mb-3">
        <div><h4 className="fw-bold mb-1">Drawing Review Workspace</h4><p className="text-secondary small mb-0">Review drawings, coordinate markups, resolve comments, and submit approved designs.</p></div>
        {canUpload && <Button variant="primary" onClick={() => setShowUpload(true)}><i className="bi bi-upload me-1" /> Upload Drawing PDF</Button>}
      </div>

      <Row className="g-3 mb-3">
        <Col xs={12} sm={4}><SummaryCard label="Drawings" value={cadFiles.length} icon="bi-vector-pen" variant="primary" /></Col>
        <Col xs={12} sm={4}><SummaryCard label="In Review" value={inReviewCount} icon="bi-chat-square-text" variant="warning" /></Col>
        <Col xs={12} sm={4}><SummaryCard label="Pending Approval" value={pendingCount} icon="bi-hourglass-split" variant="info" /></Col>
      </Row>

      <div className="section-card p-3 mb-3">
        <Row className="g-2 align-items-end">
          <Col xs={12} md={5}><Form.Label className="small mb-1">Search</Form.Label><Form.Control placeholder="Drawing name…" value={search} onChange={event => setSearch(event.target.value)} /></Col>
          <Col xs={6} md={4}><Form.Label className="small mb-1">Project</Form.Label><Form.Select value={projectId} onChange={event => setProjectId(event.target.value)}><option value="">All projects</option>{projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}</Form.Select></Col>
          <Col xs={6} md={3}><Form.Label className="small mb-1">Discipline</Form.Label><Form.Select value={discipline} onChange={event => setDiscipline(event.target.value)}><option value="">All disciplines</option>{DISCIPLINES.map(item => <option key={item} value={item}>{item}</option>)}</Form.Select></Col>
        </Row>
      </div>

      {filtered.length === 0 ? <EmptyState icon="bi-vector-pen" title="No drawings found" message="Upload a drawing PDF to start a coordinated design review." /> : <DataTable columns={columns} rows={filtered} keyField={file => file.id} pageSize={10} />}

      <CadViewerModal show={viewerFile !== null} file={viewerFile} projectName={viewerFile ? projects.find(project => project.id === viewerFile.projectId)?.name : undefined} onClose={() => setViewerFile(null)} />

      <Modal show={showUpload} onHide={() => setShowUpload(false)} centered>
        <Form onSubmit={handleUpload}>
          <Modal.Header closeButton><Modal.Title as="h5">Upload Drawing for Review</Modal.Title></Modal.Header>
          <Modal.Body>
            <Row className="g-3">
              <Col xs={12}><Form.Group controlId="cad-project"><Form.Label className="form-required">Project</Form.Label><Form.Select required value={form.projectId} onChange={event => setForm(value => ({ ...value, projectId: event.target.value }))}>{projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}</Form.Select></Form.Group></Col>
              <Col xs={12}><Form.Group controlId="cad-pdf"><Form.Label className="form-required">PDF File</Form.Label><Form.Control required type="file" accept="application/pdf,.pdf" onChange={event => { const nextFile = (event.target as HTMLInputElement).files?.[0] ?? null; setUploadFile(nextFile); setUploadError(''); if (nextFile) setForm(value => ({ ...value, name: nextFile.name })); }} /><Form.Text>The PDF remains in this browser for the interactive client demo.</Form.Text></Form.Group></Col>
              <Col xs={12}><Form.Group controlId="cad-name"><Form.Label className="form-required">Drawing Name</Form.Label><Form.Control required placeholder="e.g. Ground Floor Coordination Plan.pdf" value={form.name} onChange={event => setForm(value => ({ ...value, name: event.target.value }))} /></Form.Group></Col>
              <Col xs={12} md={6}><Form.Group controlId="cad-discipline"><Form.Label>Discipline</Form.Label><Form.Select value={form.discipline} onChange={event => setForm(value => ({ ...value, discipline: event.target.value as CadFile['discipline'] }))}>{DISCIPLINES.map(item => <option key={item} value={item}>{item}</option>)}</Form.Select></Form.Group></Col>
              <Col xs={12} md={6}><Form.Group controlId="cad-sheet"><Form.Label>Sheet Number</Form.Label><Form.Control placeholder="e.g. A-101" value={form.sheet} onChange={event => setForm(value => ({ ...value, sheet: event.target.value }))} /></Form.Group></Col>
            </Row>
            {uploadError && <div className="alert alert-danger py-2 small mt-3 mb-0">{uploadError}</div>}
          </Modal.Body>
          <Modal.Footer><Button variant="outline-secondary" onClick={() => setShowUpload(false)} disabled={uploading}>Cancel</Button><Button variant="primary" type="submit" disabled={uploading || !uploadFile}>{uploading ? 'Preparing review…' : 'Upload & Review'}</Button></Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}
