import { useEffect, useState, useCallback } from 'react';
import PageHeader from '@/components/PageHeader';
import { INVENTORY as SEED } from '@/lib/missionData';
import { Boxes, AlertTriangle, Plus, Trash2, Check, X, Pencil } from 'lucide-react';

const defaultThreshold = (unit) => (unit === 'bags' || unit === 'patches' ? 10 : 30);
const isLow = (it) => it.quantity < (it.low_threshold ?? defaultThreshold(it.unit));
const UNITS = ['tablets', 'capsules', 'patches', 'bags', 'units', 'vials', 'mL'];
const seedItems = () => SEED.map((s, i) => ({ id: `g_${i}`, name: s.name, quantity: s.quantity, unit: s.unit, description: s.description, usage: s.usage, low_threshold: defaultThreshold(s.unit) }));

const inputCls = 'w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-blue-500 focus:outline-none';

export default function Inventory() {
  const [items, setItems] = useState(null);
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setItems(seedItems());
  }, []);

  useEffect(() => { load(); }, [load]);

  const startEdit = (it) => { setEditing(it.id); setDraft({ ...it }); };
  const startNew = () => { setEditing('new'); setDraft({ name: '', quantity: 0, unit: 'tablets', description: '', usage: '', low_threshold: 30 }); };
  const cancel = () => { setEditing(null); setDraft(null); };

  const save = async () => {
    if (!draft?.name || draft.quantity == null) return;
    setSaving(true);
    try {
      const payload = { ...draft, low_threshold: draft.low_threshold ?? defaultThreshold(draft.unit) };
      setItems((prev) => editing === 'new' ? [...prev, { ...payload, id: `g_${Date.now()}` }] : prev.map((it) => it.id === editing ? { ...it, ...payload } : it));
      cancel();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const set = (k, v) => setDraft((d) => ({ ...d, [k]: v }));

  return (
    <div>
      <PageHeader title="Medical Inventory" subtitle="Local session · not synced to a server" icon={Boxes} />
      <div className="mb-4 flex justify-end">
        <button onClick={startNew} className="btn-mission"><Plus className="h-4 w-4" /> Add Item</button>
      </div>

      {items === null ? (
        <div className="panel p-6 text-sm text-slate-400">Loading supplies…</div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((it) => {
            const low = isLow(it);
            const isEditing = editing === it.id;
            return (
              <div key={it.id} className={`panel p-4 ${low ? 'border-amber-700' : ''}`}>
                {isEditing ? (
                  <div className="space-y-3">
                    <input value={draft.name} onChange={(e) => set('name', e.target.value)} placeholder="Name" className={inputCls} />
                    <div className="grid grid-cols-3 gap-2">
                      <input type="number" value={draft.quantity} onChange={(e) => set('quantity', Number(e.target.value))} placeholder="Qty" className={inputCls} />
                      <select value={draft.unit} onChange={(e) => set('unit', e.target.value)} className={inputCls}>
                        {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                      </select>
                      <input type="number" value={draft.low_threshold} onChange={(e) => set('low_threshold', Number(e.target.value))} placeholder="Low" className={inputCls} />
                    </div>
                    <input value={draft.description || ''} onChange={(e) => set('description', e.target.value)} placeholder="Description" className={inputCls} />
                    <textarea value={draft.usage || ''} onChange={(e) => set('usage', e.target.value)} placeholder="Usage" rows={2} className={inputCls} />
                    <div className="flex gap-2">
                      <button onClick={save} disabled={saving} className="btn-mission py-2 text-sm"><Check className="h-4 w-4" /> Save</button>
                      <button onClick={cancel} className="btn-mission py-2 text-sm"><X className="h-4 w-4" /> Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-slate-100">{it.name}</div>
                      <div className={`chip ${low ? 'border-amber-800 bg-amber-950/40 text-amber-300' : 'border-emerald-800 bg-emerald-950/40 text-emerald-300'}`}>{it.quantity} {it.unit}</div>
                    </div>
                    <p className="mt-2 text-sm text-slate-400">{it.description}</p>
                    <div className="mt-2 text-xs text-slate-400"><span className="font-medium">Usage:</span> {it.usage}</div>
                    <div className="mt-1 text-xs text-slate-500">Low-stock threshold: {it.low_threshold ?? defaultThreshold(it.unit)} {it.unit}</div>
                    {low && <div className="mt-2 flex items-center gap-1 text-xs text-amber-300"><AlertTriangle className="h-3.5 w-3.5" /> Low stock — request resupply</div>}
                    <div className="mt-3 flex gap-2">
                      <button onClick={() => startEdit(it)} className="btn-mission py-2 text-sm"><Pencil className="h-4 w-4" /> Edit</button>
                      <button onClick={() => remove(it.id)} className="btn-mission py-2 text-sm text-red-400 hover:bg-red-950/40 hover:border-red-700"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {editing === 'new' && (
        <div className="panel panel-glow mt-4 p-4">
          <div className="mb-2 text-sm font-semibold text-slate-100">New Supply</div>
          <div className="space-y-3">
            <input value={draft.name} onChange={(e) => set('name', e.target.value)} placeholder="Name" className={inputCls} />
            <div className="grid grid-cols-3 gap-2">
              <input type="number" value={draft.quantity} onChange={(e) => set('quantity', Number(e.target.value))} placeholder="Qty" className={inputCls} />
              <select value={draft.unit} onChange={(e) => set('unit', e.target.value)} className={inputCls}>
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
              <input type="number" value={draft.low_threshold} onChange={(e) => set('low_threshold', Number(e.target.value))} placeholder="Low" className={inputCls} />
            </div>
            <input value={draft.description || ''} onChange={(e) => set('description', e.target.value)} placeholder="Description" className={inputCls} />
            <textarea value={draft.usage || ''} onChange={(e) => set('usage', e.target.value)} placeholder="Usage" rows={2} className={inputCls} />
            <div className="flex gap-2">
              <button onClick={save} disabled={saving} className="btn-mission py-2 text-sm"><Check className="h-4 w-4" /> Save</button>
              <button onClick={cancel} className="btn-mission py-2 text-sm"><X className="h-4 w-4" /> Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}