import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { CREW } from './missionData';

const MissionContext = createContext(null);
export const useMission = () => useContext(MissionContext);

const SEVERITY_PENALTY = { EMERGENCY: 30, HIGH: 20, MEDIUM: 10, LOW: 4 };
const STORAGE_KEY = 'marsmedic_crew_conditions';

function loadConditions() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
}

function withOverrides(base, conditions) {
  const totalPenalty = Math.min(50, conditions.reduce((s, c) => s + c.penalty, 0));
  const score = Math.max(0, Math.min(100, base.score - totalPenalty));
  const status = score >= 85 ? 'green' : score >= 70 ? 'yellow' : 'red';
  const statusLabel = status === 'green' ? 'Operational' : status === 'yellow' ? 'Monitor' : 'Medical Review';
  return { ...base, score, status, statusLabel, conditions };
}

export function MissionProvider({ children }) {
  const [session, setSession] = useState(null);
  const [crewId, setCrewId] = useState(null);
  const [diagnosis, setDiagnosis] = useState(null);
  const [completedSteps, setCompletedSteps] = useState({});
  const [earthQueue, setEarthQueue] = useState([]);
  const [liveVitals, setLiveVitals] = useState(null);
  const [authGate, setAuthGate] = useState(null);
  const [crewConditions, setCrewConditions] = useState(loadConditions);

  const isGuest = session?.method === 'guest';
  const login = useCallback((method) => setSession({ method, startedAt: Date.now() }), []);
  const logout = useCallback(() => {
    setSession(null); setCrewId(null); setDiagnosis(null); setCompletedSteps({}); setEarthQueue([]); setLiveVitals(null);
  }, []);
  const selectCrew = useCallback((id) => setCrewId(id), []);

  const effectiveCrew = useMemo(
    () => CREW.map((c) => withOverrides(c, crewConditions[c.id] || [])),
    [crewConditions]
  );
  const crew = useMemo(() => effectiveCrew.find((c) => c.id === crewId) || null, [effectiveCrew, crewId]);

  const toggleStep = useCallback((diagnosisId, idx) => {
    setCompletedSteps((prev) => {
      const arr = prev[diagnosisId] || [];
      return { ...prev, [diagnosisId]: arr.includes(idx) ? arr.filter((i) => i !== idx) : [...arr, idx] };
    });
  }, []);

  const queueEarthPacket = useCallback((packet) => setEarthQueue((q) => [...q, packet]), []);
  const requestAuth = useCallback((cb, title) => setAuthGate({ cb, title }), []);
  const clearAuth = useCallback(() => setAuthGate(null), []);

  const applyDiagnosisToCrew = useCallback((dx) => {
    if (!crewId || !dx) return;
    setCrewConditions((prev) => {
      const list = prev[crewId] || [];
      if (list.some((c) => c.id === dx.id)) return prev;
      const penalty = SEVERITY_PENALTY[dx.severity] ?? 5;
      const next = { ...prev, [crewId]: [...list, { id: dx.id, name: dx.name, severity: dx.severity, penalty, date: Date.now() }] };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, [crewId]);

  const resolveCrewCondition = useCallback((conditionId) => {
    if (!crewId || !conditionId) return;
    setCrewConditions((prev) => {
      const list = prev[crewId] || [];
      const next = { ...prev, [crewId]: list.filter((c) => c.id !== conditionId) };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, [crewId]);

  const clearCrewConditions = useCallback((id) => {
    setCrewConditions((prev) => {
      const next = { ...prev };
      delete next[id];
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  return (
    <MissionContext.Provider
      value={{ session, isGuest, login, logout, crewId, selectCrew, crew, effectiveCrew, diagnosis, setDiagnosis, completedSteps, toggleStep, earthQueue, queueEarthPacket, liveVitals, setLiveVitals, authGate, requestAuth, clearAuth, crewConditions, applyDiagnosisToCrew, resolveCrewCondition, clearCrewConditions }}
    >
      {children}
    </MissionContext.Provider>
  );
}