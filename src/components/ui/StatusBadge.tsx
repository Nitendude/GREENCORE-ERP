import Badge from 'react-bootstrap/Badge';

// Maps every status/priority/health value used across the app to a Bootstrap
// variant + icon so meaning never relies on color alone.
const STATUS_MAP: Record<string, { variant: string; icon: string }> = {
  // Project statuses
  Planning: { variant: 'secondary', icon: 'bi-signpost-2' },
  Mobilization: { variant: 'info', icon: 'bi-truck' },
  'In Progress': { variant: 'primary', icon: 'bi-arrow-repeat' },
  'On Hold': { variant: 'warning', icon: 'bi-pause-circle' },
  Delayed: { variant: 'danger', icon: 'bi-exclamation-triangle' },
  'For Inspection': { variant: 'info', icon: 'bi-search' },
  Completed: { variant: 'success', icon: 'bi-check-circle' },
  Closed: { variant: 'dark', icon: 'bi-lock' },
  Cancelled: { variant: 'danger', icon: 'bi-x-circle' },
  // Bid stages
  'Lead / Opportunity': { variant: 'secondary', icon: 'bi-lightbulb' },
  'For Review': { variant: 'info', icon: 'bi-eyeglasses' },
  'Go/No-Go Decision': { variant: 'info', icon: 'bi-signpost-split' },
  'Preparing Requirements': { variant: 'info', icon: 'bi-clipboard-check' },
  'Cost Estimation': { variant: 'primary', icon: 'bi-calculator' },
  'Internal Review': { variant: 'primary', icon: 'bi-people' },
  'For Approval': { variant: 'warning', icon: 'bi-hourglass-split' },
  'Ready for Submission': { variant: 'primary', icon: 'bi-send' },
  Submitted: { variant: 'primary', icon: 'bi-envelope-check' },
  'Under Evaluation': { variant: 'info', icon: 'bi-search' },
  Negotiation: { variant: 'warning', icon: 'bi-chat-left-text' },
  Awarded: { variant: 'success', icon: 'bi-trophy' },
  Lost: { variant: 'danger', icon: 'bi-x-circle' },
  Withdrawn: { variant: 'dark', icon: 'bi-arrow-return-left' },
  // Generic / task / doc / PO statuses
  'Not Started': { variant: 'secondary', icon: 'bi-dash-circle' },
  Blocked: { variant: 'danger', icon: 'bi-slash-circle' },
  Pending: { variant: 'warning', icon: 'bi-hourglass-split' },
  Approved: { variant: 'success', icon: 'bi-check-circle' },
  Rejected: { variant: 'danger', icon: 'bi-x-circle' },
  Requested: { variant: 'secondary', icon: 'bi-inbox' },
  Ordered: { variant: 'primary', icon: 'bi-box-seam' },
  Delivered: { variant: 'success', icon: 'bi-check-circle' },
  Draft: { variant: 'secondary', icon: 'bi-pencil' },
  Sent: { variant: 'info', icon: 'bi-send' },
  Negotiating: { variant: 'warning', icon: 'bi-chat-left-text' },
  Won: { variant: 'success', icon: 'bi-trophy' },
  'In Review': { variant: 'warning', icon: 'bi-chat-square-text' },
  'Ready to Submit': { variant: 'info', icon: 'bi-send-check' },
  Open: { variant: 'danger', icon: 'bi-exclamation-circle' },
  Mitigated: { variant: 'info', icon: 'bi-shield-check' },
  // Health / priority
  Good: { variant: 'success', icon: 'bi-check-circle' },
  Watch: { variant: 'warning', icon: 'bi-eye' },
  Critical: { variant: 'danger', icon: 'bi-exclamation-triangle' },
  Low: { variant: 'secondary', icon: 'bi-arrow-down' },
  Medium: { variant: 'info', icon: 'bi-dash' },
  High: { variant: 'warning', icon: 'bi-arrow-up' },
  // Milestones
  Upcoming: { variant: 'secondary', icon: 'bi-calendar' },
  'Due Soon': { variant: 'warning', icon: 'bi-alarm' },
  Overdue: { variant: 'danger', icon: 'bi-exclamation-triangle' },
};

export default function StatusBadge({ status, subtle = false }: { status: string; subtle?: boolean }) {
  const meta = STATUS_MAP[status] || { variant: 'secondary', icon: 'bi-circle' };
  return (
    <Badge
      bg={subtle ? undefined : meta.variant}
      className={subtle ? `status-badge-subtle status-badge-${meta.variant}` : 'status-badge'}
      pill
    >
      <i className={`bi ${meta.icon}`} aria-hidden="true" />
      <span>{status}</span>
    </Badge>
  );
}
