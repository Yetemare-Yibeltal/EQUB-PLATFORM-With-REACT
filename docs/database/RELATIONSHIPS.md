# Database Relationships

## Entity diagram

```
User 1───* Member *───1 Group
                          │
                          1
                          │
                          *
                        Cycle ───────* Contribution *───1 Member
                          │                 │
                          │                 1
                          │                 │
                          │                 *
                          │              Payment
                          │
                          1
                          │
                          1
                         Draw ───1─── Payout *───1 Member (recipient)

Group 1───* Transaction     (ledger, references cycle, contribution, payout)
User  1───* Notification
Group 1───* AuditLog
```

## Relationships

| From         | To           | Cardinality        | Notes                                          |
| ------------ | ------------ | ------------------ | ---------------------------------------------- |
| User         | Member       | one to many        | A user joins many groups                       |
| Group        | Member       | one to many        | One membership per user per group              |
| Group        | Cycle        | one to many        | Exactly one cycle per member, created at start |
| Cycle        | Contribution | one to many        | One per member per cycle                       |
| Contribution | Payment      | one to many        | Several attempts can exist, only one settles   |
| Cycle        | Draw         | one to one         | A cycle is drawn once                          |
| Draw         | Payout       | one to one         | The payout is created with the draw            |
| Cycle        | Payout       | one to one         | One recipient per cycle                        |
| Contribution | Transaction  | one to at most one | Unique ledger entry per contribution           |
| Payout       | Transaction  | one to one         | Written when the payout is paid                |
| User         | Notification | one to many        | Deduplicated by `dedupeKey`                    |
| Group        | AuditLog     | one to many        | Plus global entries with no group              |

## Integrity rules

- A user has at most one membership per group.
- A cycle number is unique within a group.
- A member has at most one contribution per cycle.
- A ledger entry exists at most once per contribution.
- `payoutPosition` is unique within a group when assigned.
- A notification with a `dedupeKey` is unique per user.

These rules are enforced by unique indexes, so they hold under concurrent requests as well as in application code.

## Transactions

Operations that change several documents commit together:

| Operation           | Documents written                                    |
| ------------------- | ---------------------------------------------------- |
| Start group         | group, cycles, contributions                         |
| Record contribution | contribution, transaction, cycle status              |
| Settle payment      | payment, contribution, transaction, cycle status     |
| Run draw            | draw, cycle, payout                                  |
| Pay payout          | payout, transaction, cycle, next cycle, group status |

## Deletion

Business records are not deleted. Members leave or are removed by status change, groups are cancelled by status, and the ledger is append-only. Only notifications can be deleted by their owner, and old read ones are cleaned up by a scheduled job.
