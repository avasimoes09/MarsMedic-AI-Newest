import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMission } from '@/lib/MissionContext';
import { INVENTORY as SEED } from '@/lib/missionData';
import VitalsTelemetry from '@/components/VitalsTelemetry';
import { Stethoscope, HeartPulse, Boxes, FileText, Radio, Mic, AlertTriangle, ChevronRight, Bluetooth, Moon } from 'lucide-react';

const TOOLS = [
  { to: '/devices', label: 'Vital Devices', icon: Bluetooth, color: 'cyan' },
  { to: '/assessment', label: 'New Assessment', icon: Stethoscope, color: 'cyan' },
  { to: '/twin', label: 'Patient Health Record', icon: HeartPulse, color: 'cyan' },
  { to: '/inventory', label: 'Medical Inventory', icon: Boxes, color: 'cyan' },
  { to: '/commander', label: 'Patient Records', icon: FileText, color: 'cyan' },
  { to: '/earth-alert', label: 'Earth Alert', icon: Radio, color: 'amber' },
  { to: '/voice', label: 'Voice Assessment', icon: Mic, color: 'cyan' },
  { to: '/wellness', label: 'Sleep & Food', icon: Moon, color: 'cyan' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { liveVitals, crew, effectiveCrew } = useMission();
  const [lowStock, setLowStock] = useState([]);

  useEffect(() => {
    const low = SEED.filter((it) => it.quantity < (it.unit === 'bags' || it.unit === 'patches' ? 10 : 30))
      .map((it, i) => ({ id: `g_${i}`, name: it.name, quantity: it.quantity, unit: it.unit }));
    setLowStock(low);
  }, []);

  return (
    <div>
      <div className="mb-6">
        <div className="text-xs font-medium text-slate-400">System · Medical</div>
        <h1 className="text-2xl font-bold text-slate-100">Mission Medical Readiness</h1>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <VitalsTelemetry compact />
        </div>
        <div className="space-y-4">
          <div className="panel p-4">
            <div className="mb-3 flex items-center gap-2 text-slate-100">
              <ChevronRight className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-semibold">Quick Actions</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => navigate('/devices')} className="btn-mission py-3 text-sm"><Bluetooth className="h-4 w-4" /> Connect Device</button>
              <button onClick={() => navigate('/assessment')} className="btn-mission py-3 text-sm"><Stethoscope className="h-4 w-4" /> Assess</button>
              <button onClick={() => navigate('/twin')} className="btn-mission py-3 text-sm"><HeartPulse className="h-4 w-4" /> Health Profile</button>
              <button onClick={() => navigate('/inventory')} className="btn-mission py-3 text-sm"><Boxes className="h-4 w-4" /> Inventory</button>
            </div>
            {liveVitals && (
              <div className="mt-3 rounded-md border border-blue-800 bg-blue-950/40 p-2 text-xs text-blue-300">
                Live vitals attached · HR {liveVitals.hr ?? '—'} · SpO₂ {liveVitals.spo2 ?? '—'}
              </div>
            )}
          </div>

          <div className="panel p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-100">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                <span className="text-sm font-semibold">Low-Stock Alerts</span>
              </div>
              <span className="chip border-amber-800 bg-amber-950/40 text-amber-300">{lowStock.length}</span>
            </div>
            {lowStock.length === 0 ? (
              <div className="text-xs text-slate-400">All supplies nominal.</div>
            ) : (
              <ul className="space-y-2">
                {lowStock.slice(0, 4).map((it) => (
                  <li key={it.id} className="flex items-center justify-between rounded-md border border-amber-800 bg-amber-950/40 px-3 py-2">
                    <span className="text-sm text-slate-300">{it.name}</span>
                    <span className="font-mono text-xs text-amber-300">{it.quantity} {it.unit}</span>
                  </li>
                ))}
              </ul>
            )}
            <button onClick={() => navigate('/inventory')} className="btn-mission mt-3 w-full py-2.5 text-sm">Manage Inventory</button>
          </div>
        </div>
      </div>

      <div className="mb-3 mt-8 flex items-center justify-between">
        <div className="text-xs font-medium text-slate-400">Patient Health Profile</div>
        <button onClick={() => navigate('/crew')} className="text-xs font-medium text-blue-400 hover:text-blue-300">Manage profiles</button>
      </div>
      <div className="mb-8">
        {crew ? (
          <button onClick={() => navigate('/twin')} className="panel w-full p-4 text-left transition hover:border-blue-500">
            <div className="text-sm font-semibold text-slate-100">{crew.name}</div>
            <div className="mt-1 text-xs text-slate-400">{crew.bloodType || 'Blood type not recorded'} · {crew.allergies ? `Allergies: ${crew.allergies}` : 'Allergies not recorded'}</div>
          </button>
        ) : (
          <button onClick={() => navigate('/crew')} className="panel w-full p-4 text-left text-sm text-slate-400 transition hover:border-blue-500">
            {effectiveCrew.length ? 'Select a patient profile to view health information.' : 'No patient profiles have been added.'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {TOOLS.map((b) => {
          const I = b.icon;
          const toneCls = b.color === 'red'
            ? 'border-slate-800 bg-slate-900 text-slate-300 hover:border-red-700 hover:bg-red-950/40'
            : b.color === 'amber'
              ? 'border-slate-800 bg-slate-900 text-slate-300 hover:border-amber-700 hover:bg-amber-950/40'
              : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-blue-600 hover:bg-blue-950/40';
          return (
            <button key={b.label} onClick={() => navigate(b.to)} className={`flex flex-col items-center justify-center gap-2 rounded-lg border p-5 text-center font-medium transition active:scale-[0.99] ${toneCls}`}>
              <I className="h-6 w-6" />
              <span className="text-sm leading-tight">{b.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}