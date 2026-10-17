# Security Architecture

This document describes the security design. Operational practices are in [../security/SECURITY.md](../security/SECURITY.md).

## Authentication

- Passwords are hashed with bcryptjs and never returned by the API.
- Access tokens are short-lived JWTs (15 minutes by default).
- Refresh tokens are long-lived, stored hashed in the database, and delivered in an httpOnly, SameSite cookie scoped to `/api/auth`.
- Refresh tokens rotate on every use. Replaying an old token revokes every session for that user.
- Logout revokes the current token; logout-all revokes every token.
- An account locks after five failed login attempts.
- Login and password reset responses are identical for unknown and known accounts, so accounts cannot be enumerated.

## Authorization

- `authenticate` verifies the access token on every private route.
- `requireAdmin` guards the admin API.
- Group access is membership based. Non-members receive 404 for a group, so its existence is not revealed.
- Organizer-only actions (edit, start, cancel, approve, record contributions, run draws, pay payouts) are checked in the service layer.
- Phone numbers are visible only to the organizer and the owner.
- The invite code is visible only to the organizer.

## Input and output

- Every request body, query and parameter is validated with Joi; unknown fields are rejected.
- MongoDB operators in input are rejected to prevent operator injection.
- Responses use explicit projections so internal fields do not leak.

## Transport and headers

- helmet sets a strict Content-Security-Policy, HSTS, `X-Content-Type-Options`, frame and referrer policies.
- CORS allows only the configured client origin with credentials.
- Terminate TLS at the proxy in production.

## Rate limiting

- A general limiter applies to `/api`.
- Authentication routes use a much stricter limiter.

## Payments

- Checkout creates a pending payment with an exact server-computed amount.
- The result is confirmed by calling the Chapa verify API; redirects are never trusted.
- Webhooks must carry a valid HMAC signature, otherwise nothing changes.
- A mismatched amount, or a payment for an already recorded contribution, is flagged for admin review instead of being applied.
- Settlement is idempotent: one payment produces one ledger entry.

## Integrity and audit

- Money is stored as integers.
- Draw seeds and inputs are stored; the result is recomputed and checked on every read.
- Ledger transactions are append-only.
- Sensitive actions write audit log entries viewable by admins and by group organizers for their group.

## Secrets

- Secrets come only from environment variables and are validated at start-up.
- `.env` files are ignored by git; only `.env.example` files are committed.
- Rotate any credential that was shared outside the deployment environment.
