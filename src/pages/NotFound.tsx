import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center bg-white">
      <SEO title="Page Not Found" description="The page you're looking for doesn't exist." />
      <div className="mb-6">
        <span className="text-7xl font-black text-slate-300 italic tracking-tighter">404</span>
      </div>
      <h1 className="mb-2 text-2xl font-black text-slate-900 uppercase italic">Page Not Found</h1>
      <p className="mb-8 max-w-md text-xs text-slate-500 font-bold uppercase tracking-wider">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => navigate(-1)}
          className="rounded-xl border border-slate-200 bg-slate-50 px-6 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider hover:bg-slate-100 transition-colors focus-visible:outline-none"
        >
          Go Back
        </button>
        <button
          onClick={() => navigate('/')}
          className="rounded-xl bg-[#00d09c] hover:bg-[#00bda0] px-6 py-3 text-xs font-bold text-white uppercase tracking-wider transition-colors shadow-md shadow-[#00d09c]/15 focus-visible:outline-none"
        >
          Return Home
        </button>
      </div>
    </div>
  );
}
