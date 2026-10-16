export function celsiusToFahrenheit(celsius) {
  return (Number(celsius) * 9) / 5 + 32;
}

export function fahrenheitToCelsius(fahrenheit) {
  return ((Number(fahrenheit) - 32) * 5) / 9;
}

export function formatTemperature(celsius, unit = 'C') {
  if (celsius === null || celsius === undefined || celsius === '') return '—';
  const value = unit === 'F' ? celsiusToFahrenheit(celsius) : Number(celsius);
  return `${value.toFixed(1)} °${unit === 'F' ? 'F' : 'C'}`;
}
