# Groups API

Prefix: `/api/groups`. All routes need an access token.

| Method | Path                               | Access    | Purpose                                       |
| ------ | ---------------------------------- | --------- | --------------------------------------------- |
| POST   | `/`                                | any user  | Create a group; the creator becomes organizer |
| GET    | `/`                                | any user  | List the caller's groups                      |
| GET    | `/preview/:inviteCode`             | any user  | Preview a group before joining                |
| POST   | `/join`                            | any user  | Join with an invite code                      |
| GET    | `/:groupId`                        | member    | Read a group                                  |
| PATCH  | `/:groupId`                        | organizer | Edit a group                                  |
| POST   | `/:groupId/start`                  | organizer | Start the equb                                |
| POST   | `/:groupId/cancel`                 | organizer | Cancel an open group                          |
| POST   | `/:groupId/leave`                  | member    | Leave a group                                 |
| POST   | `/:groupId/invite-code/regenerate` | organizer | Replace the invite code                       |

Nested resources: members, cycles, contributions, draws, payouts, transactions, reports and audit logs live under `/api/groups/:groupId/...`.

## Create

`POST /api/groups`

```json
{
  "name": "Family Equb",
  "contributionAmount": 100000,
  "frequency": "weekly",
  "maxMembers": 4,
  "startDate": "2026-11-01T00:00:00.000Z"
}
```

Optional fields include `latePenaltyAmount` and `requireApproval`.

Rules:

- `frequency` is `weekly` or `monthly`.
- `maxMembers` must be at least 2.
- `startDate` must be in the future.
- `latePenaltyAmount` cannot exceed `contributionAmount`.

Response `201` returns the group with `status: "open"`, `memberCount: 1`, an 8-character `inviteCode`, and `membership.role: "organizer"`.

## Preview and join

`GET /api/groups/preview/:inviteCode` returns the group with `canJoin`. The invite code is not echoed back. An unknown code returns `404`.

`POST /api/groups/join` with `{ "inviteCode": "ABCD1234" }`.

| Status | Reason                                                             |
| ------ | ------------------------------------------------------------------ |
| 201    | Joined; `membership.status` is `pending` when approval is required |
| 403    | The caller was removed from this group before                      |
| 404    | Unknown invite code                                                |
| 409    | Already a member, group is full, or the group is no longer open    |

## Read

`GET /api/groups/:groupId` returns `404` to non-members and `403` to a member whose request is still pending. `inviteCode` is included only for the organizer.

## Edit

`PATCH /api/groups/:groupId` is organizer only.

- Money fields such as `contributionAmount` are locked with `409` once anyone besides the organizer has joined.
- `maxMembers` cannot drop below the current member count (`400`).

## Start

`POST /api/groups/:groupId/start`

- Needs at least two members, otherwise `400`.
- Creates one cycle per member and opens the first one for collection.
- `maxMembers` is set to the actual member count.
- Response includes the `group` with `status: "active"` and the `currentCycle`.
- Starting again, or joining after start, returns `409`.

## Cancel, leave, regenerate

- `POST /:groupId/cancel` with an optional `reason` sets `status: "cancelled"`. Later joins return `409`.
- `POST /:groupId/leave` removes the caller. The organizer cannot leave (`400`). A member who left may rejoin; a removed member may not.
- `POST /:groupId/invite-code/regenerate` returns a new `inviteCode`. The old code stops working.

## Group status values

`open`, `active`, `completed`, `cancelled`.
