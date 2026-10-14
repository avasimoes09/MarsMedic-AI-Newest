import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMission } from '@/lib/MissionContext';
import PageHeader from '@/components/PageHeader';
import { BODY_SYSTEMS, SYMPTOMS } from '@/lib/missionData';
import { runDiagnosis } from '@/lib/diagnosisEngine';
import { getFollowupsForSymptoms } from '@/lib/followupQuestions';
import { Stethoscope, ChevronRight, Check, X, AlertTriangle, Sparkles, ClipboardList, Radio } from 'lucide-react';

export default function SymptomAssessment() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { setDiagnosis, liveVitals, applyDiagnosisToCrew } = useMission();
  const [systems, setSystems] = useState(state?.system ? [state.system] : []);
  const [selected, setSelected] = useState([]);
  const [followups, setFollowups] = useState({});
  const [result, setResult] = useState(null);

  const followupQuestions = useMemo(() => getFollowupsForSymptoms(selected), [selected]);

  const SYMPTOM_LABELS = {};
  Object.values(SYMPTOMS).forEach((a) => a.forEach((s) => { SYMPTOM_LABELS[s.id] = s.label; }));

  useEffect(() => {
    if (state?.system) {
      setSystems((prev) => (prev.includes(state.system) ? prev : [...prev, state.system]));
      setResult(null);
    }
  }, [state]);

  const toggleSystem = (id) => setSystems((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const toggleSymptom = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const toggleFollow = (k, v) => setFollowups((f) => ({ ...f, [k]: f[k] === v ? undefined : v }));
  const diagnose = () => {
    const res = runDiagnosis(selected, followups);
    setResult(res);
    if (res.results[0]) applyDiagnosisToCrew(res.results[0]);
  };
  const reset = () => { setSystems([]); setSelected([]); setFollowups({}); setResult(null); };
  const startTreatment = (dx) => { setDiagnosis(dx); navigate('/treatment'); };
  const toEarth = (dx) => { setDiagnosis(dx); navigate('/earth-alert'); };

  if (result) {
    const top = result.results[0];
    const sev = top?.severity === 'EMERGENCY' || top?.severity === 'HIGH' ? 'red' : 'amber';
    return (
      <div>
        <PageHeader title="AI Diagnosis" subtitle="Explainable AI · Evidence-based" icon={Sparkles} />
        {!top ? (
          <div className="panel p-6">
            <div className="text-lg text-slate-100">No critical pattern detected.</div>
            <p className="mt-2 text-sm text-slate-400">Monitor symptoms and reassess in 2 hours. If condition worsens, initiate Emergency Protocol.</p>
            <button onClick={reset} className="btn-mission mt-4">New Assessment</button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className={`panel p-6 ${sev === 'red' ? 'border-red-700' : 'border-amber-700'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-slate-400">Primary Diagnosis</div>
                  <div className="text-2xl font-bold text-slate-100">{top.name}</div>
                </div>
                <div className={`chip ${sev === 'red' ? 'border-red-800 bg-red-950/40 text-red-300' : 'border-amber-800 bg-amber-950/40 text-amber-300'}`}>
                  <AlertTriangle className="h-3.5 w-3.5" /> {top.severity}
                </div>
              </div>
              <div className="mt-4">
                <div className="mb-1 flex justify-between text-xs text-slate-400"><span>Confidence</span><span className="font-mono">{top.confidence}%</span></div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800"><div className={`h-full ${sev === 'red' ? 'bg-red-500' : 'bg-amber-500'}`} style={{ width: `${top.confidence}%` }} /></div>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="panel p-5">
                <div className="mb-3 text-sm font-semibold text-emerald-300">Evidence</div>
                <ul className="space-y-2">
                  {top.evidence.map((e, i) => <li key={i} className="flex items-center gap-2 text-sm text-slate-300"><Check className="h-4 w-4 text-emerald-400" /> {e}</li>)}
                </ul>
              </div>
              <div className="panel p-5">
                <div className="mb-3 text-sm font-semibold text-red-300">Rejected Diagnoses</div>
                <ul className="space-y-2">
                  {(result.rejected.length ? result.rejected : ['None']).map((e, i) => <li key={i} className="flex items-center gap-2 text-sm text-slate-400"><X className="h-4 w-4 text-red-400" /> {e}</li>)}
                </ul>
              </div>
            </div>
            {result.results.length > 1 && (
              <div className="panel p-5">
                <div className="mb-2 text-sm font-semibold text-slate-300">Differential Considerations</div>
                <div className="flex flex-wrap gap-2">
                  {result.results.slice(1).map((r) => <span key={r.id} className="chip border-slate-700 bg-slate-800 text-slate-300">{r.name} · {r.confidence}%</span>)}
                </div>
              </div>
            )}
            <div className="flex flex-wrap gap-3">
              <button onClick={() => startTreatment(top)} className="btn-mission"><ClipboardList className="h-5 w-5" /> Start Treatment Coach</button>
              <button onClick={() => toEarth(top)} className="btn-mission text-amber-300 hover:bg-amber-950/40 hover:border-amber-700"><Radio className="h-5 w-5" /> Generate Earth Alert</button>
              <button onClick={reset} className="btn-mission">New Assessment</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Symptom Assessment" subtitle="Tap to select · Mix body systems" icon={Stethoscope} />
      {liveVitals && (
        <div className="panel mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 p-3 text-sm text-slate-300">
          <span className="chip border-blue-800 bg-blue-950/40 text-blue-300">Live Vitals · {liveVitals.source}</span>
          <span>HR {liveVitals.hr ?? '—'}</span>
          <span>SpO₂ {liveVitals.spo2 ?? '—'}</span>
          <span>BP {liveVitals.bpSys ? `${liveVitals.bpSys}/${liveVitals.bpDia}` : '—'}</span>
          <span>TEMP {liveVitals.temp ?? '—'}°C</span>
        </div>
      )}
      <div className="mb-2 text-xs font-medium text-slate-400">Body Systems · tap to open one or more</div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {BODY_SYSTEMS.map((s) => {
          const active = systems.includes(s.id);
          return (
            <button key={s.id} onClick={() => toggleSystem(s.id)} className={`panel flex flex-col items-center gap-2 p-4 transition ${active ? 'border-blue-500 bg-blue-950/50' : 'hover:border-blue-500 hover:bg-slate-800'}`}>
              <span className="text-sm font-medium text-slate-200">{s.label}</span>
            </button>
          );
        })}
      </div>

      {selected.length > 0 && (
        <div className="panel mt-4 p-3">
          <div className="mb-2 text-xs font-medium text-slate-400">Selected Symptoms ({selected.length})</div>
          <div className="flex flex-wrap gap-2">
            {selected.map((id) => (
              <button key={id} onClick={() => toggleSymptom(id)} className="chip border-blue-800 bg-blue-950/40 text-blue-300">
                {SYMPTOM_LABELS[id] || id} <X className="h-3 w-3" />
              </button>
            ))}
          </div>
        </div>
      )}

      {systems.map((sysId) => {
        const sysObj = BODY_SYSTEMS.find((s) => s.id === sysId);
        return (
          <div key={sysId} className="mt-5">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-slate-200">{sysObj.label}</div>
              <button onClick={() => toggleSystem(sysId)} className="text-xs text-blue-400 hover:underline">Close</button>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {(SYMPTOMS[sysId] || []).map((s) => {
                const on = selected.includes(s.id);
                return (
                  <button key={s.id} onClick={() => toggleSymptom(s.id)} className={`flex items-center justify-between rounded-md border px-4 py-3 text-sm font-medium transition ${on ? 'border-blue-500 bg-blue-950/50 text-slate-100' : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-blue-600'}`}>
                    {s.label}{on && <Check className="h-4 w-4 text-blue-400" />}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {followupQuestions.length > 0 && (
        <div className="mt-6 space-y-4">
          <div className="text-xs font-medium text-slate-400">Follow-up Questions · narrow the diagnosis</div>
          {followupQuestions.map((f) => (
            <div key={f.key} className="panel p-4">
              <div className="mb-2 text-sm text-slate-200">{f.q}</div>
              <div className="flex flex-wrap gap-2">
                {f.options.map((o) => {
                  const on = followups[f.key] === o;
                  return <button key={o} onClick={() => toggleFollow(f.key, o)} className={`rounded-md border px-4 py-2 text-sm ${on ? 'border-blue-500 bg-blue-950/50 text-slate-100' : 'border-slate-700 text-slate-300 hover:border-blue-600'}`}>{o}</button>;
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <button disabled={selected.length === 0} onClick={diagnose} className="btn-mission mt-6 w-full"><Sparkles className="h-5 w-5" /> Run AI Diagnosis <ChevronRight className="h-5 w-5" /></button>
    </div>
  );
}