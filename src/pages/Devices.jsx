import PageHeader from '@/components/PageHeader';
import VitalsTelemetry from '@/components/VitalsTelemetry';
import { Radio } from 'lucide-react';

export default function Devices() {
  return (
    <div>
      <PageHeader title="Vital Devices" subtitle="BLE GATT · live telemetry" icon={Radio} />
      <div className="mx-auto max-w-3xl">
        <VitalsTelemetry showAttach />
        <p className="mt-4 text-sm text-slate-400">
          Connect a BLE pulse oximeter, BP cuff, or thermometer. Readings stream offline and can be attached to an assessment or saved to the crew member's digital twin.
        </p>
      </div>
    </div>
  );
}