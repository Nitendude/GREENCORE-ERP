import Button from 'react-bootstrap/Button';

interface EmptyStateProps {
  icon?: string;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ icon = 'bi-inbox', title, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <i className={`bi ${icon} empty-state-icon`} aria-hidden="true" />
      <h6 className="mt-3 mb-1">{title}</h6>
      {message && <p className="text-secondary mb-3">{message}</p>}
      {actionLabel && onAction && (
        <Button variant="outline-primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
