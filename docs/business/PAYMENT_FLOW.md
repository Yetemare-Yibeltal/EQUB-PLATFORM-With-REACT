# Payment Flow

Online payments go through Chapa. The server decides the amount and confirms the result; the browser and the gateway's messages are never trusted on their own.

## Sequence

```
Member            Frontend            API                 Chapa
  │ pay              │                 │                    │
  ├─────────────────►│ POST /checkout  │                    │
  │                  ├────────────────►│ create pending     │
  │                  │                 │ payment + txRef    │
  │                  │                 ├───────────────────►│ initialize
  │                  │◄────────────────┤ checkout URL       │
  │◄─────────────────┤ redirect        │                    │
  │ pays on Chapa ──────────────────────────────────────────►│
  │                  │                 │◄───────────────────┤ webhook (signed)
  │                  │                 │ verify via API ───►│
  │                  │                 │ settle             │
  │◄─────────────────┤ callback / poll │                    │
```

## Checkout

1. The member requests a checkout for a contribution they own.
2. The server computes the exact amount, including any late penalty, and creates a `pending` payment with a unique `txRef`.
3. If an open checkout already exists for that contribution, it is reused.
4. The server asks Chapa to initialize the payment and returns the checkout URL.
5. If the gateway cannot be reached, no usable payment is left and the response reports the outage.

## Confirmation

A payment is confirmed through any of these entry points. All of them verify with the Chapa API before changing anything:

- the signed webhook at `POST /api/payments/webhook`
- the redirect at `GET /api/payments/callback`
- the member's own `POST /api/payments/ref/:txRef/verify`

The webhook must carry a valid HMAC signature. A bad signature is rejected with no change, and an unknown reference is acknowledged without effect.

## Settlement

| Situation                         | Result                                                               |
| --------------------------------- | -------------------------------------------------------------------- |
| Verified, amount matches          | Payment `paid`, contribution `paid`, one ledger entry, cycle checked |
| Verified failed                   | Payment `failed`; a later success can still settle it                |
| Amount differs from what was owed | Payment flagged for review; contribution stays `pending`             |
| Contribution already resolved     | Payment flagged for review                                           |
| Repeated confirmation             | No second ledger entry                                               |

Settlement runs in a transaction and is idempotent.

## Review

Flagged payments appear in the admin review queue. An admin resolves them with `POST /api/admin/payments/:paymentId/resolve-review`, which is recorded in the audit log. Refunds for a duplicate or wrong amount are handled with the gateway outside the application.

## Configuration

| Variable               | Purpose                                              |
| ---------------------- | ---------------------------------------------------- |
| `CHAPA_SECRET_KEY`     | API key for initialize and verify                    |
| `CHAPA_WEBHOOK_SECRET` | Secret for the webhook signature                     |
| Callback URL           | Must be publicly reachable, over HTTPS in production |

Use Chapa test keys in development. Testing the webhook against a local server needs a public tunnel URL.
