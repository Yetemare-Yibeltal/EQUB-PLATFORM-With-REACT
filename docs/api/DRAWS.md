# Draws API

Prefix: `/api/groups/:groupId/draws`. All routes need an access token and group membership.

| Method | Path       | Access    | Purpose                                    |
| ------ | ---------- | --------- | ------------------------------------------ |
| POST   | `/`        | organizer | Run the draw for a cycle                   |
| GET    | `/`        | member    | List draws of the group                    |
| GET    | `/:drawId` | member    | Read one draw with its verification result |

## Run a draw

`POST /api/groups/:groupId/draws` with `{ "cycleId": "..." }`.

Rules:

- Only the organizer can run it, and `cycleId` is required.
- The cycle must be `collected`. A cycle that is still collecting or has not opened is refused.
- A cycle where every contribution was waived cannot be drawn.
- Eligible participants are members who have not yet received a payout.

With a random draw, the server generates a seed and picks the recipient as `sha256(seed) mod participants`. With a fixed order group, members are paid in the order they joined and no randomness is involved.

On success the cycle becomes `drawn` and a payout is created for the recipient.

## Verification

Each draw stores its seed and the ordered participant list. On every read the server recomputes the result and returns a `verified` flag. Anyone with access can repeat the calculation:

```
index = sha256(seed) mod participants.length
recipient = participants[index]
```

## Errors

| Status | Reason                                         |
| ------ | ---------------------------------------------- |
| 400    | Missing cycle id, or the cycle cannot be drawn |
| 403    | The caller is not the organizer                |
| 404    | Not found or not visible to the caller         |
| 409    | The cycle was already drawn                    |
