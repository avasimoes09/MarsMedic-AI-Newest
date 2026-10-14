import { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMission } from '@/lib/MissionContext';
import PageHeader from '@/components/PageHeader';
import SleepPanel from '@/components/wellness/SleepPanel';
import FoodPanel from '@/components/wellness/FoodPanel';
import PatternInsights from '@/components/wellness/PatternInsights';
import { analyzeWellness } from '@/lib/wellnessPatterns';
import { todayISO } from '@/lib/wellnessData';
import { Moon, Loader2 } from 'lucide-react';

export default function Wellness() {
  const { crew, isGuest } = useMission();
  const [sleepLogs, setSleepLogs] = useState([]);
  const [mealLogs, setMealLogs] = useState([]);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isGuest) {
      setSleepLogs([]);
      setMealLogs([]);
      setInsights([]);
      setLoading(false);
      return;
    }
    const query = crew ? { crew_id: crew.id } : {};
    setLoading(true);
    Promise.all([
      base44.entities.SleepLog.filter(query, { sort: '-created_date', limit: 30 }),
      base44.entities.MealLog.filter(query, { sort: '-created_date', limit: 50 }),
      base44.entities.WellnessInsight.filter(query, { sort: '-created_date', limit: 10 }),
    ])
      .then(([sleep, meals, saved]) => {
        setSleepLogs(sleep.items);
        setMealLogs(meals.items);
        setInsights(saved.items);
      })
      .finally(() => setLoading(false));
  }, [crew, isGuest]);

  const logSleep = async (entry) => {
    const payload = { ...entry, crew_id: crew?.id, crew_name: crew?.name };
    setBusy(true);
    try {
      if (isGuest) {
        setSleepLogs((prev) => [{ id: `g-${Date.now()}`, ...payload, created_date: new Date().toISOString() }, ...prev]);
      } else {
        const rec = await base44.entities.SleepLog.create(payload);
        setSleepLogs((prev) => [rec, ...prev]);
      }
    } finally {
      setBusy(false);
    }
  };

  const logMeal = async (entry) => {
    const payload = { ...entry, crew_id: crew?.id, crew_name: crew?.name };
    setBusy(true);
    try {
      if (isGuest) {
        setMealLogs((prev) => [{ id: `g-${Date.now()}`, ...payload, created_date: new Date().toISOString() }, ...prev]);
      } else {
        const rec = await base44.entities.MealLog.create(payload);
        setMealLogs((prev) => [rec, ...prev]);
      }
    } finally {
      setBusy(false);
    }
  };

  const removeSleep = async (id) => {
    if (!isGuest) await base44.entities.SleepLog.delete(id);
    setSleepLogs((prev) => prev.filter((l) => l.id !== id));
  };

  const removeMeal = async (id) => {
    if (!isGuest) await base44.entities.MealLog.delete(id);
    setMealLogs((prev) => prev.filter((l) => l.id !== id));
  };

  const analysis = useMemo(() => analyzeWellness(sleepLogs, mealLogs), [sleepLogs, mealLogs]);

  const saveInsight = async (payload) => {
    const record = { ...payload, crew_id: crew?.id, crew_name: crew?.name, generated_on: todayISO() };
    setBusy(true);
    try {
      if (isGuest) {
        setInsights((prev) => [{ id: `g-${Date.now()}`, ...record, created_date: new Date().toISOString() }, ...prev]);
      } else {
        const rec = await base44.entities.WellnessInsight.create(record);
        setInsights((prev) => [rec, ...prev]);
      }
    } finally {
      setBusy(false);
    }
  };

  const removeInsight = async (id) => {
    if (!isGuest) await base44.entities.WellnessInsight.delete(id);
    setInsights((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <div>
      <PageHeader title="Sleep & Nutrition" subtitle="Daily intake log · crew wellbeing" icon={Moon} />
      {loading ? (
        <div className="panel flex items-center justify-center gap-2 p-10 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading logs…
        </div>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <SleepPanel logs={sleepLogs} onSave={logSleep} onDelete={removeSleep} busy={busy} />
            <FoodPanel logs={mealLogs} onSave={logMeal} onDelete={removeMeal} busy={busy} />
          </div>
          <div className="mt-4">
            <PatternInsights
              analysis={analysis}
              saved={insights}
              onSave={saveInsight}
              onDelete={removeInsight}
              busy={busy}
              crewName={crew?.name}
            />
          </div>
        </>
      )}
    </div>
  );
}