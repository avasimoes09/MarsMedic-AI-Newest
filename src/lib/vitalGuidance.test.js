import assert from 'node:assert/strict';
import test from 'node:test';
import { decodeBloodPressureMeasurement } from '../hooks/useVitalDevice.js';
import { interpretVitals } from './vitalGuidance.js';

test('unavailable monitor values do not become zero-value emergency flags', () => {
  assert.deepEqual(interpretVitals({ hr: null, spo2: null, bpSys: null, bpDia: null, temp: null }), []);
  assert.deepEqual(interpretVitals(null), []);
});

test('low oxygen produces urgent context related to selected breathing symptoms', () => {
  const [flag] = interpretVitals({ spo2: 88 }, ['shortness_of_breath']);
  assert.equal(flag.key, 'oxygenLow');
  assert.equal(flag.urgency, 'urgent');
  assert.deepEqual(flag.selectedSymptoms, ['shortness_of_breath']);
});

test('typical readings do not produce reference flags', () => {
  assert.deepEqual(interpretVitals({ hr: 72, spo2: 98, bpSys: 120, bpDia: 80, temp: 37 }), []);
});

test('decodes standard mmHg blood-pressure packets', () => {
  const buffer = new ArrayBuffer(7);
  const view = new DataView(buffer);
  view.setUint8(0, 0);
  view.setUint16(1, 120, true);
  view.setUint16(3, 80, true);
  view.setUint16(5, 93, true);
  assert.deepEqual(decodeBloodPressureMeasurement(view), { bpSys: 120, bpDia: 80 });
});

test('converts kPa blood-pressure packets to mmHg', () => {
  const buffer = new ArrayBuffer(7);
  const view = new DataView(buffer);
  view.setUint8(0, 1);
  view.setUint16(1, 16, true);
  view.setUint16(3, 10, true);
  view.setUint16(5, 12, true);
  assert.deepEqual(decodeBloodPressureMeasurement(view), { bpSys: 120, bpDia: 75 });
});