import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMission } from '@/lib/MissionContext';
import PatientHealthFields, { EMPTY_HEALTH_PROFILE } from '@/components/PatientHealthFields';
import { AlertTriangle, Fingerprint, Loader2, LockKeyhole, UserRound } from 'lucide-react';

const inputClass = 'w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-blue-500';

function signInErrorMessage(error) {
  if (error.message === 'Failed to fetch') {
    return 'The local service is not running. Start MarsMedic with npm run dev.';
  }
  if (error.message === `Local service returned ${error.status}.`) {
    if (error.status === 404) {
      return 'The local sign-in endpoint was not found. Restart the MarsMedic local service, then reload the app.';
    }
  }
  return error.message;
}

export default function MarsLogin() {
  const { createAccount, loginWithPin, loginWithPasskey, loginGuest, session, sessionLoading } = useMission();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [useExternalKey, setUseExternalKey] = useState(false);
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
      if (mode === 'create') {
        const result = await createAccount({ name, pin, ...health }, { externalOnly: useExternalKey });
        if (result.fingerprintSetupFailed) {
          setMode('login');
          setError(`Account created, but fingerprint setup was not completed. Sign in with your PIN, then add a device passkey from My Patient Profile. ${result.error?.message || ''}`.trim());
        }
      } else {
        await loginWithPin(pin);
      }
    } catch (requestError) {
      setError(signInErrorMessage(requestError));
    } finally {
      setBusy(false);
    }
  };

  const signInWithPasskey = async () => {
    setError('');
    setBusy(true);
    try {
      await loginWithPasskey();
    } catch (requestError) {
      setError(signInErrorMessage(requestError));
    } finally {
      setBusy(false);
    }
  };

  if (sessionLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-950"><Loader2 className="h-6 w-6 animate-spin text-blue-400" aria-label="Checking local account session" /></div>;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 py-8">
      <div className="w-full max-w-md">
        <header className="mb-6 text-center">
          <img src="/marsmedic.svg" alt="" className="mx-auto mb-3 h-14 w-14 rounded-2xl shadow-lg shadow-black/20" />
          <h1 className="text-2xl font-bold text-slate-100">MarsMedic AI</h1>
        </header>

        <button onClick={() => navigate('/emergency')} className="mb-5 flex w-full items-center justify-center gap-2 rounded-md border border-red-700 bg-red-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-700">
          <AlertTriangle className="h-4 w-4" /> Emergency assessment
        </button>

        {mode === 'login' ? (
          <section className="panel panel-glow px-5 py-6 sm:px-8 sm:py-8">
            <h2 className="mb-6 text-center text-base font-semibold text-slate-100">Patient sign in</h2>
            <button type="button" onClick={signInWithPasskey} disabled={busy} className="mx-auto flex h-24 w-24 flex-col items-center justify-center gap-2 rounded-full border border-orange-500/60 bg-orange-500/10 text-orange-300 transition hover:border-orange-400 hover:bg-orange-500/20 disabled:opacity-50" aria-label="Sign in with fingerprint">
              {busy ? <Loader2 className="h-8 w-8 animate-spin" /> : <Fingerprint className="h-9 w-9" />}
              <span className="sr-only">Sign in with fingerprint</span>
            </button>
            <p className="mt-3 text-center text-xs text-slate-400">Sign in with fingerprint or passkey</p>

            <div className="my-6 flex items-center gap-3 text-xs font-medium uppercase text-slate-500">
              <span className="h-px flex-1 bg-slate-700" />
              <span>Or</span>
              <span className="h-px flex-1 bg-slate-700" />
            </div>

            <form onSubmit={submit} className="space-y-4">
              <label className="block space-y-1.5 text-sm text-slate-300">
                <span>PIN</span>
                <input type="password" value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 4))} inputMode="numeric" pattern="[0-9]{4}" minLength={4} maxLength={4} required className={`${inputClass} tracking-[0.4em]`} autoComplete="current-password" />
              </label>
              {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
              <button type="submit" disabled={busy} className="btn-mission w-full py-3">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" />}
                Sign in with PIN
              </button>
            </form>
            <button type="button" onClick={() => { setMode('create'); setError(''); }} className="mt-5 block w-full text-center text-sm font-medium text-orange-300 underline decoration-orange-500/50 underline-offset-4 hover:text-orange-200">
              Create account
            </button>
          </section>
        ) : (
          <form onSubmit={submit} className="panel panel-glow space-y-4 p-5 sm:p-6">
            <h2 className="text-base font-semibold text-slate-100">New patient account</h2>
            <label className="block space-y-1.5 text-sm text-slate-300">
              <span>Full name</span>
              <input value={name} onChange={(event) => setName(event.target.value)} required maxLength={100} className={inputClass} autoComplete="name" />
            </label>
            <label className="block space-y-1.5 text-sm text-slate-300">
              <span>Create a unique four-digit PIN</span>
              <input type="password" value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 4))} inputMode="numeric" pattern="[0-9]{4}" minLength={4} maxLength={4} required className={`${inputClass} max-w-44 tracking-[0.4em]`} autoComplete="new-password" />
              <span className="block text-xs text-slate-500">Every account must use a different PIN.</span>
            </label>
            <div className="border-t border-slate-800 pt-4">
              <h3 className="mb-3 text-sm font-semibold text-slate-100">Health information</h3>
              <PatientHealthFields value={health} onChange={updateHealth} />
            </div>
            <label className="flex items-start gap-2 text-sm text-slate-300">
              <input type="checkbox" checked={useExternalKey} onChange={(event) => setUseExternalKey(event.target.checked)} className="mt-0.5 accent-orange-500" />
              <span>Set up an external FIDO2 key, such as VeriMark</span>
            </label>
            <p className="text-xs text-slate-500">Fingerprint verification stays on the authenticator; MarsMedic stores only the passkey credential.</p>
            <p className="text-xs text-slate-500">This account is stored on this computer. The PIN is hashed and health details are encrypted locally. Back up the database and its separate encryption key together.</p>
            {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
            <button type="submit" disabled={busy} className="btn-mission w-full py-3">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Fingerprint className="h-4 w-4" />}
              {useExternalKey ? 'Create account and set up VeriMark' : 'Create account and set up passkey'}
            </button>
            <button type="button" onClick={() => { setMode('login'); setError(''); }} className="w-full py-2 text-sm text-slate-400 hover:text-slate-200">Back to sign in</button>
          </form>
        )}

        <div className="my-4 flex items-center gap-3 text-xs text-slate-500"><span className="h-px flex-1 bg-slate-800" />or<span className="h-px flex-1 bg-slate-800" /></div>
        <button onClick={enterGuest} className="btn-mission w-full py-3 text-amber-300"><UserRound className="h-4 w-4" /> Continue as guest</button>
        <p className="mt-3 text-center text-xs text-slate-500">External fingerprint readers must support FIDO2/WebAuthn passkeys.</p>
      </div>
    </div>
  );
}