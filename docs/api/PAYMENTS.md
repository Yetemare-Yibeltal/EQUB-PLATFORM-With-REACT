# Payments and Transactions API

## Payments

Prefix: `/api/payments`

| Method | Path                 | Access                  | Purpose                                     |
| ------ | -------------------- | ----------------------- | ------------------------------------------- |
| POST   | `/checkout`          | payer                   | Start an online checkout for a contribution |
| GET    | `/callback`          | gateway redirect        | Return point after checkout                 |
| GET    | `/ref/:txRef`        | payer, organizer, admin | Read a payment by reference                 |
| POST   | `/ref/:txRef/verify` | payer                   | Ask the server to verify with the gateway   |
| POST   | `/webhook`           | gateway                 | Signed notification from Chapa              |
| GET    | `/`                  | admin                   | List all payments                           |

### Checkout

`POST /api/payments/checkout` with the contribution id.

- Creates a `pending` payment for the exact amount owed, including any penalty, and returns the gateway checkout URL.
- An open checkout for the same contribution is reused instead of creating a second one.
- Paying somebody else's contribution is refused.
- If the gateway is unavailable the response reports the outage and no usable payment is left behind.
- A contribution that is already resolved cannot be checked out (`409`).

### Settlement

A payment settles only after the server confirms it with the Chapa verify API, either through `/ref/:txRef/verify`, the callback, or a correctly signed webhook.

Outcomes:

- **Success with matching amount:** the contribution becomes `paid` and one ledger entry is written.
- **Failure:** the payment is recorded as failed; a later success can still settle it.
- **Amount mismatch:** the payment is flagged for review and the contribution stays `pending`.
- **Contribution already recorded:** the payment is flagged for review.

### Webhook

`POST /api/payments/webhook` requires a valid HMAC signature header. A bad signature is rejected and changes nothing. A callback for an unknown reference is acknowledged without effect.

### Reading

Only the payer, the group's organizer, or an admin can read a payment. The full list is admin only. A malformed reference returns `400`.

## Transactions

Transactions are the append-only ledger. Each settled payment and each recorded in-person payment writes one entry.

| Method | Path                                        | Access               | Purpose              |
| ------ | ------------------------------------------- | -------------------- | -------------------- |
| GET    | `/api/transactions`                         | admin or owner scope | List ledger entries  |
| GET    | `/api/groups/:groupId/transactions`         | member               | The group's ledger   |
| GET    | `/api/groups/:groupId/transactions/summary` | member               | Totals for the group |

Entries cannot be edited or deleted through the API.

## Payment status values

`pending`, `paid`, `failed`, `needs_review`.
