# MarsMedic AI

MarsMedic AI is a standalone local app. It does not use Base44 or require a hosted backend, GitHub, external fonts, or email. Once its dependencies are installed and the app is built, it runs on the computer that hosts it and works without an internet connection. Ubuntu fonts are bundled with the app for offline use. Patients create a unique username and four-digit PIN, then can optionally add a device passkey. Patient accounts and records are stored in a local SQLite database; health details are encrypted at rest, and each account only receives its own profile after PIN or passkey authentication.

The Devices page includes vital-sign and environmental BLE tabs. Environmental readings are available from compatible Bluetooth Environmental Sensing Service sensors; unsupported or missing sensor values are left blank. Temperature units can be switched between Celsius and Fahrenheit in the UI, while stored values and clinical thresholds remain in Celsius.

Connected BLE readings are shown live and are not uploaded or automatically recorded. Signed-in patients can explicitly save real vital-sign or environmental sensor readings to their encrypted local patient record from the Devices page. Simulated readings are never saved. Fingerprint sign-in uses WebAuthn/FIDO2 passkeys; an external fingerprint key must support user-verified passkeys. The fingerprint itself is verified by the device and is not sent to MarsMedic.

Use the Light/Dark controls at the top-right of the app to change appearance. The selected theme is saved on the current device.

The local service must be running whenever the app is used. Use Node.js 24 or newer. The database is stored in `data/marsmedic.sqlite`; its encryption key is stored separately at `~/.marsmedic-ai/health-data.key`. Back up both securely together. Losing the key makes encrypted health records unrecoverable. This local prototype has no remote backup or account recovery service and is not a certified clinical records system.

## Run Locally and Offline

```bash
npm install
npm run build
npm start
```

Open `http://127.0.0.1:8787` on the same computer. The local server serves the app and its SQLite/API service together; leave it running while using MarsMedic. This does not require a GitHub or Base44 session. `npm install` and `npm run build` are setup steps; after they finish, `npm start` runs locally without internet access.

For development with automatic reloads, run:

```bash
npm run dev
```

This starts both the local SQLite/API service on `127.0.0.1:8787` and the Vite development server, usually at `http://127.0.0.1:5173`. Account sign-in and records need the local service to be running; they do not need internet access. The production-style `npm start` server is the intended way to run the built app offline.

For a future packaged offline app, package the built frontend together with the local Node.js service and its dependencies. Keep the database and encryption key in the app's writable local data locations; do not package or share a live database key with the app bundle.

## Optional: Share on a Local Network

For collaborators on the same Wi-Fi/LAN, one trusted computer can host the app and database. Internet access is not required, but all devices must be connected to that local network and the host must remain on. Do not expose this prototype to the public internet.

LAN access requires HTTPS because browsers restrict passkeys and Bluetooth to secure contexts, and health data must not be sent in clear text. Reserve a fixed LAN IP for the host, then obtain a trusted TLS certificate for that address or local DNS name. For a small trusted network, install `mkcert` on the host and run:

```bash
mkcert -install
mkcert 192.168.1.25
mkcert -CAROOT
```

Install the resulting `rootCA.pem` as trusted on each collaborator device. Copy only that public root certificate—not `rootCA-key.pem`—and keep the generated TLS private key and database encryption key on the host.

Set these environment variables in the host's shell, replacing example values with the host's LAN address and certificate file paths:

```bash
export LAN_HOST=192.168.1.25
export TLS_CERT_PATH=/path/to/192.168.1.25.pem
export TLS_KEY_PATH=/path/to/192.168.1.25-key.pem
```

For development, run `npm run dev` and open `https://192.168.1.25:5173` from each trusted device. The API stays bound to the host computer's loopback interface behind the HTTPS development server.

For a production-style local host, build the app and bind the API only to the host's specific LAN address:

```bash
npm run build
API_HOST="$LAN_HOST" npm start
```

Collaborators open `https://192.168.1.25:8787`. Configure the host firewall to allow that port only from the trusted local network. To access the same patient record, they must sign in to that same patient account; the app does not provide collaborator roles or per-person access controls. Anyone with that account's username and PIN has the same access, so share credentials only with trusted people. Keep a secured backup of both `data/marsmedic.sqlite` and `~/.marsmedic-ai/health-data.key`.

## Checks

```bash
npm run lint
npm run build
npm run test:api
```