# Traditional Market

Traditional Market is a full-stack marketplace for authentic handmade products.

- Frontend: Next.js (in `client/`)
- Backend: Express + PostgreSQL (in `backend/`)

## Tech Stack

- Frontend: Next.js 16, React 19, Tailwind CSS
- Backend: Express, `pg`, JWT auth, Multer uploads
- Database: PostgreSQL

## Project Structure

```text
client/
  app/                Next.js app router
  components/         UI components
  lib/                API, auth, and data layer

backend/
  app/
    routes/           API routes
    services/         Business logic + SQL
    middleware/       Auth middleware
    utils/            Helpers and serializers
    seed/             Seed data
  database/
    traditional_market_schema.sql
  scripts/
    init-db.js
  run.js
```

## Prerequisites

- Node.js 20+ and npm
- PostgreSQL 14+ (local or remote)

## Setup From a Fresh Clone

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd tradtional-market
```

### 2. Install dependencies

```bash
npm install --prefix backend
npm install --prefix client
```

### 3. Create environment files

Create `backend/.env` from `backend/.env.example` and `client/.env.local` from `client/.env.local.example`.

macOS/Linux:

```bash
cp backend/.env.example backend/.env
cp client/.env.local.example client/.env.local
```

Windows PowerShell:

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item client/.env.local.example client/.env.local
```

### 4. Update environment values

Update these values in `backend/.env`:

- `DATABASE_URL` (required): PostgreSQL connection string
- `JWT_SECRET` (required): long random secret
- `CORS_ORIGIN` (required if frontend URL is not default)
- `PORT` (optional, default `5000`)
- `DB_SSL` (optional, set `true` for managed DBs that require SSL)

Update this value in `client/.env.local`:

- `NEXT_PUBLIC_API_BASE_URL` (normally `http://localhost:5000/api`)

### 5. Initialize database schema and seed data

From project root:

```bash
npm run db:init
```

Or from backend folder:

```bash
cd backend
npm run db:init
```

This command:

- creates the target database if it does not exist
- applies schema from `backend/database/traditional_market_schema.sql`
- inserts seed data (users, categories, districts, artisans, products)

### 6. Run the app

Use two terminals from project root:

Terminal 1 (backend):

```bash
npm run dev:backend
```

Terminal 2 (frontend):

```bash
npm run dev:client
```

App URLs:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000/api`
- Health check: `http://localhost:5000/api/health`

## Seed Login Accounts (Development)

After `npm run db:init`, these users are available:

- Admin: `admin@example.com` / `demo123`
- Customer: `user@example.com` / `demo123`
- Artisan: `artisan@example.com` / `demo123`

## What Must Be Updated After Clone

Before sharing or deploying, update these immediately:

1. Replace `JWT_SECRET` in `backend/.env` with a strong secret.
2. Set a real `DATABASE_URL` for your environment.
3. Set `CORS_ORIGIN` to your frontend domain(s).
4. Set `NEXT_PUBLIC_API_BASE_URL` to your backend API URL.
5. Replace or remove demo users/passwords in `backend/app/seed/seed_data.js`.
6. Review upload storage settings (`UPLOAD_DIR`, max size, file access policy).

## Useful Scripts

From repository root:

- `npm run db:init` -> initialize database + seed
- `npm run dev:backend` -> start backend in watch mode
- `npm run dev:client` -> start frontend dev server
- `npm run build:client` -> build frontend
