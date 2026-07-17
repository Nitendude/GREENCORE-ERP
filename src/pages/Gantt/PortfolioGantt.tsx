import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Breadcrumbs from '../../components/layout/Breadcrumbs';
import SummaryCard from '../../components/ui/SummaryCard';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import { useData } from '../../store/DataContext';
import { useAuth } from '../../store/AuthContext';
import { formatDate, genId } from '../../utils/format';
import type { Phase, Project, ProjectStatus } from '../../types';

const DAY_MS = 86_400_000;

function asDate(value: string): Date {
  const date = new Date(`${value}T00:00:00`);
  date.setHours(0, 0, 0, 0);
  return date;
}

function dayDiff(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / DAY_MS);
}

function monthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function monthEnd(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function addMonths(date: Date, count: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + count, 1);
}

function statusClass(status: Project['status'] | Phase['status']): string {
  if (status === 'Delayed') return 'delayed';
  if (status === 'Completed' || status === 'Closed') return 'completed';
  if (status === 'On Hold') return 'hold';
  if (status === 'Not Started' || status === 'Planning') return 'not-started';
  return 'active';
}

const PROJECT_STATUS_FLOW: ProjectStatus[] = ['Planning', 'Mobilization', 'In Progress', 'On Hold', 'Delayed', 'For Inspection', 'Completed', 'Closed', 'Cancelled'];
const PHASE_STATUS_FLOW: Phase['status'][] = ['Not Started', 'In Progress', 'Delayed', 'Completed'];
const CONFIRM_REQUIRED_STATUSES: ProjectStatus[] = ['On Hold', 'Cancelled', 'Completed', 'Closed'];

type StatusEditTarget =
  | { kind: 'project'; project: Project }
  | { kind: 'phase'; project: Project; phase: Phase };

export default function PortfolioGantt() {
  const { projects, changeProjectStatus, updatePhaseStatus, addPhase } = useData();
  const { can, currentUser } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [dayWidth, setDayWidth] = useState(3);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(projects.map(project => project.id)));
  const [statusTarget, setStatusTarget] = useState<StatusEditTarget | null>(null);
  const [addPhaseFor, setAddPhaseFor] = useState<Project | null>(null);

  const canEdit = can('projects.edit');

  const visibleProjects = useMemo(() => projects
    .filter(project => !project.archived)
    .filter(project => !status || project.status === status)
    .filter(project => !search.trim() || `${project.code} ${project.name} ${project.client}`.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => a.startDate.localeCompare(b.startDate)), [projects, search, status]);

  const range = useMemo(() => {
    const source = visibleProjects.length ? visibleProjects : projects;
    const starts = source.map(project => asDate(project.startDate).getTime());
    const ends = source.map(project => asDate(project.targetCompletionDate).getTime());
    const start = monthStart(new Date(Math.min(...starts)));
    const end = monthEnd(new Date(Math.max(...ends)));
    return { start: addMonths(start, -1), end: addMonths(end, 1) };
  }, [visibleProjects, projects]);

  const totalDays = Math.max(1, dayDiff(range.start, range.end) + 1);
  const timelineWidth = totalDays * dayWidth;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayLeft = dayDiff(range.start, today) * dayWidth;
  const todayVisible = today >= range.start && today <= range.end;

  const months = useMemo(() => {
    const result: { key: string; label: string; days: number; year: number }[] = [];
    let cursor = new Date(range.start);
    while (cursor <= range.end) {
      const end = monthEnd(cursor);
      const clippedEnd = end > range.end ? range.end : end;
      result.push({
        key: `${cursor.getFullYear()}-${cursor.getMonth()}`,
        label: cursor.toLocaleDateString('en-PH', { month: 'short' }),
        year: cursor.getFullYear(),
        days: dayDiff(cursor, clippedEnd) + 1,
      });
      cursor = addMonths(cursor, 1);
    }
    return result;
  }, [range]);

  const statuses = Array.from(new Set(projects.map(project => project.status)));
  const delayed = projects.filter(project => project.status === 'Delayed' || project.phases.some(phase => phase.status === 'Delayed')).length;
  const active = projects.filter(project => ['Mobilization', 'In Progress', 'For Inspection'].includes(project.status)).length;
  const averageProgress = projects.length ? Math.round(projects.reduce((sum, project) => sum + project.progress, 0) / projects.length) : 0;

  const toggleProject = (id: string) => setExpanded(current => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const barPosition = (startValue: string, endValue: string) => {
    const start = asDate(startValue);
    const end = asDate(endValue);
    const left = Math.min(timelineWidth - dayWidth * 2, Math.max(0, dayDiff(range.start, start) * dayWidth));
    const naturalWidth = Math.max(dayWidth * 2, (dayDiff(start, end) + 1) * dayWidth);
    return { left, width: Math.max(dayWidth * 2, Math.min(naturalWidth, timelineWidth - left)) };
  };

  const expandAll = () => setExpanded(new Set(visibleProjects.map(project => project.id)));
  const collapseAll = () => setExpanded(new Set());

  const openAddPhase = (project: Project) => {
    setExpanded(current => new Set(current).add(project.id));
    setAddPhaseFor(project);
  };

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Portfolio Gantt' }]} />
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mt-2 mb-3">
        <div><h4 className="fw-bold mb-1">Portfolio Gantt Viewer</h4><p className="text-secondary small mb-0">One timeline for project schedules, phases, milestones, and completion progress.{canEdit && ' Click a status badge to update it, or add a new phase.'}</p></div>
        <div className="gantt-legend"><span><i className="active" />Active</span><span><i className="completed" />Completed</span><span><i className="delayed" />Delayed</span><span><b />Today</span></div>
      </div>

      <Row className="g-3 mb-3">
        <Col xs={12} sm={6} xl={3}><SummaryCard label="Projects" value={projects.filter(project => !project.archived).length} icon="bi-buildings" variant="primary" /></Col>
        <Col xs={12} sm={6} xl={3}><SummaryCard label="Active Projects" value={active} icon="bi-play-circle" variant="info" /></Col>
        <Col xs={12} sm={6} xl={3}><SummaryCard label="Schedule Attention" value={delayed} icon="bi-exclamation-triangle" variant="warning" /></Col>
        <Col xs={12} sm={6} xl={3}><SummaryCard label="Average Progress" value={`${averageProgress}%`} icon="bi-bar-chart-steps" variant="success" /></Col>
      </Row>

      <div className="section-card p-3 mb-3">
        <Row className="g-2 align-items-end">
          <Col xs={12} lg={4}><Form.Label className="small mb-1">Search projects</Form.Label><Form.Control value={search} onChange={event => setSearch(event.target.value)} placeholder="Code, project, or client…" /></Col>
          <Col xs={6} lg={3}><Form.Label className="small mb-1">Status</Form.Label><Form.Select value={status} onChange={event => setStatus(event.target.value)}><option value="">All statuses</option>{statuses.map(item => <option key={item}>{item}</option>)}</Form.Select></Col>
          <Col xs={6} lg={2}><Form.Label className="small mb-1">Timeline scale</Form.Label><Form.Select value={dayWidth} onChange={event => setDayWidth(Number(event.target.value))}><option value={2}>Compact</option><option value={3}>Standard</option><option value={5}>Detailed</option></Form.Select></Col>
          <Col xs={12} lg={3}><div className="d-flex gap-2"><Button className="flex-fill" variant="outline-secondary" onClick={expandAll}>Expand All</Button><Button className="flex-fill" variant="outline-secondary" onClick={collapseAll}>Collapse All</Button></div></Col>
        </Row>
      </div>

      {visibleProjects.length === 0 ? <EmptyState icon="bi-bar-chart-steps" title="No projects match these filters" /> : (
        <div className="gantt-card">
          <div className="gantt-scroll">
            <div className="gantt-header-row">
              <div className="gantt-label-cell gantt-corner"><span>Project / Phase</span><span>Progress</span></div>
              <div className="gantt-timeline gantt-months" style={{ width: timelineWidth }}>
                {months.map(month => <div key={month.key} style={{ width: month.days * dayWidth }}><strong>{month.label}</strong><small>{month.year}</small></div>)}
                {todayVisible && <div className="gantt-today-line" style={{ left: todayLeft }}><span>Today</span></div>}
              </div>
            </div>

            {visibleProjects.map(project => {
              const projectBar = barPosition(project.startDate, project.targetCompletionDate);
              const isExpanded = expanded.has(project.id);
              return (
                <div key={project.id} className="gantt-project-group">
                  <div className="gantt-data-row gantt-project-row">
                    <div className="gantt-label-cell">
                      <button type="button" className="gantt-expand" onClick={() => toggleProject(project.id)} aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${project.name}`}><i className={`bi bi-chevron-${isExpanded ? 'down' : 'right'}`} /></button>
                      <button type="button" className="gantt-project-link" onClick={() => navigate(`/projects/${project.id}/schedule`)}><strong>{project.name}</strong><small>{project.code} · {project.projectManager}</small></button>
                      <div className="gantt-row-progress">
                        <span>{project.progress}%</span>
                        {canEdit ? (
                          <button type="button" className="gantt-status-trigger" title="Update project status" onClick={() => setStatusTarget({ kind: 'project', project })}>
                            <StatusBadge status={project.status} /><i className="bi bi-pencil-fill" />
                          </button>
                        ) : <StatusBadge status={project.status} />}
                      </div>
                    </div>
                    <div className="gantt-timeline" style={{ width: timelineWidth }}>
                      <div className={`gantt-bar project ${statusClass(project.status)}`} style={projectBar} title={`${project.name}: ${project.progress}% complete\n${formatDate(project.startDate)} – ${formatDate(project.targetCompletionDate)}`}>
                        <div className="gantt-bar-progress" style={{ width: `${project.progress}%` }} /><span>{project.progress}%</span>
                      </div>
                      {project.milestones.map(milestone => { const left = dayDiff(range.start, asDate(milestone.dueDate)) * dayWidth; return left >= 0 && left <= timelineWidth ? <button type="button" key={milestone.id} className={`gantt-milestone ${milestone.status === 'Completed' ? 'completed' : milestone.status === 'Overdue' ? 'overdue' : ''}`} style={{ left }} title={`${milestone.name}\nDue ${formatDate(milestone.dueDate)}`} onClick={() => navigate(`/projects/${project.id}/schedule`)} /> : null; })}
                      {todayVisible && <div className="gantt-today-line" style={{ left: todayLeft }} />}
                    </div>
                  </div>

                  {isExpanded && project.phases.map(phase => {
                    const phaseBar = barPosition(phase.plannedStart, phase.plannedEnd);
                    return (
                      <div key={phase.id} className="gantt-data-row gantt-phase-row">
                        <div className="gantt-label-cell">
                          <span className="gantt-phase-indent"><i className="bi bi-arrow-return-right" />{phase.name}</span>
                          <div className="gantt-row-progress">
                            <span>{phase.progress}%</span>
                            {canEdit ? (
                              <button type="button" className="gantt-status-trigger" title="Update phase status" onClick={() => setStatusTarget({ kind: 'phase', project, phase })}>
                                <StatusBadge status={phase.status} /><i className="bi bi-pencil-fill" />
                              </button>
                            ) : <StatusBadge status={phase.status} />}
                          </div>
                        </div>
                        <div className="gantt-timeline" style={{ width: timelineWidth }}>
                          <div className={`gantt-bar phase ${statusClass(phase.status)}`} style={phaseBar} title={`${phase.name}: ${phase.progress}% complete\n${formatDate(phase.plannedStart)} – ${formatDate(phase.plannedEnd)}`}><div className="gantt-bar-progress" style={{ width: `${phase.progress}%` }} /></div>
                          {todayVisible && <div className="gantt-today-line" style={{ left: todayLeft }} />}
                        </div>
                      </div>
                    );
                  })}

                  {isExpanded && canEdit && (
                    <div className="gantt-data-row gantt-add-phase-row">
                      <div className="gantt-label-cell">
                        <button type="button" className="gantt-add-phase-btn" onClick={() => openAddPhase(project)}>
                          <i className="bi bi-plus-lg" /> Add Phase
                        </button>
                      </div>
                      <div className="gantt-timeline" style={{ width: timelineWidth }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <GanttStatusModal
        target={statusTarget}
        onCancel={() => setStatusTarget(null)}
        onConfirmProject={(newStatus, remarks) => {
          if (statusTarget?.kind === 'project') changeProjectStatus(statusTarget.project.id, newStatus, currentUser.name, remarks || `Status changed to ${newStatus}`);
          setStatusTarget(null);
        }}
        onConfirmPhase={(newStatus) => {
          if (statusTarget?.kind === 'phase') updatePhaseStatus(statusTarget.project.id, statusTarget.phase.id, newStatus, currentUser.name);
          setStatusTarget(null);
        }}
      />

      <AddPhaseModal
        project={addPhaseFor}
        onCancel={() => setAddPhaseFor(null)}
        onSave={phase => {
          if (addPhaseFor) addPhase(addPhaseFor.id, phase, currentUser.name);
          setAddPhaseFor(null);
        }}
      />
    </div>
  );
}

function GanttStatusModal({
  target, onCancel, onConfirmProject, onConfirmPhase,
}: {
  target: StatusEditTarget | null;
  onCancel: () => void;
  onConfirmProject: (status: ProjectStatus, remarks: string) => void;
  onConfirmPhase: (status: Phase['status']) => void;
}) {
  const [selected, setSelected] = useState<string>('');
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState(false);

  // Initialize as soon as a target is set (on open), not on the modal's
  // enter-transition callback — that fires ~300ms later and can race with
  // (and silently overwrite) a fast user selection.
  useEffect(() => {
    if (!target) return;
    setSelected(target.kind === 'project' ? target.project.status : target.phase.status);
    setRemarks('');
    setError(false);
  }, [target]);

  if (!target) return <Modal show={false} onHide={onCancel} />;

  const isProject = target.kind === 'project';
  const name = isProject ? target.project.name : target.phase.name;
  const currentStatus = isProject ? target.project.status : target.phase.status;
  const options = isProject ? PROJECT_STATUS_FLOW : PHASE_STATUS_FLOW;
  const requiresRemarks = isProject && CONFIRM_REQUIRED_STATUSES.includes(selected as ProjectStatus) && selected !== currentStatus;

  const handleConfirm = () => {
    if (!selected || selected === currentStatus) { onCancel(); return; }
    if (requiresRemarks && !remarks.trim()) { setError(true); return; }
    if (isProject) onConfirmProject(selected as ProjectStatus, remarks);
    else onConfirmPhase(selected as Phase['status']);
  };

  return (
    <Modal show={target !== null} onHide={onCancel} centered>
      <Modal.Header closeButton>
        <Modal.Title as="h5">Update {isProject ? 'Project' : 'Phase'} Status</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="text-secondary small mb-2">{isProject ? 'Project' : 'Phase'}: <strong className="text-body">{name}</strong></p>
        <Form.Group controlId="gantt-status-select" className="mb-2">
          <Form.Label>New status</Form.Label>
          <Form.Select value={selected} onChange={e => { setSelected(e.target.value); setError(false); }}>
            {options.map(o => <option key={o} value={o}>{o}{o === currentStatus ? ' (current)' : ''}</option>)}
          </Form.Select>
        </Form.Group>
        {requiresRemarks && (
          <Form.Group controlId="gantt-status-remarks">
            <Form.Label>Remarks <span className="text-danger">*</span></Form.Label>
            <Form.Control as="textarea" rows={3} value={remarks} onChange={e => { setRemarks(e.target.value); setError(false); }} placeholder="Explain the reason for this change…" isInvalid={error} />
            <Form.Control.Feedback type="invalid">Remarks are required for this status change.</Form.Control.Feedback>
          </Form.Group>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onCancel}>Cancel</Button>
        <Button variant={requiresRemarks ? 'warning' : 'primary'} onClick={handleConfirm} disabled={!selected}>Update Status</Button>
      </Modal.Footer>
    </Modal>
  );
}

function AddPhaseModal({ project, onCancel, onSave }: { project: Project | null; onCancel: () => void; onSave: (phase: Phase) => void }) {
  const [name, setName] = useState('');
  const [plannedStart, setPlannedStart] = useState('');
  const [plannedEnd, setPlannedEnd] = useState('');
  const [weight, setWeight] = useState('10');
  const [initialStatus, setInitialStatus] = useState<Phase['status']>('Not Started');
  const [error, setError] = useState('');

  // Initialize on open (target reference change), not on the enter-transition
  // callback — see GanttStatusModal for why that races with fast input.
  useEffect(() => {
    if (!project) return;
    setName(''); setWeight('10'); setInitialStatus('Not Started'); setError('');
    setPlannedStart(project.startDate || '');
    setPlannedEnd(project.targetCompletionDate || '');
  }, [project]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Phase name is required.'); return; }
    if (!plannedStart || !plannedEnd) { setError('Planned start and end dates are required.'); return; }
    if (plannedEnd < plannedStart) { setError('Planned end must be on or after the planned start.'); return; }
    onSave({
      id: genId('ph'), name: name.trim(), weight: Number(weight) || 0,
      plannedStart, plannedEnd, progress: initialStatus === 'Completed' ? 100 : 0, status: initialStatus,
      actualStart: initialStatus === 'Not Started' ? undefined : plannedStart,
      actualEnd: initialStatus === 'Completed' ? plannedEnd : undefined,
    });
  };

  return (
    <Modal show={project !== null} onHide={onCancel} centered>
      <Form onSubmit={submit} noValidate>
        <Modal.Header closeButton><Modal.Title as="h5">Add Phase{project ? ` — ${project.name}` : ''}</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form.Group controlId="ap-name" className="mb-3">
            <Form.Label className="form-required">Phase Name</Form.Label>
            <Form.Control value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Interior Finishes" />
          </Form.Group>
          <Row className="g-3 mb-3">
            <Col xs={6}>
              <Form.Group controlId="ap-start">
                <Form.Label className="form-required">Planned Start</Form.Label>
                <Form.Control type="date" value={plannedStart} onChange={e => setPlannedStart(e.target.value)} />
              </Form.Group>
            </Col>
            <Col xs={6}>
              <Form.Group controlId="ap-end">
                <Form.Label className="form-required">Planned End</Form.Label>
                <Form.Control type="date" value={plannedEnd} onChange={e => setPlannedEnd(e.target.value)} />
              </Form.Group>
            </Col>
          </Row>
          <Row className="g-3">
            <Col xs={6}>
              <Form.Group controlId="ap-weight">
                <Form.Label>Weight (%)</Form.Label>
                <Form.Control type="number" min={0} max={100} value={weight} onChange={e => setWeight(e.target.value)} />
                <Form.Text>Share of overall project progress this phase represents.</Form.Text>
              </Form.Group>
            </Col>
            <Col xs={6}>
              <Form.Group controlId="ap-status">
                <Form.Label>Initial Status</Form.Label>
                <Form.Select value={initialStatus} onChange={e => setInitialStatus(e.target.value as Phase['status'])}>
                  {PHASE_STATUS_FLOW.map(s => <option key={s} value={s}>{s}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
          {error && <div className="text-danger small mt-3">{error}</div>}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onCancel}>Cancel</Button>
          <Button variant="primary" type="submit">Add Phase</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
