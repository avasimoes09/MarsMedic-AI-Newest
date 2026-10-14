import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMission } from '@/lib/MissionContext';
import { Fingerprint, Lock, UserRound, Rocket, Delete } from 'lucide-react';

export default function MarsLogin() {
  const { login } = useMission();
  const navigate = useNavigate();
  const [view, setView] = useState('home');
  const [scanning, setScanning] = useState(false);
  const [pin, setPin] = useState('');

  const enter = (m) => { login(m); navigate('/crew'); };
  const enterGuest = () => { login('guest'); navigate('/dashboard'); };
  const scan = () => { setScanning(true); setTimeout(() => enter('fingerprint'), 1800); };
  const press = (d) => setPin((p) => (p.length < 4 ? p + d : p));
  const del = () => setPin((p) => p.slice(0, -1));
  const submit = () => { if (pin.length === 4) enter('password'); };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 py-10">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600 text-white">
          <Rocket className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold text-slate-100">MarsMedic AI</h1>
        <p className="mt-1 text-sm text-slate-400">Autonomous Medical Officer · Offline Ready</p>
      </div>

      {view === 'home' && (
        <div className="grid w-full max-w-md gap-3">
          <button onClick={() => setView('fingerprint')} className="btn-mission py-5 text-base"><Fingerprint className="h-5 w-5" /> Fingerprint Login</button>
          <button onClick={() => setView('password')} className="btn-mission py-5 text-base"><Lock className="h-5 w-5" /> Password Login</button>
          <button onClick={enterGuest} className="btn-mission py-5 text-base text-amber-300 hover:bg-amber-950/40 hover:border-amber-700"><UserRound className="h-5 w-5" /> Guest Mode</button>
          <p className="mt-2 text-center text-xs text-slate-500">Guest Mode clears all data when the session ends.</p>
        </div>
      )}

      {view === 'fingerprint' && (
        <div className="panel panel-glow w-full max-w-md p-8 text-center">
          <button onClick={scanning ? undefined : scan} className="mx-auto flex h-32 w-32 items-center justify-center rounded-full border-2 border-blue-900/60 bg-blue-950/50 transition hover:bg-blue-900/40">
            <Fingerprint className={`h-16 w-16 text-blue-400 ${scanning ? 'animate-pulse' : ''}`} />
          </button>
          <div className="mt-4 text-sm text-slate-300">{scanning ? 'Scanning biometrics…' : 'Tap sensor to scan'}</div>
          {scanning && <div className="mx-auto mt-3 h-1 w-40 overflow-hidden rounded-full bg-slate-800"><div className="h-full w-1/2 animate-pulse bg-blue-500" /></div>}
          <button onClick={() => setView('home')} className="mt-6 text-xs text-blue-400 hover:underline">Back</button>
        </div>
      )}

      {view === 'password' && (
        <div className="panel panel-glow w-full max-w-xs p-6 text-center">
          <Lock className="mx-auto h-8 w-8 text-blue-400" />
          <div className="my-4 flex justify-center gap-2">
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
            <button onClick={submit} className="btn-mission py-4">✓</button>
          </div>
          <button onClick={() => setView('home')} className="mt-4 text-xs text-blue-400 hover:underline">Back</button>
        </div>
      )}
    </div>
  );
}