# Production Guide

## Architecture

```
Internet → TLS proxy / nginx → frontend container (SPA) → /api, /socket.io → API → MongoDB replica set
```

Run the API as a single process per container and scale by adding containers. Socket.IO with more than one API instance needs sticky sessions or a Socket.IO adapter.

## Environment

| Variable                                   | Production value                            |
| ------------------------------------------ | ------------------------------------------- |
| `NODE_ENV`                                 | `production`                                |
| `MONGODB_URI`                              | Replica set URI with a least-privilege user |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`  | Different random values, 48 bytes or more   |
| `CLIENT_URL`                               | Exact public origin, `https://...`          |
| `CHAPA_SECRET_KEY`, `CHAPA_WEBHOOK_SECRET` | Live keys                                   |

The server refuses to start on invalid configuration, so deployment fails early rather than running misconfigured.

## TLS and headers

- Terminate TLS in front of the application and redirect HTTP to HTTPS.
- The API sets HSTS and a strict Content-Security-Policy. Keep the proxy from stripping them.
- Cookies for the refresh token are httpOnly and scoped to `/api/auth`; confirm they are also sent as `Secure` behind HTTPS.
- If a proxy sits in front of the API, enable Express `trust proxy` so rate limiting sees client addresses, not the proxy's.

## Database

- Use a managed replica set or a three-node set you control.
- Enable authentication and network restrictions.
- Take automated backups and rehearse a restore.
- Create indexes before launch; see [../database/INDEXES.md](../database/INDEXES.md).

## Chapa

- Switch to live keys.
- Register the production webhook URL (`https://<domain>/api/payments/webhook`) and the callback URL with Chapa.
- Run one small real payment end to end before opening the site.

## Scheduled jobs

Jobs run inside the API process on the Africa/Addis_Ababa time zone. With several API instances, run jobs on one instance only, or each reminder job would run on every instance. Notification `dedupeKey` prevents duplicate messages, but not duplicated work.

## Logging and monitoring

- Ship winston logs to a central store.
- Alert on a rising rate of 5xx responses, failed logins, flagged payments and failed webhook signatures.
- Monitor the replica set health and disk usage.

## Release checklist

- [ ] CI passes: unit tests, integration tests, lint and build
- [ ] Environment variables set and secrets rotated since development
- [ ] Database backed up before the release
- [ ] Image tags are fixed, not `latest`
- [ ] Health check responds after deployment
- [ ] Smoke test: register, create a group, join, start, contribute, draw, pay out
- [ ] Rollback plan ready: previous image tag and database backup

## Rollback

Redeploy the previous image tag. Database changes in this project are additive through indexes and fields; if a release adds a migration, keep it backward compatible for one release so a rollback is safe.
