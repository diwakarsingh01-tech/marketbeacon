import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <SEO title="Page Not Found" description="The page you're looking for doesn't exist." />
      <div className="mb-6">
        <span className="text-7xl font-bold text-[var(--text-tertiary)]">404</span>
      </div>
      <h1 className="mb-2 text-xl font-semibold text-[var(--text-primary)]">Page Not Found</h1>
      <p className="mb-8 max-w-md text-sm text-[var(--text-muted)]">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => navigate(-1)}
          className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-5 py-2.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-tertiary)] focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:outline-none"
        >
          Go Back
        </button>
        <button
          onClick={() => navigate('/')}
          className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 px-5 py-2.5 text-sm font-medium text-white transition-colors focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:outline-none shadow-lg shadow-blue-500/20"
        >
          Home
        </button>
      </div>
    </div>
  );
}
