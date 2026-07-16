import { Link } from 'react-router-dom';
import EmptyState from '../components/ui/EmptyState';

export default function Forbidden() {
  return (
    <div className="d-flex justify-content-center pt-5">
      <div className="text-center">
        <EmptyState
          icon="bi-shield-lock"
          title="Access restricted"
          message="Your current role doesn't have permission to view this module. Switch roles from the top-right menu to explore other views."
        />
        <Link to="/dashboard" className="btn btn-primary mt-2">Back to Dashboard</Link>
      </div>
    </div>
  );
}
