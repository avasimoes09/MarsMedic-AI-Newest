import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMission } from '@/lib/MissionContext';
import PatientHealthFields, { EMPTY_HEALTH_PROFILE } from '@/components/PatientHealthFields';
import { AlertTriangle, Fingerprint, Loader2, LockKeyhole, Rocket, UserRound } from 'lucide-react';

const inputClass = 'w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-blue-500';

export default function MarsLogin() {
  const { createAccount, loginWithPin, loginWithPasskey, loginGuest, session, sessionLoading } = useMission();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [health, setHealth] = useState(EMPTY_HEALTH_PROFILE);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (session) navigate('/dashboard', { replace: true });
  }, [session, navigate]);

  const updateHealth = (key, value) => setHealth((current) => ({ ...current, [key]: value }));
  const enterGuest = async () => {
    await loginGuest();
    navigate('/dashboard');
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'create') await createAccount({ name, username, pin, ...health });
      else await loginWithPin(username, pin);
    } catch (requestError) {
      setError(requestError.message === 'Failed to fetch'
        ? 'The local service is not running. Start MarsMedic with npm run dev.'
        : requestError.message);
    } finally {
      setBusy(false);
    }
  };

  const signInWithPasskey = async () => {
    setError('');
    setBusy(true);
    try {
      await loginWithPasskey(username);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  if (sessionLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-950"><Loader2 className="h-6 w-6 animate-spin text-blue-400" aria-label="Checking local account session" /></div>;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 py-10">
      <div className="mb-7 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600 text-white"><Rocket className="h-7 w-7" /></div>
        <h1 className="text-2xl font-bold text-slate-100">MarsMedic AI</h1>
        <p className="mt-1 text-sm text-slate-400">Local patient health records</p>
      </div>

      <div className="w-full max-w-xl">
        <button onClick={() => navigate('/emergency')} className="mb-4 flex w-full items-center justify-center gap-2 rounded-md border border-red-700 bg-red-950/60 px-4 py-3 text-sm font-semibold text-red-200 hover:bg-red-900/60">
          <AlertTriangle className="h-4 w-4" /> Emergency assessment
        </button>
        <div className="mb-4 grid grid-cols-2 rounded-md border border-slate-800 bg-slate-900 p-1" role="tablist" aria-label="Account access">
          <button type="button" role="tab" aria-selected={mode === 'login'} onClick={() => { setMode('login'); setError(''); }} className={`rounded px-3 py-2 text-sm ${mode === 'login' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>Sign in</button>
          <button type="button" role="tab" aria-selected={mode === 'create'} onClick={() => { setMode('create'); setError(''); }} className={`rounded px-3 py-2 text-sm ${mode === 'create' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>Create account</button>
        </div>

        <form onSubmit={submit} className="panel panel-glow space-y-4 p-5">
          <h2 className="text-base font-semibold text-slate-100">{mode === 'create' ? 'New patient account' : 'Patient sign in'}</h2>
          {mode === 'create' && (
            <label className="block space-y-1.5 text-sm text-slate-300">
              <span>Full name</span>
              <input value={name} onChange={(event) => setName(event.target.value)} required maxLength={100} className={inputClass} autoComplete="name" />
            </label>
          )}
          <label className="block space-y-1.5 text-sm text-slate-300">
            <span>Username</span>
            <input type="text" value={username} onChange={(event) => setUsername(event.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 32))} required minLength={3} maxLength={32} pattern="[a-zA-Z0-9._-]{3,32}" className={inputClass} autoComplete="username" />
            {mode === 'create' && <span className="block text-xs text-slate-500">3–32 letters, numbers, dots, underscores, or hyphens</span>}
          </label>
          <label className="block space-y-1.5 text-sm text-slate-300">
            <span>{mode === 'create' ? 'Create a four-digit PIN' : 'Four-digit PIN'}</span>
            <input type="password" value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 4))} inputMode="numeric" pattern="[0-9]{4}" minLength={4} maxLength={4} required className={`${inputClass} max-w-44 tracking-[0.4em]`} autoComplete={mode === 'create' ? 'new-password' : 'current-password'} />
          </label>

          {mode === 'create' && (
            <>
              <div className="border-t border-slate-800 pt-4">
                <h3 className="mb-3 text-sm font-semibold text-slate-100">Health information</h3>
                <PatientHealthFields value={health} onChange={updateHealth} />
              </div>
              <p className="text-xs text-slate-500">This account is stored on this computer. The PIN is hashed and health details are encrypted locally. Back up the database and its separate encryption key together.</p>
            </>
          )}

          {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
          <button type="submit" disabled={busy} className="btn-mission w-full py-3">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" />}
            {mode === 'create' ? 'Create account' : 'Sign in with PIN'}
          </button>

          {mode === 'login' && (
            <button type="button" onClick={signInWithPasskey} disabled={busy || !username} className="btn-mission w-full py-3">
              <Fingerprint className="h-4 w-4" /> Sign in with device passkey
            </button>
          )}
        </form>

        <div className="my-4 flex items-center gap-3 text-xs text-slate-500"><span className="h-px flex-1 bg-slate-800" />or<span className="h-px flex-1 bg-slate-800" /></div>
        <button onClick={enterGuest} className="btn-mission w-full py-3 text-amber-300"><UserRound className="h-4 w-4" /> Continue as guest</button>
        <p className="mt-3 text-center text-xs text-slate-500">Passkeys use your device’s available verification method, such as fingerprint, face, or device PIN.</p>
      </div>
    </div>
  );
}