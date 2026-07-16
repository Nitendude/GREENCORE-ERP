import { Link, useParams } from 'react-router-dom';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import { useData } from '../../store/DataContext';
import { formatDate } from '../../utils/format';
import { loadCadPdf } from '../../utils/cadFileStorage';

export default function ClientPortal() {
  const { projectId } = useParams();
  const { projects, dailyLogs, cadFiles } = useData();
  const project = projects.find(p => p.id === projectId);

  if (!project) {
    return (
      <div className="client-portal-shell d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
        <div className="text-center">
          <EmptyState icon="bi-link-45deg" title="Portal link not found" message="This client portal link is invalid or the project no longer exists." />
          <Link to="/dashboard" className="btn btn-outline-secondary btn-sm mt-2">Staff Login</Link>
        </div>
      </div>
    );
  }

  const upcomingMilestones = project.milestones
    .filter(m => m.status !== 'Completed')
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 5);
  const recentLogs = dailyLogs
    .filter(l => l.projectId === project.id)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 4);
  const clientFacingContacts = project.contacts.filter(c => c.type === 'Internal' || c.type === 'Client').slice(0, 4);
  const sharedDesigns = cadFiles
    .filter(file => file.projectId === project.id && file.reviewStatus === 'Submitted' && file.submissionTarget === 'Client')
    .sort((a, b) => (b.submittedAt ?? b.uploadedDate).localeCompare(a.submittedAt ?? a.uploadedDate));

  const openSharedPdf = async (id: string) => {
    const pdfWindow = window.open('about:blank', '_blank');
    const pdf = await loadCadPdf(id);
    if (!pdf) {
      pdfWindow?.close();
      return;
    }
    const url = URL.createObjectURL(pdf);
    if (pdfWindow) pdfWindow.location.href = url;
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  return (
    <div className="client-portal-shell">
      <header className="client-portal-header">
        <div className="client-portal-content">
          <div className="client-portal-brand">
            <span className="client-portal-brand-mark"><i className="bi bi-buildings" /></span>
            <span className="fw-bold">Greencore Builders — Client Portal</span>
          </div>
          <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
            <h3 className="mb-0 fw-bold">{project.name}</h3>
            <StatusBadge status={project.status} />
          </div>
          <div className="text-secondary small d-flex flex-wrap gap-3">
            <span>{project.client}</span>
            <span>{project.location}</span>
            <span>Project Manager: {project.projectManager}</span>
            <span>Target Completion: {formatDate(project.targetCompletionDate)}</span>
          </div>
        </div>
      </header>

      <div className="client-portal-content py-4">
        <div className="section-card p-3 mb-3">
          <div className="d-flex justify-content-between small mb-2">
            <span className="fw-bold">Overall Progress</span>
            <span className="fw-bold">{project.progress}%</span>
          </div>
          <div className="workspace-progress-track mb-3" style={{ height: 12 }}>
            <div className="workspace-progress-fill" style={{ width: `${project.progress}%` }} />
          </div>
          {project.phases.length > 0 && (
            <Row className="g-3">
              {project.phases.map(phase => (
                <Col xs={12} sm={6} key={phase.id}>
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
                </Col>
              ))}
            </Row>
          )}
        </div>

        <Row className="g-3">
          <Col xs={12} md={6}>
            <div className="section-card p-3 h-100">
              <h6 className="fw-bold mb-2">Upcoming Milestones</h6>
              {upcomingMilestones.length === 0 ? (
                <EmptyState icon="bi-flag" title="No upcoming milestones" />
              ) : (
                <ul className="list-unstyled mb-0 d-flex flex-column gap-2">
                  {upcomingMilestones.map(m => (
                    <li key={m.id} className="d-flex justify-content-between align-items-center border-bottom pb-2">
                      <div className="min-w-0">
                        <div className="small fw-semibold text-truncate">{m.name}</div>
                        <div className="text-secondary small">Due {formatDate(m.dueDate)}</div>
                      </div>
                      <StatusBadge status={m.status} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Col>
          <Col xs={12} md={6}>
            <div className="section-card p-3 h-100">
              <h6 className="fw-bold mb-2">Key Contacts</h6>
              {clientFacingContacts.length === 0 ? (
                <EmptyState icon="bi-person" title="No contacts listed" />
              ) : (
                <ul className="list-unstyled mb-0 d-flex flex-column gap-2">
                  {clientFacingContacts.map(c => (
                    <li key={c.id}>
                      <div className="small fw-semibold">{c.name} <span className="text-secondary fw-normal">— {c.role}</span></div>
                      <div className="text-secondary small">{c.email} • {c.phone}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Col>
          <Col xs={12}>
            <div className="section-card p-3">
              <h6 className="fw-bold mb-3">Submitted Designs</h6>
              {sharedDesigns.length === 0 ? (
                <EmptyState icon="bi-file-earmark-check" title="No designs submitted yet" />
              ) : (
                <div className="table-responsive">
                  <table className="table table-sm align-middle mb-0">
                    <thead><tr><th>Drawing</th><th>Discipline</th><th>Revision</th><th>Submitted</th><th /></tr></thead>
                    <tbody>{sharedDesigns.map(file => <tr key={file.id}><td className="fw-semibold"><i className="bi bi-file-earmark-check text-success me-2" />{file.name}</td><td>{file.discipline}</td><td>{file.version}</td><td>{formatDate(file.submittedAt ?? file.uploadedDate)}</td><td className="text-end">{file.fileType === 'PDF' && <Button size="sm" variant="outline-primary" onClick={() => openSharedPdf(file.id)}>Open PDF</Button>}</td></tr>)}</tbody>
                  </table>
                </div>
              )}
            </div>
          </Col>
          <Col xs={12}>
            <div className="section-card p-3">
              <h6 className="fw-bold mb-3">Latest Site Updates</h6>
              {recentLogs.length === 0 ? (
                <EmptyState icon="bi-journal-text" title="No updates posted yet" />
              ) : (
                <div className="d-flex flex-column gap-3">
                  {recentLogs.map(log => (
                    <div key={log.id} className="border-bottom pb-3">
                      <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-1">
                        <span className="fw-bold small">{formatDate(log.date)}</span>
                        <span className="text-secondary small">
                          <i className="bi bi-cloud me-1" />{log.weather} • <i className="bi bi-camera ms-2 me-1" />{log.photos} photos
                        </span>
                      </div>
                      <p className="small mb-1">{log.workCompleted}</p>
                      <p className="text-secondary small mb-0"><strong>Next:</strong> {log.nextActivities}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Col>
        </Row>
      </div>

      <div className="client-portal-footer">
        Shared read-only project view — Powered by Greencore ERP.{' '}
        <Link to="/dashboard" className="text-decoration-none">Staff Login</Link>
      </div>
    </div>
  );
}
