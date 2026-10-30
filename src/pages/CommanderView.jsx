// Lists locally saved patient records and assessment findings.
import { useMission } from '@/lib/MissionContext';
import PageHeader from '@/components/PageHeader';
import { FileText } from 'lucide-react';

export default function CommanderView() {
  const { effectiveCrew, clearCrewConditions } = useMission();

  return (
    <div>
      <PageHeader title="Patient Records" subtitle="Saved health profiles" icon={FileText} />
      {effectiveCrew.length === 0 ? (
        <div className="panel p-5 text-sm text-slate-400">No patient profiles have been added.</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {effectiveCrew.map((patient) => (
            <PatientRecord key={patient.id} patient={patient} clearCrewConditions={clearCrewConditions} />
          ))}
        </div>
      )}
    </div>
  );
}

function PatientRecord({ patient, clearCrewConditions }) {
  const conditions = Array.isArray(patient.conditions) ? patient.conditions : [];
  return (
    <div className="panel p-4">
      <div className="font-semibold text-slate-100">{patient.name}</div>
      <div className="mt-1 text-xs text-slate-400">
        {[patient.dateOfBirth && `DOB ${patient.dateOfBirth}`, patient.bloodType && `Blood type ${patient.bloodType}`].filter(Boolean).join(' · ') || 'No demographic details recorded'}
      </div>
      <dl className="mt-4 grid gap-3 text-sm">
        <div><dt className="text-xs text-slate-400">Allergies</dt><dd className="mt-0.5 text-slate-200">{patient.allergies || 'Not recorded'}</dd></div>
        <div><dt className="text-xs text-slate-400">Current medications</dt><dd className="mt-0.5 text-slate-200">{patient.medications || 'Not recorded'}</dd></div>
        <div><dt className="text-xs text-slate-400">Medical history</dt><dd className="mt-0.5 whitespace-pre-wrap text-slate-200">{patient.medicalHistory || 'Not recorded'}</dd></div>
      </dl>
      {conditions.length > 0 && (
        <div className="mt-4 border-t border-slate-800 pt-3">
          <div className="mb-2 text-xs font-medium text-slate-400">Assessment findings</div>
          <div className="flex flex-wrap gap-1.5">
            {conditions.map((condition) => <span key={condition.id} className="chip border-slate-700 bg-slate-800 text-slate-300">{condition.severity} · {condition.name}</span>)}
          </div>
          <button onClick={() => clearCrewConditions(patient.id)} className="mt-2 text-xs text-slate-400 hover:text-slate-200">Clear assessment findings</button>
        </div>
      )}
    </div>
  );
}