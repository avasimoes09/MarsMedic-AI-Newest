import { createHash, randomBytes } from 'node:crypto';
import { createReadStream, existsSync } from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from '@simplewebauthn/server';
import {
  createPatient,
  database,
  findPatientByUsername,
  findPatientById,
  readPatient,
  updatePatientHealth,
  updatePatientPin,
  verifyPin,
} from './secureStore.js';

const PORT = Number(process.env.API_PORT || 8787);
const HOST = '127.0.0.1';
const SESSION_MS = 12 * 60 * 60 * 1000;
const challenges = new Map();
const attempts = new Map();
const profileFields = [
  'dateOfBirth', 'bloodType', 'heartRate', 'bloodPressure', 'temperature',
  'oxygenSaturation', 'respiratoryRate', 'allergies', 'medications',
  'medicalHistory', 'notes',
];
const mimeTypes = {
  '.css': 'text/css', '.html': 'text/html', '.js': 'text/javascript',
  '.json': 'application/json', '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2',
};

function json(response, status, body, headers = {}) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', ...headers });
  response.end(JSON.stringify(body));
}

async function readBody(request) {
  let raw = '';
  for await (const chunk of request) {
    raw += chunk;
    if (raw.length > 64 * 1024) throw new Error('Request is too large.');
  }
  return raw ? JSON.parse(raw) : {};
}

function cookieValue(request, name) {
  const item = (request.headers.cookie || '').split(';').map((value) => value.trim()).find((value) => value.startsWith(`${name}=`));
  return item ? decodeURIComponent(item.slice(name.length + 1)) : '';
}

function sessionCookie(token, maxAge = SESSION_MS / 1000) {
  return `marsmedic_session=${encodeURIComponent(token)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}`;
}

function createSession(response, patientId) {
  const token = randomBytes(32).toString('base64url');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const expiresAt = Date.now() + SESSION_MS;
  const startedAt = new Date().toISOString();
  database.prepare('INSERT INTO sessions (token_hash, patient_id, started_at, expires_at) VALUES (?, ?, ?, ?)').run(tokenHash, patientId, startedAt, expiresAt);
  response.setHeader('Set-Cookie', sessionCookie(token));
  return startedAt;
}

function currentPatient(request) {
  const token = cookieValue(request, 'marsmedic_session');
  if (!token) return null;
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const session = database.prepare('SELECT * FROM sessions WHERE token_hash = ? AND expires_at > ?').get(tokenHash, Date.now());
  if (!session) return null;
  const patient = findPatientById(session.patient_id);
  return patient ? { patient, tokenHash, startedAt: session.started_at } : null;
}

function publicProfile(patient) {
  const profile = readPatient(patient);
  const passkeyCount = database.prepare('SELECT COUNT(*) AS count FROM passkeys WHERE patient_id = ?').get(patient.id).count;
  return {
    ...profile,
    conditions: Array.isArray(profile.conditions) ? profile.conditions : [],
    medicalHistoryEntries: Array.isArray(profile.medicalHistoryEntries) ? profile.medicalHistoryEntries : [],
    hasPasskey: passkeyCount > 0,
  };
}

function pinOkay(pin) {
  return typeof pin === 'string' && /^\d{4}$/.test(pin);
}

function normalizeProfile(body) {
  return Object.fromEntries(profileFields.map((field) => [field, String(body[field] || '').trim().slice(0, 2000)]));
}

function attemptKey(username, request) {
  return `${String(username).trim().toLowerCase()}:${request.socket.remoteAddress || 'local'}`;
}

function blocked(key) {
  const entry = attempts.get(key);
  if (!entry) return false;
  if (entry.until <= Date.now()) {
    attempts.delete(key);
    return false;
  }
  return entry.count >= 5;
}

function failedAttempt(key) {
  const entry = attempts.get(key) || { count: 0, until: Date.now() + 15 * 60 * 1000 };
  entry.count += 1;
  attempts.set(key, entry);
}

function requestOrigin(request) {
  const origin = request.headers.origin;
  if (!origin) throw new Error('Missing request origin.');
  const url = new URL(origin);
  const isLocalHost = ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
  const forwardedDevelopmentHost = process.env.NODE_ENV !== 'production' &&
    (url.hostname.endsWith('.app.github.dev') || url.hostname.endsWith('.github.dev'));
  if (!isLocalHost && !forwardedDevelopmentHost) throw new Error('This local service only accepts same-device app requests.');
  return { origin, rpID: url.hostname };
}

function consumeChallenge(challenge, purpose, patientId) {
  const entry = challenges.get(challenge);
  challenges.delete(challenge);
  return entry && entry.purpose === purpose && entry.patientId === patientId && entry.expiresAt > Date.now();
}

function logSession(patient, body) {
  const profile = readPatient(patient);
  const entries = Array.isArray(body.entries) ? body.entries.slice(-100).map((entry) => ({
    type: String(entry.type || 'Session note').slice(0, 80),
    details: String(entry.details || '').slice(0, 1000),
    at: String(entry.at || new Date().toISOString()).slice(0, 40),
  })) : [];
  profile.medicalHistoryEntries = [
    ...(profile.medicalHistoryEntries || []),
    {
      type: 'Session summary',
      startedAt: String(body.startedAt || '').slice(0, 40),
      endedAt: new Date().toISOString(),
      entries,
    },
  ].slice(-500);
  updatePatientHealth(patient.id, profile);
}

function contentType(filePath) {
  return mimeTypes[path.extname(filePath)] || 'application/octet-stream';
}

function serveStatic(request, response) {
  const root = path.resolve('dist');
  if (!existsSync(path.join(root, 'index.html'))) return json(response, 503, { error: 'Build the app first with npm run build.' });
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  const requested = path.resolve(root, `.${pathname}`);
  const isSafeFile = requested.startsWith(`${root}${path.sep}`) && existsSync(requested) && !requested.endsWith(path.sep);
  const filePath = isSafeFile
    ? requested
    : path.join(root, 'index.html');
  response.writeHead(200, { 'Content-Type': contentType(filePath), 'X-Content-Type-Options': 'nosniff' });
  createReadStream(filePath).pipe(response);
}

async function handle(request, response) {
  const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
  if (!url.pathname.startsWith('/api/')) return serveStatic(request, response);

  try {
    if (request.method === 'POST' && url.pathname === '/api/auth/register') {
      const body = await readBody(request);
      const name = String(body.name || '').trim().slice(0, 100);
      const username = String(body.username || '').trim().toLowerCase().slice(0, 32);
      if (!name || !/^[a-z0-9._-]{3,32}$/.test(username) || !pinOkay(body.pin)) {
        return json(response, 400, { error: 'Enter a name, a 3-32 character username, and four-digit PIN.' });
      }
      const id = randomBytes(16).toString('hex');
      const healthData = { ...normalizeProfile(body), conditions: [], medicalHistoryEntries: [] };
      try {
        createPatient({ id, username, name, pin: body.pin, healthData });
      } catch (error) {
        if (String(error.message).includes('UNIQUE')) return json(response, 409, { error: 'That username is already in use.' });
        throw error;
      }
      const startedAt = createSession(response, id);
      return json(response, 201, { profile: publicProfile(findPatientById(id)), startedAt });
    }

    if (request.method === 'POST' && url.pathname === '/api/auth/login-pin') {
      const body = await readBody(request);
      const username = String(body.username || '').trim().toLowerCase();
      const key = attemptKey(username, request);
      if (blocked(key)) return json(response, 429, { error: 'Too many attempts. Try again in 15 minutes.' });
      const patient = findPatientByUsername(username);
      if (!patient || !pinOkay(body.pin) || !verifyPin(body.pin, patient.pin_salt, patient.pin_hash)) {
        failedAttempt(key);
        return json(response, 401, { error: 'Username or PIN is incorrect.' });
      }
      attempts.delete(key);
      const startedAt = createSession(response, patient.id);
      return json(response, 200, { profile: publicProfile(patient), startedAt });
    }

    if (request.method === 'GET' && url.pathname === '/api/auth/me') {
      const auth = currentPatient(request);
      return auth ? json(response, 200, { profile: publicProfile(auth.patient), startedAt: auth.startedAt }) : json(response, 401, { error: 'Sign in required.' });
    }

    if (request.method === 'POST' && url.pathname === '/api/auth/logout') {
      const auth = currentPatient(request);
      if (auth) {
        logSession(auth.patient, await readBody(request));
        database.prepare('DELETE FROM sessions WHERE token_hash = ?').run(auth.tokenHash);
      }
      return json(response, 200, { ok: true }, { 'Set-Cookie': sessionCookie('', 0) });
    }

    if (request.method === 'PUT' && url.pathname === '/api/profile') {
      const auth = currentPatient(request);
      if (!auth) return json(response, 401, { error: 'Sign in required.' });
      const body = await readBody(request);
      const profile = readPatient(auth.patient);
      const name = String(body.name || auth.patient.name).trim().slice(0, 100);
      if (!name) return json(response, 400, { error: 'Name cannot be empty.' });
      const healthData = {
        ...profile,
        ...normalizeProfile(body),
        conditions: Array.isArray(body.conditions) ? body.conditions.slice(-200) : (profile.conditions || []),
        medicalHistoryEntries: Array.isArray(body.medicalHistoryEntries)
          ? body.medicalHistoryEntries.slice(-500)
          : (profile.medicalHistoryEntries || []),
      };
      delete healthData.id;
      delete healthData.name;
      database.prepare('UPDATE patients SET name = ? WHERE id = ?').run(name, auth.patient.id);
      updatePatientHealth(auth.patient.id, healthData);
      return json(response, 200, { profile: publicProfile(findPatientById(auth.patient.id)) });
    }

    if (request.method === 'POST' && url.pathname === '/api/profile/pin') {
      const auth = currentPatient(request);
      if (!auth) return json(response, 401, { error: 'Sign in required.' });
      const body = await readBody(request);
      if (!verifyPin(String(body.currentPin || ''), auth.patient.pin_salt, auth.patient.pin_hash)) {
        return json(response, 401, { error: 'Current PIN is incorrect.' });
      }
      if (!pinOkay(body.newPin)) return json(response, 400, { error: 'PIN must contain exactly four digits.' });
      updatePatientPin(auth.patient.id, body.newPin);
      return json(response, 200, { ok: true });
    }

    if (request.method === 'POST' && url.pathname === '/api/session/end') {
      const auth = currentPatient(request);
      if (!auth) return json(response, 401, { error: 'Sign in required.' });
      logSession(auth.patient, await readBody(request));
      database.prepare('DELETE FROM sessions WHERE token_hash = ?').run(auth.tokenHash);
      return json(response, 200, { ok: true }, { 'Set-Cookie': sessionCookie('', 0) });
    }

    if (request.method === 'POST' && url.pathname === '/api/passkeys/register/options') {
      const auth = currentPatient(request);
      if (!auth) return json(response, 401, { error: 'Sign in required.' });
      const { origin, rpID } = requestOrigin(request);
      const existing = database.prepare('SELECT credential_id, transports FROM passkeys WHERE patient_id = ?').all(auth.patient.id);
      const options = await generateRegistrationOptions({
        rpName: 'MarsMedic AI',
        rpID,
        userID: new Uint8Array(Buffer.from(auth.patient.id)),
        userName: auth.patient.username,
        userDisplayName: auth.patient.name,
        attestationType: 'none',
        authenticatorSelection: { authenticatorAttachment: 'platform', residentKey: 'preferred', userVerification: 'required' },
        excludeCredentials: existing.map((item) => ({ id: item.credential_id, transports: JSON.parse(item.transports) })),
      });
      challenges.set(options.challenge, { purpose: 'register', patientId: auth.patient.id, origin, rpID, expiresAt: Date.now() + 5 * 60 * 1000 });
      return json(response, 200, options);
    }

    if (request.method === 'POST' && url.pathname === '/api/passkeys/register/verify') {
      const auth = currentPatient(request);
      if (!auth) return json(response, 401, { error: 'Sign in required.' });
      const body = await readBody(request);
      const pending = challenges.get(body.challenge);
      if (!pending || !consumeChallenge(body.challenge, 'register', auth.patient.id)) return json(response, 400, { error: 'Passkey request expired. Try again.' });
      const verification = await verifyRegistrationResponse({
        response: body,
        expectedChallenge: body.challenge,
        expectedOrigin: pending.origin,
        expectedRPID: pending.rpID,
        requireUserVerification: true,
      });
      if (!verification.verified || !verification.registrationInfo) return json(response, 400, { error: 'Passkey setup was not verified.' });
      const credential = verification.registrationInfo.credential;
      database.prepare('INSERT INTO passkeys (credential_id, patient_id, public_key, counter, transports) VALUES (?, ?, ?, ?, ?)').run(
        credential.id,
        auth.patient.id,
        Buffer.from(credential.publicKey),
        credential.counter,
        JSON.stringify(credential.transports || []),
      );
      return json(response, 201, { ok: true });
    }

    if (request.method === 'POST' && url.pathname === '/api/passkeys/login/options') {
      const body = await readBody(request);
      const patient = findPatientByUsername(String(body.username || '').trim().toLowerCase());
      if (!patient) return json(response, 401, { error: 'Username or passkey is incorrect.' });
      const { origin, rpID } = requestOrigin(request);
      const credentials = database.prepare('SELECT credential_id, transports FROM passkeys WHERE patient_id = ?').all(patient.id);
      if (!credentials.length) return json(response, 404, { error: 'No passkey is set up for this account.' });
      const options = await generateAuthenticationOptions({
        rpID,
        allowCredentials: credentials.map((item) => ({ id: item.credential_id, transports: JSON.parse(item.transports) })),
        userVerification: 'required',
      });
      challenges.set(options.challenge, { purpose: 'login', patientId: patient.id, origin, rpID, expiresAt: Date.now() + 5 * 60 * 1000 });
      return json(response, 200, options);
    }

    if (request.method === 'POST' && url.pathname === '/api/passkeys/login/verify') {
      const body = await readBody(request);
      const credentialId = body.id;
      const saved = database.prepare('SELECT * FROM passkeys WHERE credential_id = ?').get(credentialId);
      const pending = challenges.get(body.response?.clientDataJSON ? body.challenge : '');
      const challenge = body.challenge || pending?.challenge;
      const challengeEntry = challenge && challenges.get(challenge);
      if (!saved || !challengeEntry || !consumeChallenge(challenge, 'login', saved.patient_id)) return json(response, 401, { error: 'Passkey sign-in failed. Try again.' });
      const verification = await verifyAuthenticationResponse({
        response: body,
        expectedChallenge: challenge,
        expectedOrigin: challengeEntry.origin,
        expectedRPID: challengeEntry.rpID,
        requireUserVerification: true,
        credential: {
          id: saved.credential_id,
          publicKey: new Uint8Array(saved.public_key),
          counter: saved.counter,
          transports: JSON.parse(saved.transports),
        },
      });
      if (!verification.verified) return json(response, 401, { error: 'Passkey sign-in failed.' });
      database.prepare('UPDATE passkeys SET counter = ? WHERE credential_id = ?').run(verification.authenticationInfo.newCounter, saved.credential_id);
      const patient = findPatientById(saved.patient_id);
      const startedAt = createSession(response, patient.id);
      return json(response, 200, { profile: publicProfile(patient), startedAt });
    }

    return json(response, 404, { error: 'Not found.' });
  } catch (error) {
    console.error('Local API error:', error);
    return json(response, 400, { error: error.message || 'Request failed.' });
  }
}

export const server = http.createServer((request, response) => {
  handle(request, response).catch((error) => {
    console.error('Unhandled API error:', error);
    if (!response.headersSent) json(response, 500, { error: 'Local service error.' });
    else response.destroy();
  });
});

server.listen(PORT, HOST, () => console.log(`MarsMedic local service listening at http://${HOST}:${PORT}`));