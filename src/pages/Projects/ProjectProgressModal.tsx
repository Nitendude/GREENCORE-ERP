import { useNavigate } from 'react-router-dom';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import { useData } from '../../store/DataContext';
import { formatDate } from '../../utils/format';
import type { Project } from '../../types';

interface ProjectProgressModalProps {
  show: boolean;
  project: Project | null;
  onClose: () => void;
}

export default function ProjectProgressModal({ show, project, onClose }: ProjectProgressModalProps) {
  const { dailyLogs } = useData();
  const navigate = useNavigate();

  if (!project) return null;

  const latestLog = dailyLogs
    .filter(l => l.projectId === project.id)
    .sort((a, b) => b.date.localeCompare(a.date))[0];

  return (
    <Modal show={show} onHide={onClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title as="h5">
          {project.name} <span className="text-secondary fw-normal">— Progress</span>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="d-flex justify-content-between align-items-center mb-1">
          <span className="fw-bold">Overall Progress</span>
          <span className="fw-bold">{project.progress}%</span>
        </div>
        <div className="workspace-progress-track mb-1" style={{ height: 10 }}>
          <div className="workspace-progress-fill" style={{ width: `${project.progress}%` }} />
        </div>
        <div className="d-flex justify-content-between small text-secondary mb-3">
          <span>Current phase: {project.currentPhase}</span>
          <StatusBadge status={project.status} />
        </div>

        <h6 className="fw-bold small mb-2">Phase Breakdown</h6>
        {project.phases.length === 0 ? (
          <EmptyState icon="bi-diagram-3" title="No phases defined yet" />
        ) : (
          <div className="d-flex flex-column gap-2 mb-3">
            {project.phases.map(phase => (
              <div key={phase.id}>
                <div className="d-flex justify-content-between small mb-1">
                  <span>{phase.name}</span>
                  <span className="text-secondary">{phase.progress}%</span>
                </div>
                <div className="workspace-progress-track">
                  <div
                    className="workspace-progress-fill"
                    style={{ width: `${phase.progress}%`, background: phase.status === 'Delayed' ? '#d64545' : undefined }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <h6 className="fw-bold small mb-2">Latest Update</h6>
        {!latestLog ? (
          <EmptyState icon="bi-journal-text" title="No daily updates logged yet" />
        ) : (
          <div className="section-card p-3">
            <div className="d-flex justify-content-between small mb-1">
              <span className="fw-semibold">{formatDate(latestLog.date)}</span>
              <span className="text-secondary"><i className="bi bi-camera me-1" />{latestLog.photos} photos</span>
            </div>
            <p className="small mb-1">{latestLog.workCompleted}</p>
            <p className="text-secondary small mb-0"><strong>Next:</strong> {latestLog.nextActivities}</p>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onClose}>Close</Button>
        <Button variant="primary" onClick={() => { onClose(); navigate(`/projects/${project.id}/overview`); }}>Open Full Workspace</Button>
      </Modal.Footer>
    </Modal>
  );
}
