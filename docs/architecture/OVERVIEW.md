# Architecture Overview

## System context

```
Browser (React SPA)
   │  HTTPS: REST /api, WebSocket /socket.io
   ▼
nginx (serves the SPA, proxies /api and /socket.io)
   ▼
Express API ──── Socket.IO (same HTTP server)
   │   │
   │   └── node-cron jobs (reminders, notifications)
   ▼
MongoDB replica set
   ▲
   └── Chapa gateway (checkout, verify API, signed webhook)
```

## Principles

- **Layered backend.** Routes call controllers, controllers call services, services call repositories, repositories use models. Each layer has one job and depends only on the layer below.
- **Money as integers.** All amounts are stored in santim as integers. Formatting to birr happens only in the frontend.
- **Transactions for state changes.** Operations that touch several documents run inside a MongoDB transaction, so a failure leaves no partial state.
- **Server-side truth.** Eligibility, penalties, payout amounts and draw results are computed by the server. The client only displays them.
- **Verify, never trust.** Payment status comes from the Chapa verify API, not from the redirect or the webhook body alone.
- **Auditable by design.** Draws store their seed and inputs, and every sensitive action writes an audit log entry.

## Main domain objects

| Object       | Purpose                                                     |
| ------------ | ----------------------------------------------------------- |
| User         | An account with role `user` or `admin`                      |
| Group        | An equb with contribution amount, frequency, size and rules |
| Member       | A user's membership in a group, with role and status        |
| Cycle        | One round of an equb; a group has one cycle per member      |
| Contribution | What one member owes in one cycle                           |
| Payment      | A gateway checkout attempt for a contribution               |
| Transaction  | An immutable ledger entry                                   |
| Draw         | The recorded selection of a cycle's recipient               |
| Payout       | The pot paid out to the cycle's recipient                   |
| Notification | A message to a user, deduplicated by key                    |
| AuditLog     | A record of who did what and when                           |

## Lifecycle of an equb

1. An organizer creates a group; members join, optionally with approval.
2. The organizer starts the group. One cycle is created per member and the first opens for collection.
3. Members contribute, in person (recorded by the organizer) or online through Chapa.
4. When every contribution is resolved, the cycle is collected.
5. The organizer runs the draw, or the fixed order picks the recipient.
6. A payout is created for the recipient and marked paid.
7. The next cycle opens. After the last cycle, the group is completed.

## Real-time and scheduled work

- **Socket.IO** pushes notifications and draw events to authenticated users and group rooms.
- **node-cron** (timezone Africa/Addis_Ababa) runs contribution, draw and payout reminders and notification clean-up.
- Notification events are best effort and fired after the transaction commits, so a failed notification never rolls back business data.
