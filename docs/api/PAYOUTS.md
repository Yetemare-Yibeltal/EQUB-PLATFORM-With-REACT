# Payouts API

## Group payouts

Prefix: `/api/groups/:groupId/payouts`

| Method | Path             | Access    | Purpose                   |
| ------ | ---------------- | --------- | ------------------------- |
| GET    | `/`              | member    | List payouts of the group |
| GET    | `/:payoutId`     | member    | Read one payout           |
| POST   | `/:payoutId/pay` | organizer | Mark a payout as paid     |

## Personal view

| Method | Path                | Purpose                                   |
| ------ | ------------------- | ----------------------------------------- |
| GET    | `/api/payouts/mine` | Payouts the caller has received or is due |

## Model

| Field       | Meaning                                       |
| ----------- | --------------------------------------------- |
| `cycle`     | The cycle that produced it                    |
| `recipient` | The member who receives the pot               |
| `amount`    | The pot in santim, after waived contributions |
| `status`    | `pending` or `paid`                           |
| `paidAt`    | When the organizer marked it paid             |

## Paying

`POST /:payoutId/pay`

- Organizer only.
- Moves the payout to `paid`, writes a ledger entry and the audit log.
- The cycle becomes `paid`, and the next cycle opens for collection.
- After the final cycle is paid, the group becomes `completed`.
- A payout that is already paid returns `409`.

Across a full equb every member is paid exactly once.

## Errors

| Status | Reason                                 |
| ------ | -------------------------------------- |
| 403    | The caller is not the organizer        |
| 404    | Not found or not visible to the caller |
| 409    | The payout was already paid            |
