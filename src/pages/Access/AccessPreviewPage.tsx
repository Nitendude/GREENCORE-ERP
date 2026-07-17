import { Fragment, useState } from 'react';
import { flushSync } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Breadcrumbs from '../../components/layout/Breadcrumbs';
import { useAuth } from '../../store/AuthContext';
import { ALL_ROLES, PERMISSION_CATALOG, getPermissions, hasPermission } from '../../utils/permissions';
import type { Role } from '../../types';

export default function AccessPreviewPage() {
  const navigate = useNavigate();
  const { effectiveRole, previewRole, setPreviewRole } = useAuth();
  const [selectedRole, setSelectedRole] = useState<Role>(previewRole ?? effectiveRole);

  const selectedPerms = getPermissions(selectedRole);
  const navItems = PERMISSION_CATALOG[0].items;
  const allowedModules = navItems.filter(i => selectedPerms.includes(i.key));
  const totalPerms = PERMISSION_CATALOG.reduce((sum, g) => sum + g.items.length, 0);
  const grantedPerms = PERMISSION_CATALOG.reduce((sum, g) => sum + g.items.filter(i => selectedPerms.includes(i.key)).length, 0);

  const applyPreview = () => {
    // Apply the role, then redirect to the universally-accessible dashboard.
    // Using replace so the transient guard bounce never lingers in history.
    flushSync(() => setPreviewRole(selectedRole));
    navigate('/dashboard', { replace: true });
  };

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Access Preview' }]} />
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mt-2 mb-2">
        <div>
          <h4 className="fw-bold mb-1">Role &amp; Access Preview</h4>
          <p className="text-secondary small mb-0">See what every role can access, then preview the system through that role's permissions.</p>
        </div>
      </div>

      <Row className="g-3 mb-3">
        <Col xs={12} lg={4}>
          <div className="section-card p-3 h-100">
            <h6 className="fw-bold mb-2">Choose a role</h6>
            <Form.Select value={selectedRole} onChange={e => setSelectedRole(e.target.value as Role)} className="mb-3">
              {ALL_ROLES.map(role => <option key={role} value={role}>{role}</option>)}
            </Form.Select>

            <div className="access-summary mb-3">
              <div className="d-flex justify-content-between small mb-1">
                <span className="text-secondary">Permissions granted</span>
                <span className="fw-semibold">{grantedPerms} / {totalPerms}</span>
              </div>
              <div className="workspace-progress-track"><div className="workspace-progress-fill" style={{ width: `${(grantedPerms / totalPerms) * 100}%` }} /></div>
            </div>

            <div className="small text-secondary mb-1">Modules this role can open</div>
            <div className="d-flex flex-wrap gap-1 mb-3">
              {allowedModules.length ? allowedModules.map(m => (
                <span key={m.key} className="badge text-bg-light border">{m.label}</span>
              )) : <span className="text-secondary small">No modules</span>}
            </div>

            <Button variant="primary" className="w-100" onClick={applyPreview}>
              <i className="bi bi-eyeglasses me-1" /> Preview as {selectedRole}
            </Button>
            <Form.Text>Applies this role's permissions across the app (nav, actions, and route guards) until you exit the preview.</Form.Text>
          </div>
        </Col>

        <Col xs={12} lg={8}>
          <div className="section-card p-3 h-100">
            <h6 className="fw-bold mb-2">{selectedRole} — access detail</h6>
            {PERMISSION_CATALOG.map(group => (
              <div key={group.group} className="mb-3">
                <div className="access-group-title"><i className={`bi ${group.icon} me-2`} />{group.group}</div>
                <div className="access-perm-grid">
                  {group.items.map(item => {
                    const granted = selectedPerms.includes(item.key);
                    return (
                      <div key={item.key} className={`access-perm ${granted ? 'granted' : 'denied'}`}>
                        <i className={`bi ${granted ? 'bi-check-circle-fill' : 'bi-x-circle'}`} />
                        <span>{item.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Col>
      </Row>

      <div className="section-card p-3">
        <h6 className="fw-bold mb-2">Full role comparison matrix</h6>
        <p className="text-secondary small">Every role against every permission. Columns highlight the role selected above.</p>
        <div className="table-responsive-wrapper">
          <table className="table app-table access-matrix mb-0">
            <thead>
              <tr>
                <th>Permission</th>
                {ALL_ROLES.map(role => (
                  <th key={role} className={`text-center ${role === selectedRole ? 'access-col-active' : ''}`}>
                    <span className="access-role-head">{role}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSION_CATALOG.map(group => (
                <Fragment key={group.group}>
                  <tr className="access-group-row">
                    <td colSpan={ALL_ROLES.length + 1}><i className={`bi ${group.icon} me-2`} />{group.group}</td>
                  </tr>
                  {group.items.map(item => (
                    <tr key={item.key}>
                      <td className="access-perm-name">{item.label}</td>
                      {ALL_ROLES.map(role => {
                        const granted = hasPermission(role, item.key);
                        return (
                          <td key={role} className={`text-center ${role === selectedRole ? 'access-col-active' : ''}`}>
                            {granted
                              ? <i className="bi bi-check-lg text-success" aria-label="granted" />
                              : <span className="access-dash" aria-label="not granted">—</span>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
