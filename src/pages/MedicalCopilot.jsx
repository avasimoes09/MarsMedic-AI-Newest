import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMission } from '@/lib/MissionContext';
import PageHeader from '@/components/PageHeader';
import { Activity, Check, RotateCcw } from 'lucide-react';

const FLOW = {
  start: { type: 'q', text: 'Is the patient conscious?', opts: [{ l: 'YES', n: 'breathing_q' }, { l: 'NO', n: 'conscious_no' }] },
  conscious_no: { type: 'a', text: 'No response detected. Open airway using head-tilt / chin-lift. Look, listen & feel for breathing for 10 seconds.', opts: [{ l: 'Continue', n: 'breathing_q' }] },
  breathing_q: { type: 'q', text: 'Patient Breathing?', opts: [{ l: 'YES', n: 'breathing_yes' }, { l: 'NO', n: 'breathing_no' }] },
  breathing_yes: { type: 'a', text: 'Breathing present. Keep airway clear. Place in recovery position unless spinal injury suspected. Monitor continuously.', opts: [{ l: 'Continue', n: 'pulse_q' }] },
  breathing_no: { type: 'a', text: 'NOT breathing. Alert Mission Control. Begin rescue breathing: 1 breath every 5–6 seconds. Prepare for CPR.', opts: [{ l: 'Continue', n: 'pulse_q' }] },
  pulse_q: { type: 'q', text: 'Pulse Present?', opts: [{ l: 'YES', n: 'pulse_yes' }, { l: 'NO', n: 'pulse_no' }] },
  pulse_yes: { type: 'a', text: 'Pulse present. Monitor vitals. Keep patient warm. Record ECG. Prepare Earth Alert Packet for transmission.', opts: [{ l: 'Generate Earth Alert', n: 'earth' }, { l: 'Restart Protocol', n: 'start' }] },
  pulse_no: { type: 'a', text: 'No pulse. Begin CPR: 30 chest compressions + 2 rescue breaths. Rate 100–120/min, depth 5–6cm. Continue until pulse returns or Mission Control advises.', opts: [{ l: 'Pulse Returned', n: 'pulse_yes' }, { l: 'Continue CPR', n: 'pulse_no' }, { l: 'Restart Protocol', n: 'start' }] },
  earth: { type: 'a', text: 'Routing to Earth Alert Packet generator…', opts: [{ l: 'Open Earth Alert', n: 'goto_earth' }] },
  contacted: { type: 'a', text: 'The emergency packet has been queued locally. It will not transmit until a communications link is available.', opts: [{ l: 'Restart Protocol', n: 'start' }] },
};

export default function MedicalCopilot({ embedded = false, emergency = false, onContactEarth, contactQueued = false }) {
  const [node, setNode] = useState('start');
  const [responses, setResponses] = useState([]);
  const navigate = useNavigate();
  const { queueEmergencyPacket } = useMission();
  const cur = FLOW[node];
  const go = (option) => {
    if (option.n === 'goto_earth' || (emergency && option.n === 'earth')) {
      if (emergency) {
        const packet = { protocol: responses, protocolStep: cur.text };
        if (onContactEarth) onContactEarth(packet);
        else queueEmergencyPacket({ patient: 'Emergency patient', diagnosis: 'Copilot emergency request', severity: 'UNASSESSED', ...packet, createdAt: new Date().toISOString() });
        setNode('contacted');
        return;
      }
      navigate('/earth-alert');
      return;
    }
    if (option.n === 'start') setResponses([]);
    else setResponses((current) => [...current, { prompt: cur.text, response: option.l }]);
    setNode(option.n);
  };
  const isQ = cur.type === 'q';
  const activeStep = ['start', 'conscious_no'].includes(node)
    ? 0
    : node.startsWith('breathing')
      ? 1
      : node.startsWith('pulse')
        ? 2
        : 3;
  const protocolSteps = ['Consciousness', 'Breathing', 'Pulse'];

  return (
    <div>
      {!embedded && <PageHeader title="Medical Copilot" subtitle="Emergency step-by-step assistant" icon={Activity} />}
      <div className={`panel panel-glow p-6 ${embedded ? 'flex h-full flex-col' : ''}`}>
        <div className="mb-4 flex items-center gap-2 text-red-400"><Activity className="h-5 w-5" /><span className="text-xs font-semibold uppercase tracking-wide">{embedded ? 'Medical Copilot · Emergency Protocol' : 'Emergency Protocol Active'}</span></div>
        <div className={`rounded-lg border p-6 ${isQ ? 'border-blue-800 bg-blue-950/40' : 'border-amber-800 bg-amber-950/40'}`}>
          <div className="text-xl font-semibold text-slate-100">{cur.text}</div>
        </div>
        {embedded && (
          <div className="flex flex-1 flex-col justify-center py-8">
            <div className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-400">Assessment sequence</div>
            <ol className="space-y-3">
              {protocolSteps.map((step, index) => {
                const complete = index < activeStep;
                const active = index === activeStep;
                return (
                  <li key={step} className={`flex items-center gap-3 rounded-md border px-4 py-3 ${active ? 'border-blue-700 bg-blue-950/40 text-slate-100' : complete ? 'border-emerald-900/70 bg-emerald-950/20 text-emerald-200' : 'border-slate-800 bg-slate-900/60 text-slate-500'}`}>
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${active ? 'border-blue-500 text-blue-300' : complete ? 'border-emerald-700 text-emerald-300' : 'border-slate-700'}`}>
                      {complete ? <Check className="h-4 w-4" /> : index + 1}
                    </span>
                    <span className="text-sm font-medium">{step}</span>
                    {active && <span className="ml-auto text-[11px] uppercase tracking-wide text-blue-300">Current</span>}
                  </li>
                );
              })}
            </ol>
          </div>
        )}
        <div className={`mt-6 grid gap-3 sm:grid-cols-2 ${embedded ? 'mt-auto pt-6' : ''}`}>
          {cur.opts.map((o) => (
            <button key={o.l} onClick={() => go(o)} disabled={contactQueued && (o.n === 'earth' || o.n === 'goto_earth')} className="btn-mission py-5 text-base disabled:opacity-50">
              {emergency && o.n === 'earth' ? 'Contact Earth for Emergency' : o.l}
            </button>
          ))}
        </div>
      </div>
      {!embedded && <div className="mt-4 flex justify-center">
        <button onClick={() => { setResponses([]); setNode('start'); }} className="inline-flex items-center gap-1 text-xs text-blue-400 hover:underline"><RotateCcw className="h-3.5 w-3.5" /> Restart Protocol</button>
      </div>}
    </div>
  );
}