# Payout Flow

A payout hands the pot of a drawn cycle to its recipient.

## Creation

A payout is created automatically with the draw, in status `pending`.

| Field       | Value                                                |
| ----------- | ---------------------------------------------------- |
| `recipient` | The drawn member                                     |
| `amount`    | The cycle pot: collected contributions after waivers |
| `status`    | `pending`                                            |

## Paying

1. The organizer hands over the money outside the platform, or by the agreed method.
2. The organizer marks the payout paid with `POST /api/groups/:groupId/payouts/:payoutId/pay`.
3. In one transaction the server:
   - sets the payout to `paid` with `paidAt`
   - writes the payout ledger entry
   - moves the cycle to `paid`
   - opens the next cycle for collection, or completes the group after the last cycle
   - writes an audit log entry
4. After commit, the recipient is notified.

## Rules

- Only the organizer can mark a payout paid.
- A payout can be paid once; a second attempt returns `409`.
- The next cycle opens only after the previous payout is paid.
- After the final payout, the group status is `completed`.
- Across a completed equb, each member receives exactly one payout.
- Members can read the group's payouts, and every user can see their own payouts at `/api/payouts/mine`.

## Reminders

A scheduled job reminds the organizer about payouts that remain unpaid after a draw. The reminder is sent once per occasion.

## Reconciliation

For each completed cycle, total contributions in the ledger minus waived amounts equals the payout amount. The group summary report shows collected, paid out and outstanding totals so the organizer and members can check this.
