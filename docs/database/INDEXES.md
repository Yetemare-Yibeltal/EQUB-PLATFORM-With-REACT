# Database Indexes

Indexes are declared in each model file. Unique indexes also enforce business rules.

## users

| Index                              | Purpose                                 |
| ---------------------------------- | --------------------------------------- |
| `phone` unique                     | Login identifier                        |
| `email` unique, only when a string | Optional email without duplicate blanks |
| `{ role: 1, status: 1 }`           | Admin filters                           |
| `{ createdAt: -1 }`                | Newest users first                      |

## groups

| Index                             | Purpose                               |
| --------------------------------- | ------------------------------------- |
| `{ createdBy: 1, createdAt: -1 }` | Groups organized by a user            |
| `{ status: 1, createdAt: -1 }`    | Admin and scheduler queries by status |
| `inviteCode` unique               | Join and preview lookup               |

## members

| Index                                                        | Purpose                           |
| ------------------------------------------------------------ | --------------------------------- |
| `{ group: 1, user: 1 }` unique                               | One membership per user per group |
| `{ group: 1, payoutPosition: 1 }` unique, only when a number | Unique fixed order positions      |
| `{ group: 1, status: 1, createdAt: 1 }`                      | Member lists and join order       |
| `{ user: 1, status: 1, createdAt: -1 }`                      | A user's groups                   |

## cycles

| Index                                | Purpose                    |
| ------------------------------------ | -------------------------- |
| `{ group: 1, number: 1 }` unique     | One cycle number per group |
| `{ group: 1, status: 1, number: 1 }` | Find the current cycle     |

## contributions

| Index                                | Purpose                               |
| ------------------------------------ | ------------------------------------- |
| `{ cycle: 1, member: 1 }` unique     | One contribution per member per cycle |
| `{ group: 1, cycle: 1, status: 1 }`  | Ledger and cycle completion checks    |
| `{ status: 1, lateAfter: 1 }`        | Late penalty processing               |
| `{ user: 1, status: 1, dueDate: 1 }` | A user's contributions and reminders  |

## payments

| Index                                           | Purpose                     |
| ----------------------------------------------- | --------------------------- |
| `txRef` unique                                  | Lookup by gateway reference |
| `{ contribution: 1, status: 1, createdAt: -1 }` | Reuse an open checkout      |
| `{ group: 1, createdAt: -1 }`                   | Group payment history       |
| `{ user: 1, createdAt: -1 }`                    | A user's payments           |
| `{ requiresReview: 1, createdAt: -1 }`          | Admin review queue          |

## transactions

| Index                                                       | Purpose                           |
| ----------------------------------------------------------- | --------------------------------- |
| `{ contribution: 1 }` unique, only for contribution entries | One ledger entry per contribution |
| `{ cycle: 1, type: 1 }`                                     | Cycle totals                      |
| `{ group: 1, occurredAt: -1 }`                              | Group ledger                      |
| `{ user: 1, occurredAt: -1 }`                               | User statement                    |

## draws

| Index                      | Purpose               |
| -------------------------- | --------------------- |
| `{ group: 1, drawnAt: 1 }` | Draw history in order |

## payouts

| Index                                   | Purpose                |
| --------------------------------------- | ---------------------- |
| `{ group: 1, createdAt: 1 }`            | Group payouts in order |
| `{ user: 1, status: 1, createdAt: -1 }` | A user's payouts       |

## notifications

| Index                                                  | Purpose                         |
| ------------------------------------------------------ | ------------------------------- |
| `{ user: 1, dedupeKey: 1 }` unique, only when a string | Prevent duplicate notifications |
| `{ user: 1, createdAt: -1 }`                           | Notification list               |
| `{ user: 1, readAt: 1, createdAt: -1 }`                | Unread count and unread list    |
| `{ createdAt: 1 }`                                     | Clean-up of old notifications   |

## auditlogs

| Index                            | Purpose               |
| -------------------------------- | --------------------- |
| `{ group: 1, createdAt: -1 }`    | Group audit trail     |
| `{ actor: 1, createdAt: -1 }`    | Actions by a user     |
| `{ action: 1, createdAt: -1 }`   | Filter by action      |
| `{ entityType: 1, entityId: 1 }` | History of one record |

## Notes

- Partial unique indexes ignore documents where the field is missing, so optional fields do not collide.
- After changing an index in a model, create it in the target database. In production, build indexes during a maintenance window for large collections.
- Check a query with `explain("executionStats")` before adding another index.
