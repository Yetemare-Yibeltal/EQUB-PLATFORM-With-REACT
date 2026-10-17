# Contributions API

## Group ledger

Prefix: `/api/groups/:groupId/contributions`. Members can read; only the organizer can record or waive.

| Method | Path                     | Access    | Purpose                                     |
| ------ | ------------------------ | --------- | ------------------------------------------- |
| GET    | `/`                      | member    | List contributions, filter with `?cycleId=` |
| POST   | `/:contributionId/pay`   | organizer | Record an in-person payment                 |
| POST   | `/:contributionId/waive` | organizer | Waive a contribution                        |

Outsiders receive `404` for the ledger.

## Personal view

| Method | Path                      | Purpose                                          |
| ------ | ------------------------- | ------------------------------------------------ |
| GET    | `/api/contributions/mine` | The caller's own contributions across all groups |

## Model

| Field                      | Meaning                                             |
| -------------------------- | --------------------------------------------------- |
| `member`, `cycle`, `group` | References                                          |
| `amount`                   | Amount due in santim                                |
| `penaltyAmount`            | Late penalty added when paid after the grace period |
| `status`                   | `pending`, `paid`, `waived`                         |
| `paidAt`                   | When it was resolved                                |

A cycle with three members produces three contributions.

## Recording a payment

`POST /:contributionId/pay` with the payment details required by the validator.

- An on-time payment has no penalty.
- A payment after the grace period adds the group's late penalty once.
- When every contribution in the cycle is resolved, the cycle moves to `collected`.
- A contribution that is already `paid` or `waived` cannot be resolved again (`409`).

## Waiving

`POST /:contributionId/waive` resolves the contribution without money. The cycle's pot becomes smaller by the waived amount. A cycle where every contribution is waived cannot be drawn.

## Errors

| Status | Reason                                 |
| ------ | -------------------------------------- |
| 400    | Validation failed                      |
| 403    | The caller is not the organizer        |
| 404    | Not found or not visible to the caller |
| 409    | Already resolved                       |
