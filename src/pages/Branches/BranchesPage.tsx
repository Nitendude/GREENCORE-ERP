import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Alert from 'react-bootstrap/Alert';
import Breadcrumbs from '../../components/layout/Breadcrumbs';
import SummaryCard from '../../components/ui/SummaryCard';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import BranchFormModal from './BranchFormModal';
import { useData } from '../../store/DataContext';
import { useAuth } from '../../store/AuthContext';
import { formatCompactCurrency, formatDate } from '../../utils/format';
import type { Branch } from '../../types';

export default function BranchesPage() {
  const { branches, projects, bids, users } = useData();
  const { can, setPreviewBranchId, previewBranchId } = useAuth();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);

  const canManage = can('branches.manage');

  const rollups = useMemo(() => {
    const map = new Map<string, { projects: number; bids: number; users: number; contractValue: number }>();
    for (const branch of branches) {
      const branchProjects = projects.filter(p => p.branchId === branch.id);
      map.set(branch.id, {
        projects: branchProjects.length,
        bids: bids.filter(b => b.branchId === branch.id).length,
        users: users.filter(u => u.branchId === branch.id).length,
        contractValue: branchProjects.reduce((sum, p) => sum + p.contractValue, 0),
      });
    }
    return map;
  }, [branches, projects, bids, users]);

  const totalContractValue = projects.reduce((sum, p) => sum + p.contractValue, 0);
  const activeCount = branches.filter(b => b.status === 'Active').length;

  const previewBranch = (branch: Branch) => {
    setPreviewBranchId(branch.id);
    navigate('/dashboard');
  };

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Branches' }]} />
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mt-2 mb-2">
        <div>
          <h4 className="fw-bold mb-1">Branches</h4>
          <p className="text-secondary small mb-0">This ERP instance is the central system. Add branch offices and preview exactly what each branch sees.</p>
        </div>
        {canManage && (
          <Button variant="primary" onClick={() => { setEditing(null); setShowForm(true); }}>
            <i className="bi bi-plus-lg me-1" /> Add Branch
          </Button>
        )}
      </div>

      <Alert variant="light" className="border small d-flex gap-2 align-items-start">
        <i className="bi bi-diagram-3 fs-5 text-primary" />
        <div>
          <strong>Central system model.</strong> Headquarters sees data across every branch. Each branch office sees only
          its own projects, bids, and team. Use <em>Preview branch</em> to open the system exactly as that branch's users would.
        </div>
      </Alert>

      <Row className="g-3 my-1">
        <Col xs={12} sm={6} lg={3}><SummaryCard label="Total Branches" value={branches.length} icon="bi-diagram-3" variant="primary" /></Col>
        <Col xs={12} sm={6} lg={3}><SummaryCard label="Active" value={activeCount} icon="bi-check-circle" variant="success" /></Col>
        <Col xs={12} sm={6} lg={3}><SummaryCard label="Headquarters" value={branches.filter(b => b.type === 'Headquarters').length} icon="bi-building" variant="info" /></Col>
        <Col xs={12} sm={6} lg={3}><SummaryCard label="Combined Contract Value" value={formatCompactCurrency(totalContractValue)} icon="bi-cash-stack" variant="secondary" /></Col>
      </Row>

      {branches.length === 0 ? (
        <EmptyState icon="bi-diagram-3" title="No branches yet" message="Add your first branch office to scope projects and teams." />
      ) : (
        <Row className="g-3">
          {branches.map(branch => {
            const stats = rollups.get(branch.id)!;
            const isPreviewing = previewBranchId === branch.id;
            return (
              <Col xs={12} md={6} lg={4} key={branch.id}>
                <Card className={`section-card h-100 branch-card ${isPreviewing ? 'branch-card-active' : ''}`}>
                  <Card.Body className="d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div className="min-w-0">
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                          <span className={`branch-type-badge ${branch.type === 'Headquarters' ? 'hq' : ''}`}>
                            <i className={`bi ${branch.type === 'Headquarters' ? 'bi-building-fill-gear' : 'bi-geo-alt-fill'}`} />
                          </span>
                          <div className="min-w-0">
                            <div className="fw-bold text-truncate">{branch.name}</div>
                            <div className="text-secondary small">{branch.code} · {branch.location}</div>
                          </div>
                        </div>
                      </div>
                      <StatusBadge status={branch.status === 'Active' ? 'Approved' : 'Rejected'} />
                    </div>

                    {branch.type === 'Headquarters' && (
                      <span className="badge text-bg-light border align-self-start mb-2"><i className="bi bi-hdd-network me-1" />Central system · sees all branches</span>
                    )}

                    <div className="branch-stat-row mb-2">
                      <div><span className="branch-stat-value">{stats.projects}</span><span className="branch-stat-label">Projects</span></div>
                      <div><span className="branch-stat-value">{stats.bids}</span><span className="branch-stat-label">Bids</span></div>
                      <div><span className="branch-stat-value">{stats.users}</span><span className="branch-stat-label">Team</span></div>
                    </div>

                    <dl className="branch-meta mb-3">
                      <div><dt>Manager</dt><dd>{branch.manager}</dd></div>
                      <div><dt>Contract Value</dt><dd>{formatCompactCurrency(stats.contractValue)}</dd></div>
                      <div><dt>Established</dt><dd>{formatDate(branch.established)}</dd></div>
                      <div><dt>Contact</dt><dd className="text-truncate">{branch.email || '—'}</dd></div>
                    </dl>

                    <div className="mt-auto d-flex gap-2">
                      <Button size="sm" variant={isPreviewing ? 'success' : 'outline-primary'} className="flex-grow-1" onClick={() => previewBranch(branch)}>
                        <i className="bi bi-eyeglasses me-1" />{isPreviewing ? 'Previewing' : 'Preview branch'}
                      </Button>
                      {canManage && (
                        <Button size="sm" variant="outline-secondary" onClick={() => { setEditing(branch); setShowForm(true); }} aria-label={`Edit ${branch.name}`}>
                          <i className="bi bi-pencil" />
                        </Button>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      <BranchFormModal show={showForm} branch={editing} onClose={() => setShowForm(false)} />
    </div>
  );
}
