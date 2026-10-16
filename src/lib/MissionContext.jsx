import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { startAuthentication, startRegistration } from '@simplewebauthn/browser';
import { localApi } from '@/lib/localApi';

const MissionContext = createContext(null);
export const useMission = () => useContext(MissionContext);

const SEVERITY_PENALTY = { EMERGENCY: 30, HIGH: 20, MEDIUM: 10, LOW: 4 };

export function MissionProvider({ children }) {
  const [session, setSession] = useState(null);
  const [patient, setPatient] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [diagnosis, setDiagnosisState] = useState(null);
  const [completedSteps, setCompletedSteps] = useState({});
  const [temperatureUnit, setTemperatureUnitState] = useState(() => {
    try {
      return localStorage.getItem('marsmedic_temperature_unit') === 'F' ? 'F' : 'C';
    } catch {
      return 'C';
    }
  });
  const [earthQueue, setEarthQueue] = useState([]);
  const [liveVitals, setLiveVitalsState] = useState(null);
  const [events, setEvents] = useState([]);
  const authChannel = useRef(null);

  const clearSessionState = useCallback(() => {
    setPatient(null);
    setSession(null);
    setEvents([]);
    setDiagnosisState(null);
    setCompletedSteps({});
    setEarthQueue([]);
    setLiveVitalsState(null);
  }, []);

  const notifyAuthChange = useCallback(() => {
    authChannel.current?.postMessage('session-changed');
    try { localStorage.setItem('marsmedic_auth_revision', String(Date.now())); } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    let active = true;
    localApi('/auth/logout', { method: 'POST', body: { entries: [] } })
      .catch(() => {})
      .finally(() => { if (active) setSessionLoading(false); });
    return () => { active = false; };
  }, []);

  const isGuest = session?.method === 'guest';
  const recordEvent = useCallback((type, details) => {
    setEvents((current) => [...current, { type, details: String(details || '').slice(0, 1000), at: new Date().toISOString() }].slice(-100));
  }, []);

  const setPatientSession = useCallback(({ profile, startedAt }) => {
    setPatient({
      ...profile,
      conditions: Array.isArray(profile?.conditions) ? profile.conditions : [],
      medicalHistoryEntries: Array.isArray(profile?.medicalHistoryEntries) ? profile.medicalHistoryEntries : [],
    });
    setSession({ method: 'patient', startedAt: startedAt || new Date().toISOString() });
    setEvents([]);
    setDiagnosisState(null);
    setCompletedSteps({});
    setEarthQueue([]);
    setLiveVitalsState(null);
    notifyAuthChange();
  }, [notifyAuthChange]);

  const createAccount = useCallback(async (details) => {
    const result = await localApi('/auth/register', { method: 'POST', body: details });
    setPatientSession(result);
  }, [setPatientSession]);

  const loginWithPin = useCallback(async (username, pin) => {
    const result = await localApi('/auth/login-pin', { method: 'POST', body: { username, pin } });
    setPatientSession(result);
  }, [setPatientSession]);

  const loginWithPasskey = useCallback(async (username) => {
    const options = await localApi('/passkeys/login/options', { method: 'POST', body: { username } });
    const response = await startAuthentication({ optionsJSON: options });
    const result = await localApi('/passkeys/login/verify', {
      method: 'POST',
      body: { ...response, challenge: options.challenge },
    });
    setPatientSession(result);
  }, [setPatientSession]);

  const registerPasskey = useCallback(async () => {
    const options = await localApi('/passkeys/register/options', { method: 'POST', body: {} });
    const response = await startRegistration({ optionsJSON: options });
    await localApi('/passkeys/register/verify', {
      method: 'POST',
      body: { ...response, challenge: options.challenge },
    });
    setPatient((current) => current ? { ...current, hasPasskey: true } : current);
  }, []);

  const updateProfile = useCallback(async (details) => {
    const result = await localApi('/profile', { method: 'PUT', body: details });
    const updated = {
      ...result.profile,
      conditions: Array.isArray(result.profile?.conditions) ? result.profile.conditions : [],
      medicalHistoryEntries: Array.isArray(result.profile?.medicalHistoryEntries) ? result.profile.medicalHistoryEntries : [],
    };
    setPatient(updated);
    return updated;
  }, []);

  const changePin = useCallback((currentPin, newPin) => (
    localApi('/profile/pin', { method: 'POST', body: { currentPin, newPin } })
  ), []);

  const loginGuest = useCallback(async () => {
    try {
      await localApi('/auth/logout', {
        method: 'POST',
        body: {
          startedAt: session?.startedAt,
          entries: session?.method === 'patient' ? events : [],
        },
      });
    } catch { /* Guest mode remains available if the local service is unavailable. */ }
    setPatient(null);
    setSession({ method: 'guest', startedAt: new Date().toISOString() });
    setEvents([]);
    setDiagnosisState(null);
    setCompletedSteps({});
    setEarthQueue([]);
    setLiveVitalsState(null);
    notifyAuthChange();
  }, [session, events, notifyAuthChange]);

  useEffect(() => {
    try {
      localStorage.removeItem('marsmedic_patient_profiles');
      localStorage.removeItem('marsmedic_crew_conditions');
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const channel = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel('marsmedic-auth');
    authChannel.current = channel;
    const onChange = () => clearSessionState();
    channel?.addEventListener('message', onChange);
    window.addEventListener('storage', onChange);
    return () => {
      channel?.removeEventListener('message', onChange);
      channel?.close();
      window.removeEventListener('storage', onChange);
    };
  }, [clearSessionState]);

  const logout = useCallback(async () => {
    try {
      if (session?.method === 'patient') {
        await localApi('/session/end', { method: 'POST', body: { startedAt: session.startedAt, entries: events } });
      }
    } finally {
      clearSessionState();
      notifyAuthChange();
    }
  }, [session, events, clearSessionState, notifyAuthChange]);

  const updateDiagnosis = useCallback((next) => {
    setDiagnosisState(next);
    if (next) recordEvent('Assessment', `${next.name || 'Assessment'} · ${next.severity || 'severity not recorded'}`);
  }, [recordEvent]);

  const setTemperatureUnit = useCallback((unit) => {
    if (unit !== 'C' && unit !== 'F') return;
    setTemperatureUnitState(unit);
    try {
      localStorage.setItem('marsmedic_temperature_unit', unit);
    } catch {
      // The preference still applies for this session if storage is unavailable.
    }
  }, []);

  const toggleStep = useCallback((diagnosisId, idx) => {
    if (diagnosis?.id !== diagnosisId || !Number.isInteger(idx) || idx < 0) return;
    const arr = completedSteps[diagnosisId] || [];
    if (idx > arr.length) return;
    setCompletedSteps((prev) => {
      const current = prev[diagnosisId] || [];
      if (idx > current.length) return prev;
      return { ...prev, [diagnosisId]: idx < current.length ? current.slice(0, idx) : [...current, idx] };
    });
    recordEvent('Treatment plan', `Updated step ${idx + 1} for ${diagnosisId}`);
  }, [completedSteps, diagnosis, recordEvent]);

  const queueEarthPacket = useCallback((packet) => {
    setEarthQueue((current) => [...current, packet]);
    recordEvent('Earth alert', `Queued packet: ${packet.diagnosis || 'medical summary'}`);
  }, [recordEvent]);

  const queueEmergencyPacket = useCallback((packet) => {
    setEarthQueue((current) => [...current, packet]);
  }, []);

  const setLiveVitals = useCallback((readings) => {
    setLiveVitalsState(readings);
    if (readings) recordEvent('Vitals', `HR ${readings.hr ?? '—'}, BP ${readings.bpSys ? `${readings.bpSys}/${readings.bpDia}` : '—'}, SpO2 ${readings.spo2 ?? '—'}%, temperature ${readings.temp ?? '—'}°C`);
  }, [recordEvent]);

  const persistConditions = useCallback(async (conditions) => {
    if (!patient) return;
    const updated = await updateProfile({ ...patient, conditions });
    setPatient(updated);
  }, [patient, updateProfile]);

  const applyDiagnosisToCrew = useCallback((dx) => {
    if (!patient || !dx) return;
    const current = patient.conditions || [];
    if (current.some((condition) => condition.id === dx.id)) return;
    const condition = {
      id: dx.id,
      name: dx.name,
      severity: dx.severity,
      penalty: SEVERITY_PENALTY[dx.severity] ?? 5,
      date: Date.now(),
    };
    persistConditions([...current, condition]);
  }, [patient, persistConditions]);

  const resolveCrewCondition = useCallback((conditionId) => {
    if (!patient) return;
    persistConditions((patient.conditions || []).filter((condition) => condition.id !== conditionId));
  }, [patient, persistConditions]);

  const clearCrewConditions = useCallback((id) => {
    if (patient?.id === id) persistConditions([]);
  }, [patient, persistConditions]);

  const effectiveCrew = useMemo(() => patient ? [patient] : [], [patient]);
  const crew = patient;

  return (
    <MissionContext.Provider value={{
      session,
      sessionLoading,
      isGuest,
      patient,
      crew,
      crewId: patient?.id || null,
      effectiveCrew,
      createAccount,
      loginWithPin,
      loginWithPasskey,
      loginGuest,
      registerPasskey,
      updateProfile,
      changePin,
      logout,
      diagnosis,
      setDiagnosis: updateDiagnosis,
      completedSteps,
      toggleStep,
      temperatureUnit,
      setTemperatureUnit,
      earthQueue,
      queueEarthPacket,
      queueEmergencyPacket,
      liveVitals,
      setLiveVitals,
      recordEvent,
      applyDiagnosisToCrew,
      resolveCrewCondition,
      clearCrewConditions,
    }}>
      {children}
    </MissionContext.Provider>
  );
}