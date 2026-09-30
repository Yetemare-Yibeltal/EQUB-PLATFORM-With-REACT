# Equb Platform

A digital equb (rotating savings) platform. Groups of members contribute a fixed amount each cycle, and one member receives the full pot per round, chosen by an auditable draw.

## Stack

- Backend: Node.js, Express 4, Mongoose, MongoDB (replica set), Socket.IO, node-cron
- Frontend: React, Vite
- Infrastructure: Docker Compose, GitHub Actions

## Repository layout

```
backend/    REST API, sockets, scheduled jobs, tests
frontend/   React single-page application
database/   Seeders and backup output
docs/       Architecture, API, business rules, deployment
scripts/    Utility scripts
```

## Requirements

- Node.js 20 or newer
- Docker with Docker Compose

## Getting started

1. Copy the environment templates:

```bash
   cp .env.example .env
   cp backend/.env.example backend/.env
```

2. Start MongoDB as a single-node replica set (required for transactions):

```bash
   docker compose up -d mongo
```

3. Install and run the backend:

```bash
   npm --prefix backend install
   npm run dev:backend
```

4. Verify the API:

```bash
   curl http://localhost:5000/api/health
```

## Running everything in containers

```bash
docker compose up -d --build
docker compose --profile full up -d --build
```

The first command starts MongoDB and the backend. The second also starts the frontend.

## Scripts

| Command                | Purpose                          |
| ---------------------- | -------------------------------- |
| `npm run dev:backend`  | Start the API with file watching |
| `npm run dev:frontend` | Start the Vite dev server        |
| `npm run test:backend` | Run backend tests                |
| `npm run docker:up`    | Build and start containers       |
| `npm run docker:down`  | Stop containers                  |

## Money handling

All monetary amounts are stored as integers in the smallest currency unit (santim). Floating point values are never used for money.

## Documentation

See the `docs/` directory for architecture, API reference, business rules, and deployment guides.
