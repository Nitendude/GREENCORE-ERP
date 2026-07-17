import { useNavigate } from 'react-router-dom';
import Dropdown from 'react-bootstrap/Dropdown';
import Badge from 'react-bootstrap/Badge';
import { useAuth } from '../../store/AuthContext';
import { ALL_ROLES } from '../../utils/permissions';

// "View As" demo control: overlay any role and/or branch scope on top of the
// signed-in identity so you can see exactly what that role/branch would access.
export default function ViewAsMenu() {
  const navigate = useNavigate();
  const {
    branches, previewRole, previewBranchId, isPreviewing, effectiveRole,
    setPreviewRole, setPreviewBranchId, exitPreview,
  } = useAuth();

  return (
    <Dropdown align="end" autoClose="outside">
      <Dropdown.Toggle as="button" className={`topbar-viewas-btn ${isPreviewing ? 'active' : ''}`} aria-label="View as role or branch">
        <i className="bi bi-eyeglasses" />
        <span className="d-none d-lg-inline">View As</span>
        {isPreviewing && <span className="topbar-viewas-dot" />}
      </Dropdown.Toggle>
      <Dropdown.Menu className="viewas-menu">
        <div className="viewas-section-title">Preview role</div>
        {ALL_ROLES.map(role => (
          <button
            key={role}
            type="button"
            className={`viewas-option ${effectiveRole === role ? 'active' : ''}`}
            onClick={() => setPreviewRole(role === effectiveRole && previewRole ? null : role)}
          >
            <i className={`bi ${effectiveRole === role ? 'bi-check-circle-fill' : 'bi-circle'}`} />
            <span>{role}</span>
            {previewRole === role && <Badge bg="warning" text="dark">preview</Badge>}
          </button>
        ))}

        <Dropdown.Divider />
        <div className="viewas-section-title">Preview branch scope</div>
        <button
          type="button"
          className={`viewas-option ${!previewBranchId ? 'active' : ''}`}
          onClick={() => setPreviewBranchId(null)}
        >
          <i className={`bi ${!previewBranchId ? 'bi-check-circle-fill' : 'bi-circle'}`} />
          <span>Central system — all branches</span>
        </button>
        {branches.map(branch => (
          <button
            key={branch.id}
            type="button"
            className={`viewas-option ${previewBranchId === branch.id ? 'active' : ''}`}
            onClick={() => setPreviewBranchId(previewBranchId === branch.id ? null : branch.id)}
          >
            <i className={`bi ${previewBranchId === branch.id ? 'bi-check-circle-fill' : 'bi-circle'}`} />
            <span>{branch.name}</span>
            {branch.type === 'Headquarters' && <Badge bg="secondary">HQ</Badge>}
          </button>
        ))}

        <Dropdown.Divider />
        <div className="d-flex gap-2 px-2 pb-1">
          <button type="button" className="btn btn-sm btn-outline-secondary flex-grow-1" onClick={() => navigate('/access')}>
            <i className="bi bi-shield-lock me-1" /> Access map
          </button>
          <button type="button" className="btn btn-sm btn-outline-danger flex-grow-1" disabled={!isPreviewing} onClick={exitPreview}>
            <i className="bi bi-x-lg me-1" /> Exit
          </button>
        </div>
      </Dropdown.Menu>
    </Dropdown>
  );
}
