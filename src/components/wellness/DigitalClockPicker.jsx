import { pad2 } from '@/lib/wellnessData';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

// Selectable digital clock: big read-out on top, tap an hour / minute below.
export default function DigitalClockPicker({ label, icon: Icon, value, onChange, accent = 'blue' }) {
  const [h, m] = value.split(':').map(Number);
  const setH = (nh) => onChange(`${pad2(nh)}:${pad2(m)}`);
  const setM = (nm) => onChange(`${pad2(h)}:${pad2(nm)}`);

  const readout = accent === 'amber' ? 'text-amber-300' : 'text-blue-300';
  const activeCls = accent === 'amber'
    ? 'border-amber-500 bg-amber-950/60 text-amber-200'
    : 'border-blue-500 bg-blue-950/60 text-blue-200';
  const idleCls = 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-600 hover:text-slate-200';

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
      <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
        {Icon && <Icon className="h-4 w-4 text-slate-500" />}
        {label}
      </div>
      <div className={`my-3 text-center font-mono text-4xl font-bold tracking-[0.15em] ${readout}`}>
        {pad2(h)}:{pad2(m)}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Hour</div>
          <div className="grid grid-cols-6 gap-1">
            {HOURS.map((hh) => (
              <button
                key={hh}
                type="button"
                onClick={() => setH(hh)}
                className={`rounded border py-1 font-mono text-[11px] transition ${hh === h ? activeCls : idleCls}`}
              >
                {pad2(hh)}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Minute</div>
          <div className="grid grid-cols-4 gap-1">
            {MINUTES.map((mm) => (
              <button
                key={mm}
                type="button"
                onClick={() => setM(mm)}
                className={`rounded border py-1 font-mono text-[11px] transition ${mm === m ? activeCls : idleCls}`}
              >
                {pad2(mm)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}