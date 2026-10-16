import assert from 'node:assert/strict';
import test from 'node:test';
import { celsiusToFahrenheit, fahrenheitToCelsius, formatTemperature } from './temperature.js';

test('temperature conversion preserves canonical Celsius values', () => {
  assert.equal(celsiusToFahrenheit(37), 98.6);
  assert.equal(fahrenheitToCelsius(98.6), 37);
});

test('temperature formatter honors the selected unit and missing readings', () => {
  assert.equal(formatTemperature(37, 'C'), '37.0 °C');
  assert.equal(formatTemperature(37, 'F'), '98.6 °F');
  assert.equal(formatTemperature(null, 'F'), '—');
});
