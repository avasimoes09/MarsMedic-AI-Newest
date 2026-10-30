// Tests environmental sensor measurement decoding and simulated readings.
import assert from 'node:assert/strict';
import test from 'node:test';
import { createSimulatedEnvironmentalReadings, decodeEnvironmentalMeasurement } from './useEnvironmentalDevice.js';

test('decodes standard environmental BLE measurements', () => {
  const temperature = new DataView(new ArrayBuffer(2));
  temperature.setInt16(0, 2150, true);
  assert.equal(decodeEnvironmentalMeasurement('temperatureC', temperature), 21.5);

  const humidity = new DataView(new ArrayBuffer(2));
  humidity.setUint16(0, 4567, true);
  assert.equal(decodeEnvironmentalMeasurement('humidity', humidity), 45.67);

  const pressure = new DataView(new ArrayBuffer(4));
  pressure.setUint32(0, 1013250, true);
  assert.equal(decodeEnvironmentalMeasurement('pressureKpa', pressure), 101.325);

  const co2 = new DataView(new ArrayBuffer(2));
  co2.setUint16(0, 650, true);
  assert.equal(decodeEnvironmentalMeasurement('co2Ppm', co2), 650);
});

test('rejects incomplete or unknown environmental measurements', () => {
  assert.throws(() => decodeEnvironmentalMeasurement('temperatureC', new DataView(new ArrayBuffer(1))), RangeError);
  assert.throws(() => decodeEnvironmentalMeasurement('unknown', new DataView(new ArrayBuffer(2))), RangeError);
});

test('generates plausible changing environmental demo readings', () => {
  const readings = createSimulatedEnvironmentalReadings(undefined, () => 0.75);
  assert.deepEqual(readings, {
    temperatureC: 23.07,
    humidity: 48,
    pressureKpa: 100.03,
    co2Ppm: 1210,
  });

  const next = createSimulatedEnvironmentalReadings(readings, () => 0);
  assert.ok(next.temperatureC < readings.temperatureC);
  assert.ok(next.humidity < readings.humidity);
  assert.ok(next.pressureKpa < readings.pressureKpa);
  assert.ok(next.co2Ppm < readings.co2Ppm);
});
