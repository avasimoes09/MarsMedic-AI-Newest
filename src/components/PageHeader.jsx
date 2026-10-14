import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PageHeader({ title, subtitle, icon: Icon }) {
  const navigate = useNavigate();
  return (
    <div className="mb-6 flex items-center gap-4">
      <button onClick={() => navigate('/dashboard')} className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-700 bg-slate-800 text-slate-300 transition hover:bg-slate-700" aria-label="Back to dashboard">
        <ArrowLeft className="h-4 w-4" />
      </button>
      <div>
        <h1 className="flex items-center gap-2 text-xl font-semibold text-slate-100">
          {Icon && <Icon className="h-5 w-5 text-blue-400" />}
          {title}
        </h1>
        {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
      </div>
    </div>
  );
}