# API Reference

Base URL in development: `http://localhost:5000/api`

## Resource map

| Prefix                                                     | Document                             |
| ---------------------------------------------------------- | ------------------------------------ |
| `/api/auth`                                                | [AUTH.md](AUTH.md)                   |
| `/api/users`                                               | [USERS.md](USERS.md)                 |
| `/api/groups`                                              | [GROUPS.md](GROUPS.md)               |
| `/api/groups/:groupId/members`                             | [MEMBERS.md](MEMBERS.md)             |
| `/api/groups/:groupId/cycles`                              | [CYCLES.md](CYCLES.md)               |
| `/api/groups/:groupId/contributions`, `/api/contributions` | [CONTRIBUTIONS.md](CONTRIBUTIONS.md) |
| `/api/payments`, `/api/transactions`                       | [PAYMENTS.md](PAYMENTS.md)           |
| `/api/groups/:groupId/draws`                               | [DRAWS.md](DRAWS.md)                 |
| `/api/groups/:groupId/payouts`, `/api/payouts`             | [PAYOUTS.md](PAYOUTS.md)             |
| `/api/notifications`                                       | [NOTIFICATIONS.md](NOTIFICATIONS.md) |
| `/api/admin`, `/api/reports`                               | [ADMIN.md](ADMIN.md)                 |

## Authentication

Private endpoints need an access token:

```
Authorization: Bearer <accessToken>
```

The refresh token is an httpOnly cookie sent automatically to `/api/auth`. Browsers must send requests with credentials enabled.

## Response format

```json
{ "success": true, "message": "optional", "data": {} }
```

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "phone", "message": "Phone number is already registered" }
  ]
}
```

## Status codes

| Code | Meaning                                                          |
| ---- | ---------------------------------------------------------------- |
| 200  | Success                                                          |
| 201  | Created                                                          |
| 400  | Validation error or a rule was violated                          |
| 401  | Missing, invalid or expired token                                |
| 403  | Authenticated but not allowed                                    |
| 404  | Not found, or hidden from the caller                             |
| 409  | Conflict with current state, such as a duplicate or a full group |
| 429  | Rate limit exceeded                                              |
| 500  | Unexpected server error                                          |

## Conventions

- **Money** is an integer in santim. `100000` means 1,000 birr.
- **Dates** are ISO 8601 strings.
- **Ids** are MongoDB ObjectId strings, returned as `id`.
- **Pagination** uses `page` and `limit` query parameters; list responses include pagination metadata.
- **Rate limits**: 300 requests per 15 minutes on `/api`, and 10 per 15 minutes on authentication routes. Limits are reported in `RateLimit-*` headers.
- **Validation** is strict. Unknown fields are rejected. The exact rules are in `backend/src/validators`.
