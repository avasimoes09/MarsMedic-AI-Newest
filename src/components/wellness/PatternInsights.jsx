// Summarizes wellness patterns and lets patients save or dismiss insights.
import { Activity, Save, Trash2, AlertTriangle, Eye, Info, CheckCircle2 } from 'lucide-react';
import { SLEEP_TARGET, fmtDuration } from '@/lib/wellnessPatterns';

const STATUS = {
  attention: { label: 'Attention', cls: 'border-red-700 bg-red-950/50 text-red-300' },
  watch: { label: 'Watch', cls: 'border-amber-700 bg-amber-950/50 text-amber-300' },
  stable: { label: 'Stable', cls: 'border-emerald-700 bg-emerald-950/50 text-emerald-300' },
  insufficient: { label: 'Building baseline', cls: 'border-slate-700 bg-slate-800 text-slate-300' },
};

const SEVERITY = {
  alert: { icon: AlertTriangle, icon_cls: 'text-red-400', box_cls: 'border-red-900/70 bg-red-950/20' },
  watch: { icon: Eye, icon_cls: 'text-amber-400', box_cls: 'border-amber-900/70 bg-amber-950/20' },
  info: { icon: Info, icon_cls: 'text-blue-400', box_cls: 'border-slate-800 bg-slate-900/60' },
};

export default function PatternInsights({ analysis, saved, onSave, onDelete, busy, crewName }) {
  const status = STATUS[analysis.status] || STATUS.insufficient;
  const m = analysis.metrics;

  const tiles = [
    { label: 'Avg sleep', value: m.avgSleep !== null ? `${m.avgSleep} h` : '—', hint: `target ${SLEEP_TARGET} h` },
    { label: 'Sleep debt', value: m.sleepDebt !== null ? `${m.sleepDebt} h` : '—', hint: 'last 7 nights' },
    { label: 'Bedtime spread', value: m.spread > 0 ? fmtDuration(m.spread) : '—', hint: 'timing consistency' },
    { label: 'Food / day', value: m.mealsPerDay !== null ? m.mealsPerDay : '—', hint: `${m.mealCount} entries logged` },
  ];

  const save = () => onSave({
    status: analysis.status,
    headline: analysis.headline,
    summary: analysis.summary,
    avg_sleep: m.avgSleep ?? 0,
    sleep_debt: m.sleepDebt ?? 0,
    bedtime_spread: m.spread ?? 0,
    entries_analyzed: (m.nights || 0) + (m.mealCount || 0),
    patterns: analysis.patterns.map((p) => `${p.severity.toUpperCase()} · ${p.title} — ${p.detail}`),
    recommendations: analysis.recommendations,
  });

  return (
    <div className="panel p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-blue-400" />
          <span className="text-sm font-semibold text-slate-100">Pattern Insights</span>
        </div>
        <span className={`chip ${status.cls}`}>{status.label}</span>
      </div>

      <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
        <div className="text-base font-semibold text-slate-100">{analysis.headline}</div>
        <p className="mt-1 text-xs leading-relaxed text-slate-400">{analysis.summary}</p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-lg border border-slate-800 bg-slate-900 p-3">
            <div className="text-[11px] uppercase tracking-wide text-slate-500">{t.label}</div>
            <div className="mt-1 font-mono text-lg font-bold text-slate-100">{t.value}</div>
            <div className="text-[11px] text-slate-500">{t.hint}</div>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div>
          <div className="mb-2 text-xs font-medium text-slate-400">Patterns detected</div>
          <ul className="space-y-2">
            {analysis.patterns.map((p) => {
              const s = SEVERITY[p.severity] || SEVERITY.info;
              const Icon = s.icon;
              return (
                <li key={p.title} className={`flex gap-3 rounded-lg border p-3 ${s.box_cls}`}>
                  <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${s.icon_cls}`} />
                  <div>
                    <div className="text-sm font-medium text-slate-100">{p.title}</div>
                    <p className="text-[12px] leading-relaxed text-slate-400">{p.detail}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
        <div>
          <div className="mb-2 text-xs font-medium text-slate-400">What to do about it</div>
          <ul className="space-y-2">
            {analysis.recommendations.map((r) => (
              <li key={r} className="flex gap-3 rounded-lg border border-slate-800 bg-slate-900 p-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                <span className="text-[12px] leading-relaxed text-slate-300">{r}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button onClick={save} disabled={busy} className="btn-mission disabled:opacity-60">
          <Save className="h-4 w-4" /> Save to Crew Profile
        </button>
        <span className="text-xs text-slate-500">
          {saved.length > 0
            ? `${saved.length} saved${crewName ? ` for ${crewName}` : ''} · latest ${saved[0].generated_on}`
            : `Stores this analysis on ${crewName || 'the crew'}'s profile so it can be reviewed later.`}
        </span>
      </div>

      {saved.length > 0 && (
        <div className="mt-4">
          <div className="mb-2 text-xs font-medium text-slate-400">Saved analyses</div>
          <ul className="space-y-2">
            {saved.slice(0, 5).map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 rounded-md border border-slate-800 bg-slate-900 px-3 py-2">
                <div>
                  <div className="text-sm text-slate-200">{s.headline}</div>
                  <div className="text-[11px] text-slate-500">{s.generated_on} · {s.status}</div>
                </div>
                <button onClick={() => onDelete(s.id)} className="text-slate-500 transition hover:text-red-400">
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}