// Scores selected symptoms and health context to produce assessment guidance.
import { SYMPTOMS } from './missionData.js';
import { FOLLOWUP_BONUSES } from './followupQuestions.js';

const SYMPTOM_LABELS = {};
Object.values(SYMPTOMS).forEach((arr) => arr.forEach((s) => { SYMPTOM_LABELS[s.id] = s.label; }));

const SPACEFLIGHT_SYMPTOM_RULES = [
  ['stuffy_head', 'Nasal Congestion Evaluation'],
  ['sinus_pressure', 'Sinus Pressure Evaluation'],
  ['post_nasal_drip', 'Post-nasal Drip Evaluation'],
  ['sore_throat', 'Sore Throat Evaluation'],
  ['lumbar_stiffness', 'Lower Back Stiffness Evaluation'],
  ['nerve_discomfort', 'Nerve-like Back Discomfort Evaluation', 'MEDIUM'],
  ['height_increase', 'Standing Height Change Evaluation'],
  ['reduced_torso_flexibility', 'Torso Flexibility Evaluation'],
  ['skin_fold_rash', 'Skin-fold Rash Evaluation'],
  ['skin_peeling', 'Skin Peeling Evaluation'],
  ['skin_stinging', 'Skin Irritation Evaluation'],
  ['nerve_path_blisters', 'Blistering Rash Evaluation', 'MEDIUM'],
  ['tingling_skin', 'Localized Skin Sensitivity Evaluation'],
  ['cold_sore', 'Cold Sore Evaluation'],
  ['swollen_lymph_nodes', 'Swollen Lymph Node Evaluation'],
  ['throat_irritation', 'Throat Irritation Evaluation'],
  ['eye_irritation', 'Eye Irritation Evaluation'],
  ['exertional_shortness_of_breath', 'Breathlessness with Exertion Evaluation', 'MEDIUM'],
  ['difficulty_starting_urination', 'Difficulty Starting Urination Evaluation'],
  ['slow_urinary_stream', 'Slow Urinary Stream Evaluation'],
  ['incomplete_emptying', 'Incomplete Bladder Emptying Evaluation'],
  ['bladder_pressure', 'Bladder Pressure Evaluation', 'MEDIUM'],
  ['unable_to_urinate', 'Urgent Urinary Retention Evaluation', 'HIGH',
    ['Seek urgent medical assessment, especially with bladder pressure or lower abdominal pain', 'Do not attempt catheterization without trained clinical direction', 'Record symptom onset and urine output if safe to do so']],
].map(([symptom, name, severity = 'LOW', treatment]) => ({
  id: `s_${symptom}`,
  name,
  severity,
  confidence: severity === 'HIGH' ? 78 : severity === 'MEDIUM' ? 50 : 44,
  requires: [symptom],
  rejected: [],
  treatment: treatment || [
    'Record when the symptom started and whether it is changing',
    'Check for related symptoms and record vital signs when available',
    'Avoid suspected irritants or triggers when practical',
    'Seek medical assessment if it persists, worsens, or becomes concerning',
  ],
}));

// Every unique symptom has at least one rule, so any non-empty selection
// produces a result. Key combinations add higher-confidence diagnoses.
// Treatment steps are written in plain language for crew with no medical training.
export const DIAGNOSIS_RULES = [
  // --- Existing high-confidence combination rules ---
  { id: 'heart_attack', name: 'Possible Heart Attack', severity: 'HIGH', confidence: 86,
    requires: ['chest_pain', 'shortness_of_breath', 'sweating'], rejected: ['Pneumonia', 'Asthma'],
    treatment: ['Call Mission Control immediately', 'Give aspirin 325 mg to chew', 'Keep the person resting and give oxygen', 'Prepare an Earth Alert Packet'] },
  { id: 'pneumonia', name: 'Possible Pneumonia', severity: 'MEDIUM', confidence: 72,
    requires: ['chest_pain', 'fever', 'cough'], rejected: ['Asthma', 'Bronchitis'],
    treatment: ['Rest and drink plenty of fluids', 'Check and record temperature regularly', 'Give antibiotics if available', 'Reassess the person in 4 hours'] },
  { id: 'pulmonary_embolism', name: 'Possible Pulmonary Embolism', severity: 'HIGH', confidence: 78,
    requires: ['chest_pain', 'shortness_of_breath', 'leg_swelling'], rejected: ['Pneumonia', 'Asthma'],
    treatment: ['Give oxygen', 'Give a blood-thinning medicine only if cleared by Mission Control', 'Prepare an Earth Alert Packet', 'Have the person rest and limit movement'] },
  { id: 'meningitis', name: 'Possible Meningitis', severity: 'EMERGENCY', confidence: 81,
    requires: ['headache', 'fever', 'neck_stiffness'], rejected: ['Migraine', 'Tension Headache'],
    treatment: ['Start Emergency Protocol', 'Keep the person isolated from others', 'Prepare an Earth Alert Packet', 'Give antibiotics if available'] },
  { id: 'stroke', name: 'Possible Stroke', severity: 'EMERGENCY', confidence: 84,
    requires: ['weakness', 'difficulty_speaking'], rejected: ['Migraine', 'Hypoglycemia'],
    treatment: ['Start Emergency Protocol', 'Do the FAST stroke check (Face droop, Arm weakness, Speech difficulty, Time to call for help)', 'Prepare an Earth Alert Packet', 'Stabilize vital signs'] },
  { id: 'kidney_stones', name: 'Possible Kidney Stone', severity: 'MEDIUM', confidence: 75,
    requires: ['flank_pain', 'blood_in_urine', 'painful_urination'], rejected: ['UTI', 'Appendicitis'],
    treatment: ['Drink plenty of water', 'Give potassium citrate if available', 'Give pain medication', 'Reassess the person in 2 hours'] },

  // --- Key 2-symptom combination rules ---
  { id: 'sans', name: 'Fluid Shift / Visual Impairment Syndrome (SANS)', severity: 'MEDIUM', confidence: 70,
    requires: ['puffy_face', 'blurry_vision'], rejected: ['Migraine', 'Hypertension'],
    treatment: ['Use a lower-body negative pressure device if available', 'Do resistance (strength) exercises', 'Check vision regularly', 'Use adjustable glasses if needed'] },
  { id: 'gastroenteritis', name: 'Acute Gastroenteritis', severity: 'MEDIUM', confidence: 68,
    requires: ['diarrhea', 'vomiting'], rejected: ['Food Intolerance', 'Appendicitis'],
    treatment: ['Give fluids with electrolytes (oral rehydration salts)', 'Eat bland foods: bananas, rice, applesauce, toast', 'Give anti-nausea medicine if available', 'Reassess the person in 4 hours'] },
  { id: 'uti', name: 'Urinary Tract Infection', severity: 'MEDIUM', confidence: 70,
    requires: ['frequent_urination', 'painful_urination'], rejected: ['Kidney Stone', 'Overactive Bladder'],
    treatment: ['Drink more fluids', 'Test the urine if a kit is available', 'Give antibiotics if available', 'Reassess the person in 24 hours'] },
  { id: 'asthma', name: 'Asthma / Bronchospasm', severity: 'MEDIUM', confidence: 66,
    requires: ['cough', 'wheezing'], rejected: ['Pneumonia', 'Particle Inhalation'],
    treatment: ['Use a reliever inhaler (bronchodilator)', 'Have the person sit upright', 'Keep away from anything that triggers it', 'Monitor blood oxygen level (SpO₂)'] },
  { id: 'vasovagal', name: 'Vasovagal / Presyncope', severity: 'MEDIUM', confidence: 64,
    requires: ['dizziness', 'cold_sweats'], rejected: ['Arrhythmia', 'Hypoglycemia'],
    treatment: ['Have the person lie down and raise their legs', 'Give fluids to drink', 'Check blood sugar (glucose)', 'Recheck vital signs'] },
  { id: 'abdominal_infection', name: 'Possible Intra-abdominal Infection', severity: 'HIGH', confidence: 72,
    requires: ['abdominal_pain', 'fever'], rejected: ['Gastroenteritis', 'Constipation'],
    treatment: ['Give nothing by mouth (no food or drink)', 'Monitor vital signs', 'Send an Earth Alert if the condition worsens', 'Give antibiotics if available'] },
  { id: 'anxiety_insomnia', name: 'Anxiety with Sleep Disturbance', severity: 'LOW', confidence: 60,
    requires: ['anxiety', 'insomnia'], rejected: ['Hyperthyroidism', 'Depression'],
    treatment: ['Follow a sleep hygiene routine (dark, cool, quiet room; regular sleep time)', 'Cut back on caffeine', 'Use brief calming and grounding techniques', 'Reassess in 72 hours'] },
  { id: 'bone_loss_pain', name: 'Bone Loss / Musculoskeletal Strain', severity: 'MEDIUM', confidence: 62,
    requires: ['back_pain', 'muscle_pain'], rejected: ['Disc Injury', 'Overexertion'],
    treatment: ['Do resistance (strength) exercises', 'Take calcium and vitamin D supplements', 'Take pain medication', 'Reassess in 1 week'] },
  { id: 'delirium', name: 'Acute Confusional State', severity: 'HIGH', confidence: 74,
    requires: ['confusion', 'disorientation'], rejected: ['Psychosis', 'Hypoxia'],
    treatment: ['Look for a reversible cause (infection, low oxygen, medication)', 'Check blood oxygen and blood sugar', 'Reduce sedative medicines', 'Send an Earth Alert if it persists'] },
  { id: 'dehydration', name: 'Dehydration / Fatigue Syndrome', severity: 'MEDIUM', confidence: 60,
    requires: ['weakness', 'fatigue'], rejected: ['Anemia', 'Depression'],
    treatment: ['Give fluids with electrolytes (oral rehydration)', 'Check electrolyte levels if possible', 'Rest', 'Reassess in 24 hours'] },
  { id: 'hypertension_headache', name: 'Hypertensive Headache', severity: 'MEDIUM', confidence: 62,
    requires: ['headache', 'blurry_vision'], rejected: ['Migraine', 'Fluid Shift'],
    treatment: ['Check blood pressure', 'Reduce stimulants (caffeine, etc.)', 'Rest', 'Reassess in 2 hours'] },

  // --- Spaceflight-related symptom patterns: decision support, not confirmation ---
  { id: 'spaceflight_rhinitis', name: 'Possible Spaceflight Rhinitis (Puffy Face)', severity: 'LOW', confidence: 72,
    requires: ['stuffy_head', 'sinus_pressure', 'post_nasal_drip', 'puffy_face', 'sore_throat'], rejected: ['Infection', 'Allergy'],
    treatment: ['Record symptoms and temperature', 'Consider infection, allergy, and other causes rather than assuming a fluid shift', 'Use only approved saline or other remedies', 'Seek medical advice if symptoms persist or worsen'] },
  { id: 'spinal_elongation', name: 'Possible Spinal Elongation / Back Discomfort', severity: 'MEDIUM', confidence: 72,
    requires: ['lumbar_stiffness', 'nerve_discomfort', 'height_increase', 'reduced_torso_flexibility'], rejected: ['Muscle Strain', 'Disc Injury'],
    treatment: ['Record pain, function, and height changes consistently', 'Use only approved mobility and exercise routines', 'Seek medical assessment for persistent or shooting pain', 'Escalate urgently for new weakness, numbness, or bladder/bowel changes'] },
  { id: 'contact_dermatitis_intertrigo', name: 'Possible Contact Dermatitis / Intertrigo', severity: 'LOW', confidence: 70,
    requires: ['skin_fold_rash', 'itching', 'skin_peeling', 'skin_stinging'], rejected: ['Viral Rash', 'Skin Infection'],
    treatment: ['Gently clean and dry the affected area', 'Reduce friction and avoid suspected irritants', 'Do not share towels or clothing', 'Seek medical advice for spreading redness, drainage, fever, or worsening pain'] },
  { id: 'viral_reactivation', name: 'Possible Viral Reactivation Pattern', severity: 'MEDIUM', confidence: 76,
    requires: ['nerve_path_blisters', 'tingling_skin', 'cold_sore', 'fatigue', 'swollen_lymph_nodes'], rejected: ['Contact Dermatitis', 'Other Rash'],
    treatment: ['Seek clinical assessment; these symptoms do not confirm a viral cause', 'Avoid touching active lesions and sharing items that contact them', 'Use antiviral medicine only when prescribed for this episode', 'Record temperature and symptom progression'] },
  { id: 'particle_inhalation', name: 'Possible Inhaled Particulate Irritation', severity: 'MEDIUM', confidence: 76,
    requires: ['cough', 'throat_irritation', 'wheezing', 'eye_irritation', 'shortness_of_breath', 'exertional_shortness_of_breath'], rejected: ['Asthma', 'Respiratory Infection'],
    treatment: ['Move away from the suspected source if safe', 'Follow cabin air-filter and cleanup procedures', 'Rinse irritated eyes with clean water if appropriate', 'Seek urgent help for worsening or significant breathing difficulty'] },
  { id: 'urinary_retention', name: 'Possible Acute Urinary Retention', severity: 'HIGH', confidence: 82,
    requires: ['unable_to_urinate', 'difficulty_starting_urination', 'slow_urinary_stream', 'incomplete_emptying', 'bladder_pressure'], rejected: ['Urinary Tract Infection', 'Medication Effect'],
    treatment: ['Seek urgent medical assessment for inability to urinate or a painful, distended bladder', 'Do not attempt catheterization without trained clinical direction', 'Review medicines with a clinician', 'Record urine output and symptom onset if safe to do so'] },

  // --- Single-symptom rules (guarantee every symptom yields a result) ---
  // Cardiovascular
  { id: 's_chest_pain', name: 'Cardiac Chest Pain Evaluation', severity: 'HIGH', confidence: 55, requires: ['chest_pain'], rejected: ['Musculoskeletal Pain'],
    treatment: ['Do a heart tracing (electrocardiogram / ECG) if available', 'Check vital signs', 'Give aspirin if a heart problem is suspected', 'Send an Earth Alert if severe'] },
  { id: 's_palpitations', name: 'Palpitation / Arrhythmia Evaluation', severity: 'MEDIUM', confidence: 50, requires: ['palpitations'], rejected: ['Anxiety'],
    treatment: ['Monitor with a heart tracing (electrocardiogram / ECG)', 'Check electrolyte levels', 'Reduce caffeine', 'Reassess if it continues'] },
  { id: 's_chest_tightness', name: 'Angina Evaluation', severity: 'MEDIUM', confidence: 52, requires: ['chest_tightness'], rejected: ['Reflux', 'Anxiety'],
    treatment: ['Rest', 'Check vital signs', 'Give nitroglycerin if available', 'Reassess in 1 hour'] },
  { id: 's_swelling', name: 'Edema Evaluation', severity: 'LOW', confidence: 45, requires: ['swelling'], rejected: ['Infection'],
    treatment: ['Raise the swollen area', 'Use compression if it is a limb', 'Monitor fluid intake', 'Reassess in 24 hours'] },
  { id: 's_leg_swelling', name: 'Deep Vein Thrombosis (DVT) Evaluation', severity: 'HIGH', confidence: 58, requires: ['leg_swelling'], rejected: ['Cellulitis', 'Venous Insufficiency'],
    treatment: ['Do an ultrasound if available', 'Reduce activity', 'Give a blood-thinning medicine only if cleared by Mission Control', 'Send an Earth Alert if it worsens'] },
  { id: 's_sob', name: 'Dyspnea Evaluation', severity: 'MEDIUM', confidence: 52, requires: ['shortness_of_breath'], rejected: ['Anxiety', 'Deconditioning'],
    treatment: ['Check blood oxygen level (SpO₂)', 'Have the person sit upright', 'Give oxygen if the level is low', 'Reassess in 1 hour'] },
  { id: 's_dizziness', name: 'Dizziness Evaluation', severity: 'MEDIUM', confidence: 48, requires: ['dizziness'], rejected: ['Dehydration'],
    treatment: ['Check vital signs lying down and standing', 'Give fluids to drink', 'Change positions slowly', 'Reassess in 2 hours'] },
  { id: 's_sweating', name: 'Diaphoresis Evaluation', severity: 'LOW', confidence: 42, requires: ['sweating'], rejected: ['Fever', 'Anxiety'],
    treatment: ['Check temperature and blood sugar (glucose)', 'Give fluids to drink', 'Monitor vital signs', 'Reassess if it continues'] },

  // Respiratory
  { id: 's_cough', name: 'Upper Respiratory Irritation', severity: 'LOW', confidence: 45, requires: ['cough'], rejected: ['Allergy'],
    treatment: ['Drink fluids', 'Use a throat lozenge', 'Check the air filtration system', 'Reassess in 48 hours'] },
  { id: 's_fever', name: 'Fever Evaluation', severity: 'MEDIUM', confidence: 50, requires: ['fever'], rejected: ['Heat Stress'],
    treatment: ['Monitor temperature', 'Drink fluids', 'Give fever-reducing medicine (antipyretic)', 'Reassess in 4 hours'] },
  { id: 's_wheezing', name: 'Bronchospasm Evaluation', severity: 'MEDIUM', confidence: 52, requires: ['wheezing'], rejected: ['Particle Irritation'],
    treatment: ['Use a reliever inhaler (bronchodilator) if available', 'Check blood oxygen level (SpO₂)', 'Avoid triggers', 'Reassess in 1 hour'] },
  { id: 's_sputum', name: 'Bacterial Respiratory Infection', severity: 'MEDIUM', confidence: 54, requires: ['sputum'], rejected: ['Viral URI'],
    treatment: ['Monitor temperature', 'Drink fluids', 'Give antibiotics if available', 'Reassess in 48 hours'] },

  // Neurological
  { id: 's_headache', name: 'Headache Evaluation', severity: 'LOW', confidence: 46, requires: ['headache'], rejected: ['Dehydration', 'Tension'],
    treatment: ['Drink fluids', 'Rest in a quiet area', 'Take pain medication', 'Reassess in 4 hours'] },
  { id: 's_neck_stiffness', name: 'Meningeal Signs', severity: 'HIGH', confidence: 60, requires: ['neck_stiffness'], rejected: ['Muscle Strain'],
    treatment: ['Check for fever and light sensitivity (photophobia)', 'Start Emergency Protocol if it worsens', 'Send an Earth Alert', 'Isolate the person if meningitis is suspected'] },
  { id: 's_weakness', name: 'Neuromuscular Weakness', severity: 'MEDIUM', confidence: 48, requires: ['weakness'], rejected: ['Fatigue', 'Dehydration'],
    treatment: ['Check electrolytes and blood sugar (glucose)', 'Rest', 'Drink fluids', 'Reassess in 24 hours'] },
  { id: 's_difficulty_speaking', name: 'Aphasia Evaluation', severity: 'EMERGENCY', confidence: 70, requires: ['difficulty_speaking'], rejected: ['Anxiety'],
    treatment: ['Start Emergency Protocol', 'Do the FAST stroke check (Face droop, Arm weakness, Speech difficulty, Time to call for help)', 'Send an Earth Alert', 'Stabilize vital signs'] },
  { id: 's_confusion', name: 'Altered Mental Status', severity: 'HIGH', confidence: 62, requires: ['confusion'], rejected: ['Fatigue'],
    treatment: ['Check blood oxygen and blood sugar (glucose)', 'Review current medications', 'Send an Earth Alert if it persists', 'Reassess in 1 hour'] },

  // Gastrointestinal
  { id: 's_nausea', name: 'Nausea / Gastritis', severity: 'LOW', confidence: 44, requires: ['nausea'], rejected: ['Motion Sickness'],
    treatment: ['Eat small bland meals', 'Drink fluids', 'Give anti-nausea medicine if available', 'Reassess in 4 hours'] },
  { id: 's_vomiting', name: 'Vomiting Evaluation', severity: 'MEDIUM', confidence: 48, requires: ['vomiting'], rejected: ['Gastroenteritis'],
    treatment: ['Give fluids with electrolytes (oral rehydration)', 'Nothing by mouth at first, then return to food gradually', 'Give anti-nausea medicine if available', 'Reassess in 4 hours'] },
  { id: 's_diarrhea', name: 'Diarrhea Evaluation', severity: 'LOW', confidence: 46, requires: ['diarrhea'], rejected: ['Dietary Irritant'],
    treatment: ['Give fluids with electrolytes (oral rehydration)', 'Eat bland foods: bananas, rice, applesauce, toast', 'Watch for dehydration', 'Reassess in 24 hours'] },
  { id: 's_abdominal_pain', name: 'Abdominal Pain Evaluation', severity: 'MEDIUM', confidence: 50, requires: ['abdominal_pain'], rejected: ['Indigestion'],
    treatment: ['Give nothing by mouth (no food or drink)', 'Gently feel the abdomen for tensing or guarding', 'Monitor vital signs', 'Reassess in 2 hours'] },

  // Skin
  { id: 's_rash', name: 'Dermatitis / Rash Evaluation', severity: 'LOW', confidence: 44, requires: ['rash'], rejected: ['Allergy', 'Viral Reactivation'],
    treatment: ['Avoid anything that irritates the skin', 'Apply a topical steroid cream if available', 'Take an antihistamine (allergy medicine)', 'Reassess in 48 hours'] },
  { id: 's_itching', name: 'Pruritus Evaluation', severity: 'LOW', confidence: 40, requires: ['itching'], rejected: ['Dry Skin'],
    treatment: ['Moisturize the skin', 'Take an antihistamine (allergy medicine) if available', 'Avoid scratching', 'Reassess in 72 hours'] },
  { id: 's_burn', name: 'Thermal Burn Care', severity: 'MEDIUM', confidence: 56, requires: ['burn'], rejected: ['Irritant Dermatitis'],
    treatment: ['Cool with running water', 'Apply a sterile dressing', 'Take pain medication', 'Reassess daily'] },
  { id: 's_wound', name: 'Wound Care', severity: 'MEDIUM', confidence: 54, requires: ['wound'], rejected: ['Abrasion'],
    treatment: ['Clean with saline (salt water)', 'Remove dead tissue if needed', 'Apply a sterile dressing', 'Watch for infection'] },

  // Urinary
  { id: 's_flank_pain', name: 'Flank Pain Evaluation', severity: 'MEDIUM', confidence: 52, requires: ['flank_pain'], rejected: ['Muscle Strain'],
    treatment: ['Drink more fluids', 'Take pain medication', 'Test the urine if a kit is available', 'Reassess in 4 hours'] },
  { id: 's_blood_in_urine', name: 'Hematuria Evaluation', severity: 'HIGH', confidence: 60, requires: ['blood_in_urine'], rejected: ['UTI', 'Kidney Stone'],
    treatment: ['Test the urine', 'Drink more fluids', 'Send an Earth Alert if it persists', 'Reassess in 24 hours'] },
  { id: 's_painful_urination', name: 'Dysuria Evaluation', severity: 'LOW', confidence: 48, requires: ['painful_urination'], rejected: ['Irritation'],
    treatment: ['Drink more fluids', 'Test the urine if a kit is available', 'Give antibiotics if available', 'Reassess in 24 hours'] },
  { id: 's_frequent_urination', name: 'Frequent Urination Evaluation', severity: 'LOW', confidence: 44, requires: ['frequent_urination'], rejected: ['Overactive Bladder'],
    treatment: ['Track fluid intake and urine output', 'Check blood sugar (glucose)', 'Reassess in 48 hours'] },

  // Musculoskeletal
  { id: 's_joint_pain', name: 'Arthralgia / Arthritis', severity: 'LOW', confidence: 46, requires: ['joint_pain'], rejected: ['Overexertion'],
    treatment: ['Rest the joint', 'Use a cold or warm compress', 'Take an anti-inflammatory medicine', 'Reassess in 48 hours'] },
  { id: 's_muscle_pain', name: 'Myalgia Evaluation', severity: 'LOW', confidence: 44, requires: ['muscle_pain'], rejected: ['Overexertion'],
    treatment: ['Rest', 'Drink fluids', 'Gentle stretching', 'Reassess in 48 hours'] },
  { id: 's_back_pain', name: 'Back Pain / Bone Loss Evaluation', severity: 'MEDIUM', confidence: 48, requires: ['back_pain'], rejected: ['Strain'],
    treatment: ['Do resistance (strength) exercises', 'Take pain medication', 'Check bone health markers if possible', 'Reassess in 1 week'] },

  // Mental
  { id: 's_anxiety', name: 'Anxiety Evaluation', severity: 'LOW', confidence: 44, requires: ['anxiety'], rejected: ['Hyperthyroidism'],
    treatment: ['Do breathing exercises', 'Reduce stimulants (caffeine, etc.)', 'Use grounding techniques', 'Reassess in 72 hours'] },
  { id: 's_low_mood', name: 'Depressive Symptoms Evaluation', severity: 'LOW', confidence: 44, requires: ['low_mood'], rejected: ['Fatigue'],
    treatment: ['Keep to a structured daily activity', 'Check in with crewmates', 'Follow a sleep hygiene routine', 'Reassess in 1 week'] },
  { id: 's_insomnia', name: 'Sleep Disturbance', severity: 'LOW', confidence: 44, requires: ['insomnia'], rejected: ['Caffeine Use'],
    treatment: ['Follow a sleep hygiene routine', 'Stop caffeine early in the day', 'Keep the sleep environment dark and cool', 'Reassess in 1 week'] },
  { id: 's_irritability', name: 'Mood Dysregulation', severity: 'LOW', confidence: 42, requires: ['irritability'], rejected: ['Stress'],
    treatment: ['Use stress management techniques', 'Identify triggers', 'Rest', 'Reassess in 72 hours'] },

  // Space conditions
  { id: 's_puffy_face', name: 'Fluid Shift Syndrome', severity: 'MEDIUM', confidence: 52, requires: ['puffy_face'], rejected: ['Allergy'],
    treatment: ['Use a lower-body negative pressure device if available', 'Do resistance (strength) exercises', 'Check vision regularly', 'Reassess in 24 hours'] },
  { id: 's_blurry_vision', name: 'Visual Changes (SANS)', severity: 'MEDIUM', confidence: 52, requires: ['blurry_vision'], rejected: ['Eye Strain'],
    treatment: ['Check how clearly the person can see', 'Use adjustable glasses', 'Watch for any worsening', 'Reassess monthly'] },
  { id: 's_cold_sweats', name: 'Autonomic Response Evaluation', severity: 'LOW', confidence: 42, requires: ['cold_sweats'], rejected: ['Anxiety'],
    treatment: ['Check blood sugar (glucose) and vital signs', 'Give fluids to drink', 'Rest', 'Reassess in 2 hours'] },
  { id: 's_disorientation', name: 'Spatial Disorientation', severity: 'HIGH', confidence: 58, requires: ['disorientation'], rejected: ['Motion Sickness'],
    treatment: ['Make the surroundings safe', 'Provide a fixed visual reference point', 'Check blood oxygen and blood sugar (glucose)', 'Reassess in 1 hour'] },

  // General
  { id: 's_fatigue', name: 'Fatigue Evaluation', severity: 'LOW', confidence: 42, requires: ['fatigue'], rejected: ['Dehydration'],
    treatment: ['Rest', 'Drink fluids and eat properly', 'Review sleep habits', 'Reassess in 24 hours'] },

  ...SPACEFLIGHT_SYMPTOM_RULES,
];

const EMERGENCY_SYMPTOMS = ['difficulty_speaking', 'neck_stiffness', 'disorientation', 'blood_in_urine'];

const MEDICAL_HISTORY_LINKS = [
  { pattern: /\b(?:hypertension|high blood pressure)\b/i, label: 'Hypertension', diagnosisIds: ['hypertension_headache', 'heart_attack', 'stroke'] },
  { pattern: /\b(?:asthma|bronchospasm)\b/i, label: 'Asthma', diagnosisIds: ['asthma'] },
  { pattern: /\b(?:diabetes|diabetic)\b/i, label: 'Diabetes', diagnosisIds: ['dehydration', 'delirium', 's_weakness', 's_fatigue'] },
  { pattern: /\b(?:heart disease|coronary artery|cardiac disease|previous heart attack|heart attack)\b/i, label: 'Heart disease', diagnosisIds: ['heart_attack', 's_chest_pain', 's_palpitations'] },
  { pattern: /\b(?:kidney disease|renal disease|kidney stones?)\b/i, label: 'Kidney disease or stones', diagnosisIds: ['kidney_stones', 'uti', 's_flank_pain'] },
  { pattern: /\b(?:blood clot|thrombosis|deep vein thrombosis|dvt|pulmonary embolism)\b/i, label: 'Clotting history', diagnosisIds: ['pulmonary_embolism', 's_leg_swelling'] },
  { pattern: /\b(?:migraine|recurrent headaches?)\b/i, label: 'Migraine or recurrent headaches', diagnosisIds: ['s_headache', 'hypertension_headache'] },
];

function describeRecordText(value) {
  return typeof value === 'string' ? value.trim().slice(0, 2000) : '';
}

function numericRecordValue(value) {
  if (value === null || value === undefined || value === '') return NaN;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function hasAffirmedHistory(pattern, text) {
  const matcher = new RegExp(pattern.source, `${pattern.flags}g`);
  for (const match of text.matchAll(matcher)) {
    const precedingText = text.slice(Math.max(0, match.index - 50), match.index);
    if (/\bfamily history of\s*$/i.test(precedingText)) continue;
    if (!/\b(?:no|not|denies|without|negative for)(?:\s+history of)?\s+(?:the\s+)?$/i.test(precedingText)) return true;
  }
  return false;
}

export function getMedicalHistoryContext(record = {}) {
  const conditions = Array.isArray(record.conditions) ? record.conditions : [];
  const conditionText = conditions.map((condition) => (
    typeof condition === 'string' ? condition : `${condition?.id || ''} ${condition?.name || ''}`
  )).filter(Boolean);
  const sessionHistory = (Array.isArray(record.medicalHistoryEntries) ? record.medicalHistoryEntries : [])
    .flatMap((entry) => Array.isArray(entry?.entries) ? entry.entries : [])
    .filter((entry) => entry?.type === 'Assessment')
    .map((entry) => describeRecordText(entry.details))
    .filter(Boolean);
  const historyText = [
    ...conditionText,
    describeRecordText(record.medicalHistory),
    describeRecordText(record.notes),
    ...sessionHistory,
  ].filter(Boolean).join(' ');
  const factors = MEDICAL_HISTORY_LINKS
    .filter((item) => hasAffirmedHistory(item.pattern, historyText))
    .map(({ label, diagnosisIds }) => ({ label, diagnosisIds, bonus: 6 }));
  for (const condition of conditions) {
    const id = typeof condition === 'string' ? condition : condition?.id;
    const rule = DIAGNOSIS_RULES.find((item) => item.id === id);
    if (rule && !factors.some((factor) => factor.diagnosisIds.includes(id))) {
      factors.push({
        label: `Previous diagnosis: ${typeof condition === 'string' ? rule.name : condition.name || rule.name}`,
        diagnosisIds: [id],
        bonus: 6,
      });
    }
  }

  const temperature = numericRecordValue(record.temperature);
  const heartRate = numericRecordValue(record.heartRate);
  const oxygen = numericRecordValue(record.oxygenSaturation);
  const respiratoryRate = numericRecordValue(record.respiratoryRate);
  const bloodPressure = describeRecordText(record.bloodPressure).match(/^\s*(\d{2,3})\s*\/\s*(\d{2,3})\s*$/);
  const systolic = bloodPressure ? Number(bloodPressure[1]) : NaN;
  const diastolic = bloodPressure ? Number(bloodPressure[2]) : NaN;
  const addVitalFactor = (label, diagnosisIds) => factors.push({
    label: `Recorded vital: ${label}`,
    diagnosisIds,
    bonus: 4,
  });

  if (Number.isFinite(temperature) && temperature >= 38) {
    addVitalFactor('elevated temperature', ['pneumonia', 'meningitis', 'abdominal_infection']);
  } else if (Number.isFinite(temperature) && temperature < 35) {
    addVitalFactor('low temperature', ['s_cold_sweats', 'delirium', 's_weakness']);
  }
  if (Number.isFinite(heartRate) && heartRate > 100) {
    addVitalFactor('fast heart rate', ['heart_attack', 's_palpitations', 's_sob', 'vasovagal']);
  } else if (Number.isFinite(heartRate) && heartRate < 50) {
    addVitalFactor('slow heart rate', ['s_palpitations', 'vasovagal', 's_dizziness']);
  }
  if (Number.isFinite(oxygen) && oxygen < 95) {
    addVitalFactor('low oxygen saturation', ['pulmonary_embolism', 'pneumonia', 'asthma', 'heart_attack', 's_sob']);
  }
  if (Number.isFinite(systolic) && Number.isFinite(diastolic)) {
    if (systolic >= 180 || diastolic >= 120) {
      addVitalFactor('very high blood pressure', ['hypertension_headache', 'stroke', 'heart_attack']);
    } else if (systolic < 90) {
      addVitalFactor('low blood pressure', ['vasovagal', 'dehydration', 's_dizziness']);
    }
  }
  if (Number.isFinite(respiratoryRate) && respiratoryRate >= 22) {
    addVitalFactor('fast breathing rate', ['pulmonary_embolism', 'pneumonia', 'asthma', 's_sob']);
  }

  return {
    factors,
    allergies: describeRecordText(record.allergies),
    medications: describeRecordText(record.medications),
    conditions: conditionText.map((condition) => condition.trim().slice(0, 200)).filter(Boolean),
    historyRecorded: Boolean(
      describeRecordText(record.medicalHistory)
      || describeRecordText(record.notes)
      || conditionText.length
      || sessionHistory.length,
    ),
  };
}

export function runDiagnosis(symptomIds, followups = {}, patientRecord = {}) {
  const medicalHistory = getMedicalHistoryContext(patientRecord);
  const base = DIAGNOSIS_RULES.map((r) => {
    const matched = r.requires.filter((s) => symptomIds.includes(s));
    const ratio = matched.length / r.requires.length;
    const conf = r.confidence * (0.7 + 0.3 * ratio);
    const historyFactors = medicalHistory.factors.filter((factor) => factor.diagnosisIds.includes(r.id));
    return {
      ...r,
      matched,
      ratio,
      confidence: Math.round(conf),
      historyFactors,
      historyBonus: Math.min(12, historyFactors.reduce((sum, factor) => sum + factor.bonus, 0)),
    };
  });

  // Apply follow-up answer bonuses to refine confidence among candidates
  const bonuses = {};
  Object.entries(followups).forEach(([key, value]) => {
    const list = FOLLOWUP_BONUSES[`${key}=${value}`];
    if (!list) return;
    list.forEach((b) => { bonuses[b.id] = (bonuses[b.id] || 0) + b.bonus; });
  });
  const scored = base.map((r) => ({
    ...r,
    confidence: Math.min(95, Math.round(r.confidence + (bonuses[r.id] || 0) + r.historyBonus)),
  }));

  // threshold lowered to 1 so single-symptom rules can match
  const threshold = (r) => Math.max(1, Math.ceil(r.requires.length * 0.6));
  const results = scored
    .filter((r) => r.matched.length >= threshold(r))
    .map((r) => ({
      ...r,
      evidence: [
        ...r.matched.map((id) => SYMPTOM_LABELS[id] || id),
        ...r.historyFactors.map((factor) => factor.label.startsWith('Recorded vital:')
          ? factor.label
          : `Relevant patient history: ${factor.label}`),
      ],
    }))
    .sort((a, b) => b.confidence - a.confidence);
  const rejected = scored
    .filter((r) => r.matched.length < threshold(r) && r.matched.length > 0)
    .map((r) => r.name);

  // Fallback: always guarantee an actionable result for any non-empty selection
  if (results.length === 0 && symptomIds.length > 0) {
    const hasEmergency = symptomIds.some((s) => EMERGENCY_SYMPTOMS.includes(s));
    const severity = hasEmergency ? 'HIGH' : 'LOW';
    return {
      results: [{
        id: 'general_assessment',
        name: 'General Symptom Assessment',
        severity,
        confidence: 40,
        matched: symptomIds,
        evidence: symptomIds.map((id) => SYMPTOM_LABELS[id] || id),
        rejected: [],
        treatment: [
          'Write down all reported symptoms',
          'Check and record vital signs',
          'Watch for changes over 2 hours',
          'Reassess or escalate if the condition worsens',
        ],
      }],
      rejected: rejected.length ? rejected : [],
      medicalHistory,
    };
  }

  return { results, rejected: rejected.length ? rejected : [], medicalHistory };
}