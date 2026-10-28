import { useEffect, useState, useCallback } from 'react';
import PageHeader from '@/components/PageHeader';
import { INVENTORY as SEED } from '@/lib/missionData';
import { FOOD_UNITS, SPACE_FOODS } from '@/lib/wellnessData';
import { Boxes, AlertTriangle, Plus, Trash2, Check, X, Pencil, Utensils, CupSoda } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const defaultThreshold = (unit) => (unit === 'bags' || unit === 'patches' ? 10 : 30);
const isLow = (it) => it.quantity < (it.low_threshold ?? defaultThreshold(it.unit));
const UNITS = ['tablets', 'capsules', 'patches', 'bags', 'units', 'vials', 'mL'];
const FOOD_CATEGORIES = ['Food', 'Drink'];
const INVENTORY_STORAGE_KEY = 'marsmedic_shared_inventory_v1';
const seedItems = () => SEED.map((s, i) => ({ id: `g_${i}`, name: s.name, quantity: s.quantity, unit: s.unit, description: s.description, usage: s.usage, low_threshold: defaultThreshold(s.unit) }));

const inputCls = 'w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-blue-500 focus:outline-none';

export default function Inventory() {
  const [items, setItems] = useState(null);
  const [foodItems, setFoodItems] = useState([]);
  const [activeTab, setActiveTab] = useState('medical');
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const load = useCallback(async () => {
    let saved;
    try {
      saved = JSON.parse(localStorage.getItem(INVENTORY_STORAGE_KEY) || 'null');
    } catch {
      saved = null;
    }
    setItems(Array.isArray(saved?.medicalItems) ? saved.medicalItems : seedItems());
    setFoodItems(Array.isArray(saved?.foodItems) ? saved.foodItems : []);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (items === null) return;
    try {
      localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify({ medicalItems: items, foodItems }));
    } catch { /* Inventory stays available for this session if storage is unavailable. */ }
  }, [items, foodItems]);

  const currentItems = activeTab === 'medical' ? items : foodItems;
  const setCurrentItems = activeTab === 'medical' ? setItems : setFoodItems;
  const unitOptions = activeTab === 'medical' ? UNITS : FOOD_UNITS;

  const startEdit = (it) => { setEditing(it.id); setDraft({ ...it }); };
  const startNew = () => {
    setEditing('new');
    setDraft({
      name: '',
      quantity: 0,
      unit: activeTab === 'medical' ? 'tablets' : 'servings',
      category: activeTab === 'medical' ? 'Medical' : 'Food',
      description: '',
      usage: '',
      low_threshold: activeTab === 'medical' ? 30 : 3,
    });
  };
  const cancel = () => { setEditing(null); setDraft(null); };

  const save = async () => {
    if (!draft?.name || draft.quantity == null) return;
    setSaving(true);
    try {
      const payload = { ...draft, low_threshold: draft.low_threshold ?? defaultThreshold(draft.unit) };
      setCurrentItems((prev) => editing === 'new' ? [...prev, { ...payload, id: `g_${Date.now()}` }] : prev.map((it) => it.id === editing ? { ...it, ...payload } : it));
      cancel();
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setCurrentItems((prev) => prev.filter((it) => it.id !== itemToDelete.id));
    setItemToDelete(null);
  };

  const set = (k, v) => setDraft((d) => ({ ...d, [k]: v }));
  const renderItems = (list, emptyMessage) => list.length === 0 ? (
    <div className="panel p-8 text-center">
      <Utensils className="mx-auto mb-3 h-8 w-8 text-emerald-400" />
      <p className="text-sm text-slate-300">{emptyMessage}</p>
    </div>
  ) : (
    <div className="grid gap-3 md:grid-cols-2">
      {list.map((it) => {
        const low = isLow(it);
        const isEditing = editing === it.id;
        return (
          <div key={it.id} className={`panel p-4 ${low ? 'border-amber-700' : ''}`}>
            {isEditing ? (
              <div className="space-y-3">
                <input value={draft.name} onChange={(e) => set('name', e.target.value)} placeholder="Name" list={activeTab === 'food' ? 'space-food-options' : undefined} className={inputCls} />
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {activeTab === 'food' && (
                    <select value={draft.category} onChange={(e) => set('category', e.target.value)} className={inputCls} aria-label="Food or drink">
                      {FOOD_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
                    </select>
                  )}
                  <input type="number" min="0" value={draft.quantity} onChange={(e) => set('quantity', Number(e.target.value))} placeholder="Qty" className={inputCls} />
                  <select value={draft.unit} onChange={(e) => set('unit', e.target.value)} className={inputCls} aria-label="Quantity unit">
                    {unitOptions.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
                  </select>
                  <input type="number" min="0" value={draft.low_threshold} onChange={(e) => set('low_threshold', Number(e.target.value))} placeholder="Low" className={inputCls} aria-label="Low-stock threshold" />
                </div>
                <input value={draft.description || ''} onChange={(e) => set('description', e.target.value)} placeholder="Description" className={inputCls} />
                <textarea value={draft.usage || ''} onChange={(e) => set('usage', e.target.value)} placeholder="Usage or notes" rows={2} className={inputCls} />
                <div className="flex gap-2">
                  <button onClick={save} disabled={saving} className="btn-mission py-2 text-sm"><Check className="h-4 w-4" /> Save</button>
                  <button onClick={cancel} className="btn-mission py-2 text-sm"><X className="h-4 w-4" /> Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-slate-100">{it.name}</div>
                    {activeTab === 'food' && <span className="mt-1 inline-block text-[11px] font-medium uppercase tracking-wide text-emerald-300">{it.category}</span>}
                  </div>
                  <div className={`chip shrink-0 ${low ? 'border-amber-800 bg-amber-950/40 text-amber-300' : 'border-emerald-800 bg-emerald-950/40 text-emerald-300'}`}>{it.quantity} {it.unit}</div>
                </div>
                {it.description && <p className="mt-2 text-sm text-slate-400">{it.description}</p>}
                {it.usage && <div className="mt-2 text-xs text-slate-400"><span className="font-medium">Notes:</span> {it.usage}</div>}
                <div className="mt-1 text-xs text-slate-500">Low-stock threshold: {it.low_threshold ?? defaultThreshold(it.unit)} {it.unit}</div>
                {low && <div className="mt-2 flex items-center gap-1 text-xs text-amber-300"><AlertTriangle className="h-3.5 w-3.5" /> Low stock — request resupply</div>}
                <div className="mt-3 flex justify-between">
                  <button onClick={() => startEdit(it)} className="btn-mission py-2 text-sm"><Pencil className="h-4 w-4" /> Edit</button>
                  <button onClick={() => setItemToDelete(it)} aria-label={`Delete ${it.name}`} className="btn-mission py-2 text-sm text-red-400 hover:bg-red-950/40 hover:border-red-700"><Trash2 className="h-4 w-4" /></button>
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div>
      <PageHeader title="Medical Inventory" subtitle="Local session · not synced to a server" icon={Boxes} />
      <Tabs value={activeTab} onValueChange={(value) => { setActiveTab(value); cancel(); setItemToDelete(null); }}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <TabsList className="grid h-auto w-full max-w-md grid-cols-2 bg-slate-900">
            <TabsTrigger value="medical" className="gap-2"><Boxes className="h-4 w-4" /> Medical Supplies</TabsTrigger>
            <TabsTrigger value="food" className="gap-2"><CupSoda className="h-4 w-4" /> Food &amp; Drink</TabsTrigger>
          </TabsList>
          <button onClick={startNew} className="btn-mission"><Plus className="h-4 w-4" /> Add {activeTab === 'food' ? 'Food or Drink' : 'Item'}</button>
        </div>

        <TabsContent value="medical" className="mt-0">
          {items === null ? <div className="panel p-6 text-sm text-slate-400">Loading supplies…</div> : renderItems(items, 'No medical supplies have been added.')}
        </TabsContent>
        <TabsContent value="food" className="mt-0">
          {renderItems(foodItems, 'No food or drinks in inventory yet. Add stock to begin tracking quantities and low-stock levels.')}
        </TabsContent>
      </Tabs>
      {activeTab === 'food' && <datalist id="space-food-options">{SPACE_FOODS.map((food) => <option key={food} value={food} />)}</datalist>}

      {editing === 'new' && (
        <div className="panel panel-glow mt-4 p-4">
          <div className="mb-2 text-sm font-semibold text-slate-100">New Supply</div>
          <div className="space-y-3">
            <input value={draft.name} onChange={(e) => set('name', e.target.value)} placeholder="Name" list={activeTab === 'food' ? 'space-food-options' : undefined} className={inputCls} />
            {activeTab === 'food' && (
              <select value={draft.category} onChange={(e) => set('category', e.target.value)} className={inputCls} aria-label="Food or drink">
                {FOOD_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            )}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <input type="number" min="0" value={draft.quantity} onChange={(e) => set('quantity', Number(e.target.value))} placeholder="Qty" className={inputCls} />
              <select value={draft.unit} onChange={(e) => set('unit', e.target.value)} className={inputCls}>
                {unitOptions.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
              </select>
              <input type="number" min="0" value={draft.low_threshold} onChange={(e) => set('low_threshold', Number(e.target.value))} placeholder="Low" className={inputCls} />
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

      <AlertDialog open={itemToDelete !== null} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent className="border-slate-700 bg-slate-900 text-slate-100">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {itemToDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              This will remove this supply from your inventory. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={remove} className="bg-red-700 text-white hover:bg-red-600">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}