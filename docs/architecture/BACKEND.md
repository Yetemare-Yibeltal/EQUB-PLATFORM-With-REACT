# Backend Architecture

## Structure

```
backend/src/
  config/        env validation, database, Socket.IO, Chapa, Cloudinary
  constants/     roles and status enums
  controllers/   HTTP handlers, no business logic
  jobs/          scheduled jobs
  middleware/    auth, admin guard, validation, rate limiting, error handler
  models/        Mongoose schemas
  repositories/  data access
  routes/        route definitions
  services/      business logic
  sockets/       Socket.IO setup and events
  utils/         tokens, passwords, pagination, logging, transactions
  validators/    Joi schemas
```

## Request flow

1. The route applies middleware: `authenticate`, optional `requireAdmin`, and `validateRequest` with a Joi schema.
2. The controller reads the validated input and calls a service.
3. The service enforces rules and opens a transaction when several writes must succeed together.
4. Repositories read and write models.
5. The controller returns a response through the shared response helper. After a successful commit it may fire notification events.
6. Errors thrown as `ApiError` are converted by the error handler into `{ success: false, message, errors? }` with the right status.

## Response format

Success:

```json
{ "success": true, "message": "optional", "data": {} }
```

Failure:

```json
{
  "success": false,
  "message": "Reason",
  "errors": [{ "field": "phone", "message": "..." }]
}
```

## Configuration

`config/env.js` validates the environment with Joi at start-up and refuses to boot on invalid values, including short JWT secrets and malformed durations such as `JWT_REFRESH_EXPIRES_IN`.

| Variable                 | Meaning                                  |
| ------------------------ | ---------------------------------------- |
| `NODE_ENV`               | `development`, `test` or `production`    |
| `PORT`                   | API port                                 |
| `MONGODB_URI`            | Connection string for a replica set      |
| `JWT_ACCESS_SECRET`      | At least 32 characters                   |
| `JWT_REFRESH_SECRET`     | At least 32 characters                   |
| `JWT_ACCESS_EXPIRES_IN`  | Access token lifetime, default `15m`     |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token lifetime, for example `7d` |
| `CLIENT_URL`             | Allowed browser origin                   |
| `CHAPA_SECRET_KEY`       | Gateway secret key                       |
| `CHAPA_WEBHOOK_SECRET`   | Webhook HMAC secret                      |

See `backend/.env.example` for the complete list.

## Transactions

Services use `withTransaction` from `utils/transaction.js`. A replica set is required, including in development and tests.

## Scheduled jobs

| Job                   | Purpose                                                       |
| --------------------- | ------------------------------------------------------------- |
| Contribution reminder | Reminds members with unpaid contributions before the due date |
| Draw reminder         | Reminds organizers when a collected cycle is ready for a draw |
| Payout reminder       | Reminds organizers of unpaid payouts                          |
| Notification job      | Removes old read notifications                                |

Jobs can be listed and triggered by an admin through the admin API.

## Sockets

Clients authenticate the socket with the access token. Each user joins a personal room for notifications; group members join a group room for draw events.

## Logging

winston writes structured logs. Sensitive fields such as passwords and tokens are never logged.

## Testing

- **Unit tests** cover validators, pure rules and utilities.
- **Integration tests** run the real app with supertest against a local replica set. The helpers refuse any database name that does not end in `_test`.

```
npm --prefix backend run test:unit
npm --prefix backend run test:integration
```
