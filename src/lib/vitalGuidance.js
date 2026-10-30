// Provides general reference guidance for vital readings and symptoms.
const symptomContext = {
  heartRateHigh: ['palpitations', 'shortness_of_breath', 'dizziness', 'chest_pain'],
  heartRateLow: ['dizziness', 'weakness', 'confusion', 'shortness_of_breath'],
  oxygenLow: ['shortness_of_breath', 'chest_pain', 'confusion', 'weakness'],
  bloodPressureLow: ['dizziness', 'weakness', 'confusion'],
  bloodPressureHigh: ['headache', 'chest_pain', 'dizziness', 'blurry_vision'],
  temperatureHigh: ['fever', 'cold_sweats', 'confusion'],
  temperatureLow: ['cold_sweats', 'confusion', 'weakness'],
};

function alertFor(readings, selectedSymptoms, key, label, value, guidance, urgency = 'caution') {
  return {
    key,
    label,
    value,
    guidance,
    urgency,
    relatedSymptoms: symptomContext[key],
    selectedSymptoms: symptomContext[key].filter((symptom) => selectedSymptoms.includes(symptom)),
  };
}

const numericReading = (value) => (value === null || value === undefined || value === '' ? NaN : Number(value));

export function interpretVitals(readings = {}, selectedSymptoms = []) {
  if (!readings || typeof readings !== 'object') readings = {};
  const alerts = [];
  const heartRate = numericReading(readings.hr);
  const oxygen = numericReading(readings.spo2);
  const systolic = numericReading(readings.bpSys);
  const diastolic = numericReading(readings.bpDia);
  const temperature = numericReading(readings.temp);

  if (Number.isFinite(heartRate) && heartRate > 100) {
    alerts.push(alertFor(
      readings,
      selectedSymptoms,
      'heartRateHigh',
      'Fast heart rate',
      `${heartRate} bpm`,
      'Above the typical resting adult range. Pain, fever, dehydration, exertion, and other causes can raise heart rate.',
      heartRate >= 130 ? 'urgent' : 'caution',
    ));
  } else if (Number.isFinite(heartRate) && heartRate < 50) {
    alerts.push(alertFor(
      readings,
      selectedSymptoms,
      'heartRateLow',
      'Slow heart rate',
      `${heartRate} bpm`,
      'Below the typical adult resting range; this can be normal for some people. Dizziness, fainting, chest pain, or breathing difficulty needs prompt assessment.',
      heartRate < 40 ? 'urgent' : 'caution',
    ));
  }

  if (Number.isFinite(oxygen) && oxygen < 95) {
    alerts.push(alertFor(
      readings,
      selectedSymptoms,
      'oxygenLow',
      'Low oxygen saturation',
      `${oxygen}%`,
      'Below the usual range. Recheck sensor placement and repeat the reading; a persistent value below 90% can be urgent.',
      oxygen < 90 ? 'urgent' : 'caution',
    ));
  }

  if (Number.isFinite(systolic) && systolic < 90) {
    alerts.push(alertFor(
      readings,
      selectedSymptoms,
      'bloodPressureLow',
      'Low systolic blood pressure',
      `${systolic}/${Number.isFinite(diastolic) ? diastolic : '—'} mmHg`,
      'A low reading with fainting, confusion, severe weakness, or cold clammy skin needs urgent medical assessment.',
      'urgent',
    ));
  } else if ((Number.isFinite(systolic) && systolic >= 180) || (Number.isFinite(diastolic) && diastolic >= 120)) {
    alerts.push(alertFor(
      readings,
      selectedSymptoms,
      'bloodPressureHigh',
      'Very high blood pressure',
      `${Number.isFinite(systolic) ? systolic : '—'}/${Number.isFinite(diastolic) ? diastolic : '—'} mmHg`,
      'Repeat after a few minutes of rest. A repeated value this high, especially with chest pain, severe headache, weakness, or vision changes, is urgent.',
      'urgent',
    ));
  }

  if (Number.isFinite(temperature) && temperature >= 38) {
    alerts.push(alertFor(
      readings,
      selectedSymptoms,
      'temperatureHigh',
      'Elevated temperature',
      `${temperature} °C`,
      'A fever can occur with infection and other conditions. Consider the person’s age, symptoms, and measurement method.',
      temperature >= 40 ? 'urgent' : 'caution',
    ));
  } else if (Number.isFinite(temperature) && temperature < 35) {
    alerts.push(alertFor(
      readings,
      selectedSymptoms,
      'temperatureLow',
      'Low body temperature',
      `${temperature} °C`,
      'A reading below 35 °C can be an emergency. Confirm the measurement and seek urgent medical help.',
      'urgent',
    ));
  }

  return alerts;
}
