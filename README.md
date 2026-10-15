# MarsMedic AI

MarsMedic AI is a standalone installable web app with a same-computer local service. It works without internet access once dependencies are installed. It does not require Base44, a hosted backend, external fonts, or email. Patients create a unique username and four-digit PIN, then can optionally add a device passkey. Patient accounts and records are stored in a local SQLite database; health details are encrypted at rest, and each account only receives its own profile after PIN or passkey authentication.

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

## Checks

```bash
npm run lint
npm run build
npm run test:api
```