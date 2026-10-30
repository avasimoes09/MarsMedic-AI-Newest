// Collects and formats the patient's editable health-profile details.
import { useMission } from '@/lib/MissionContext';
import { celsiusToFahrenheit, fahrenheitToCelsius } from '@/lib/temperature';

const FIELDS = [
  { key: 'dateOfBirth', label: 'Date of birth', type: 'date' },
  { key: 'bloodType', label: 'Blood type', placeholder: 'For example, O+' },
  { key: 'heartRate', label: 'Heart rate (bpm)', type: 'number', placeholder: 'Optional', min: 0, max: 300 },
  { key: 'bloodPressure', label: 'Blood pressure', placeholder: 'For example, 120/80' },
  { key: 'temperature', label: 'Temperature', type: 'number', placeholder: 'Optional', min: 25, max: 45, step: 0.1 },
  { key: 'oxygenSaturation', label: 'Oxygen saturation (%)', type: 'number', placeholder: 'Optional', min: 0, max: 100 },
  { key: 'respiratoryRate', label: 'Respiratory rate (breaths/min)', type: 'number', placeholder: 'Optional', min: 0, max: 100 },
  { key: 'allergies', label: 'Allergies', placeholder: 'List allergies or enter None' },
  { key: 'medications', label: 'Current medications', placeholder: 'Medication and dosage' },
  { key: 'medicalHistory', label: 'Medical conditions and history', placeholder: 'Conditions, procedures, or relevant history', multiline: true },
  { key: 'notes', label: 'Additional health notes', placeholder: 'Other information for the care team', multiline: true },
];

export const EMPTY_HEALTH_PROFILE = Object.fromEntries(FIELDS.map(({ key }) => [key, '']));

export default function PatientHealthFields({ value, onChange }) {
  const { temperatureUnit, setTemperatureUnit } = useMission();

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {FIELDS.map((field) => (
        <div key={field.key} className={`space-y-1.5 text-sm text-slate-300 ${field.multiline ? 'sm:col-span-2' : ''}`}>
          <label htmlFor={`health-field-${field.key}`} className="block">{field.label}</label>
          {field.key === 'temperature' && (
            <div className="flex gap-1" aria-label="Temperature unit">
              {['C', 'F'].map((unit) => (
                <button
                  key={unit}
                  type="button"
                  aria-pressed={temperatureUnit === unit}
                  onClick={() => setTemperatureUnit(unit)}
                  className={`rounded border px-2 py-0.5 text-xs ${temperatureUnit === unit ? 'border-blue-500 bg-blue-950/50 text-slate-100' : 'border-slate-700 text-slate-400'}`}
                >
                  °{unit}
                </button>
              ))}
            </div>
          )}
          {field.multiline ? (
            <textarea
              id={`health-field-${field.key}`}
              value={value[field.key] || ''}
              onChange={(event) => onChange(field.key, event.target.value)}
              placeholder={field.placeholder}
              rows={3}
              maxLength={2000}
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-blue-500"
            />
          ) : (
            <input
              id={`health-field-${field.key}`}
              type={field.type || 'text'}
              value={field.key === 'temperature' && value.temperature
                ? (temperatureUnit === 'F'
                  ? celsiusToFahrenheit(value.temperature).toFixed(1)
                  : value.temperature)
                : value[field.key] || ''}
              onChange={(event) => {
                const inputValue = event.target.value;
                const storedValue = field.key === 'temperature' && inputValue && temperatureUnit === 'F'
                  ? fahrenheitToCelsius(inputValue).toFixed(1)
                  : inputValue;
                onChange(field.key, storedValue);
              }}
              placeholder={field.placeholder}
              min={field.key === 'temperature' && temperatureUnit === 'F' ? 77 : field.min}
              max={field.key === 'temperature' && temperatureUnit === 'F' ? 113 : field.max}
              step={field.step}
              maxLength={field.type === 'number' ? undefined : 200}
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-blue-500"
            />
          )}
        </div>
      ))}
    </div>
  );
}