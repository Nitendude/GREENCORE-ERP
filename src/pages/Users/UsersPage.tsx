import { useState } from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Breadcrumbs from '../../components/layout/Breadcrumbs';
import DataTable, { type Column } from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import { useData } from '../../store/DataContext';
import { useAuth } from '../../store/AuthContext';
import { genId } from '../../utils/format';
import type { User, Role } from '../../types';

const ROLES: Role[] = [
  'Administrator', 'Management', 'Project Manager', 'Bidding Manager',
  'Estimator', 'Finance', 'Procurement', 'Project Staff', 'Viewer',
];
const COLORS = ['#2f6f4e', '#8a4b9c', '#1f6fa8', '#c0722a', '#a13e5c', '#3a7d7d', '#6b5b3e', '#4a5a8c', '#5c8a3a', '#9c5b4b'];

export default function UsersPage() {
  const { users, addUser, updateUser } = useData();
  const { can } = useAuth();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: 'Project Staff' as Role, title: '', phone: '' });

  const canManage = can('users.manage');

  const filtered = users.filter(u =>
    (!roleFilter || u.role === roleFilter) &&
    (!search.trim() || u.name.toLowerCase().includes(search.trim().toLowerCase()) || u.email.toLowerCase().includes(search.trim().toLowerCase())));

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;
    addUser({
      id: genId('u'), name: form.name, email: form.email, role: form.role, title: form.title,
      phone: form.phone, avatarColor: COLORS[users.length % COLORS.length], active: true,
    });
    setShowForm(false);
    setForm({ name: '', email: '', role: 'Project Staff', title: '', phone: '' });
  };

  const columns: Column<User>[] = [
    { key: 'name', label: 'Name', sortable: true, accessor: u => u.name, render: u => (
      <div className="d-flex align-items-center gap-2">
        <span className="avatar-circle avatar-circle-sm" style={{ background: u.avatarColor }}>{u.name.split(' ').map(p => p[0]).join('').slice(0, 2)}</span>
        <span className="fw-semibold">{u.name}</span>
      </div>
    ) },
    { key: 'email', label: 'Email', accessor: u => u.email },
    { key: 'title', label: 'Title', accessor: u => u.title || '—' },
    { key: 'role', label: 'Role', render: u => canManage ? (
      <Form.Select size="sm" style={{ width: 160 }} value={u.role} onChange={e => updateUser(u.id, { role: e.target.value as Role })}>
        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
      </Form.Select>
    ) : <span>{u.role}</span> },
    { key: 'status', label: 'Status', render: u => <StatusBadge status={u.active ? 'Approved' : 'Rejected'} /> },
    ...(canManage ? [{
      key: 'actions', label: 'Actions', render: (u: User) => (
        <Button size="sm" variant={u.active ? 'outline-danger' : 'outline-success'} onClick={() => updateUser(u.id, { active: !u.active })}>
          {u.active ? 'Deactivate' : 'Activate'}
        </Button>
      ),
    } as Column<User>] : []),
  ];

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Users' }]} />
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mt-2 mb-3">
        <h4 className="fw-bold mb-0">Users & Roles</h4>
        {canManage && <Button variant="primary" onClick={() => setShowForm(true)}><i className="bi bi-plus-lg me-1" /> Add User</Button>}
      </div>

      <div className="section-card p-3 mb-3">
        <Row className="g-2 align-items-end">
          <Col xs={12} md={6}>
            <Form.Label className="small mb-1">Search</Form.Label>
            <Form.Control placeholder="Name or email..." value={search} onChange={e => setSearch(e.target.value)} />
          </Col>
          <Col xs={12} md={4}>
            <Form.Label className="small mb-1">Role</Form.Label>
            <Form.Select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
              <option value="">All roles</option>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </Form.Select>
          </Col>
        </Row>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="bi-people" title="No users found" />
      ) : (
        <DataTable columns={columns} rows={filtered} keyField={u => u.id} pageSize={12} />
      )}

      <Modal show={showForm} onHide={() => setShowForm(false)} centered>
        <Form onSubmit={handleAdd}>
          <Modal.Header closeButton><Modal.Title as="h5">Add User</Modal.Title></Modal.Header>
          <Modal.Body>
            <Row className="g-3">
              <Col xs={12}>
                <Form.Group controlId={`fld-1`}>
                  <Form.Label className="form-required">Full Name</Form.Label>
                  <Form.Control required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </Form.Group>
              </Col>
              <Col xs={12}>
                <Form.Group controlId={`fld-2`}>
                  <Form.Label className="form-required">Email</Form.Label>
                  <Form.Control required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </Form.Group>
              </Col>
              <Col xs={6}>
                <Form.Group controlId={`fld-3`}>
                  <Form.Label>Role</Form.Label>
                  <Form.Select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as Role }))}>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col xs={6}>
                <Form.Group controlId={`fld-4`}>
                  <Form.Label>Title</Form.Label>
                  <Form.Control value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                </Form.Group>
              </Col>
              <Col xs={12}>
                <Form.Group controlId={`fld-5`}>
                  <Form.Label>Phone</Form.Label>
                  <Form.Control value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Add User</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}
