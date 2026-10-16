# MarsMedic AI

MarsMedic AI is a standalone installable web app with a same-computer local service by default. It works without internet access once dependencies are installed and does not require a hosted backend, external fonts, or email. Ubuntu fonts are bundled with the app for offline use. Patients create a unique username and four-digit PIN, then can optionally add a device passkey. Patient accounts and records are stored in a local SQLite database; health details are encrypted at rest, and each account only receives its own profile after PIN or passkey authentication.

The Devices page includes vital-sign and environmental BLE tabs. Environmental readings are available from compatible Bluetooth Environmental Sensing Service sensors; unsupported or missing sensor values are left blank. Temperature units can be switched between Celsius and Fahrenheit in the UI, while stored values and clinical thresholds remain in Celsius.

Use the Light/Dark controls at the top-right of the app to change appearance. The selected theme is saved on the current device.

The local service must be running whenever the app is used. Use Node.js 24 or newer. The database is stored in `data/marsmedic.sqlite`; its encryption key is stored separately at `~/.marsmedic-ai/health-data.key`. Back up both securely together. Losing the key makes encrypted health records unrecoverable. This local prototype has no remote backup or account recovery service and is not a certified clinical records system.

## Run Locally

```bash
npm install
npm run dev
```

This starts the SQLite/API service on `127.0.0.1:8787` and the Vite app, usually at `http://localhost:5173`.

For production-style offline use, build and start the combined local app server:

```bash
npm run build
npm start
```

Open `http://localhost:8787` once to cache the PWA assets. The service worker caches the app shell; the local service and database remain necessary for account sign-in and records, but do not need internet access.

## Share on a Local Network

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