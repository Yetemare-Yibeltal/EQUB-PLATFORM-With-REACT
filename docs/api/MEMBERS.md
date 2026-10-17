# Members API

Prefix: `/api/groups/:groupId/members`. All routes need an access token.

| Method | Path                 | Access    | Purpose                   |
| ------ | -------------------- | --------- | ------------------------- |
| GET    | `/`                  | member    | List members              |
| POST   | `/:memberId/approve` | organizer | Approve a pending request |
| POST   | `/:memberId/reject`  | organizer | Reject a pending request  |
| DELETE | `/:memberId`         | organizer | Remove a member           |

## List

`GET /api/groups/:groupId/members?status=pending`

- `status` filters by membership status. Pending requests are normally reviewed by the organizer.
- Each item contains `id`, `role`, `status`, and a `user` object with `id` and `fullName`.
- The `phone` field of `user` is returned only to the organizer. Regular members do not receive it.

## Approve and reject

`POST /:memberId/approve` activates a pending member. The applicant can then read the group (`200`); before that they receive `403`.

`POST /:memberId/reject` sets the member's status to `rejected` and returns the updated member.

## Remove

`DELETE /:memberId` removes a member from an open group. A removed member receives `403` if they try to join again with the invite code.

## Membership status values

`pending`, `active`, `rejected`, `removed`, `left`.

## Errors

| Status | Reason                                                                  |
| ------ | ----------------------------------------------------------------------- |
| 403    | The caller is not the organizer                                         |
| 404    | Group or member not found, or hidden from the caller                    |
| 409    | The request is not pending or the group state does not allow the change |
