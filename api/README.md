# LeadFlow API

Node.js, Express, TypeScript, and MongoDB API for the LeadFlow Mini CRM.

## Setup

1. Copy `.env.example` to `.env`.
2. Set unique values for `JWT_SECRET`, `ADMIN_PASSWORD`, and `API_SECRET`.
3. Start MongoDB with `docker compose up -d mongodb`, or set `MONGODB_URI` to your own MongoDB instance.
4. Run `npm run dev` in this folder.

The API runs on `http://localhost:5000` by default. Use `GET /health` to confirm that it is running.

## Authentication

`POST /api/auth/login`

```json
{
  "email": "admin@leadflow.local",
  "password": "your-admin-password"
}
```

Use the returned token as `Authorization: Bearer <token>` for all `/api/leads` endpoints. The admin credentials are read from `.env`; `ADMIN_PASSWORD_HASH` can be used instead of the plaintext local `ADMIN_PASSWORD`.

## API endpoints

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/health` | Public | Health check |
| POST | `/api/auth/login` | Public | Admin login and JWT |
| POST | `/api/integrations/wordpress/leads` | `x-api-secret` | Receive a WordPress form submission |
| GET | `/api/leads` | JWT | List leads; accepts `status`, `q`, `page`, `limit` |
| POST | `/api/leads` | JWT | Create a manual dashboard lead |
| GET | `/api/leads/:id` | JWT | Lead details |
| PUT | `/api/leads/:id` | JWT | Update lead fields |
| PATCH | `/api/leads/:id/status` | JWT | Change lead status |
| DELETE | `/api/leads/:id` | JWT | Delete a lead |
| GET | `/api/leads/stats` | JWT | Total leads and counts by status |
| GET | `/api/leads/insights` | JWT | Stats plus the five highest-scoring leads |

## Lead payload

```json
{
  "name": "Ayesha Khan",
  "email": "ayesha@example.com",
  "phone": "+92 300 1234567",
  "service": "Web Development",
  "budgetRange": "$5,000 - $10,000",
  "message": "We need a responsive company website with a small CMS."
}
```

## Duplicate prevention

A duplicate is a lead whose lowercase email **and** normalized phone number match an existing lead. The API returns `409 Conflict` with the existing lead ID rather than saving another record.

## Lead Score rules

The API calculates and stores a score from 0 to 100 whenever a lead is created or updated:

- Start at 20 points.
- Add 10, 20, or 30 points for starter, medium, or high budget intent.
- Add 8, 12, or 20 points based on service complexity.
- Add 10 points each for a valid email, a valid phone number, and a message of at least 40 characters.

The score is capped at 100. It is always calculated server-side and cannot be sent by WordPress or either frontend.
