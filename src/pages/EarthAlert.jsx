import { useState } from 'react';
import { useMission } from '@/lib/MissionContext';
import PageHeader from '@/components/PageHeader';
import { Radio, Send, Check } from 'lucide-react';

function Field({ label, value }) {
  return (
    <div className="rounded-md border border-slate-800 bg-slate-800/50 p-3">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-1 text-sm text-slate-200">{value}</div>
    </div>
  );
}

export default function EarthAlert() {
  const { crew, diagnosis, earthQueue, queueEarthPacket } = useMission();
  const [queued, setQueued] = useState(false);

  if (!crew) {
    return (
      <div>
        <PageHeader title="Earth Alert Packet" subtitle="Emergency medical report" icon={Radio} />
        <div className="panel panel-glow p-8 text-center">
          <Radio className="mx-auto mb-3 h-10 w-10 text-amber-400" />
          <div className="text-sm font-semibold text-slate-100">No crew member selected</div>
          <p className="mx-auto mt-2 max-w-sm text-xs text-slate-400">Guest mode can't generate an Earth Alert packet without a crew member. Exit guest mode and select a crew member to use this tool.</p>
        </div>
      </div>
    );
  }

  const packet = {
    patient: crew.name,
    role: crew.role,
    symptoms: diagnosis?.evidence || ['See assessment notes'],
    diagnosis: diagnosis?.name || 'No diagnosis on file',
    confidence: diagnosis?.confidence ?? '—',
    severity: diagnosis?.severity || 'ROUTINE',
    vitals: crew.vitals,
    treatments: diagnosis?.treatment || [],
    history: crew.history,
  };

  const queue = () => { queueEarthPacket({ ...packet, ts: new Date().toISOString() }); setQueued(true); };

  return (
    <div>
      <PageHeader title="Earth Alert Packet" subtitle="Emergency medical report" icon={Radio} />
      <div className="panel panel-glow p-6">
        <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <div className="text-xs font-medium text-slate-400">Priority Medical · Mission Day 042</div>
            <div className="text-xl font-bold text-slate-100">{crew.name}</div>
          </div>
          <span className="chip border-red-800 bg-red-950/40 text-red-300"><Radio className="h-3.5 w-3.5" /> {packet.severity}</span>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Patient" value={`${packet.patient} · ${packet.role}`} />
          <Field label="Diagnosis" value={`${packet.diagnosis} (${packet.confidence}% confidence)`} />
          <Field label="Vitals" value={`HR ${packet.vitals.hr} · BP ${packet.vitals.bp} · T ${packet.vitals.temp}°C · SpO₂ ${packet.vitals.spo2}% · RR ${packet.vitals.rr}`} />
          <Field label="Symptoms / Evidence" value={packet.symptoms.join(', ')} />
        </div>
        <div className="mt-4">
          <div className="mb-1 text-xs font-medium text-slate-400">Treatment Plan</div>
          <ul className="list-disc space-y-0.5 pl-5 text-sm text-slate-300">
            {packet.treatments.map((t, i) => <li key={i}>{t}</li>)}
          </ul>
        </div>
        <div className="mt-4">
          <div className="mb-1 text-xs font-medium text-slate-400">Medical History</div>
          <ul className="text-sm text-slate-300">{packet.history.map((h, i) => <li key={i}>· {h}</li>)}</ul>
        </div>
        <div className="mt-4 text-xs text-slate-500">ECG: sinus rhythm · Images: crew medical scan attached</div>
      </div>
      <button onClick={queue} disabled={queued} className="btn-mission mt-4 w-full text-amber-300 hover:bg-amber-950/40 hover:border-amber-700 disabled:opacity-50">
        {queued ? <><Check className="h-5 w-5" /> Queued For Earth Transmission</> : <><Send className="h-5 w-5" /> Queue For Earth Transmission</>}
      </button>
      {earthQueue.length > 0 && <div className="panel mt-4 p-4 text-xs text-slate-400">Packets queued: {earthQueue.length} · Last: {earthQueue[earthQueue.length - 1].diagnosis}</div>}
    </div>
  );
}