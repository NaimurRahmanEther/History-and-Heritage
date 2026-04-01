# Bangladesh Heritage Crafts

A Next.js e-commerce demo for showcasing traditional handmade products from Bangladesh. The project includes a public storefront, product browsing, cart and checkout flow, user account pages, and an admin panel for managing products, orders, artisans, categories, and districts.

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Radix UI components
- Recharts
- Local browser storage for demo data

## Features

- Home page, products, districts, categories, artisans, and about pages
- Product details with add-to-cart flow
- Cart and checkout experience
- Demo login and registration pages
- User account and orders pages
- Admin dashboard with product and order management
- Traditional Bangladesh-themed UI and imagery

## Getting Started

### Prerequisites

- Git
- Node.js LTS
- npm

Node.js 20 or newer is recommended for the smoothest experience.

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd <your-project-folder>
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Production Build

To create a production build:

```bash
npm run build
```

To start the production server:

```bash
npm run start
```

## Demo Login

Use these demo credentials after starting the app:

- Customer: `user@example.com`
- Admin: `admin@example.com`
- Password: `demo123`

To access the admin panel after logging in as admin, open:

```text
/admin
```

## Important Notes

- This project does not require a database or backend setup to run locally.
- Cart, orders, user session, and admin-managed data are stored in `localStorage`.
- Because of that, data is saved per browser on each machine.
- If you want a fresh demo state, clear the browser site data or `localStorage`.
- No `.env` setup is required for basic local development.

## Windows PowerShell Note

If PowerShell blocks `npm` scripts on your machine, use:

```powershell
npm.cmd install
npm.cmd run dev
```

Or run the commands in Command Prompt, Git Bash, or Windows Terminal with a shell that allows npm scripts.

## Package Manager Note

This repository currently includes both `package-lock.json` and `pnpm-lock.yaml`. To avoid confusion, it is best to use one package manager consistently. The commands in this README use `npm`.

## Available Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Project Structure

```text
app/          Next.js app routes
components/   Shared UI and feature components
hooks/        Reusable React hooks
lib/          Data, storage, and business logic
public/       Static assets and images
styles/       Global styles
```

## Sharing This Project

If someone clones this repository, the usual steps they should follow are:

```bash
git clone <your-repository-url>
cd <your-project-folder>
npm install
npm run dev
```

Then they can visit:

```text
http://localhost:3000
```

## Known Development Note

The `lint` script exists in `package.json`, but if linting does not run on a fresh clone, ESLint setup may need to be completed in the project first.
