import { useCallback, useEffect, useRef, useState } from 'react';

const ENVIRONMENTAL_SENSING_SERVICE = 0x181a;
const SENSORS = [
  { key: 'temperatureC', id: 0x2a6e, decode: (value) => value.getInt16(0, true) / 100 },
  { key: 'humidity', id: 0x2a6f, decode: (value) => value.getUint16(0, true) / 100 },
  { key: 'pressureKpa', id: 0x2a6d, decode: (value) => value.getUint32(0, true) / 10000 },
  { key: 'co2Ppm', id: 0x2b8c, decode: (value) => value.getUint16(0, true) },
];

export function decodeEnvironmentalMeasurement(key, value) {
  const sensor = SENSORS.find((item) => item.key === key);
  if (!sensor) throw new RangeError(`Unsupported environmental sensor: ${key}`);
  const minimumLength = key === 'pressureKpa' ? 4 : 2;
  if (value.byteLength < minimumLength) throw new RangeError(`Environmental ${key} reading is incomplete.`);
  return sensor.decode(value);
}

const emptyReadings = () => ({
  temperatureC: null,
  humidity: null,
  pressureKpa: null,
  co2Ppm: null,
});

export function createSimulatedEnvironmentalReadings(previous = {}, random = Math.random) {
  const shift = (value, variation, min, max) => {
    const next = (value ?? (min + max) / 2) + (random() - 0.5) * variation;
    return Math.min(max, Math.max(min, Number(next.toFixed(2))));
  };

  return {
    temperatureC: shift(previous.temperatureC, 0.3, 18, 28),
    humidity: shift(previous.humidity, 2, 25, 70),
    pressureKpa: shift(previous.pressureKpa, 0.1, 95, 105),
    co2Ppm: Math.round(shift(previous.co2Ppm, 40, 400, 2000)),
  };
}

export function useEnvironmentalDevice() {
  const [status, setStatus] = useState('idle');
  const [deviceName, setDeviceName] = useState('');
  const [readings, setReadings] = useState(emptyReadings);
  const [error, setError] = useState('');
  const deviceRef = useRef(null);
  const serverRef = useRef(null);
  const simulationRef = useRef(null);
  const supported = typeof navigator !== 'undefined' && Boolean(navigator.bluetooth);

  const disconnect = useCallback(() => {
    if (simulationRef.current) {
      clearInterval(simulationRef.current);
      simulationRef.current = null;
    }
    const device = deviceRef.current;
    deviceRef.current = null;
    if (device) device.removeEventListener('gattserverdisconnected', disconnect);
    if (serverRef.current?.connected) serverRef.current.disconnect();
    serverRef.current = null;
    setStatus('idle');
    setDeviceName('');
    setReadings(emptyReadings());
  }, []);

  const simulate = useCallback(() => {
    disconnect();
    setStatus('simulated');
    setDeviceName('SIMULATED ENVIRONMENT SENSOR');
    setError('');
    setReadings((previous) => createSimulatedEnvironmentalReadings(previous));
    simulationRef.current = setInterval(() => {
      setReadings((previous) => createSimulatedEnvironmentalReadings(previous));
    }, 1200);
  }, [disconnect]);

  const connect = useCallback(async () => {
    if (!supported) {
      setError('Web Bluetooth is unavailable in this browser. Use a supported desktop browser and a secure connection.');
      return;
    }

    setError('');
    setStatus('scanning');
    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [ENVIRONMENTAL_SENSING_SERVICE] }],
        optionalServices: [ENVIRONMENTAL_SENSING_SERVICE],
      });
      if (!device.gatt) throw new Error('This environmental sensor does not provide a GATT connection.');

      deviceRef.current = device;
      device.addEventListener('gattserverdisconnected', disconnect);
      const server = await device.gatt.connect();
      serverRef.current = server;
      const service = await server.getPrimaryService(ENVIRONMENTAL_SENSING_SERVICE);
      let availableSensors = 0;

      for (const sensor of SENSORS) {
        let characteristic;
        try {
          characteristic = await service.getCharacteristic(sensor.id);
        } catch (requestError) {
          if (requestError.name === 'NotFoundError') continue;
          throw requestError;
        }
        availableSensors += 1;
        const updateReading = (value) => {
          setReadings((current) => ({
            ...current,
            [sensor.key]: decodeEnvironmentalMeasurement(sensor.key, value),
          }));
        };
        characteristic.addEventListener('characteristicvaluechanged', (event) => {
          try {
            if (event.target.value) updateReading(event.target.value);
          } catch (readingError) {
            setError(readingError.message);
          }
        });

        let notificationsStarted = false;
        try {
          await characteristic.startNotifications();
          notificationsStarted = true;
        } catch {
          // Read-only sensors can still provide a current measurement.
        }
        try {
          updateReading(await characteristic.readValue());
        } catch (readError) {
          if (!notificationsStarted) throw readError;
        }
      }

      if (!availableSensors) {
        throw new Error('The connected device has no supported temperature, humidity, pressure, or CO₂ sensors.');
      }
      setDeviceName(device.name || 'Environmental sensor');
      setStatus('connected');
    } catch (requestError) {
      disconnect();
      if (requestError.name === 'NotFoundError') {
        setError('');
        return;
      }
      setStatus('error');
      setError(requestError.message || 'Could not connect to the environmental sensor.');
    }
  }, [disconnect, supported]);

  useEffect(() => () => {
    const device = deviceRef.current;
    deviceRef.current = null;
    if (device) {
      device.removeEventListener('gattserverdisconnected', disconnect);
      if (device.gatt?.connected) device.gatt.disconnect();
    }
  }, [disconnect]);

  return { status, deviceName, readings, error, supported, connect, disconnect, simulate };
}
