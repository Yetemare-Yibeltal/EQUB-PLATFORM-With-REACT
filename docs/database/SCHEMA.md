# Database Schema

MongoDB with Mongoose 8. A replica set is required because services use multi-document transactions.

Conventions:

- Every collection has `createdAt` and `updatedAt` timestamps.
- Money is an integer in santim.
- References are ObjectIds.
- The API returns `id` instead of `_id` and hides internal fields.

The authoritative definitions are in `backend/src/models`. Index definitions are listed in [INDEXES.md](INDEXES.md).

## users

| Field                                        | Notes                                            |
| -------------------------------------------- | ------------------------------------------------ |
| `fullName`                                   | Display name                                     |
| `phone`                                      | Unique login identifier                          |
| `email`                                      | Optional; unique only when present               |
| `passwordHash`                               | bcrypt hash, never returned                      |
| `role`                                       | `user` or `admin`                                |
| `status`                                     | `active` or `suspended`                          |
| `failedLoginAttempts`, `lockUntil`           | Account lock after five failures                 |
| `refreshTokens`                              | Hashed refresh tokens with expiry and revocation |
| `passwordResetToken`, `passwordResetExpires` | Hashed single-use reset token                    |

## groups

| Field                | Notes                                                   |
| -------------------- | ------------------------------------------------------- |
| `name`               | Group name                                              |
| `createdBy`          | The organizer's user id                                 |
| `contributionAmount` | Santim per member per cycle                             |
| `frequency`          | `weekly` or `monthly`                                   |
| `maxMembers`         | Capacity; set to the member count when the group starts |
| `startDate`          | First cycle date                                        |
| `latePenaltyAmount`  | Added when paid after the grace period                  |
| `requireApproval`    | Joins are held as pending until approved                |
| `inviteCode`         | 8 characters, `A-Z0-9`, unique                          |
| `status`             | `open`, `active`, `completed`, `cancelled`              |
| `cancelReason`       | Set when cancelled                                      |

## members

| Field            | Notes                                                   |
| ---------------- | ------------------------------------------------------- |
| `group`, `user`  | One membership per user per group                       |
| `role`           | `organizer` or `member`                                 |
| `status`         | `pending`, `active`, `rejected`, `removed`, `left`      |
| `payoutPosition` | Order in a fixed order group; unique per group when set |

## cycles

| Field             | Notes                                                  |
| ----------------- | ------------------------------------------------------ |
| `group`, `number` | One cycle per member; number starts at 1               |
| `status`          | `upcoming`, `collecting`, `collected`, `drawn`, `paid` |
| `dueDate`         | When contributions are due                             |
| `potAmount`       | Expected total in santim                               |
| `recipient`       | Set after the draw                                     |

## contributions

| Field                              | Notes                                |
| ---------------------------------- | ------------------------------------ |
| `group`, `cycle`, `member`, `user` | Ownership                            |
| `amount`, `penaltyAmount`          | Santim                               |
| `status`                           | `pending`, `paid`, `waived`          |
| `dueDate`, `lateAfter`             | Deadline and end of the grace period |
| `paidAt`                           | When resolved                        |

One contribution exists per member per cycle.

## payments

| Field                            | Notes                                       |
| -------------------------------- | ------------------------------------------- |
| `contribution`, `group`, `user`  | What is being paid and by whom              |
| `txRef`                          | Unique gateway reference                    |
| `amount`                         | Santim, set by the server                   |
| `status`                         | `pending`, `paid`, `failed`, `needs_review` |
| `requiresReview`, `reviewReason` | Set on amount mismatch or duplicate payment |
| `gatewayResponse`                | Stored verify response for audit            |

## transactions

Append-only ledger.

| Field                    | Notes                                                 |
| ------------------------ | ----------------------------------------------------- |
| `group`, `cycle`, `user` | Context                                               |
| `type`                   | Contribution, penalty, payout and similar entry types |
| `contribution`, `payout` | Source record                                         |
| `amount`                 | Santim                                                |
| `occurredAt`             | When the money event happened                         |

At most one contribution-type entry exists per contribution.

## draws

| Field                | Notes                            |
| -------------------- | -------------------------------- |
| `group`, `cycle`     | What was drawn                   |
| `method`             | Random or fixed order            |
| `seed`               | Seed for the random method       |
| `participants`       | Ordered list of eligible members |
| `winner`             | Selected member                  |
| `drawnAt`, `drawnBy` | When and by whom                 |

`verified` is not stored; it is recomputed on every read.

## payouts

| Field                    | Notes               |
| ------------------------ | ------------------- |
| `group`, `cycle`, `draw` | Origin              |
| `user`, `member`         | Recipient           |
| `amount`                 | Santim              |
| `status`                 | `pending` or `paid` |
| `paidAt`, `paidBy`       | Set when paid       |

## notifications

| Field                              | Notes                        |
| ---------------------------------- | ---------------------------- |
| `user`                             | Recipient                    |
| `type`, `title`, `message`, `data` | Content                      |
| `dedupeKey`                        | Unique per user when present |
| `readAt`                           | Set when read                |

## auditlogs

| Field                    | Notes                     |
| ------------------------ | ------------------------- |
| `actor`                  | User who acted            |
| `action`                 | Action name               |
| `entityType`, `entityId` | Target                    |
| `group`                  | Group scope when relevant |
| `details`                | Extra context             |

## reports, organizers, drawparticipants

`Report` and `Organizer` exist as model files reserved for report snapshots and organizer profile data. `DrawParticipant` is reserved; draw participants are currently embedded in the draw document.
