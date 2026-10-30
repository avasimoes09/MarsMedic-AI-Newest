// Tests assessment scoring against symptom and patient-history scenarios.
import assert from 'node:assert/strict';
import test from 'node:test';
import { runDiagnosis } from './diagnosisEngine.js';
import { BODY_SYSTEMS, SPACE_CONDITIONS, SYMPTOMS } from './missionData.js';

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

test('spaceflight rhinitis symptoms produce a specific assessment result', () => {
  const result = runDiagnosis(['stuffy_head', 'sinus_pressure', 'post_nasal_drip']);
  const diagnosis = result.results.find((item) => item.id === 'spaceflight_rhinitis');

  assert.ok(diagnosis);
  assert.equal(diagnosis.severity, 'LOW');
  assert.ok(diagnosis.evidence.includes('Nasal Congestion'));
  assert.equal(runDiagnosis(['stuffy_head', 'sinus_pressure']).results.some((item) => item.id === 'spaceflight_rhinitis'), false);
});

test('spinal elongation symptoms produce a specific assessment result', () => {
  const result = runDiagnosis(['lumbar_stiffness', 'nerve_discomfort', 'height_increase']);

  assert.ok(result.results.some((item) => item.id === 'spinal_elongation'));
});

test('skin-fold irritation symptoms produce a specific assessment result', () => {
  const result = runDiagnosis(['skin_fold_rash', 'itching', 'skin_peeling', 'skin_stinging']);

  assert.ok(result.results.some((item) => item.id === 'contact_dermatitis_intertrigo'));
});

test('viral reactivation pattern symptoms produce a cautious assessment result', () => {
  const result = runDiagnosis(['nerve_path_blisters', 'tingling_skin', 'cold_sore', 'fatigue']);
  const diagnosis = result.results.find((item) => item.id === 'viral_reactivation');

  assert.ok(diagnosis);
  assert.ok(diagnosis.treatment.some((step) => step.includes('do not confirm a viral cause')));
});

test('inhaled particulate symptoms produce a specific assessment result', () => {
  const result = runDiagnosis(['cough', 'throat_irritation', 'eye_irritation', 'shortness_of_breath']);

  assert.ok(result.results.some((item) => item.id === 'particle_inhalation'));
});

test('urinary retention pattern is flagged as high severity with urgent guidance', () => {
  const result = runDiagnosis([
    'unable_to_urinate',
    'slow_urinary_stream',
    'incomplete_emptying',
    'bladder_pressure',
  ]);
  const diagnosis = result.results.find((item) => item.id === 'urinary_retention');

  assert.ok(diagnosis);
  assert.equal(diagnosis.severity, 'HIGH');
  assert.ok(diagnosis.treatment.some((step) => step.includes('urgent medical assessment')));
});

test('every added assessment symptom is selectable and has an evaluation rule', () => {
  const symptomIds = [
    'stuffy_head', 'sinus_pressure', 'post_nasal_drip', 'throat_irritation', 'eye_irritation',
    'sore_throat', 'exertional_shortness_of_breath',
    'lumbar_stiffness', 'nerve_discomfort', 'height_increase', 'reduced_torso_flexibility',
    'skin_fold_rash', 'skin_peeling', 'skin_stinging', 'nerve_path_blisters', 'tingling_skin',
    'cold_sore', 'swollen_lymph_nodes', 'unable_to_urinate', 'difficulty_starting_urination',
    'slow_urinary_stream', 'incomplete_emptying', 'bladder_pressure',
  ];
  const availableSymptoms = new Set(Object.values(SYMPTOMS).flat().map(({ id }) => id));
  const spaceConditionIds = new Set(SPACE_CONDITIONS.map(({ id }) => id));

  for (const symptomId of symptomIds) {
    assert.ok(availableSymptoms.has(symptomId), `${symptomId} is available in assessment`);
    assert.ok(runDiagnosis([symptomId]).results.length > 0, `${symptomId} has a single-symptom result`);
  }
  for (const diagnosisId of [
    'spaceflight_rhinitis', 'spinal_elongation', 'contact_dermatitis_intertrigo',
    'viral_reactivation', 'particle_inhalation', 'urinary_retention',
  ]) assert.ok(spaceConditionIds.has(diagnosisId), `${diagnosisId} has a Space Medicine entry`);
  assert.ok(BODY_SYSTEMS.some(({ id }) => SYMPTOMS[id]?.some(({ id: symptomId }) => symptomIds.includes(symptomId))));
});
