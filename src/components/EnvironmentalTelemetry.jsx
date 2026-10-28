import { useMission } from '@/lib/MissionContext';
import { celsiusToFahrenheit } from '@/lib/temperature';
import { useEnvironmentalDevice } from '@/hooks/useEnvironmentalDevice';
import { BluetoothConnected, Cloud, Thermometer, Activity } from 'lucide-react';
import { useState } from 'react';

function SensorReading({ label, value, unit, icon: Icon }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-400">
        <Icon className="h-4 w-4 text-blue-400" /> {label}
      </div>
      <div className="mt-2 font-mono text-2xl font-bold text-slate-100">{value ?? '—'}</div>
      <div className="text-xs text-slate-500">{unit}</div>
    </div>
  );
}

export default function EnvironmentalTelemetry() {
  const { temperatureUnit, setTemperatureUnit, saveDeviceReading, patient, isGuest } = useMission();
  const { status, deviceName, readings, error, supported, connect, disconnect, simulate } = useEnvironmentalDevice();
  const connected = status === 'connected' || status === 'simulated';
  const simulated = status === 'simulated';
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const temperature = readings.temperatureC == null
    ? null
    : temperatureUnit === 'F'
      ? celsiusToFahrenheit(readings.temperatureC).toFixed(1)
      : readings.temperatureC.toFixed(1);

  return (
    <section className="panel panel-glow p-4" aria-labelledby="environment-heading">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="environment-heading" className="text-base font-semibold text-slate-100">Environmental Status</h2>
          <p className="mt-1 text-xs text-slate-400">Live readings from compatible BLE environmental sensors</p>
        </div>
        <span className={`chip ${simulated ? 'border-amber-800 bg-amber-950/40 text-amber-300' : connected ? 'border-emerald-800 bg-emerald-950/40 text-emerald-300' : 'border-slate-700 bg-slate-800 text-slate-400'}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${simulated ? 'bg-amber-500' : connected ? 'bg-emerald-500' : 'bg-slate-500'}`} />
          {simulated ? 'Demo stream' : connected ? 'Streaming' : status === 'scanning' ? 'Scanning' : status === 'error' ? 'Error' : 'Offline'}
        </span>
      </div>

      {connected && (
        <div className="mt-4 flex items-center gap-2 text-sm text-slate-300">
          {simulated
            ? <Activity className="h-4 w-4 text-amber-400" />
            : <BluetoothConnected className="h-4 w-4 text-blue-400" />}
          {deviceName}
        </div>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-400">
        <span className="mr-1">Temperature unit</span>
        {['C', 'F'].map((unit) => (
          <button
            key={unit}
            type="button"
            aria-pressed={temperatureUnit === unit}
            onClick={() => setTemperatureUnit(unit)}
            className={`rounded border px-3 py-1.5 ${temperatureUnit === unit ? 'border-blue-500 bg-blue-950/50 text-slate-100' : 'border-slate-700 text-slate-400 hover:border-slate-500'}`}
          >
            °{unit}
          </button>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SensorReading label="Temperature" value={temperature} unit={`°${temperatureUnit}`} icon={Thermometer} />
        <SensorReading label="Humidity" value={readings.humidity?.toFixed(1) ?? null} unit="%" icon={Cloud} />
        <SensorReading label="Air pressure" value={readings.pressureKpa?.toFixed(2) ?? null} unit="kPa" icon={Cloud} />
        <SensorReading label="Carbon dioxide" value={readings.co2Ppm ?? null} unit="ppm" icon={Cloud} />
      </div>

      {simulated && <p className="mt-3 text-xs text-amber-300">Simulated readings for preview only; not measured by a real sensor.</p>}
      {error && <p role="alert" className="mt-3 text-sm text-red-300">{error}</p>}
      {saveError && <p role="alert" className="mt-3 text-sm text-red-300">{saveError}</p>}
      {saveMessage && <p role="status" className="mt-3 text-sm text-emerald-300">{saveMessage}</p>}
      {!connected && !error && (
        <p className="mt-3 text-xs text-slate-400">
          {supported
            ? 'Connect a BLE Environmental Sensing Service (0x181A) device. Unsupported sensor values remain blank.'
            : 'Web Bluetooth is not available in this browser. Environmental readings require a compatible BLE sensor.'}
        </p>
      )}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button onClick={connected ? disconnect : connect} disabled={status === 'scanning'} className="btn-mission flex-1 py-3">
          {connected ? 'Disconnect sensor' : status === 'scanning' ? 'Searching for sensors…' : 'Connect environmental sensor'}
        </button>
        {!connected && (
          <button onClick={simulate} className="btn-mission flex-1 py-3 text-amber-300">
            Simulate live readings
          </button>
        )}
      </div>
      {status === 'connected' && (
        <button
          type="button"
          disabled={saving || !patient || isGuest}
          onClick={async () => {
            setSaving(true);
            setSaveError('');
            setSaveMessage('');
            try {
              await saveDeviceReading('environmental', deviceName, readings);
              setSaveMessage("Sensor readings saved to this patient's encrypted local record.");
            } catch (saveRequestError) {
              setSaveError(saveRequestError.message);
            } finally {
              setSaving(false);
            }
          }}
          className="btn-mission mt-2 w-full py-3 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save readings to patient record'}
        </button>
      )}
      {!patient && status === 'connected' && <p className="mt-2 text-xs text-slate-400">Sign in to a patient account to save readings.</p>}
    </section>
  );
}
