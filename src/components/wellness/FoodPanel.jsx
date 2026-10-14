import { useState } from 'react';
import { Utensils, Save, Trash2 } from 'lucide-react';
import { AMOUNT_OPTIONS, FOOD_UNITS, SPACE_FOODS, formatClock, todayISO } from '@/lib/wellnessData';

export default function FoodPanel({ logs, onSave, onDelete, busy }) {
  const [food, setFood] = useState('');
  const [amount, setAmount] = useState(1);
  const [unit, setUnit] = useState('servings');

  const save = () => {
    onSave({ log_date: todayISO(), food_name: food.trim(), amount, unit });
    setFood('');
    setAmount(1);
    setUnit('servings');
  };

  return (
    <div className="panel p-5">
      <div className="mb-4 flex items-center gap-2">
        <Utensils className="h-4 w-4 text-emerald-400" />
        <span className="text-sm font-semibold text-slate-100">Food Intake</span>
      </div>

      <label className="text-xs text-slate-400">What did you eat?</label>
      <input
        list="space-foods"
        value={food}
        onChange={(e) => setFood(e.target.value)}
        placeholder="Type a food…"
        className="mb-3 mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-600"
      />
      <datalist id="space-foods">
        {SPACE_FOODS.map((f) => <option key={f} value={f} />)}
      </datalist>

      <div className="text-xs text-slate-400">Quick pick · common space foods</div>
      <div className="mt-2 flex max-h-28 flex-wrap gap-2 overflow-y-auto">
        {SPACE_FOODS.slice(0, 14).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFood(f)}
            className={`chip transition ${food === f ? 'border-emerald-600 bg-emerald-950/50 text-emerald-200' : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-emerald-700'}`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="mt-4 text-xs text-slate-400">Amount</div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {AMOUNT_OPTIONS.map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => setAmount(a)}
            className={`rounded-md border px-4 py-2 text-sm font-mono transition ${amount === a ? 'border-emerald-500 bg-emerald-950/50 text-emerald-200' : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-emerald-700'}`}
          >
            {a}
          </button>
        ))}
        <select
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-600"
        >
          {FOOD_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
        </select>
      </div>

      <button onClick={save} disabled={busy || !food.trim()} className="btn-mission mt-4 w-full disabled:opacity-60">
        <Save className="h-4 w-4" /> Log Food
      </button>

      {logs.length > 0 && (
        <div className="mt-5">
          <div className="mb-2 text-xs font-medium text-slate-400">Recent Food</div>
          <ul className="space-y-2">
            {logs.slice(0, 8).map((l) => (
              <li key={l.id} className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-900 px-3 py-2">
                <div>
                  <div className="text-sm text-slate-200">{l.food_name}</div>
                  <div className="text-[11px] text-slate-500">{formatClock(l.created_date)} · {l.log_date}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-emerald-300">{l.amount} {l.unit}</span>
                  <button onClick={() => onDelete(l.id)} className="text-slate-500 transition hover:text-red-400">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}