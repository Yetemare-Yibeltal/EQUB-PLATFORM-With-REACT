# Contribution Flow

## Creation

When a group starts, the server creates a contribution for every member in every cycle. Each contribution has:

- the amount owed (`contributionAmount`)
- a due date derived from the cycle
- a `lateAfter` time, the end of the grace period
- the status `pending`

Only the first cycle is open for collection; later cycles stay `upcoming`.

## Resolving a contribution

A pending contribution is resolved in one of three ways.

### In-person payment

1. The member pays the organizer in cash or by another outside method.
2. The organizer records it with `POST /api/groups/:groupId/contributions/:contributionId/pay`.
3. The server writes the contribution as `paid`, adds a ledger entry, and checks the cycle.

### Online payment

1. The member starts a checkout.
2. After the gateway confirms the payment, the server marks the contribution `paid` and writes the ledger entry.

See [PAYMENT_FLOW.md](PAYMENT_FLOW.md).

### Waiver

1. The organizer waives the contribution with `POST .../waive`.
2. The contribution becomes `waived` and no money moves. The cycle's pot is smaller by that amount.

## Late penalties

- A payment recorded before `lateAfter` carries no penalty.
- A payment after `lateAfter` adds the group's `latePenaltyAmount` once.
- The penalty is stored in `penaltyAmount` and appears as its own part of the ledger.
- An online checkout asks for the amount including the penalty at the time of checkout.

## Cycle completion

After each resolution the server checks the cycle. When every contribution is `paid` or `waived`, the cycle becomes `collected`, and the organizer is notified that the draw can run.

## Rules

- A contribution can be resolved only once. A second attempt returns `409`.
- Only the organizer records and waives contributions.
- Members can read the group's ledger; outsiders cannot.
- A member can list their own contributions across groups.
- Resolution runs inside a transaction, so the contribution, ledger entry and cycle status change together or not at all.

## Reminders

Scheduled jobs notify members before a due date and when a contribution becomes late. Each reminder is sent once per occasion through the notification `dedupeKey`.
