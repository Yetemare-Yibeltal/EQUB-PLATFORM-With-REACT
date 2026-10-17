# Equb Platform Documentation

Documentation for the Equb platform, a system for running rotating savings groups (equbs) with contributions, auditable draws, payouts and online payments.

## Contents

### Architecture

- [Overview](architecture/OVERVIEW.md)
- [Backend](architecture/BACKEND.md)
- [Frontend](architecture/FRONTEND.md)
- [Security design](architecture/SECURITY.md)

### API

- [API conventions](api/README.md)
- [Auth](api/AUTH.md)
- [Users](api/USERS.md)
- [Groups](api/GROUPS.md)
- [Members](api/MEMBERS.md)
- [Cycles](api/CYCLES.md)
- [Contributions](api/CONTRIBUTIONS.md)
- [Payments](api/PAYMENTS.md)
- [Draws](api/DRAWS.md)
- [Payouts](api/PAYOUTS.md)
- [Notifications](api/NOTIFICATIONS.md)
- [Admin](api/ADMIN.md)

### Database

- [Schema](database/SCHEMA.md)
- [Relationships](database/RELATIONSHIPS.md)
- [Indexes](database/INDEXES.md)

### Business rules

- [Equb rules](business/EQUB_RULES.md)
- [Contribution flow](business/CONTRIBUTION_FLOW.md)
- [Draw flow](business/DRAW_FLOW.md)
- [Payout flow](business/PAYOUT_FLOW.md)
- [Payment flow](business/PAYMENT_FLOW.md)

### Security

- [Security practices](security/SECURITY.md)

### Deployment

- [Installation](deployment/INSTALLATION.md)
- [Docker](deployment/DOCKER.md)
- [Production](deployment/PRODUCTION.md)

## Stack

| Layer    | Technology                                                         |
| -------- | ------------------------------------------------------------------ |
| Backend  | Node 20, Express 4, Mongoose 8, Joi, Socket.IO, node-cron, winston |
| Database | MongoDB replica set (transactions required)                        |
| Frontend | React 18, Vite 5, React Router 6, axios, zustand, socket.io-client |
| Payments | Chapa                                                              |
| Tests    | Jest, supertest                                                    |
| Delivery | Docker, nginx, GitHub Actions                                      |

## Repository layout

```
backend/      Express API, models, services, jobs, sockets, tests
frontend/     React single page application
database/     Migrations, seeders and backups
docs/         This documentation
scripts/      Smoke test scripts
.github/      CI and deployment workflows
```
