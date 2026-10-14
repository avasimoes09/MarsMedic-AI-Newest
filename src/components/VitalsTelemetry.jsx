import { Activity, BluetoothConnected, Save, Stethoscope } from 'lucide-react';
import { useVitalDevice } from '@/hooks/useVitalDevice';
import { useMission } from '@/lib/MissionContext';
import { useNavigate } from 'react-router-dom';

const RANGES = {
  hr: { ok: (v) => v >= 50 && v <= 100, label: 'HR', unit: 'bpm' },
  spo2: { ok: (v) => v >= 95, label: 'SpO₂', unit: '%' },
  bp: { ok: (v) => v, label: 'BP', unit: 'mmHg' },
  temp: { ok: (v) => v <= 37.5 && v >= 35.5, label: 'TEMP', unit: '°C' },
};

function Waveform({ data }) {
  const w = 320, h = 64;
  if (data.length < 2) return <div className="flex h-16 items-center justify-center text-xs text-slate-500">Awaiting signal…</div>;
  const min = Math.min(...data), max = Math.max(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / span) * (h - 8) - 4}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-16 w-full" preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke="#3b82f6" strokeWidth="2" />
    </svg>
  );
}

function Readout({ kind, value }) {
  const r = RANGES[kind];
  const display = kind === 'bp' ? (value.bpSys ? `${value.bpSys}/${value.bpDia}` : '—') : (value ?? '—');
  const warn = kind === 'bp' ? false : value != null && !r.ok(value);
  return (
    <div className={`rounded-lg border p-3 ${warn ? 'border-red-700 bg-red-950/40' : 'border-slate-800 bg-slate-900'}`}>
      <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{r.label}</div>
      <div className={`font-mono text-2xl font-bold ${warn ? 'text-red-400' : 'text-slate-100'}`}>{display}</div>
      <div className="text-[11px] text-slate-500">{r.unit}</div>
    </div>
  );
}

export default function VitalsTelemetry({ compact = false, showAttach = true }) {
  const dev = useVitalDevice();
  const { status, deviceName, readings, waveform, supported, connect, disconnect, simulate } = dev;
  const { setLiveVitals } = useMission();
  const navigate = useNavigate();
  const connected = status === 'connected';

  const attach = (dest) => {
    setLiveVitals({ ...readings, source: deviceName, at: Date.now() });
    navigate(dest);
  };

  return (
    <div className="panel panel-glow p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-400" />
          <span className="text-sm font-semibold text-slate-100">Vitals Telemetry</span>
        </div>
        <span className={`chip ${connected ? 'border-emerald-800 bg-emerald-950/40 text-emerald-300' : 'border-slate-700 bg-slate-800 text-slate-400'}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${connected ? 'bg-emerald-500' : 'bg-slate-500'}`} />
          {connected ? 'Streaming' : status === 'scanning' ? 'Scanning' : 'Offline'}
        </span>
      </div>

      {!connected && (
        <div className="mt-4 flex flex-col gap-3">
          <button onClick={connect} disabled={status === 'scanning'} className="btn-mission py-4">
            {status === 'scanning' ? 'Scanning…' : 'Connect BLE Device'}
          </button>
          {!supported && (
            <div className="rounded-md border border-amber-800 bg-amber-950/40 p-3 text-xs text-amber-300">
              Web Bluetooth isn't available here. Use the simulator to preview live telemetry.
            </div>
          )}
          <button onClick={simulate} className="btn-mission py-3 text-sm">Simulate Live Stream</button>
        </div>
      )}

      {connected && (
        <>
          <div className="mt-3 flex items-center gap-2 text-sm text-slate-300">
            <BluetoothConnected className="h-4 w-4 text-blue-400" /> {deviceName}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Readout kind="hr" value={readings.hr} />
            <Readout kind="spo2" value={readings.spo2} />
            <Readout kind="bp" value={{ bpSys: readings.bpSys, bpDia: readings.bpDia }} />
            <Readout kind="temp" value={readings.temp} />
          </div>
          <div className="mt-3 rounded-md border border-slate-800 bg-slate-800/50 p-2">
            <Waveform data={waveform} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {showAttach && (
              <>
                <button onClick={() => attach('/assessment')} className="btn-mission py-2.5 text-sm"><Stethoscope className="h-4 w-4" /> Attach to Assessment</button>
                <button onClick={() => attach('/twin')} className="btn-mission py-2.5 text-sm"><Save className="h-4 w-4" /> Save to Twin</button>
              </>
            )}
            <button onClick={disconnect} className="btn-mission py-2.5 text-sm text-red-400 hover:bg-red-950/40 hover:border-red-700">Disconnect</button>
          </div>
        </>
      )}
    </div>
  );
}