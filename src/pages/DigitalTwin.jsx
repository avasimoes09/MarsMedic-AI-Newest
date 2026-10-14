import { useNavigate } from 'react-router-dom';
import { useMission } from '@/lib/MissionContext';
import PageHeader from '@/components/PageHeader';
import { Heart, Bone, Eye, Moon, Brain, Droplet, Dumbbell, Activity, TrendingUp, TrendingDown, Minus, MapPin, Sparkles } from 'lucide-react';

const META = {
  heart: { label: 'Heart Health', icon: Heart },
  bone: { label: 'Bone Health', icon: Bone },
  vision: { label: 'Vision Health', icon: Eye },
  sleep: { label: 'Sleep Quality', icon: Moon },
  stress: { label: 'Stress Index', icon: Brain, invert: true },
  hydration: { label: 'Hydration', icon: Droplet },
  muscle: { label: 'Muscle Health', icon: Dumbbell },
  cognitive: { label: 'Cognitive Health', icon: Activity },
};

const valNorm = (key, v) => (META[key].invert ? 100 - v : v);
const colorFor = (key, v) => {
  const n = valNorm(key, v);
  if (n >= 80) return 'text-emerald-400';
  if (n >= 60) return 'text-amber-400';
  return 'text-red-400';
};
const barColor = (key, v) => {
  const n = valNorm(key, v);
  if (n >= 80) return 'bg-emerald-500';
  if (n >= 60) return 'bg-amber-500';
  return 'bg-red-500';
};

export default function DigitalTwin() {
  const { crew, liveVitals } = useMission();
  const navigate = useNavigate();
  const TrendIcon = ({ t }) => (t === 'up' ? <TrendingUp className="h-4 w-4 text-emerald-400" /> : t === 'down' ? <TrendingDown className="h-4 w-4 text-red-400" /> : <Minus className="h-4 w-4 text-slate-500" />);

  if (!crew) {
    return (
      <div>
        <PageHeader title="Crew Health Profile" subtitle="Guest Mode" icon={Activity} />
        <div className="panel panel-glow p-8 text-center">
          <Activity className="mx-auto mb-3 h-10 w-10 text-amber-400" />
          <div className="text-sm font-semibold text-slate-100">No crew member selected</div>
          <p className="mx-auto mt-2 max-w-sm text-xs text-slate-400">Guest mode doesn't include a personal digital twin. Exit guest mode and select a crew member to view individual health data.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Crew Health Profile" subtitle={`${crew.name} · ${crew.role}`} icon={Activity} />
      <div className="panel panel-glow mb-6 flex items-center justify-between p-5">
        <div>
          <div className="text-xs font-medium text-slate-400">Readiness Score</div>
          <div className={`font-mono text-5xl font-bold ${colorFor('heart', crew.score)}`}>{crew.score}<span className="text-xl text-slate-500">/100</span></div>
        </div>
        <button onClick={() => navigate('/body')} className="btn-mission"><MapPin className="h-4 w-4" /> Open Body Map</button>
      </div>
      {liveVitals && (
        <div className="panel panel-glow mb-6 p-4">
          <div className="mb-2 flex items-center gap-2 text-slate-100"><Activity className="h-4 w-4 text-blue-400" /><span className="text-sm font-semibold">Live Vitals · {liveVitals.source}</span></div>
          <div className="grid grid-cols-4 gap-2 font-mono">
            <div><div className="text-[11px] text-slate-400">HR</div><div className="text-xl font-bold text-slate-100">{liveVitals.hr ?? '—'}</div></div>
            <div><div className="text-[11px] text-slate-400">SpO₂</div><div className="text-xl font-bold text-slate-100">{liveVitals.spo2 ?? '—'}</div></div>
            <div><div className="text-[11px] text-slate-400">BP</div><div className="text-xl font-bold text-slate-100">{liveVitals.bpSys ? `${liveVitals.bpSys}/${liveVitals.bpDia}` : '—'}</div></div>
            <div><div className="text-[11px] text-slate-400">TEMP</div><div className="text-xl font-bold text-slate-100">{liveVitals.temp ?? '—'}</div></div>
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Object.entries(crew.metrics).map(([key, m]) => {
          const M = META[key];
          const I = M.icon;
          return (
            <div key={key} className="panel p-4">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-300"><I className="h-4 w-4 text-slate-400" /><span className="text-xs font-medium">{M.label}</span></div>
                <TrendIcon t={m.trend} />
              </div>
              <div className={`font-mono text-3xl font-bold ${colorFor(key, m.value)}`}>{m.value}<span className="text-base text-slate-500">%</span></div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                <div className={`h-full ${barColor(key, m.value)}`} style={{ width: `${m.value}%` }} />
              </div>
            </div>
          );
        })}
      </div>
      <div className="panel mt-6 p-5">
        <div className="mb-3 flex items-center gap-2 text-slate-100"><Sparkles className="h-4 w-4 text-blue-400" /><span className="text-sm font-semibold">AI Observations</span></div>
        <ul className="space-y-2">
          {crew.observations.map((o, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-300"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500" />{o}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}