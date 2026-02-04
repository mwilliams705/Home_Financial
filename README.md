# Home_Financial

Multi-user financial planning app for a shared household. Includes a Node/Express API, Postgres database, and a Vue 3 (Vite) frontend.

## Repo Layout
- `api/` Node/Express API
- `db/` Postgres schema
- `web/` Vue 3 + Vite frontend
- `docs/` API and data model notes

## Local Development (No Docker)

### 1) Prerequisites
- Node.js 20+
- npm 9+
- Postgres 14+
- A working SMTP server for email verification codes

### 2) Database Setup
Create a local Postgres database and user, then load the schema.

Example (adjust for your environment):

```bash
createdb home_financial
createuser home_financial
psql -d home_financial -c "alter user home_financial with password 'home_financial';"
psql -d home_financial -f db/schema.sql
```

### 3) API Setup
Copy the example env file and fill in values:

```bash
cp api/.env.example api/.env
```

Required values in `api/.env`:
- `DATABASE_URL=postgres://home_financial:home_financial@localhost:5432/home_financial`
- `JWT_SECRET=...`
- `SMTP_HOST=...`
- `SMTP_PORT=...`
- `SMTP_USER=...`
- `SMTP_PASS=...`
- `EMAIL_FROM=...`

Install dependencies and start the API:

```bash
cd api
npm install
npm run dev
```

The API runs at `http://localhost:3001`.

### 4) Web App Setup
Install dependencies and start the web app:

```bash
cd web
npm install
npm run dev
```

The web app runs at `http://localhost:5173` and proxies `/api` to the backend.

### 5) Email Verification Notes
Registration sends a 6-digit code using SMTP. Ensure your SMTP credentials are valid and reachable from the API process.

## Common Tasks
- Update schema: edit `db/schema.sql` and rerun `psql -f db/schema.sql` against your local database.
- Change API target for Vite dev server: set `VITE_API_TARGET` before running `npm run dev` in `web/`.
- Logging: set `LOG_LEVEL=debug` in `api/.env` and `localStorage.setItem('logLevel', 'debug')` in the browser console.

Example:

```bash
VITE_API_TARGET=http://localhost:3001 npm run dev
```

## Docker Setup
See `DOCKER.md` for running the entire stack with Docker Compose (dev) and `docker-compose.prod.yml` for a production-style build using Nginx.
