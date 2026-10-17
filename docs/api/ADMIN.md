# Admin and Reports API

## Admin

Prefix: `/api/admin`. Every route requires an access token and the admin role; other callers receive `403`.

| Method | Path                                  | Purpose                                 |
| ------ | ------------------------------------- | --------------------------------------- |
| GET    | `/overview`                           | System-wide counts and totals           |
| GET    | `/groups`                             | List all groups                         |
| GET    | `/audit-logs`                         | Read the audit log                      |
| GET    | `/jobs`                               | List scheduled jobs and their last runs |
| POST   | `/jobs/:name/run`                     | Run a scheduled job now                 |
| POST   | `/payments/:paymentId/resolve-review` | Resolve a payment flagged for review    |

User management is under [USERS.md](USERS.md); the full payment list is under [PAYMENTS.md](PAYMENTS.md).

### Resolving a flagged payment

Payments are flagged when the amount does not match or the contribution was already recorded. An admin reviews the payment and resolves it, which updates the payment and writes the audit log. The contribution is changed only by the resolution, never silently.

## Audit logs

Each entry records the actor, the action, the target, a timestamp and relevant details. Admins read all entries at `/api/admin/audit-logs`. A group organizer reads the entries for their own group at `/api/groups/:groupId/audit-logs`.

Logged actions include account and role changes, group start and cancel, member approval, removal, recorded and waived contributions, payments resolved, draws and payouts.

## Reports

Reports aggregate data for a group and are read-only.

| Method | Path                                       | Access    | Purpose                                             |
| ------ | ------------------------------------------ | --------- | --------------------------------------------------- |
| GET    | `/api/groups/:groupId/reports/summary`     | member    | Collected, paid out and outstanding totals          |
| GET    | `/api/groups/:groupId/reports/reliability` | organizer | On-time record per member                           |
| GET    | `/api/groups/:groupId/reports/statement`   | member    | Statement of the caller's contributions and payouts |
| GET    | `/api/reports/*`                           | any user  | Personal reports across groups                      |

All amounts are integer santim.
