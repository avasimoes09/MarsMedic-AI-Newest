// Hosts the vital-sign and environmental Bluetooth sensor panels.
import PageHeader from '@/components/PageHeader';
import VitalsTelemetry from '@/components/VitalsTelemetry';
import EnvironmentalTelemetry from '@/components/EnvironmentalTelemetry';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Radio, Thermometer } from 'lucide-react';

export default function Devices() {
  return (
    <div>
      <PageHeader title="Vital Devices" subtitle="BLE GATT · live telemetry" icon={Radio} />
      <div className="mx-auto max-w-3xl">
        <Tabs defaultValue="vitals">
          <TabsList className="mb-4 h-auto w-full justify-start gap-1 overflow-x-auto bg-slate-900">
            <TabsTrigger value="vitals" className="gap-2"><Radio className="h-4 w-4" /> Vital signs</TabsTrigger>
            <TabsTrigger value="environment" className="gap-2"><Thermometer className="h-4 w-4" /> Environment</TabsTrigger>
          </TabsList>
          <TabsContent value="vitals">
            <VitalsTelemetry showAttach />
            <p className="mt-4 text-sm text-slate-400">
              Connect a BLE pulse oximeter, BP cuff, or thermometer. Readings stream offline and can be attached to an assessment or saved to the crew member's digital twin.
            </p>
          </TabsContent>
          <TabsContent value="environment">
            <EnvironmentalTelemetry />
            <p className="mt-4 text-sm text-slate-400">
              Environmental telemetry reads temperature, humidity, barometric pressure, and carbon dioxide from compatible Bluetooth Environmental Sensing Service devices.
            </p>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}