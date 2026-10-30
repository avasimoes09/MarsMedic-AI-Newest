// Maps selected symptoms to follow-up questions and scoring bonuses.
// Follow-up questions shown after symptoms are selected, keyed by the
// triggering symptom. Answers feed the diagnosis engine as confidence
// bonuses (FOLLOWUP_BONUSES), narrowing the differential diagnosis.

export const FOLLOWUPS = {
  chest_pain: [
    { key: 'pain_type', q: 'What does the chest pain feel like?', options: ['Sharp', 'Pressure', 'Burning', 'Dull'] },
    { key: 'radiation', q: 'Does the pain radiate anywhere?', options: ['Jaw', 'Neck', 'Arm', 'No radiation'] },
    { key: 'pain_location', q: 'Where is the pain located?', options: ['Left side', 'Center', 'Right side'] },
  ],
  headache: [
    { key: 'headache_onset', q: 'How did the headache start?', options: ['Sudden (seconds)', 'Gradual (hours)'] },
    { key: 'photophobia', q: 'Bothered by light?', options: ['Yes', 'No'] },
    { key: 'headache_worst', q: 'Worst headache of your life?', options: ['Yes', 'No'] },
  ],
  fever: [
    { key: 'fever_level', q: 'Highest temperature reading?', options: ['37.5-38°C', '38-39°C', 'Above 39°C'] },
    { key: 'fever_chills', q: 'Chills or shaking?', options: ['Yes', 'No'] },
  ],
  abdominal_pain: [
    { key: 'abdo_location', q: 'Where is the abdominal pain?', options: ['Upper right', 'Lower right', 'Lower left', 'Whole abdomen'] },
    { key: 'abdo_onset', q: 'How did the pain start?', options: ['Sudden', 'Gradual'] },
  ],
  shortness_of_breath: [
    { key: 'sob_onset', q: 'How did the breathlessness start?', options: ['Sudden', 'Gradual'] },
    { key: 'sob_position', q: 'Worse when lying flat?', options: ['Yes', 'No'] },
  ],
  dizziness: [
    { key: 'dizzy_type', q: 'What kind of dizziness?', options: ['Spinning (vertigo)', 'Lightheaded', 'Off-balance'] },
    { key: 'dizzy_onset', q: 'Triggered by standing up?', options: ['Yes', 'No'] },
  ],
  cough: [
    { key: 'cough_duration', q: 'How long has the cough lasted?', options: ['Under 3 days', '3-14 days', 'Over 14 days'] },
    { key: 'cough_productive', q: 'Producing phlegm?', options: ['Yes', 'No'] },
  ],
  nausea: [
    { key: 'nausea_duration', q: 'How long has nausea lasted?', options: ['Under 12 hours', '12-48 hours', 'Over 48 hours'] },
  ],
  leg_swelling: [
    { key: 'leg_side', q: 'One leg or both?', options: ['One leg', 'Both legs'] },
    { key: 'leg_pain', q: 'Pain or tenderness in the calf?', options: ['Yes', 'No'] },
  ],
  diarrhea: [
    { key: 'diarrhea_blood', q: 'Blood or mucus in stool?', options: ['Yes', 'No'] },
  ],
  weakness: [
    { key: 'weakness_side', q: 'One side of the body or both?', options: ['One side', 'Both sides'] },
    { key: 'weakness_sudden', q: 'Came on suddenly?', options: ['Yes', 'No'] },
  ],
  rash: [
    { key: 'rash_spread', q: 'Is the rash spreading?', options: ['Yes', 'No'] },
    { key: 'rash_itch', q: 'Is it itchy?', options: ['Yes', 'No'] },
  ],
  flank_pain: [
    { key: 'flank_side', q: 'One side or both?', options: ['One side', 'Both sides'] },
  ],
};

// Confidence bonuses applied by the engine: `${key}=${value}` -> [{ id, bonus }]
export const FOLLOWUP_BONUSES = {
  'pain_type=Pressure': [{ id: 'heart_attack', bonus: 6 }, { id: 's_chest_pain', bonus: 4 }],
  'pain_type=Sharp': [{ id: 'pulmonary_embolism', bonus: 3 }, { id: 'pneumonia', bonus: 2 }],
  'pain_type=Burning': [{ id: 's_chest_tightness', bonus: 4 }],
  'radiation=Jaw': [{ id: 'heart_attack', bonus: 4 }],
  'radiation=Arm': [{ id: 'heart_attack', bonus: 4 }],
  'radiation=No radiation': [{ id: 'pneumonia', bonus: 2 }],
  'pain_location=Center': [{ id: 'heart_attack', bonus: 2 }],
  'headache_onset=Sudden (seconds)': [{ id: 'meningitis', bonus: 4 }, { id: 's_headache', bonus: 3 }],
  'headache_onset=Gradual (hours)': [{ id: 'hypertension_headache', bonus: 3 }],
  'photophobia=Yes': [{ id: 'meningitis', bonus: 5 }],
  'headache_worst=Yes': [{ id: 'meningitis', bonus: 5 }, { id: 's_headache', bonus: 4 }],
  'fever_level=38-39°C': [{ id: 'pneumonia', bonus: 3 }, { id: 'abdominal_infection', bonus: 3 }],
  'fever_level=Above 39°C': [{ id: 'meningitis', bonus: 4 }, { id: 'abdominal_infection', bonus: 4 }, { id: 'pneumonia', bonus: 3 }],
  'fever_chills=Yes': [{ id: 'pneumonia', bonus: 2 }, { id: 'abdominal_infection', bonus: 2 }],
  'abdo_location=Lower right': [{ id: 'abdominal_infection', bonus: 5 }, { id: 's_abdominal_pain', bonus: 3 }],
  'abdo_onset=Sudden': [{ id: 'abdominal_infection', bonus: 3 }],
  'sob_onset=Sudden': [{ id: 'pulmonary_embolism', bonus: 5 }, { id: 's_sob', bonus: 3 }],
  'sob_onset=Gradual': [{ id: 'asthma', bonus: 3 }, { id: 'pneumonia', bonus: 2 }],
  'sob_position=Yes': [{ id: 's_sob', bonus: 2 }],
  'dizzy_type=Spinning (vertigo)': [{ id: 's_dizziness', bonus: 3 }],
  'dizzy_type=Lightheaded': [{ id: 'vasovagal', bonus: 4 }, { id: 'dehydration', bonus: 3 }],
  'dizzy_onset=Yes': [{ id: 'vasovagal', bonus: 4 }, { id: 's_dizziness', bonus: 3 }],
  'cough_duration=Over 14 days': [{ id: 's_cough', bonus: 2 }],
  'cough_productive=Yes': [{ id: 'pneumonia', bonus: 3 }, { id: 's_sputum', bonus: 3 }],
  'nausea_duration=Over 48 hours': [{ id: 's_nausea', bonus: 2 }],
  'leg_side=One leg': [{ id: 's_leg_swelling', bonus: 5 }, { id: 'pulmonary_embolism', bonus: 3 }],
  'leg_pain=Yes': [{ id: 's_leg_swelling', bonus: 4 }, { id: 'pulmonary_embolism', bonus: 3 }],
  'diarrhea_blood=Yes': [{ id: 's_diarrhea', bonus: 4 }, { id: 'gastroenteritis', bonus: 2 }],
  'weakness_side=One side': [{ id: 'stroke', bonus: 6 }, { id: 's_weakness', bonus: 4 }],
  'weakness_sudden=Yes': [{ id: 'stroke', bonus: 5 }, { id: 's_weakness', bonus: 3 }],
  'rash_spread=Yes': [{ id: 's_rash', bonus: 3 }],
  'rash_itch=Yes': [{ id: 's_itching', bonus: 3 }, { id: 's_rash', bonus: 2 }],
  'flank_side=One side': [{ id: 'kidney_stones', bonus: 4 }, { id: 's_flank_pain', bonus: 3 }],
};

// Returns the union of follow-up questions for the selected symptoms,
// deduplicated by key (in selection order).
export function getFollowupsForSymptoms(symptomIds) {
  const seen = new Set();
  const out = [];
  for (const sym of symptomIds) {
    const qs = FOLLOWUPS[sym];
    if (!qs) continue;
    for (const q of qs) {
      if (seen.has(q.key)) continue;
      seen.add(q.key);
      out.push(q);
    }
  }
  return out;
}