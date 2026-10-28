import { Activity, BluetoothConnected, Save, Stethoscope } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useVitalDevice } from '@/hooks/useVitalDevice';
import { useMission } from '@/lib/MissionContext';
import { useNavigate } from 'react-router-dom';
import { celsiusToFahrenheit } from '@/lib/temperature';

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

function Readout({ kind, value, temperatureUnit }) {
  const r = RANGES[kind];
  const display = kind === 'bp'
    ? (value.bpSys ? `${value.bpSys}/${value.bpDia}` : '—')
    : kind === 'temp' && value != null
      ? (temperatureUnit === 'F' ? celsiusToFahrenheit(value).toFixed(1) : Number(value).toFixed(1))
      : (value ?? '—');
  const warn = kind === 'bp' ? false : value != null && !r.ok(value);
  const unit = kind === 'temp' ? `°${temperatureUnit}` : r.unit;
  return (
    <div className={`rounded-lg border p-3 ${warn ? 'border-red-700 bg-red-950/40' : 'border-slate-800 bg-slate-900'}`}>
      <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{r.label}</div>
      <div className={`font-mono text-2xl font-bold ${warn ? 'text-red-400' : 'text-slate-100'}`}>{display}</div>
      <div className="text-[11px] text-slate-500">{unit}</div>
    </div>
  );
}

export default function VitalsTelemetry({ compact = false, showAttach = true, onReadingsChange, className = '' }) {
  const dev = useVitalDevice();
  const { status, deviceName, readings, waveform, supported, connect, disconnect, simulate } = dev;
  const { setLiveVitals, saveDeviceReading, patient, isGuest, temperatureUnit, setTemperatureUnit } = useMission();
  const navigate = useNavigate();
  const connected = status === 'connected';
  const simulated = status === 'simulated';
  const active = connected || simulated;
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    onReadingsChange?.(connected ? { ...readings, source: deviceName, at: Date.now() } : null);
  }, [connected, deviceName, readings, onReadingsChange]);

  const attach = (dest) => {
    setLiveVitals({ ...readings, source: deviceName, at: Date.now() });
    navigate(dest);
  };

  const saveToRecord = async () => {
    setSaving(true);
    setSaveError('');
    try {
      await saveDeviceReading('vitals', deviceName, readings);
      setLiveVitals({ ...readings, source: deviceName, at: Date.now() });
      navigate('/twin');
    } catch (error) {
      setSaveError(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`panel panel-glow p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-400" />
          <span className="text-sm font-semibold text-slate-100">Vitals Telemetry</span>
        </div>
        <span className={`chip ${connected ? 'border-emerald-800 bg-emerald-950/40 text-emerald-300' : 'border-slate-700 bg-slate-800 text-slate-400'}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${connected ? 'bg-emerald-500' : 'bg-slate-500'}`} />
          {connected ? 'Streaming' : simulated ? 'Demo stream' : status === 'scanning' ? 'Scanning' : 'Offline'}
        </span>
      </div>

      {!active && (
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

      {active && (
        <>
          <div className="mt-3 flex items-center gap-2 text-sm text-slate-300">
            {simulated ? <Activity className="h-4 w-4 text-amber-400" /> : <BluetoothConnected className="h-4 w-4 text-blue-400" />} {deviceName}
          </div>
          {simulated && <p className="mt-2 text-xs text-amber-300">Simulated readings are for preview only and cannot be saved to a patient record.</p>}
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Readout kind="hr" value={readings.hr} temperatureUnit={temperatureUnit} />
            <Readout kind="spo2" value={readings.spo2} temperatureUnit={temperatureUnit} />
            <Readout kind="bp" value={{ bpSys: readings.bpSys, bpDia: readings.bpDia }} temperatureUnit={temperatureUnit} />
            <Readout kind="temp" value={readings.temp} temperatureUnit={temperatureUnit} />
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
            Temperature unit
            {['C', 'F'].map((unit) => (
              <button key={unit} type="button" aria-pressed={temperatureUnit === unit} onClick={() => setTemperatureUnit(unit)} className={`rounded border px-2 py-1 ${temperatureUnit === unit ? 'border-blue-500 bg-blue-950/50 text-slate-100' : 'border-slate-700 text-slate-400'}`}>°{unit}</button>
            ))}
          </div>
          <div className="mt-3 rounded-md border border-slate-800 bg-slate-800/50 p-2">
            <Waveform data={waveform} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {showAttach && connected && (
              <>
                <button onClick={() => attach('/assessment')} className="btn-mission py-2.5 text-sm"><Stethoscope className="h-4 w-4" /> Attach to Assessment</button>
                <button onClick={saveToRecord} disabled={saving || !patient || isGuest} className="btn-mission py-2.5 text-sm disabled:opacity-50">
                  {saving ? <Activity className="h-4 w-4 animate-pulse" /> : <Save className="h-4 w-4" />}
                  Save to patient record
                </button>
              </>
            )}
            <button onClick={disconnect} className="btn-mission py-2.5 text-sm text-red-400 hover:bg-red-950/40 hover:border-red-700">Disconnect</button>
          </div>
          {!patient && connected && <p className="mt-2 text-xs text-slate-400">Sign in to a patient account to save readings.</p>}
          {saveError && <p role="alert" className="mt-2 text-sm text-red-300">{saveError}</p>}
        </>
      )}
    </div>
  );
}