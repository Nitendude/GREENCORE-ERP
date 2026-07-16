import { useMemo, useState } from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import DataTable, { type Column } from '../../../../components/ui/DataTable';
import StatusBadge from '../../../../components/ui/StatusBadge';
import EmptyState from '../../../../components/ui/EmptyState';
import { useData } from '../../../../store/DataContext';
import { useAuth } from '../../../../store/AuthContext';
import { formatDate, isOverdue, genId } from '../../../../utils/format';
import type { Project, ProjectTask, Priority } from '../../../../types';

const STATUS_COLUMNS: ProjectTask['status'][] = ['Not Started', 'In Progress', 'Blocked', 'Completed'];

export default function TasksTab({ project }: { project: Project }) {
  const { tasks, addTask, updateTask } = useData();
  const { allUsers, currentUser } = useAuth();
  const [view, setView] = useState<'list' | 'board' | 'timeline'>('list');
  const [showForm, setShowForm] = useState(false);

  const projectTasks = tasks.filter(t => t.projectId === project.id);

  const [form, setForm] = useState({
    name: '', assignee: currentUser.name, status: 'Not Started' as ProjectTask['status'],
    priority: 'Medium' as Priority, startDate: '', dueDate: '', progress: '0', isMilestone: false,
  });

  const resetForm = () => setForm({ name: '', assignee: currentUser.name, status: 'Not Started', priority: 'Medium', startDate: '', dueDate: '', progress: '0', isMilestone: false });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.startDate || !form.dueDate) return;
    addTask({
      id: genId('t'), projectId: project.id, name: form.name, assignee: form.assignee,
      status: form.status, priority: form.priority, startDate: form.startDate, dueDate: form.dueDate,
      progress: Number(form.progress), dependencies: [], isMilestone: form.isMilestone,
    });
    setShowForm(false);
    resetForm();
  };

  const columns: Column<ProjectTask>[] = [
    { key: 'name', label: 'Task', sortable: true, accessor: t => t.name, render: t => (
      <div>
        <div className="fw-semibold d-flex align-items-center gap-1">
          {t.isMilestone && <i className="bi bi-flag-fill text-primary" title="Milestone" />}
          {t.name}
        </div>
        {t.dependencies.length > 0 && <div className="text-secondary small">Depends on {t.dependencies.length} task(s)</div>}
      </div>
    ) },
    { key: 'assignee', label: 'Assigned To', sortable: true, accessor: t => t.assignee },
    { key: 'status', label: 'Status', render: t => <StatusBadge status={t.status} /> },
    { key: 'priority', label: 'Priority', render: t => <StatusBadge status={t.priority} /> },
    { key: 'startDate', label: 'Start', sortable: true, accessor: t => t.startDate, render: t => formatDate(t.startDate) },
    { key: 'dueDate', label: 'Due', sortable: true, accessor: t => t.dueDate, render: t => (
      <span className={t.status !== 'Completed' && isOverdue(t.dueDate) ? 'text-danger fw-semibold' : ''}>
        {formatDate(t.dueDate)}{t.status !== 'Completed' && isOverdue(t.dueDate) && <i className="bi bi-exclamation-triangle-fill ms-1" title="Overdue" />}
      </span>
    ) },
    { key: 'progress', label: 'Progress', sortable: true, accessor: t => t.progress, render: t => (
      <div style={{ minWidth: 80 }}>
        <div className="workspace-progress-track mb-1"><div className="workspace-progress-fill" style={{ width: `${t.progress}%` }} /></div>
        <span className="small text-secondary">{t.progress}%</span>
      </div>
    ) },
  ];

  const boardColumns = useMemo(() => STATUS_COLUMNS.map(status => ({
    status, items: projectTasks.filter(t => t.status === status),
  })), [projectTasks]);

  const timelineSorted = [...projectTasks].sort((a, b) => a.startDate.localeCompare(b.startDate));

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <ButtonGroup size="sm">
          <Button variant={view === 'list' ? 'primary' : 'outline-secondary'} onClick={() => setView('list')}><i className="bi bi-list-task" /> List</Button>
          <Button variant={view === 'board' ? 'primary' : 'outline-secondary'} onClick={() => setView('board')}><i className="bi bi-kanban" /> Board</Button>
          <Button variant={view === 'timeline' ? 'primary' : 'outline-secondary'} onClick={() => setView('timeline')}><i className="bi bi-bar-chart-steps" /> Timeline</Button>
        </ButtonGroup>
        <Button size="sm" variant="primary" onClick={() => setShowForm(true)}><i className="bi bi-plus-lg me-1" /> Add Task</Button>
      </div>

      {projectTasks.length === 0 ? (
        <EmptyState icon="bi-check2-square" title="No tasks yet" message="Add the first task or milestone for this project." actionLabel="Add Task" onAction={() => setShowForm(true)} />
      ) : view === 'list' ? (
        <DataTable columns={columns} rows={projectTasks} keyField={t => t.id} pageSize={10} />
      ) : view === 'board' ? (
        <div className="kanban-board">
          {boardColumns.map(col => (
            <div key={col.status} className="kanban-column">
              <div className="kanban-column-header"><span>{col.status}</span><span>{col.items.length}</span></div>
              {col.items.map(t => (
                <div key={t.id} className="kanban-card">
                  <div className="kanban-card-title">{t.isMilestone && <i className="bi bi-flag-fill text-primary me-1" />}{t.name}</div>
                  <div className="kanban-card-meta"><span>{t.assignee}</span><StatusBadge status={t.priority} /></div>
                  <div className="mt-2 d-flex justify-content-between align-items-center">
                    <span className={`small ${isOverdue(t.dueDate) && t.status !== 'Completed' ? 'text-danger fw-semibold' : 'text-secondary'}`}>{formatDate(t.dueDate)}</span>
                    <Form.Select
                      size="sm"
                      style={{ width: 120 }}
                      value={t.status}
                      onChange={e => updateTask(t.id, { status: e.target.value as ProjectTask['status'] })}
                    >
                      {STATUS_COLUMNS.map(s => <option key={s} value={s}>{s}</option>)}
                    </Form.Select>
                  </div>
                </div>
              ))}
              {col.items.length === 0 && <div className="text-secondary small text-center py-3">No tasks</div>}
            </div>
          ))}
        </div>
      ) : (
        <div className="section-card p-3">
          <div className="d-flex flex-column gap-2">
            {timelineSorted.map(t => (
              <div key={t.id} className="d-flex align-items-center gap-3 border-bottom pb-2">
                <div style={{ minWidth: 200 }} className="text-truncate small fw-semibold">
                  {t.isMilestone && <i className="bi bi-flag-fill text-primary me-1" />}{t.name}
                </div>
                <div className="flex-grow-1">
                  <div className="workspace-progress-track"><div className="workspace-progress-fill" style={{ width: `${t.progress}%` }} /></div>
                </div>
                <div style={{ minWidth: 190 }} className="small text-secondary text-end">
                  {formatDate(t.startDate)} → {formatDate(t.dueDate)}
                </div>
                <StatusBadge status={t.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal show={showForm} onHide={() => setShowForm(false)} centered>
        <Form onSubmit={handleAdd}>
          <Modal.Header closeButton><Modal.Title as="h5">Add Task</Modal.Title></Modal.Header>
          <Modal.Body>
            <Row className="g-3">
              <Col xs={12}>
                <Form.Group controlId={`fld-1`}>
                  <Form.Label className="form-required">Task Name</Form.Label>
                  <Form.Control required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </Form.Group>
              </Col>
              <Col xs={6}>
                <Form.Group controlId={`fld-2`}>
                  <Form.Label>Assigned To</Form.Label>
                  <Form.Select value={form.assignee} onChange={e => setForm(f => ({ ...f, assignee: e.target.value }))}>
                    {allUsers.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col xs={6}>
                <Form.Group controlId={`fld-3`}>
                  <Form.Label>Priority</Form.Label>
                  <Form.Select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as Priority }))}>
                    {(['Low', 'Medium', 'High', 'Critical'] as Priority[]).map(p => <option key={p} value={p}>{p}</option>)}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col xs={6}>
                <Form.Group controlId={`fld-4`}>
                  <Form.Label className="form-required">Start Date</Form.Label>
                  <Form.Control required type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
                </Form.Group>
              </Col>
              <Col xs={6}>
                <Form.Group controlId={`fld-5`}>
                  <Form.Label className="form-required">Due Date</Form.Label>
                  <Form.Control required type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
                </Form.Group>
              </Col>
              <Col xs={12}>
                <Form.Check
                  type="checkbox"
                  label="Mark as milestone"
                  checked={form.isMilestone}
                  onChange={e => setForm(f => ({ ...f, isMilestone: e.target.checked }))}
                />
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Add Task</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}
