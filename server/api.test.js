// Tests local API account, record-isolation, PIN, session, and passkey flows.
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createServer as createPortServer } from 'node:net';
import test from 'node:test';

test('local accounts isolate records, change PINs, log sessions, and offer passkeys', async () => {
  const tempDir = mkdtempSync(path.join(tmpdir(), 'marsmedic-api-'));
  const probe = createPortServer();
  probe.listen(0, '127.0.0.1');
  await once(probe, 'listening');
  const { port } = probe.address();
  await new Promise((resolve) => probe.close(resolve));

  process.env.MARSMEDIC_DATA_DIR = tempDir;
  process.env.MARSMEDIC_KEY_PATH = path.join(tempDir, 'private', 'health.key');
  process.env.API_PORT = String(port);
  const { server } = await import('./index.js');
  const { database } = await import('./secureStore.js');
  if (!server.listening) await once(server, 'listening');
  const origin = `http://127.0.0.1:${port}`;
  const request = (route, method = 'GET', body, cookie) => fetch(`${origin}${route}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
      ...(route.includes('/passkeys/') ? { Origin: origin } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const cookieFrom = (response) => response.headers.getSetCookie()[0].split(';')[0];

  try {
    const firstRegistration = await request('/api/auth/register', 'POST', {
      name: 'Patient One', pin: '1234',
      allergies: 'Confidential allergy note', bloodType: 'O+',
    });
    assert.equal(firstRegistration.status, 201);
    const firstCookie = cookieFrom(firstRegistration);
    const firstBody = await firstRegistration.json();
    assert.equal(firstBody.profile.allergies, 'Confidential allergy note');
    assert.equal('username' in firstBody.profile, false);
    assert.deepEqual(firstBody.profile.conditions, []);
    assert.deepEqual(firstBody.profile.medicalHistoryEntries, []);
    assert.equal('pin_hash' in firstBody.profile, false);

    const secondRegistration = await request('/api/auth/register', 'POST', {
      name: 'Patient Two', pin: '5678', allergies: 'Second patient only',
    });
    assert.equal(secondRegistration.status, 201);
    const secondCookie = cookieFrom(secondRegistration);

    const duplicatePinRegistration = await request('/api/auth/register', 'POST', {
      name: 'Patient Three', pin: '1234',
    });
    assert.equal(duplicatePinRegistration.status, 409);

    const pinOnlyLogin = await request('/api/auth/login-pin', 'POST', { pin: '1234' });
    assert.equal(pinOnlyLogin.status, 200);
    assert.equal((await pinOnlyLogin.json()).profile.name, 'Patient One');

    const passkeyOptionsWithoutUsername = await request('/api/passkeys/login/options', 'POST', {});
    assert.equal(passkeyOptionsWithoutUsername.status, 404);

    const firstProfile = await request('/api/auth/me', 'GET', undefined, firstCookie);
    assert.equal((await firstProfile.json()).profile.name, 'Patient One');
    const secondProfile = await request('/api/auth/me', 'GET', undefined, secondCookie);
    assert.equal((await secondProfile.json()).profile.name, 'Patient Two');

    const unauthenticatedReading = await request('/api/device-readings', 'POST', {
      type: 'vitals', source: 'BLE monitor', readings: { hr: 72 },
    });
    assert.equal(unauthenticatedReading.status, 401);
    const savedVitals = await request('/api/device-readings', 'POST', {
      type: 'vitals', source: 'BLE monitor', readings: { hr: 72, spo2: 98, unrecognized: 123 },
    }, firstCookie);
    assert.equal(savedVitals.status, 201);
    const savedVitalsBody = await savedVitals.json();
    assert.deepEqual(savedVitalsBody.reading.readings, { hr: 72, spo2: 98 });
    assert.equal(savedVitalsBody.readings.length, 1);
    const savedEnvironment = await request('/api/device-readings', 'POST', {
      type: 'environmental', source: 'BLE environment sensor', readings: { temperatureC: 22.5, co2Ppm: 700 },
    }, firstCookie);
    assert.equal(savedEnvironment.status, 201);
    const invalidReading = await request('/api/device-readings', 'POST', {
      type: 'unknown', source: 'BLE monitor', readings: { hr: 72 },
    }, firstCookie);
    assert.equal(invalidReading.status, 400);

    const optionsResponse = await request('/api/passkeys/register/options', 'POST', {}, firstCookie);
    assert.equal(optionsResponse.status, 200);
    const options = await optionsResponse.json();
    assert.ok(options.challenge);
    assert.equal(options.authenticatorSelection.authenticatorAttachment, 'platform');
    assert.equal(options.authenticatorSelection.residentKey, 'preferred');
    assert.equal(options.authenticatorSelection.userVerification, 'required');

    const localhostOptionsResponse = await fetch(`${origin}/api/passkeys/register/options`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: firstCookie,
        Origin: `http://localhost:${port}`,
      },
      body: JSON.stringify({ externalOnly: false }),
    });
    assert.equal(localhostOptionsResponse.status, 200);
    assert.equal((await localhostOptionsResponse.json()).rp.id, 'localhost');

    const codespacesOrigin = 'https://marsmedic-test-5173.app.github.dev';
    const codespacesOptionsResponse = await fetch(`${origin}/api/passkeys/register/options`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: firstCookie,
        Origin: codespacesOrigin,
      },
      body: JSON.stringify({ externalOnly: false }),
    });
    assert.equal(codespacesOptionsResponse.status, 200);
    assert.equal((await codespacesOptionsResponse.json()).rp.id, 'marsmedic-test-5173.app.github.dev');

    const externalOptionsResponse = await request('/api/passkeys/register/options', 'POST', { externalOnly: true }, firstCookie);
    assert.equal(externalOptionsResponse.status, 200);
    const externalOptions = await externalOptionsResponse.json();
    assert.equal(externalOptions.authenticatorSelection.authenticatorAttachment, 'cross-platform');

    const wrongPin = await request('/api/profile/pin', 'POST', { currentPin: '0000', newPin: '4321' }, firstCookie);
    assert.equal(wrongPin.status, 401);
    const duplicatePinChange = await request('/api/profile/pin', 'POST', { currentPin: '1234', newPin: '5678' }, firstCookie);
    assert.equal(duplicatePinChange.status, 409);
    const changedPin = await request('/api/profile/pin', 'POST', { currentPin: '1234', newPin: '4321' }, firstCookie);
    assert.equal(changedPin.status, 200);

    const updated = await request('/api/profile', 'PUT', {
      name: 'Patient One Updated', allergies: 'Updated allergy note', bloodType: 'O+',
    }, firstCookie);
    const updatedProfile = (await updated.json()).profile;
    assert.equal(updatedProfile.name, 'Patient One Updated');
    assert.equal(updatedProfile.deviceReadings.length, 2);

    const ended = await request('/api/session/end', 'POST', {
      startedAt: new Date().toISOString(),
      entries: [{ type: 'Assessment', details: 'Private session event' }],
    }, firstCookie);
    assert.equal(ended.status, 200);

    const oldPinLogin = await request('/api/auth/login-pin', 'POST', { pin: '1234' });
    assert.equal(oldPinLogin.status, 401);
    const newPinLogin = await request('/api/auth/login-pin', 'POST', { pin: '4321' });
    assert.equal(newPinLogin.status, 200);
    const newCookie = cookieFrom(newPinLogin);
    const restored = await request('/api/auth/me', 'GET', undefined, newCookie);
    const restoredProfile = (await restored.json()).profile;
    assert.equal(restoredProfile.name, 'Patient One Updated');
    assert.equal(restoredProfile.medicalHistoryEntries[0].entries[0].details, 'Private session event');

    const guestTransition = await request('/api/auth/logout', 'POST', { entries: [] }, newCookie);
    assert.equal(guestTransition.status, 200);
    const afterGuestTransition = await request('/api/auth/me', 'GET', undefined, newCookie);
    assert.equal(afterGuestTransition.status, 401);

    const databaseContents = readFileSync(path.join(tempDir, 'marsmedic.sqlite')).toString('utf8');
    assert.equal(databaseContents.includes('Updated allergy note'), false);
    assert.equal(databaseContents.includes('Private session event'), false);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    database.close();
    rmSync(tempDir, { recursive: true, force: true });
  }
});