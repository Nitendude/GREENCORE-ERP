import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { useAuth } from '../../store/AuthContext';

export default function LoginPage() {
  const { allUsers, isAuthenticated, login } = useAuth();
  const [email, setEmail] = useState(allUsers[0]?.email ?? '');
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const destination = (location.state as { from?: string } | null)?.from ?? '/dashboard';

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!login(email, accessCode)) {
      setError('The employee email or demo access code is incorrect.');
      return;
    }
    navigate(destination, { replace: true });
  };

  return (
    <main className="access-page">
      <section className="access-card">
        <div className="access-brand-mark"><i className="bi bi-buildings" /></div>
        <div className="text-uppercase small fw-bold text-primary mb-2">Private discovery prototype</div>
        <h1 className="h3 fw-bold mb-2">Greencore ERP Demo</h1>
        <p className="text-secondary mb-4">Employee access only. Use this workspace to explore workflows and agree on scope before development.</p>

        {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Employee</Form.Label>
            <Form.Select value={email} onChange={event => setEmail(event.target.value)}>
              {allUsers.filter(user => user.active).map(user => (
                <option key={user.id} value={user.email}>{user.name} — {user.role}</option>
              ))}
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Demo access code</Form.Label>
            <Form.Control
              type="password"
              value={accessCode}
              onChange={event => setAccessCode(event.target.value)}
              autoComplete="current-password"
              required
            />
          </Form.Group>
          <Button type="submit" className="w-100">Enter private demo</Button>
        </Form>

        <div className="access-security-note">
          <i className="bi bi-shield-lock me-2" />
          Client links are separate, read-only, project-scoped, and expire automatically.
        </div>
      </section>
    </main>
  );
}
