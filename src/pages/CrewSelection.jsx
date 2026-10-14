import { useNavigate } from 'react-router-dom';
import { useMission } from '@/lib/MissionContext';
import { CREW } from '@/lib/missionData';
import { Rocket, LogOut } from 'lucide-react';

export default function CrewSelection() {
  const { selectCrew, crewId, requestAuth, logout } = useMission();
  const navigate = useNavigate();

  const choose = (id) => {
    if (crewId && crewId !== id) {
      requestAuth(() => { selectCrew(id); navigate('/dashboard'); });
    } else {
      selectCrew(id);
      navigate('/dashboard');
    }
  };

  const exitToLogin = () => requestAuth(() => { logout(); navigate('/'); });

  const dotClass = (s) => (s === 'green' ? 'bg-emerald-500' : s === 'yellow' ? 'bg-amber-500' : 'bg-red-500');
  const tone = (s) => (s === 'green' ? 'text-emerald-400' : s === 'yellow' ? 'text-amber-400' : 'text-red-400');

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 py-10">
      <button onClick={exitToLogin} className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700">
        <LogOut className="h-3.5 w-3.5" /> Exit to Login
      </button>
      <div className="mb-2 flex items-center gap-2 text-slate-400"><Rocket className="h-4 w-4" /><span className="text-xs font-medium">Crew Manifest</span></div>
      <h1 className="mb-8 text-center text-2xl font-bold text-slate-100">Select Crew Member</h1>
      <div className="grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CREW.map((c) => (
          <button key={c.id} onClick={() => choose(c.id)} className="panel panel-glow p-6 text-center transition hover:border-blue-500">
            <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-slate-800 text-xl font-bold text-slate-300">{c.initials}</div>
            <div className="text-lg font-bold text-slate-100">{c.name}</div>
            <div className="mb-3 text-xs text-slate-400">{c.role}</div>
            <span className={`inline-block h-2.5 w-2.5 rounded-full ${dotClass(c.status)}`} />
            <div className={`mt-1 font-mono text-xl font-bold ${tone(c.status)}`}>{c.score}/100</div>
          </button>
        ))}
      </div>
      {crewId && <p className="mt-6 text-center text-xs text-slate-500">Switching crew requires fingerprint re-authentication.</p>}
    </div>
  );
}