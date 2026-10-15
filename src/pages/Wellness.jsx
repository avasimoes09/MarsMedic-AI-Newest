import { useEffect, useMemo, useState } from 'react';
import { useMission } from '@/lib/MissionContext';
import PageHeader from '@/components/PageHeader';
import SleepPanel from '@/components/wellness/SleepPanel';
import FoodPanel from '@/components/wellness/FoodPanel';
import PatternInsights from '@/components/wellness/PatternInsights';
import { analyzeWellness } from '@/lib/wellnessPatterns';
import { todayISO } from '@/lib/wellnessData';
import { Moon, Loader2 } from 'lucide-react';

export default function Wellness() {
  const { crew, recordEvent } = useMission();
  const [sleepLogs, setSleepLogs] = useState([]);
  const [mealLogs, setMealLogs] = useState([]);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setLoading(false);
  }, []);

  const logSleep = async (entry) => {
    const payload = { ...entry, crew_id: crew?.id, crew_name: crew?.name };
    recordEvent('Sleep', JSON.stringify(entry));
    setBusy(true);
    try {
      setSleepLogs((prev) => [{ id: `g-${Date.now()}`, ...payload, created_date: new Date().toISOString() }, ...prev]);
    } finally {
      setBusy(false);
    }
  };

  const logMeal = async (entry) => {
    const payload = { ...entry, crew_id: crew?.id, crew_name: crew?.name };
    recordEvent('Nutrition', JSON.stringify(entry));
    setBusy(true);
    try {
      setMealLogs((prev) => [{ id: `g-${Date.now()}`, ...payload, created_date: new Date().toISOString() }, ...prev]);
    } finally {
      setBusy(false);
    }
  };

  const removeSleep = async (id) => {
    setSleepLogs((prev) => prev.filter((l) => l.id !== id));
  };

  const removeMeal = async (id) => {
    setMealLogs((prev) => prev.filter((l) => l.id !== id));
  };

  const analysis = useMemo(() => analyzeWellness(sleepLogs, mealLogs), [sleepLogs, mealLogs]);

  const saveInsight = async (payload) => {
    const record = { ...payload, crew_id: crew?.id, crew_name: crew?.name, generated_on: todayISO() };
    recordEvent('Wellness insight', JSON.stringify(payload));
    setBusy(true);
    try {
      setInsights((prev) => [{ id: `g-${Date.now()}`, ...record, created_date: new Date().toISOString() }, ...prev]);
    } finally {
      setBusy(false);
    }
  };

  const removeInsight = async (id) => {
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