import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Breadcrumbs from '../../components/layout/Breadcrumbs';
import DataTable, { type Column } from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import { useData } from '../../store/DataContext';
import { formatDate, isOverdue } from '../../utils/format';
import type { ProjectTask } from '../../types';

export default function TasksPage() {
  const { tasks, projects } = useData();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [projectId, setProjectId] = useState('');
  const [assignee, setAssignee] = useState('');

  const assignees = Array.from(new Set(tasks.map(t => t.assignee))).sort();

  const filtered = useMemo(() => {
    let list = tasks;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(t => t.name.toLowerCase().includes(q));
    }
    if (status) list = list.filter(t => t.status === status);
    if (projectId) list = list.filter(t => t.projectId === projectId);
    if (assignee) list = list.filter(t => t.assignee === assignee);
    return [...list].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [tasks, search, status, projectId, assignee]);

  const columns: Column<ProjectTask>[] = [
    { key: 'name', label: 'Task', sortable: true, accessor: t => t.name, render: t => (
      <span>{t.isMilestone && <i className="bi bi-flag-fill text-primary me-1" />}{t.name}</span>
    ) },
    { key: 'project', label: 'Project', accessor: t => projects.find(p => p.id === t.projectId)?.name || '—' },
    { key: 'assignee', label: 'Assigned To', sortable: true, accessor: t => t.assignee },
    { key: 'status', label: 'Status', render: t => <StatusBadge status={t.status} /> },
    { key: 'priority', label: 'Priority', render: t => <StatusBadge status={t.priority} /> },
    { key: 'dueDate', label: 'Due', sortable: true, accessor: t => t.dueDate, render: t => (
      <span className={t.status !== 'Completed' && isOverdue(t.dueDate) ? 'text-danger fw-semibold' : ''}>{formatDate(t.dueDate)}</span>
    ) },
    { key: 'progress', label: 'Progress', sortable: true, accessor: t => t.progress, render: t => `${t.progress}%` },
  ];

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Tasks' }]} />
      <h4 className="fw-bold mt-2 mb-3">Tasks Across Projects</h4>

      <div className="section-card p-3 mb-3">
        <Row className="g-2 align-items-end">
          <Col xs={12} md={4}>
            <Form.Label className="small mb-1">Search</Form.Label>
            <Form.Control placeholder="Task name..." value={search} onChange={e => setSearch(e.target.value)} />
          </Col>
          <Col xs={6} md={3}>
            <Form.Label className="small mb-1">Project</Form.Label>
            <Form.Select value={projectId} onChange={e => setProjectId(e.target.value)}>
              <option value="">All projects</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Form.Select>
          </Col>
          <Col xs={6} md={3}>
            <Form.Label className="small mb-1">Assignee</Form.Label>
            <Form.Select value={assignee} onChange={e => setAssignee(e.target.value)}>
              <option value="">All assignees</option>
              {assignees.map(a => <option key={a} value={a}>{a}</option>)}
            </Form.Select>
          </Col>
          <Col xs={12} md={2}>
            <Form.Label className="small mb-1">Status</Form.Label>
            <Form.Select value={status} onChange={e => setStatus(e.target.value)}>
              <option value="">All statuses</option>
              {(['Not Started', 'In Progress', 'Blocked', 'Completed'] as const).map(s => <option key={s} value={s}>{s}</option>)}
            </Form.Select>
          </Col>
        </Row>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="bi-check2-square" title="No tasks found" />
      ) : (
        <DataTable columns={columns} rows={filtered} keyField={t => t.id} onRowClick={t => navigate(`/projects/${t.projectId}/tasks`)} pageSize={12} />
      )}
    </div>
  );
}
