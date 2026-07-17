import { useAuth } from '../../store/AuthContext';

// Persistent banner shown whenever a "View As" preview overlay is active, so it's
// always obvious the current view isn't your real identity/branch scope.
export default function PreviewBanner() {
  const { isPreviewing, previewRole, effectiveBranch, previewBranchId, branches, currentUser, exitPreview } = useAuth();
  if (!isPreviewing) return null;

  const previewBranch = previewBranchId ? branches.find(b => b.id === previewBranchId) : null;
  const parts: string[] = [];
  if (previewRole) parts.push(`role “${previewRole}”`);
  if (previewBranch) {
    parts.push(previewBranch.type === 'Headquarters'
      ? `${previewBranch.name} (central system — all branches)`
      : `${previewBranch.name} scope`);
  }

  return (
    <div className="preview-banner" role="status">
      <i className="bi bi-eyeglasses" aria-hidden="true" />
      <span className="preview-banner-text">
        Previewing as {parts.join(' · ')}.{' '}
        <span className="d-none d-sm-inline">
          {effectiveBranch ? 'Data is scoped to this branch. ' : ''}
          You are signed in as {currentUser.name}.
        </span>
      </span>
      <button type="button" className="preview-banner-exit" onClick={exitPreview}>
        <i className="bi bi-x-lg me-1" /> Exit preview
      </button>
    </div>
  );
}
