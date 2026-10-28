import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMission } from '@/lib/MissionContext';
import PatientHealthFields, { EMPTY_HEALTH_PROFILE } from '@/components/PatientHealthFields';
import PageHeader from '@/components/PageHeader';
import { Fingerprint, KeyRound, Loader2, Save } from 'lucide-react';

const inputClass = 'w-full max-w-xs rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500';

export default function CrewSelection() {
  const { patient, updateProfile, changePin, registerPasskey, isGuest } = useMission();
  const navigate = useNavigate();
  const [profile, setProfile] = useState({ ...EMPTY_HEALTH_PROFILE });
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!patient || isGuest) {
      navigate(isGuest ? '/dashboard' : '/', { replace: true });
      return;
    }
    setProfile({
      name: patient.name,
      ...Object.fromEntries(Object.keys(EMPTY_HEALTH_PROFILE).map((key) => [key, patient[key] || ''])),
    });
  }, [patient, isGuest, navigate]);

  const saveProfile = async (event) => {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    setError('');
    try {
      await updateProfile({ ...profile, name: profile.name });
      setMessage('Health profile updated.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  const savePin = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');
    if (!/^\d{4}$/.test(newPin)) return setError('New PIN must contain exactly four digits.');
    if (newPin !== confirmPin) return setError('PIN confirmation does not match.');
    setBusy(true);
    try {
      await changePin(currentPin, newPin);
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      setMessage('PIN changed.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  const addPasskey = async (externalOnly = false) => {
    setBusy(true);
    setMessage('');
    setError('');
    try {
      await registerPasskey({ externalOnly });
      setMessage(externalOnly ? 'External security key added.' : 'Device passkey added.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  if (!patient || isGuest) return null;

  return (
    <div>
      <PageHeader title="My Patient Profile" subtitle={patient.name} icon={KeyRound} />
      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <form onSubmit={saveProfile} className="panel panel-glow space-y-4 p-5">
          <h2 className="text-base font-semibold text-slate-100">Health information</h2>
          <label className="block space-y-1.5 text-sm text-slate-300">Full name
            <input value={profile.name || ''} onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))} required maxLength={100} className={inputClass} autoComplete="name" />
          </label>
          <PatientHealthFields value={profile} onChange={(key, value) => setProfile((current) => ({ ...current, [key]: value }))} />
          <button type="submit" disabled={busy} className="btn-mission"><Save className="h-4 w-4" /> Save changes</button>
        </form>

        <div className="space-y-4">
          <form onSubmit={savePin} className="panel p-5">
            <h2 className="mb-4 text-base font-semibold text-slate-100">Change PIN</h2>
            <div className="space-y-3">
              <label className="block space-y-1.5 text-sm text-slate-300">Current PIN
                <input type="password" value={currentPin} onChange={(event) => setCurrentPin(event.target.value.replace(/\D/g, '').slice(0, 4))} inputMode="numeric" pattern="[0-9]{4}" maxLength={4} required className={inputClass} autoComplete="current-password" />
              </label>
              <label className="block space-y-1.5 text-sm text-slate-300">New four-digit PIN
                <input type="password" value={newPin} onChange={(event) => setNewPin(event.target.value.replace(/\D/g, '').slice(0, 4))} inputMode="numeric" pattern="[0-9]{4}" maxLength={4} required className={inputClass} autoComplete="new-password" />
              </label>
              <label className="block space-y-1.5 text-sm text-slate-300">Confirm new PIN
                <input type="password" value={confirmPin} onChange={(event) => setConfirmPin(event.target.value.replace(/\D/g, '').slice(0, 4))} inputMode="numeric" pattern="[0-9]{4}" maxLength={4} required className={inputClass} autoComplete="new-password" />
              </label>
            </div>
            <button type="submit" disabled={busy} className="btn-mission mt-4">Change PIN</button>
          </form>

          <div className="panel p-5">
            <h2 className="mb-2 text-base font-semibold text-slate-100">Fingerprint sign-in</h2>
            <p className="mb-4 text-xs text-slate-400">Register a VeriMark USB key or this device’s built-in biometric. Fingerprint verification stays on the authenticator.</p>
            {patient.hasPasskey && <p className="mb-3 text-xs text-emerald-400">A passkey is registered. You can add another reader or device.</p>}
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => addPasskey(true)} disabled={busy} className="btn-mission">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Fingerprint className="h-4 w-4" />}
                Set up VeriMark key
              </button>
              <button type="button" onClick={() => addPasskey(false)} disabled={busy} className="btn-mission">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Fingerprint className="h-4 w-4" />}
                {patient.hasPasskey ? 'Add device passkey' : 'Use this device'}
              </button>
            </div>
          </div>
        </div>
      </div>
      {message && <p role="status" className="mt-4 text-sm text-emerald-400">{message}</p>}
      {error && <p role="alert" className="mt-4 text-sm text-red-400">{error}</p>}
    </div>
  );
}