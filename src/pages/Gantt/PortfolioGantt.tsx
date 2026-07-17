import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Breadcrumbs from '../../components/layout/Breadcrumbs';
import SummaryCard from '../../components/ui/SummaryCard';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import { useData } from '../../store/DataContext';
import { formatDate } from '../../utils/format';
import type { Phase, Project } from '../../types';

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

export default function PortfolioGantt() {
  const { projects } = useData();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [dayWidth, setDayWidth] = useState(3);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(projects.map(project => project.id)));

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

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Portfolio Gantt' }]} />
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mt-2 mb-3">
        <div><h4 className="fw-bold mb-1">Portfolio Gantt Viewer</h4><p className="text-secondary small mb-0">One timeline for project schedules, phases, milestones, and completion progress.</p></div>
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
                      <div className="gantt-row-progress"><span>{project.progress}%</span><StatusBadge status={project.status} /></div>
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
                    return <div key={phase.id} className="gantt-data-row gantt-phase-row"><div className="gantt-label-cell"><span className="gantt-phase-indent"><i className="bi bi-arrow-return-right" />{phase.name}</span><div className="gantt-row-progress"><span>{phase.progress}%</span><StatusBadge status={phase.status} /></div></div><div className="gantt-timeline" style={{ width: timelineWidth }}><div className={`gantt-bar phase ${statusClass(phase.status)}`} style={phaseBar} title={`${phase.name}: ${phase.progress}% complete\n${formatDate(phase.plannedStart)} – ${formatDate(phase.plannedEnd)}`}><div className="gantt-bar-progress" style={{ width: `${phase.progress}%` }} /></div>{todayVisible && <div className="gantt-today-line" style={{ left: todayLeft }} />}</div></div>;
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
