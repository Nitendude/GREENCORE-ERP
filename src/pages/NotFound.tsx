import { Link } from 'react-router-dom';
import EmptyState from '../components/ui/EmptyState';

export default function NotFound() {
  return (
    <div className="d-flex justify-content-center pt-5">
      <div className="text-center">
        <EmptyState icon="bi-signpost-split" title="Page not found" message="The page you're looking for doesn't exist or has moved." />
        <Link to="/dashboard" className="btn btn-primary mt-2">Back to Dashboard</Link>
      </div>
    </div>
  );
}
