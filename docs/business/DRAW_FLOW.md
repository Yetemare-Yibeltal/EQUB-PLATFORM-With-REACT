# Draw Flow

The draw decides which member receives the pot of a cycle.

## Preconditions

- The caller is the group organizer.
- The request includes a valid `cycleId`.
- The cycle status is `collected`. A cycle that is still collecting, or has not opened, cannot be drawn.
- At least one contribution in the cycle was paid. A cycle where every contribution was waived is refused.
- At least one eligible member remains.

## Eligibility

Eligible members are active members who have not received a payout in an earlier cycle. A member can win only once.

## Methods

### Random

1. The server generates a random seed.
2. Eligible members are listed in a stable order.
3. The recipient index is `sha256(seed) mod eligibleCount`.
4. The seed, the ordered list and the result are stored in the draw.

### Fixed order

When the group uses a fixed order, no randomness is involved. The next member by `payoutPosition`, which follows the order of joining, receives the cycle.

## Result

In one transaction the server:

1. creates the draw record
2. sets the cycle recipient and moves the cycle to `drawn`
3. creates a pending payout for the recipient
4. writes an audit log entry

After commit, notifications go to the recipient and to the group, and a draw event is broadcast to the group's socket room.

## Verification

Reading a draw recomputes the recipient from the stored seed and participants and returns `verified: true` only if it matches the stored winner. Any member can repeat the calculation independently:

```
index = sha256(seed) mod participants.length
recipient = participants[index]
```

## Rules

- A cycle is drawn only once; a second attempt returns `409`.
- The draw cannot be edited or deleted.
- Over a full random equb, every member is selected exactly once.
- Waived contributions produce a smaller pot but do not exclude anyone from the draw.
