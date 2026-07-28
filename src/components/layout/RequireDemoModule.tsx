import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useDemoConfig } from '../../store/DemoConfigContext';

export default function RequireDemoModule({ moduleId, children }: { moduleId: string; children: ReactNode }) {
  const { isModuleEnabled } = useDemoConfig();

  if (isModuleEnabled(moduleId)) return children;

  return (
    <div className="section-card p-5 text-center">
      <div className="display-6 text-secondary mb-3"><i className="bi bi-toggle-off" /></div>
      <h4>This module is hidden in the current demo</h4>
      <p className="text-secondary mb-3">An employee removed it from the prototype scope in Demo Workshop.</p>
      <Link className="btn btn-primary" to="/workshop">Open Demo Workshop</Link>
    </div>
  );
}
