import { useState } from 'react';
import { Moon, Sun, Save, Trash2 } from 'lucide-react';
import DigitalClockPicker from './DigitalClockPicker';
import { hoursBetween, todayISO } from '@/lib/wellnessData';

export default function SleepPanel({ logs, onSave, onDelete, busy }) {
  const [date, setDate] = useState(todayISO());
  const [sleepTime, setSleepTime] = useState('22:30');
  const [wakeTime, setWakeTime] = useState('06:30');
  const hours = hoursBetween(sleepTime, wakeTime);

  return (
    <div className="panel p-5">
      <div className="mb-4 flex items-center gap-2">
        <Moon className="h-4 w-4 text-blue-400" />
        <span className="text-sm font-semibold text-slate-100">Sleep Log</span>
      </div>

      <label className="text-xs text-slate-400">Date</label>
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="mb-4 mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-600"
      />

      <div className="space-y-3">
        <DigitalClockPicker label="Time fell asleep" icon={Moon} accent="blue" value={sleepTime} onChange={setSleepTime} />
        <DigitalClockPicker label="Time woke up" icon={Sun} accent="amber" value={wakeTime} onChange={setWakeTime} />
      </div>

      <div className="mt-4 flex items-center justify-between rounded-md border border-blue-800 bg-blue-950/40 px-4 py-3">
        <span className="text-xs text-blue-300">Total sleep</span>
        <span className="font-mono text-xl font-bold text-blue-200">{hours} h</span>
      </div>

      <button
        onClick={() => onSave({ log_date: date, sleep_time: sleepTime, wake_time: wakeTime, hours })}
        disabled={busy}
        className="btn-mission mt-4 w-full disabled:opacity-60"
      >
        <Save className="h-4 w-4" /> Save Sleep Entry
      </button>

      {logs.length > 0 && (
        <div className="mt-5">
          <div className="mb-2 text-xs font-medium text-slate-400">Recent Sleep</div>
          <ul className="space-y-2">
            {logs.slice(0, 6).map((l) => (
              <li key={l.id} className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-900 px-3 py-2">
                <div>
                  <div className="font-mono text-sm text-slate-200">{l.sleep_time} → {l.wake_time}</div>
                  <div className="text-[11px] text-slate-500">{l.log_date} · {l.hours} h</div>
                </div>
                <button onClick={() => onDelete(l.id)} className="text-slate-500 transition hover:text-red-400">
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}