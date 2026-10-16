# AGENTS.md

## Project Context

MarsMedic AI is a standalone local application. Keep account authentication and patient data on the local computer; do not add hosted authentication, remote data storage, or network dependencies to core workflows.

Start with `README.md` for local setup, offline use, and data backup guidance.

## Key Files

- `src/`: frontend application source.
- `src/lib/localApi.js`: same-origin client for the local API.
- `server/`: local HTTP API and encrypted SQLite storage.
- `vite.config.js`: local development server and API proxy.
- `scripts/dev.js`: starts the API and Vite development server together.

## Working Notes

- Use `npm run dev` for development; it starts both the local API and frontend.
- Use `npm run build` followed by `npm start` to serve the built app and API together for local/offline use.
- The local API binds to loopback by default. Preserve this default and the existing explicit LAN configuration safeguards.
- Keep `.env.local` and other local-only environment values out of version control.
- Run the relevant checks from `package.json` before finishing code changes.
