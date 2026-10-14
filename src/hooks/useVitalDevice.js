import { useState, useRef, useCallback, useEffect } from 'react';

// Reusable Web Bluetooth (BLE) hook for streaming vital signs from GATT monitors.
// Supports Heart Rate (0x180D), Pulse Oximeter Spot-Check (0x1822), Temperature (0x1809).
// Falls back to a built-in simulator when Web Bluetooth is unavailable (e.g. preview, iOS).
export function useVitalDevice() {
  const [status, setStatus] = useState('idle'); // idle | scanning | connected | error | unsupported
  const [deviceName, setDeviceName] = useState('');
  const [readings, setReadings] = useState({ hr: null, spo2: null, bpSys: null, bpDia: null, temp: null });
  const [waveform, setWaveform] = useState([]);
  const deviceRef = useRef(null);
  const serverRef = useRef(null);
  const simRef = useRef(null);
  const supported = typeof navigator !== 'undefined' && !!navigator.bluetooth;

  const reset = useCallback(() => {
    setDeviceName('');
    setReadings({ hr: null, spo2: null, bpSys: null, bpDia: null, temp: null });
    setWaveform([]);
  }, []);

  const disconnect = useCallback(() => {
    if (simRef.current) { clearInterval(simRef.current); simRef.current = null; }
    if (serverRef.current) { try { serverRef.current.disconnect(); } catch {} serverRef.current = null; }
    if (deviceRef.current) { try { deviceRef.current.removeEventListener('gattserverdisconnected', disconnect); } catch {} deviceRef.current = null; }
    setStatus('idle');
    reset();
  }, [reset]);

  const connect = useCallback(async () => {
    if (!supported) { setStatus('unsupported'); return; }
    try {
      setStatus('scanning');
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: ['heart_rate'] }, { services: [0x1822] }, { services: [0x1809] }],
        optionalServices: ['heart_rate', 0x1822, 0x1809, 'device_information'],
      });
      deviceRef.current = device;
      device.addEventListener('gattserverdisconnected', disconnect);
      const server = await device.gatt.connect();
      serverRef.current = server;
      setDeviceName(device.name || 'BLE VITAL MONITOR');
      setStatus('connected');

      // Heart Rate service (0x180D)
      try {
        const svc = await server.getPrimaryService('heart_rate');
        const chr = await svc.getCharacteristic('heart_rate_measurement');
        chr.addEventListener('characteristicvaluechanged', (e) => {
          const dv = e.target.value;
          const flags = dv.getUint8(0);
          const hr = flags & 1 ? dv.getUint16(1, true) : dv.getUint8(1);
          setReadings((r) => ({ ...r, hr }));
          setWaveform((w) => [...w.slice(-80), hr]);
        });
        await chr.startNotifications();
      } catch {}

      // Pulse Oximeter Spot-Check (0x1822) — SFLOAT spo2 + pulse rate
      try {
        const svc = await server.getPrimaryService(0x1822);
        const chr = await svc.getCharacteristic(0x2a5e);
        chr.addEventListener('characteristicvaluechanged', (e) => {
          const dv = e.target.value;
          if (dv.byteLength >= 5) {
            const spo2 = dv.getInt16(1, true) & 0x3fff;
            const pulse = dv.getInt16(3, true) & 0x3fff;
            setReadings((r) => ({ ...r, spo2, hr: r.hr ?? pulse }));
          }
        });
        await chr.startNotifications();
      } catch {}

      // Health Thermometer (0x1809)
      try {
        const svc = await server.getPrimaryService(0x1809);
        const chr = await svc.getCharacteristic('temperature_measurement');
        chr.addEventListener('characteristicvaluechanged', (e) => {
          const dv = e.target.value;
          if (dv.byteLength >= 3) {
            const temp = dv.getInt16(1, true) / 100;
            setReadings((r) => ({ ...r, temp }));
          }
        });
        await chr.startNotifications();
      } catch {}
    } catch {
      setStatus('error');
    }
  }, [supported, disconnect]);

  // Simulator for environments without a real BLE device (keeps the UI live offline).
  const simulate = useCallback(() => {
    setStatus('connected');
    setDeviceName('SIMULATED PULSE-OX');
    let t = 0;
    simRef.current = setInterval(() => {
      t += 0.12;
      const hr = 72 + Math.round(Math.sin(t) * 7 + (Math.random() - 0.5) * 5);
      setReadings((r) => ({
        ...r,
        hr,
        spo2: 96 + Math.round(Math.random() * 3),
        bpSys: 118 + Math.round(Math.random() * 6),
        bpDia: 76 + Math.round(Math.random() * 4),
        temp: 36.7,
      }));
      setWaveform((w) => [...w.slice(-80), hr]);
    }, 600);
  }, []);

  useEffect(() => () => { if (simRef.current) clearInterval(simRef.current); }, []);

  return { status, deviceName, readings, waveform, supported, connect, disconnect, simulate };
}