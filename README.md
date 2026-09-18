# LeadFlow Mini CRM

LeadFlow is a small end-to-end lead-management system for a fictional digital agency. A visitor submits a lead through WordPress, the plugin stores it locally and syncs it to the Node API, MongoDB persists the CRM record, and the React and Angular clients consume the API.

## Repository structure

```text
/wordpress-plugin   WordPress LeadFlow Connector
/api                Node.js + Express + TypeScript + MongoDB API
/react-dashboard    React + Vite CRM dashboard
/angular-insights   Angular standalone Lead Insights view
/postman             Importable API collection and test notes
```

## Architecture

```text
Visitor
   ↓
WordPress [leadflow_form] → Node API → MongoDB Atlas/local MongoDB
                                  ↙        ↘
                         React CRM     Angular Insights
```

WordPress stores a private `leadflow_lead` custom post type before making the server-to-server request. The API validates the payload, prevents duplicates using lowercase email plus normalized phone, calculates the Lead Score, and stores the CRM record. Private CRM endpoints use a JWT issued to the single configured admin user.

## Local setup

### 1. API

```bash
cd api
npm install
cp .env.example .env
# Configure MongoDB and the admin/API secrets in .env
npm run dev
```

The API runs on `http://localhost:5000`. Confirm it with `GET /health`. MongoDB can be local through Docker or an external MongoDB connection configured by `MONGODB_URI`.

### 2. React dashboard

```bash
cd react-dashboard
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:5173` and use the admin credentials from `api/.env`.

### 3. WordPress

```bash
docker compose up -d
```

Open `http://localhost:8080`, activate **LeadFlow Connector**, configure **LeadFlow → Settings**, and create a page containing:

```text
[leadflow_form]
```

For the Docker setup, use `http://host.docker.internal:5000/api/integrations/wordpress/leads` as the WordPress API endpoint and the same `API_SECRET` configured in the API.

### 4. Angular insights

```bash
cd angular-insights
npm install
npm start
```

Open `http://localhost:4200`. Localhost uses `http://localhost:5000/api`; a hosted build uses the configured Render API URL in `src/app/leadflow-api.service.ts`.

## Important technical decisions

- TypeScript is used in the API, React dashboard, and Angular app for shared contract clarity.
- WordPress uses a private custom post type instead of introducing a second custom database table.
- API secrets are sent only from WordPress server-side code using `X-API-Secret`.
- JWT protects dashboard and insights data; secrets stay in ignored `.env` files.
- React uses Axios with a JWT interceptor and provides CSV export as the extra product feature.
- Angular intentionally stays a small standalone insights view, as required by the assessment.

## Lead Score rules

The backend calculates a score from 0–100. It starts at 20, adds 10/20/30 for starter/medium/high budget intent, adds 8/12/20 for service complexity, and adds 10 points each for a valid email, valid phone, and a message of at least 40 characters. The score is capped at 100 and cannot be supplied by a client.

## Duplicate prevention

A lead is considered a duplicate when its lowercase email and normalized phone number both match an existing record. The API returns `409 Conflict` and does not create another record.

## Checks

```bash
cd api && npm run typecheck && npm run build && npm run smoke
cd react-dashboard && npm run build && npm run lint
cd angular-insights && npm run build
```

## Deployment and limitations

The API can run on Render, while the React and Angular static clients can run on Vercel. Set the deployed frontend origins in the API CORS environment variables. The current assessment uses one admin account, browser local storage for the dashboard JWT, and synchronous WordPress-to-API sync; a production system would add role management, background retries, audit history, and stronger secret rotation.

See the individual README files in `api`, `react-dashboard`, and `wordpress-plugin` for component-specific details.
