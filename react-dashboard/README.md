# LeadFlow React CRM Dashboard

React + TypeScript + Vite dashboard for the LeadFlow CRM. The frontend foundation follows the ProofFolio reference structure while keeping the app as a Vite SPA.

## Installed frontend dependencies

- `axios` — API requests and JWT interceptor
- `react-router-dom` — login and protected-route navigation
- `lucide-react` — consistent interface icons
- React notification context — success, error, warning, and info messages

## Structure

```text
src/
├── components/       # Shared UI and route guards
├── context/           # Notification and app state providers
├── features/          # Feature-specific modules as the dashboard grows
├── pages/             # Route-level screens
├── types/             # API and domain TypeScript types
└── utils/             # Axios instance, auth, API calls, and error helpers
```

## Local setup

```bash
npm install
cp .env.example .env
npm run dev
```

The API base URL is configured with `VITE_API_URL` and defaults to `http://localhost:5000/api`.

## Checks

```bash
npm run build
```
