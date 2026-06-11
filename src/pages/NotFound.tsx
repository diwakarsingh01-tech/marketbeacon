import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <SEO title="Page Not Found" description="The page you're looking for doesn't exist." />
      <div className="mb-6">
        <span className="text-7xl font-black text-slate-200">404</span>
      </div>
      <h1 className="mb-2 text-xl font-semibold text-slate-800">Page Not Found</h1>
      <p className="mb-8 max-w-md text-sm text-slate-500">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => navigate(-1)}
          className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:outline-none"
        >
          Go Back
        </button>
        <button
          onClick={() => navigate('/')}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:outline-none"
        >
          Home
        </button>
      </div>
    </div>
  );
}
