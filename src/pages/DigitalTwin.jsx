// Displays the active patient's locally stored health record and history.
import { useNavigate } from 'react-router-dom';
import { useMission } from '@/lib/MissionContext';
import PageHeader from '@/components/PageHeader';
import { Activity, Pencil } from 'lucide-react';
import { formatTemperature } from '@/lib/temperature';

function HealthField({ label, value }) {
  return (
    <div className="rounded-md border border-slate-800 bg-slate-900 p-3">
      <div className="text-[11px] font-medium uppercase text-slate-400">{label}</div>
      <div className="mt-1 whitespace-pre-wrap text-sm text-slate-200">{value || 'Not recorded'}</div>
    </div>
  );
}

export default function DigitalTwin() {
  const { crew, liveVitals, temperatureUnit } = useMission();
  const navigate = useNavigate();
  const conditions = Array.isArray(crew?.conditions) ? crew.conditions : [];

  if (!crew) {
    return (
      <div>
        <PageHeader title="Patient Health Record" subtitle="No patient selected" icon={Activity} />
        <div className="panel p-6 text-sm text-slate-400">Select or add a patient profile to view health information.</div>
        <button onClick={() => navigate('/crew')} className="btn-mission mt-4">Manage patient profiles</button>
      </div>
    );
  }

  const fields = [
    ['Date of birth', crew.dateOfBirth],
    ['Blood type', crew.bloodType],
    ['Allergies', crew.allergies],
    ['Current medications', crew.medications],
    ['Medical conditions and history', crew.medicalHistory],
    ['Additional health notes', crew.notes],
  ];

  return (
    <div>
      <PageHeader title="Patient Health Record" subtitle={crew.name} icon={Activity} />
      <div className="mb-4 flex justify-end">
        <button onClick={() => navigate('/crew')} className="btn-mission py-2 text-sm"><Pencil className="h-4 w-4" /> Manage profiles</button>
      </div>
      {liveVitals && (
        <div className="panel panel-glow mb-4 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-100"><Activity className="h-4 w-4 text-blue-400" />Live Vitals · {liveVitals.source}</div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <HealthField label="Heart rate" value={liveVitals.hr ? `${liveVitals.hr} bpm` : ''} />
            <HealthField label="Blood pressure" value={liveVitals.bpSys ? `${liveVitals.bpSys}/${liveVitals.bpDia} mmHg` : ''} />
            <HealthField label="Temperature" value={liveVitals.temp != null ? formatTemperature(liveVitals.temp, temperatureUnit) : ''} />
            <HealthField label="Oxygen saturation" value={liveVitals.spo2 ? `${liveVitals.spo2}%` : ''} />
            <HealthField label="Respiratory rate" value={liveVitals.respiratoryRate ? `${liveVitals.respiratoryRate}/min` : ''} />
          </div>
        </div>
      )}
      <div className="panel panel-glow mb-4 p-4">
        <div className="mb-3 text-sm font-semibold text-slate-100">Saved device readings</div>
        {crew.deviceReadings?.length ? (
          <ul className="space-y-3">
            {[...crew.deviceReadings].reverse().slice(0, 20).map((reading, index) => (
              <li key={`${reading.recordedAt}-${index}`} className="border-b border-slate-800 pb-3 last:border-0 last:pb-0">
                <div className="text-xs text-slate-400">
                  {reading.type === 'environmental' ? 'Environmental sensor' : 'Vital-sign device'} · {reading.source} · {new Date(reading.recordedAt).toLocaleString()}
                </div>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-200">
                  {Object.entries(reading.readings || {}).map(([key, value]) => (
                    <span key={key}>{key}: {value}{key === 'hr' ? ' bpm' : key === 'spo2' || key === 'humidity' ? '%' : key === 'bpSys' || key === 'bpDia' ? ' mmHg' : key === 'temp' || key === 'temperatureC' ? ' °C' : key === 'pressureKpa' ? ' kPa' : key === 'co2Ppm' ? ' ppm' : ''}</span>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-sm text-slate-400">No device readings have been saved.</div>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map(([label, value]) => <HealthField key={label} label={label} value={value} />)}
      </div>
      <div className="panel mt-4 p-4">
        <div className="mb-2 text-sm font-semibold text-slate-100">Assessment history</div>
        {conditions.length ? (
          <ul className="space-y-2 text-sm text-slate-300">
            {conditions.map((condition) => <li key={condition.id}>{condition.name} · {condition.severity} · {new Date(condition.date).toLocaleDateString()}</li>)}
          </ul>
        ) : (
          <div className="text-sm text-slate-400">No assessments recorded for this patient.</div>
        )}
      </div>
      <div className="panel mt-4 p-4">
        <div className="mb-2 text-sm font-semibold text-slate-100">Session medical history</div>
        {crew.medicalHistoryEntries?.length ? (
          <ul className="space-y-3 text-sm text-slate-300">
            {[...crew.medicalHistoryEntries].reverse().map((entry, index) => (
              <li key={`${entry.endedAt}-${index}`} className="border-b border-slate-800 pb-3 last:border-0 last:pb-0">
                <div className="text-xs text-slate-400">Session ended {entry.endedAt ? new Date(entry.endedAt).toLocaleString() : 'at unknown time'}</div>
                {entry.entries?.length ? (
                  <ul className="mt-1 space-y-1">
                    {entry.entries.map((item, itemIndex) => <li key={`${item.at}-${itemIndex}`}>{item.type}: {item.details}</li>)}
                  </ul>
                ) : <div className="mt-1 text-slate-400">No clinical events were recorded during this session.</div>}
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-sm text-slate-400">No session history has been recorded.</div>
        )}
      </div>
    </div>
  );
}