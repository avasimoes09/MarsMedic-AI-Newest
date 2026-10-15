import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMission } from '@/lib/MissionContext';
import PageHeader from '@/components/PageHeader';
import { BODY_SYSTEMS, SYMPTOMS } from '@/lib/missionData';
import { runDiagnosis } from '@/lib/diagnosisEngine';
import { interpretVitals } from '@/lib/vitalGuidance';
import { getFollowupsForSymptoms } from '@/lib/followupQuestions';
import VitalsTelemetry from '@/components/VitalsTelemetry';
import MedicalCopilot from '@/pages/MedicalCopilot';
import { Stethoscope, ChevronRight, Check, X, AlertTriangle, Sparkles, ClipboardList, Radio, Send } from 'lucide-react';

export default function SymptomAssessment({ emergency = false }) {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { setDiagnosis, liveVitals: patientVitals, applyDiagnosisToCrew, queueEmergencyPacket } = useMission();
  const [externalVitals, setExternalVitals] = useState(null);
  const liveVitals = emergency ? externalVitals : patientVitals;
  const [systems, setSystems] = useState(state?.system ? [state.system] : []);
  const [selected, setSelected] = useState([]);
  const [followups, setFollowups] = useState({});
  const [result, setResult] = useState(null);
  const [emergencyContactQueued, setEmergencyContactQueued] = useState(false);

  const followupQuestions = useMemo(() => getFollowupsForSymptoms(selected), [selected]);
  const vitalGuidance = useMemo(
    () => emergency ? interpretVitals(externalVitals, selected) : [],
    [emergency, externalVitals, selected],
  );

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
    if (!emergency && res.results[0]) applyDiagnosisToCrew(res.results[0]);
  };
  const reset = () => { setSystems([]); setSelected([]); setFollowups({}); setResult(null); setEmergencyContactQueued(false); };
  const startTreatment = (dx) => { setDiagnosis(dx); navigate('/treatment'); };
  const toEarth = (dx) => { setDiagnosis(dx); navigate('/earth-alert'); };
  const contactEarth = () => {
    const diagnosisResult = result?.results[0];
    queueEmergencyPacket({
      patient: 'Emergency patient',
      symptoms: selected.map((id) => SYMPTOM_LABELS[id] || id),
      diagnosis: diagnosisResult?.name || 'Emergency assistance requested',
      severity: diagnosisResult?.severity || 'UNASSESSED',
      confidence: diagnosisResult?.confidence ?? null,
      vitals: externalVitals,
      createdAt: new Date().toISOString(),
    });
    setEmergencyContactQueued(true);
  };
  const queueCopilotEarthContact = (copilot) => {
    const diagnosisResult = result?.results[0];
    queueEmergencyPacket({
      patient: 'Emergency patient',
      symptoms: selected.map((id) => SYMPTOM_LABELS[id] || id),
      diagnosis: diagnosisResult?.name || 'Copilot emergency request',
      severity: diagnosisResult?.severity || 'UNASSESSED',
      confidence: diagnosisResult?.confidence ?? null,
      vitals: externalVitals,
      ...copilot,
      createdAt: new Date().toISOString(),
    });
    setEmergencyContactQueued(true);
  };
  const emergencyContact = (
    <div role="alert" className="panel mb-4 border-red-700 bg-red-950/40 p-4 text-sm text-red-100">
      <p>Prepare an emergency packet for Earth. If no communication link is available, it will remain queued locally.</p>
      <button onClick={contactEarth} disabled={emergencyContactQueued} className="btn-mission mt-3 border-red-700 bg-red-900/60 text-red-100 hover:bg-red-800/70 disabled:opacity-60">
        <Send className="h-4 w-4" /> {emergencyContactQueued ? 'Emergency packet queued locally' : 'Contact Earth for Emergency'}
      </button>
    </div>
  );
  const emergencyVitalsSummary = externalVitals && (
    <div className="panel mb-4 p-4">
      <div className="mb-3 text-sm font-semibold text-slate-100">Vital-sign context</div>
      <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-md border border-slate-800 bg-slate-900 p-3"><div className="text-xs text-slate-400">Heart rate</div><div className="font-mono text-lg text-slate-100">{externalVitals.hr ?? '—'} bpm</div></div>
        <div className="rounded-md border border-slate-800 bg-slate-900 p-3"><div className="text-xs text-slate-400">Oxygen saturation</div><div className="font-mono text-lg text-slate-100">{externalVitals.spo2 ?? '—'}%</div></div>
        <div className="rounded-md border border-slate-800 bg-slate-900 p-3"><div className="text-xs text-slate-400">Blood pressure</div><div className="font-mono text-lg text-slate-100">{externalVitals.bpSys ? `${externalVitals.bpSys}/${externalVitals.bpDia}` : '—'} mmHg</div></div>
        <div className="rounded-md border border-slate-800 bg-slate-900 p-3"><div className="text-xs text-slate-400">Temperature</div><div className="font-mono text-lg text-slate-100">{externalVitals.temp ?? '—'} °C</div></div>
      </div>
      {vitalGuidance.length ? (
        <ul className="space-y-2">
          {vitalGuidance.map((flag) => (
            <li key={flag.key} className={`rounded-md border p-3 text-sm ${flag.urgency === 'urgent' ? 'border-red-700 bg-red-950/40 text-red-100' : 'border-amber-800 bg-amber-950/30 text-amber-100'}`}>
              <div className="font-semibold">{flag.label}: {flag.value}</div>
              <p className="mt-1">{flag.guidance}</p>
              <p className="mt-1 text-xs">Can be relevant with: {flag.relatedSymptoms.map((id) => SYMPTOM_LABELS[id] || id).join(', ')}{flag.selectedSymptoms.length ? ` · Selected: ${flag.selectedSymptoms.map((id) => SYMPTOM_LABELS[id] || id).join(', ')}` : ''}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-slate-400">No reference flags for the available values. Normal readings do not rule out an emergency.</p>
      )}
      <p className="mt-3 text-xs text-slate-500">General adult reference guidance only. Recheck readings; devices and individual baselines vary. Vitals alone cannot diagnose a condition.</p>
    </div>
  );

  if (result) {
    const top = result.results[0];
    const sev = top?.severity === 'EMERGENCY' || top?.severity === 'HIGH' ? 'red' : 'amber';
    return (
      <div>
        <PageHeader title={emergency ? 'Emergency Triage Guidance' : 'AI Diagnosis'} subtitle={emergency ? 'Symptom-based decision support' : 'Explainable AI · Evidence-based'} icon={Sparkles} />
        {emergency && emergencyContact}
        {emergency && emergencyVitalsSummary}
        {emergency && <div className="mb-4"><MedicalCopilot embedded emergency onContactEarth={queueCopilotEarthContact} contactQueued={emergencyContactQueued} /></div>}
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
              {!emergency && <button onClick={() => startTreatment(top)} className="btn-mission"><ClipboardList className="h-5 w-5" /> Start Treatment Coach</button>}
              {!emergency && <button onClick={() => toEarth(top)} className="btn-mission text-amber-300 hover:bg-amber-950/40 hover:border-amber-700"><Radio className="h-5 w-5" /> Generate Earth Alert</button>}
              <button onClick={reset} className="btn-mission">New Assessment</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={emergency ? 'Emergency Assessment' : 'Symptom Assessment'} subtitle={emergency ? 'Quick symptom triage · No account required' : 'Tap to select · Mix body systems'} icon={emergency ? AlertTriangle : Stethoscope} />
      {emergency && emergencyContact}
      {emergency && <div className="mb-4"><VitalsTelemetry compact showAttach={false} onReadingsChange={setExternalVitals} /></div>}
      {emergency && emergencyVitalsSummary}
      {emergency && <div className="mb-5"><MedicalCopilot embedded emergency onContactEarth={queueCopilotEarthContact} contactQueued={emergencyContactQueued} /></div>}
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