import { useNavigate } from 'react-router-dom';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import { useAuth } from '../../store/AuthContext';
import { formatCurrency, formatDate } from '../../utils/format';
import type { Project } from '../../types';

interface ProjectQuickViewModalProps {
  show: boolean;
  project: Project | null;
  onClose: () => void;
}

// Shown first when a project row/card is clicked — a compact, read-only
// snapshot of only the key details, with an explicit action to drill into
// the full Project Workspace (tasks, financials, documents, etc.).
export default function ProjectQuickViewModal({ show, project, onClose }: ProjectQuickViewModalProps) {
  const navigate = useNavigate();
  const { can } = useAuth();

  if (!project) return null;

  const financialsAuthorized = can('projects.financials.view');

  const openFullWorkspace = () => {
    onClose();
    navigate(`/projects/${project.id}`);
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title as="h5" className="d-flex align-items-center gap-2 flex-wrap">
          {project.name} <span className="text-secondary fw-normal">{project.code}</span>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="d-flex align-items-center gap-2 mb-3">
          <StatusBadge status={project.status} />
          <StatusBadge status={project.priority} />
        </div>

        <dl className="quick-view-meta mb-3">
          <div><dt>Client</dt><dd>{project.client}</dd></div>
          <div><dt>Location</dt><dd>{project.location}</dd></div>
          <div><dt>Project Manager</dt><dd>{project.projectManager}</dd></div>
          <div><dt>Start Date</dt><dd>{formatDate(project.startDate)}</dd></div>
          <div><dt>Target Completion</dt><dd>{formatDate(project.targetCompletionDate)}</dd></div>
          {financialsAuthorized && <div><dt>Contract Value</dt><dd>{formatCurrency(project.contractValue)}</dd></div>}
        </dl>

        <div>
          <div className="d-flex justify-content-between small text-secondary mb-1">
            <span>Overall Progress</span>
            <span>{project.progress}%</span>
          </div>
          <div className="workspace-progress-track" style={{ height: 10 }}>
            <div className="workspace-progress-fill" style={{ width: `${project.progress}%` }} />
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onClose}>Close</Button>
        <Button variant="primary" onClick={openFullWorkspace}>
          <i className="bi bi-box-arrow-in-right me-1" /> View Full Workspace
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
