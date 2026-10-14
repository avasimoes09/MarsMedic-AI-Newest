import { useMission } from '@/lib/MissionContext';
import PageHeader from '@/components/PageHeader';
import { FileText } from 'lucide-react';

export default function CommanderView() {
  const { effectiveCrew, clearCrewConditions } = useMission();
  const avg = effectiveCrew.length ? Math.round(effectiveCrew.reduce((a, c) => a + c.score, 0) / effectiveCrew.length) : 0;
  const dotClass = (s) => (s === 'green' ? 'bg-emerald-500' : s === 'yellow' ? 'bg-amber-500' : 'bg-red-500');
  const tone = (s) => (s === 'green' ? 'text-emerald-400' : s === 'yellow' ? 'text-amber-400' : 'text-red-400');
  const overall = avg >= 80 ? 'GREEN · OPERATIONAL' : avg >= 60 ? 'YELLOW · MONITOR' : 'RED · MEDICAL REVIEW';

  return (
    <div>
      <PageHeader title="Mission Commander View" subtitle="Crew medical readiness" icon={FileText} />
      <div className="panel panel-glow mb-4 p-5">
        <div className="text-xs font-medium text-slate-400">Overall Crew Readiness</div>
        <div className="flex items-end gap-2">
          <span className={`font-mono text-4xl font-bold ${avg >= 80 ? 'text-emerald-400' : avg >= 60 ? 'text-amber-400' : 'text-red-400'}`}>{avg}</span>
          <span className="mb-1 text-slate-500">/100</span>
        </div>
        <div className={`mt-1 text-sm font-semibold ${avg >= 80 ? 'text-emerald-300' : avg >= 60 ? 'text-amber-300' : 'text-red-300'}`}>{overall}</div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {effectiveCrew.map((c) => (
          <div key={c.id} className="panel p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-800 text-sm font-bold text-slate-300">{c.initials}</div>
                <div><div className="font-semibold text-slate-100">{c.name}</div><div className="text-xs text-slate-400">{c.role}</div></div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-block h-2.5 w-2.5 rounded-full ${dotClass(c.status)}`} />
                <div className={`text-xs font-medium ${tone(c.status)}`}>{c.statusLabel}</div>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className={`font-mono text-lg font-bold ${tone(c.status)}`}>{c.score}/100</div>
              {c.conditions?.length > 0 && (
                <button onClick={() => clearCrewConditions(c.id)} className="text-xs text-slate-400 hover:text-slate-200">Clear conditions ({c.conditions.length})</button>
              )}
            </div>
            {c.conditions?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {c.conditions.map((cond) => (
                  <span key={cond.id} className="chip border-slate-700 bg-slate-800 text-slate-300">−{cond.penalty} · {cond.name}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}