import { Outlet, useNavigate, Navigate } from 'react-router-dom';
import { useMission } from '@/lib/MissionContext';
import MissionClock from './MissionClock';
import { Home, Radio, Stethoscope, HeartPulse, Boxes, FileText, Bluetooth, LogOut, Moon, Loader2 } from 'lucide-react';

const NAV = [
  { to: '/dashboard', label: 'Bridge', icon: Home },
  { to: '/devices', label: 'Devices', icon: Bluetooth },
  { to: '/twin', label: 'Patient Health Record', icon: HeartPulse },
  { to: '/wellness', label: 'Wellness', icon: Moon },
  { to: '/assessment', label: 'Assess', icon: Stethoscope },
  { to: '/inventory', label: 'Inventory', icon: Boxes },
  { to: '/earth-alert', label: 'Earth Alert', icon: Radio },
  { to: '/commander', label: 'Patient Records', icon: FileText },
];

export default function MissionShell() {
  const { session, sessionLoading, crew, logout, isGuest } = useMission();
  const navigate = useNavigate();
  if (sessionLoading) return <div className="flex min-h-screen items-center justify-center bg-slate-950"><Loader2 className="h-6 w-6 animate-spin text-blue-400" aria-label="Restoring local session" /></div>;
  if (!session) return <Navigate to="/" replace />;
  if (!isGuest && !crew) return <Navigate to="/crew" replace />;

  const switchCrew = () => navigate('/crew');
  const exitToLogin = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-900">
        <div className="flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 text-sm font-bold text-white">M</div>
            <div>
              <div className="text-sm font-semibold text-slate-100">MarsMedic AI</div>
              <div className="text-xs text-slate-400">Mission Control · Mars Transit</div>
            </div>
            {isGuest && <span className="ml-1 rounded-full border border-amber-700 bg-amber-950/50 px-2 py-0.5 text-[11px] font-medium text-amber-300">Guest</span>}
          </div>
          <MissionClock />
          <div className="flex items-center gap-2">
            <button onClick={exitToLogin} className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-700">
              <LogOut className="h-3.5 w-3.5" /> Exit
            </button>
            {isGuest ? (
              <div className="flex items-center gap-2 rounded-md border border-amber-800 bg-amber-950/40 px-3 py-1.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-900 text-xs font-bold text-amber-200">G</div>
                <div className="text-left">
                  <div className="text-xs font-semibold text-amber-200">Guest User</div>
                  <div className="text-[11px] text-amber-400">No patient selected</div>
                </div>
              </div>
            ) : (
              <button onClick={switchCrew} className="flex items-center gap-2 rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 transition hover:bg-slate-700">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-700 text-xs font-bold text-slate-200">{crew.initials}</div>
                <div className="text-left">
                  <div className="text-xs font-semibold text-slate-100">{crew.name}</div>
                  <div className="text-[11px] text-slate-400">{crew.bloodType || 'Patient profile'}</div>
                </div>
              </button>
            )}
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-2">
          {NAV.map((n) => {
            const I = n.icon;
            return (
              <button key={n.to} onClick={() => navigate(n.to)} className="flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium text-slate-400 transition hover:bg-slate-800 hover:text-slate-100">
                <I className="h-3.5 w-3.5" />{n.label}
              </button>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>

    </div>
  );
}