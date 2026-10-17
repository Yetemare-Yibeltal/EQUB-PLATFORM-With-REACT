# Equb Platform

A web platform for running equbs, the rotating savings groups common in Ethiopia. Organizers create groups, members contribute on a schedule, a verifiable draw selects each cycle's recipient, and payouts are tracked in an immutable ledger. Contributions can be recorded in person or paid online through Chapa.

## Features

- Accounts with short-lived access tokens and rotating refresh tokens
- Groups with invite codes, optional approval, and organizer controls
- One cycle per member, created when the group starts
- Contribution ledger with late penalties and waivers
- Online payments through Chapa with verification and a signed webhook
- Auditable draws: stored seed, recomputed verification, or a fixed order
- Payout tracking that opens the next cycle and completes the group
- Real-time and scheduled notifications
- Admin area with reports, audit logs, payment review and job control

## Stack

- Backend: Node 20, Express, Mongoose, MongoDB replica set, Socket.IO, node-cron
- Frontend: React 18, Vite, React Router, zustand
- Tests: Jest and supertest
- Delivery: Docker, nginx, GitHub Actions

## Quick start

```
npm --prefix backend install
npm --prefix frontend install
cp backend/.env.example backend/.env
npm --prefix backend run dev
npm --prefix frontend run dev
```

Edit `backend/.env` first. MongoDB must be a replica set. The full walkthrough is in [docs/deployment/INSTALLATION.md](docs/deployment/INSTALLATION.md).

## Scripts

| Command                                     | Purpose                                    |
| ------------------------------------------- | ------------------------------------------ |
| `npm --prefix backend run dev`              | Start the API with reload                  |
| `npm --prefix frontend run dev`             | Start the web app                          |
| `npm --prefix backend run test:unit`        | Unit tests                                 |
| `npm --prefix backend run test:integration` | Integration tests, need a `_test` database |
| `npm --prefix frontend run lint`            | Lint the frontend                          |
| `npm --prefix frontend run build`           | Production build                           |

## Documentation

Start at [docs/README.md](docs/README.md): architecture, API reference, database, business rules, security and deployment.

## Project layout

```
backend/    API, models, services, jobs, sockets, tests
frontend/   React application
database/   Migrations, seeders, backups
docs/       Documentation
scripts/    Smoke test scripts
.github/    CI and deployment workflows
```

## Security

Never commit `.env` files or paste secrets into chats or issues. See [docs/security/SECURITY.md](docs/security/SECURITY.md).
