const FIELDS = [
  { key: 'dateOfBirth', label: 'Date of birth', type: 'date' },
  { key: 'bloodType', label: 'Blood type', placeholder: 'For example, O+' },
  { key: 'heartRate', label: 'Heart rate (bpm)', type: 'number', placeholder: 'Optional', min: 0, max: 300 },
  { key: 'bloodPressure', label: 'Blood pressure', placeholder: 'For example, 120/80' },
  { key: 'temperature', label: 'Temperature (°C)', type: 'number', placeholder: 'Optional', min: 25, max: 45, step: 0.1 },
  { key: 'oxygenSaturation', label: 'Oxygen saturation (%)', type: 'number', placeholder: 'Optional', min: 0, max: 100 },
  { key: 'respiratoryRate', label: 'Respiratory rate (breaths/min)', type: 'number', placeholder: 'Optional', min: 0, max: 100 },
  { key: 'allergies', label: 'Allergies', placeholder: 'List allergies or enter None' },
  { key: 'medications', label: 'Current medications', placeholder: 'Medication and dosage' },
  { key: 'medicalHistory', label: 'Medical conditions and history', placeholder: 'Conditions, procedures, or relevant history', multiline: true },
  { key: 'notes', label: 'Additional health notes', placeholder: 'Other information for the care team', multiline: true },
];

export const EMPTY_HEALTH_PROFILE = Object.fromEntries(FIELDS.map(({ key }) => [key, '']));

export default function PatientHealthFields({ value, onChange }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {FIELDS.map((field) => (
        <label key={field.key} className={`block space-y-1.5 text-sm text-slate-300 ${field.multiline ? 'sm:col-span-2' : ''}`}>
          <span>{field.label}</span>
          {field.multiline ? (
            <textarea
              value={value[field.key] || ''}
              onChange={(event) => onChange(field.key, event.target.value)}
              placeholder={field.placeholder}
              rows={3}
              maxLength={2000}
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-blue-500"
            />
          ) : (
            <input
              type={field.type || 'text'}
              value={value[field.key] || ''}
              onChange={(event) => onChange(field.key, event.target.value)}
              placeholder={field.placeholder}
              min={field.min}
              max={field.max}
              step={field.step}
              maxLength={field.type === 'number' ? undefined : 200}
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-blue-500"
            />
          )}
        </label>
      ))}
    </div>
  );
}