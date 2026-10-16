import assert from 'node:assert/strict';
import test from 'node:test';
import { runDiagnosis } from './diagnosisEngine.js';

test('relevant recorded medical history changes diagnosis confidence', () => {
  const symptoms = ['chest_pain', 'shortness_of_breath'];
  const withoutHistory = runDiagnosis(symptoms).results.find((result) => result.id === 'heart_attack');
  const withHistory = runDiagnosis(symptoms, {}, {
    medicalHistory: 'History of coronary artery disease',
    allergies: 'Penicillin',
    medications: 'Daily medicine',
  });
  const withRelevantHistory = withHistory.results.find((result) => result.id === 'heart_attack');

  assert.equal(withRelevantHistory.confidence, withoutHistory.confidence + 6);
  assert.ok(withRelevantHistory.evidence.includes('Relevant patient history: Heart disease'));
  assert.equal(withHistory.medicalHistory.allergies, 'Penicillin');
  assert.equal(withHistory.medicalHistory.medications, 'Daily medicine');
});

test('unrelated or missing history does not alter symptom-only scoring', () => {
  const symptoms = ['chest_pain', 'shortness_of_breath'];
  const withoutHistory = runDiagnosis(symptoms).results.find((result) => result.id === 'heart_attack');
  const withUnrelatedHistory = runDiagnosis(symptoms, {}, { medicalHistory: 'Seasonal allergies' })
    .results.find((result) => result.id === 'heart_attack');

  assert.equal(withUnrelatedHistory.confidence, withoutHistory.confidence);
});

test('negated history is not scored as a relevant condition', () => {
  const symptoms = ['chest_pain', 'shortness_of_breath'];
  const withoutHistory = runDiagnosis(symptoms).results.find((result) => result.id === 'heart_attack');
  const withNegatedHistory = runDiagnosis(symptoms, {}, { medicalHistory: 'No history of heart disease' })
    .results.find((result) => result.id === 'heart_attack');

  assert.equal(withNegatedHistory.confidence, withoutHistory.confidence);
});

test('family history is not treated as the patient’s own diagnosis', () => {
  const symptoms = ['chest_pain', 'shortness_of_breath'];
  const withoutHistory = runDiagnosis(symptoms).results.find((result) => result.id === 'heart_attack');
  const withFamilyHistory = runDiagnosis(symptoms, {}, { medicalHistory: 'Family history of heart disease' })
    .results.find((result) => result.id === 'heart_attack');

  assert.equal(withFamilyHistory.confidence, withoutHistory.confidence);
});

test('recorded abnormal vitals contribute context to matching diagnoses', () => {
  const symptoms = ['fever', 'cough'];
  const withoutVitals = runDiagnosis(symptoms).results.find((result) => result.id === 'pneumonia');
  const withVitals = runDiagnosis(symptoms, {}, { temperature: '39' })
    .results.find((result) => result.id === 'pneumonia');

  assert.equal(withVitals.confidence, withoutVitals.confidence + 4);
  assert.ok(withVitals.evidence.includes('Recorded vital: elevated temperature'));
});
