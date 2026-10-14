import { useState } from 'react';
import { Fingerprint, Delete, ShieldCheck } from 'lucide-react';

export default function FingerprintGate({ title = 'Biometric Re-Auth Required', onSuccess, onCancel }) {
  const [mode, setMode] = useState('fingerprint');
  const [scanning, setScanning] = useState(false);
  const [pin, setPin] = useState('');

  const scan = () => { setScanning(true); setTimeout(() => onSuccess(), 1500); };
  const press = (d) => setPin((p) => (p.length < 4 ? p + d : p));
  const del = () => setPin((p) => p.slice(0, -1));
  const submitPin = () => { if (pin.length === 4) onSuccess(); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm">
      <div className="panel panel-glow w-full max-w-sm p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-blue-900/60 bg-blue-950/50">
          <ShieldCheck className="h-6 w-6 text-blue-400" />
        </div>
        <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
        <p className="mt-1 text-sm text-slate-400">Verify identity to continue</p>

        {mode === 'fingerprint' && (
          <div className="mt-6">
            <button onClick={scanning ? undefined : scan} className="mx-auto flex h-32 w-32 items-center justify-center rounded-full border-2 border-blue-900/60 bg-blue-950/50 transition hover:bg-blue-900/40">
              <Fingerprint className={`h-16 w-16 text-blue-400 ${scanning ? 'animate-pulse' : ''}`} />
            </button>
            <div className="mt-4 text-sm text-slate-300">{scanning ? 'Scanning…' : 'Tap sensor to scan'}</div>
            {scanning && <div className="mx-auto mt-3 h-1 w-40 overflow-hidden rounded-full bg-slate-800"><div className="h-full w-1/2 animate-pulse bg-blue-500" /></div>}
            <div className="mt-6 flex justify-center gap-4 text-xs">
              <button onClick={() => setMode('pin')} className="text-blue-400 hover:underline">Use PIN</button>
              {onCancel && <button onClick={onCancel} className="text-slate-400 hover:underline">Cancel</button>}
            </div>
          </div>
        )}

        {mode === 'pin' && (
          <div className="mt-6">
            <div className="mb-4 flex justify-center gap-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className={`h-3.5 w-3.5 rounded-full border ${pin.length > i ? 'border-blue-500 bg-blue-500' : 'border-slate-600'}`} />
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
                <button key={d} onClick={() => press(d)} className="btn-mission py-4 text-xl">{d}</button>
              ))}
              <button onClick={del} className="btn-mission py-4"><Delete className="h-5 w-5" /></button>
              <button onClick={() => press('0')} className="btn-mission py-4 text-xl">0</button>
              <button onClick={submitPin} className="btn-mission py-4">✓</button>
            </div>
            <button onClick={() => setMode('fingerprint')} className="mt-4 text-xs text-blue-400 hover:underline">Use Fingerprint</button>
          </div>
        )}
      </div>
    </div>
  );
}