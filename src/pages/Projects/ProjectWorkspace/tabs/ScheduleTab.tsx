import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import StatusBadge from '../../../../components/ui/StatusBadge';
import EmptyState from '../../../../components/ui/EmptyState';
import { useData } from '../../../../store/DataContext';
import { formatDate } from '../../../../utils/format';
import type { Project } from '../../../../types';

function dayOffset(from: string, to: string): number {
  return Math.round((new Date(to).getTime() - new Date(from).getTime()) / (1000 * 60 * 60 * 24));
}

export default function ScheduleTab({ project }: { project: Project }) {
  const { tasks } = useData();
  const rangeStart = project.startDate;
  const rangeEnd = project.targetCompletionDate;
  const totalDays = Math.max(1, dayOffset(rangeStart, rangeEnd));

  const delayedPhases = project.phases.filter(p => p.status === 'Delayed');
  const delayedTasks = tasks.filter(t => t.projectId === project.id && t.status !== 'Completed' && new Date(t.dueDate) < new Date() && t.status === 'Blocked');

  return (
    <Row className="g-3">
      <Col xs={12} lg={8}>
        <div className="section-card p-3 mb-3">
          <h6 className="fw-bold mb-3">Project Phases (Planned vs. Actual)</h6>
          {project.phases.length === 0 ? (
            <EmptyState icon="bi-calendar3" title="No phases defined" />
          ) : (
            <div className="d-flex flex-column gap-3">
              {project.phases.map(phase => {
                const startOff = Math.max(0, dayOffset(rangeStart, phase.plannedStart));
                const plannedSpan = Math.max(1, dayOffset(phase.plannedStart, phase.plannedEnd));
                const leftPct = (startOff / totalDays) * 100;
                const widthPct = Math.min(100 - leftPct, (plannedSpan / totalDays) * 100);
                return (
                  <div key={phase.id}>
                    <div className="d-flex justify-content-between align-items-center mb-1 flex-wrap gap-1">
                      <span className="fw-semibold small">{phase.name}</span>
                      <StatusBadge status={phase.status} />
                    </div>
                    <div className="position-relative" style={{ height: 20, background: '#eef1f4', borderRadius: 6 }}>
                      <div
                        className="position-absolute top-0 h-100 rounded"
                        style={{
                          left: `${leftPct}%`, width: `${widthPct}%`,
                          background: phase.status === 'Delayed' ? '#d64545' : phase.status === 'Completed' ? '#2f9e5c' : 'var(--gc-primary)',
                          opacity: phase.status === 'Not Started' ? 0.35 : 0.9,
                        }}
                        title={`${phase.progress}% complete`}
                      />
                    </div>
                    <div className="d-flex justify-content-between text-secondary small mt-1">
                      <span>Planned: {formatDate(phase.plannedStart)} → {formatDate(phase.plannedEnd)}</span>
                      <span>Actual: {phase.actualStart ? formatDate(phase.actualStart) : '—'} → {phase.actualEnd ? formatDate(phase.actualEnd) : 'In progress'}</span>
                      <span>{phase.progress}% • weight {phase.weight}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="section-card p-3">
          <h6 className="fw-bold mb-3">Task Dependencies</h6>
          {tasks.filter(t => t.projectId === project.id && t.dependencies.length > 0).length === 0 ? (
            <EmptyState icon="bi-diagram-3" title="No dependency chains recorded" />
          ) : (
            <ul className="list-unstyled mb-0 d-flex flex-column gap-2">
              {tasks.filter(t => t.projectId === project.id && t.dependencies.length > 0).map(t => (
                <li key={t.id} className="small border-bottom pb-2">
                  <strong>{t.name}</strong> depends on:{' '}
                  {t.dependencies.map(depId => {
                    const dep = tasks.find(dt => dt.id === depId);
                    return dep ? <span key={depId} className="badge text-bg-light border me-1">{dep.name}</span> : null;
                  })}
                </li>
              ))}
            </ul>
          )}
        </div>
      </Col>

      <Col xs={12} lg={4}>
        <div className="section-card p-3 mb-3">
          <h6 className="fw-bold mb-2">Milestones</h6>
          {project.milestones.length === 0 ? (
            <EmptyState icon="bi-flag" title="No milestones" />
          ) : (
            <ul className="list-unstyled mb-0 d-flex flex-column gap-2">
              {project.milestones.map(m => (
                <li key={m.id} className="d-flex justify-content-between align-items-center border-bottom pb-2">
                  <div className="min-w-0">
                    <div className="small fw-semibold text-truncate">{m.name}</div>
                    <div className="text-secondary small">Due {formatDate(m.dueDate)}{m.completedDate && ` • Completed ${formatDate(m.completedDate)}`}</div>
                  </div>
                  <StatusBadge status={m.status} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="section-card p-3">
          <h6 className="fw-bold mb-2">Delayed Activities</h6>
          {delayedPhases.length === 0 && delayedTasks.length === 0 ? (
            <EmptyState icon="bi-check-circle" title="Nothing delayed" />
          ) : (
            <ul className="list-unstyled mb-0 d-flex flex-column gap-2">
              {delayedPhases.map(p => (
                <li key={p.id} className="small text-danger"><i className="bi bi-exclamation-triangle-fill me-1" />{p.name} (phase)</li>
              ))}
              {delayedTasks.map(t => (
                <li key={t.id} className="small text-danger"><i className="bi bi-exclamation-triangle-fill me-1" />{t.name} (blocked task)</li>
              ))}
            </ul>
          )}
        </div>
      </Col>
    </Row>
  );
}
