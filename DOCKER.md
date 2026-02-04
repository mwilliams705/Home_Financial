# Docker Setup

This project can run locally using Docker Compose with three services:
- `db` Postgres 16
- `api` Node/Express backend
- `web` Vue 3 (Vite) frontend

## Prerequisites
- Docker Desktop or Docker Engine
- Docker Compose v2

## 1) Create API Environment File
Copy the example and fill in SMTP/JWT settings:

```bash
cp api/.env.example api/.env
```

Required values in `api/.env`:
- `JWT_SECRET=...`
- `SMTP_HOST=...`
- `SMTP_PORT=...`
- `SMTP_USER=...`
- `SMTP_PASS=...`
- `EMAIL_FROM=...`

The `DATABASE_URL` is set automatically inside `docker-compose.yml`.

## 2) Start the Stack
From the repo root:

```bash
docker compose up --build
```

Services will be available at:
- API: `http://localhost:3001`
- Web: `http://localhost:5173`
- Postgres: `localhost:5432`

## Production-Style Build (Nginx)
Use the production compose file to build the Vue frontend and serve it with Nginx:

```bash
docker compose -f docker-compose.prod.yml up --build
```

Services will be available at:
- API: `http://localhost:3001`
- Web (Nginx): `http://localhost:8080`
- Postgres: `localhost:5432`

## 3) Reset the Database
To reset the database volume:

```bash
docker compose down -v
```

This removes the Postgres data volume and will re-run `db/schema.sql` on next startup.

## Notes
- The database is initialized from `db/schema.sql` when the `db` service first creates its data volume.
- The web service uses `VITE_API_TARGET=http://api:3001` inside the container.
