# Traditional Market (Frontend + Backend)

This project is now split into:

1. Frontend (Next.js) in [`client/`](client)
2. Backend (Express + PostgreSQL + JWT + local file upload) in [`backend/`](backend)

The frontend UI/UX is preserved while data is served from PostgreSQL APIs.

## Tech Stack

- Frontend: Next.js 16, React 19, JavaScript, Tailwind CSS
- Backend: Express, raw SQL (`pg`), JWT auth, Multer uploads
- Database: PostgreSQL

## Project Structure

```text
client/
  app/                Next.js app router (frontend)
  components/         Frontend UI components
  lib/                Frontend API/data/auth/cart layer
backend/
  app/
    routes/           API routes (care-meal style layering)
    services/         Business logic + SQL calls
    utils/            JWT/serializers/helpers
    seed/             Seed data
    middleware/       Auth middleware
  database/
    traditional_market_schema.sql
  scripts/
    init-db.js
  run.js
```

## Quick Start (Clone & Run)

This repository includes the real `.env` files. After cloning, run:

```bash
# install dependencies
npm install --prefix backend
npm install --prefix client

# initialize database schema + seed data
npm run db:init

# start backend (terminal 1)
npm run dev:backend

# start frontend (terminal 2)
npm run dev:client
```

Backend runs on `http://localhost:5000`  
Frontend runs on `http://localhost:3000`

## What To Update After Clone

Update these values with valid data for your machine or hosted services:

- `backend/.env`
  - `DATABASE_URL` (PostgreSQL connection string)
  - `JWT_SECRET` (any long random string)
  - `CORS_ORIGIN` (frontend URL, default `http://localhost:3000`)
- `client/.env.local`
  - `NEXT_PUBLIC_API_BASE_URL` (backend base URL, default `http://localhost:5000/api`)

## Prerequisites

1. Node.js 20+
2. PostgreSQL running locally (or the DB in your `.env` must be reachable)

## Database Notes

- The database is created (if missing) and seeded by `npm run db:init`.
- Seeded demo users:
  - Admin: `admin@example.com` / `demo123`
  - Customer: `user@example.com` / `demo123`

## Notes

1. Authentication is JWT-based.
2. Cart is persisted in PostgreSQL for logged-in users.
3. Guest cart is temporarily kept client-side and synced to DB after login.
4. Product images can be uploaded from local drive via backend upload endpoint and are stored in `backend/uploads/`.
5. Backend structure was aligned to your referenced `care-meal` style (`app/routes`, `app/services`, `app/utils`, `app/seed`, `database`).
