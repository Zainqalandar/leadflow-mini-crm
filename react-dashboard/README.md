# LeadFlow React CRM Dashboard

React + TypeScript + Vite dashboard for the LeadFlow Mini CRM. It connects to the Express API in `../api`.

## What is included

- Admin login and protected dashboard routes
- Summary cards and pipeline breakdown from `GET /api/leads/stats`
- Recent leads, searchable and filterable leads list with pagination
- Lead details and backend-calculated Lead Score
- Manual lead creation, editing, status changes, and deletion
- Loading, empty, error, and success notifications
- Responsive desktop and mobile layouts
- Extra feature: CSV export of **all leads matching the current search and status filter**

## Main frontend dependencies

- `axios` — API requests and JWT interceptor
- `react-router-dom` — login and protected-route navigation
- `lucide-react` — consistent interface icons
- React notification context — success, error, warning, and info messages

## Structure

`src/pages` contains the login, overview, leads, lead details, and lead form screens. `src/components` contains the shell, route guard, and shared lead UI. `src/context` manages notifications, `src/types` defines API types, and `src/utils` contains auth, API calls, formatting, and error handling.

## Local setup

```bash
cd api
npm install
# Configure api/.env using api/.env.example
npm run dev
```

In a second terminal:

```bash
cd react-dashboard
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:5173` and sign in with the `ADMIN_EMAIL` and `ADMIN_PASSWORD` configured in `api/.env`. The API base URL is configured with `VITE_API_URL` and defaults to `http://localhost:5000/api`. The API's `FRONTEND_URL` must match the browser origin exactly, including hostname and port.

CSV export fetches every matching page before download, rather than only the visible page. Spreadsheet formula characters at the start of a cell are escaped. The JWT is kept in browser local storage for this assessment; sign out removes it, and an API `401` clears it automatically.

## Checks

```bash
npm run build
npm run lint
```
