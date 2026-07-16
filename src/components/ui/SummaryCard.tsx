import Card from 'react-bootstrap/Card';
import { Link } from 'react-router-dom';

interface SummaryCardProps {
  label: string;
  value: string | number;
  icon: string;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'secondary';
  to?: string;
  hint?: string;
}

export default function SummaryCard({ label, value, icon, variant = 'primary', to, hint }: SummaryCardProps) {
  const content = (
    <Card className="summary-card h-100">
      <Card.Body className="d-flex align-items-start gap-3">
        <div className={`summary-card-icon bg-${variant}-subtle text-${variant}`}>
          <i className={`bi ${icon}`} aria-hidden="true" />
        </div>
        <div className="flex-grow-1 min-w-0">
          <div className="summary-card-value">{value}</div>
          <div className="summary-card-label">{label}</div>
          {hint && <div className="summary-card-hint">{hint}</div>}
        </div>
      </Card.Body>
    </Card>
  );

  if (to) {
    return (
      <Link to={to} className="summary-card-link" aria-label={`${label}: ${value}`}>
        {content}
      </Link>
    );
  }
  return content;
}
