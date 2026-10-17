# Users API

Prefix: `/api/users`. All routes need an access token.

| Method | Path              | Access   | Purpose                    |
| ------ | ----------------- | -------- | -------------------------- |
| GET    | `/me`             | any user | Read the own profile       |
| PATCH  | `/me`             | any user | Update the own profile     |
| GET    | `/`               | admin    | List users                 |
| GET    | `/:userId`        | admin    | Read one user              |
| PATCH  | `/:userId/role`   | admin    | Change a user's role       |
| PATCH  | `/:userId/status` | admin    | Activate or suspend a user |

## Profile

`GET /api/users/me` returns the user without password or token fields.

`PATCH /api/users/me` updates editable profile fields. Fields that identify the account for login, such as the password, are changed only through the auth endpoints.

## Admin

- The user list is admin only; other roles receive `403`.
- Role changes and status changes are written to the audit log.
- Suspended users cannot log in and their refresh tokens are no longer accepted.

## Errors

| Status | Reason                            |
| ------ | --------------------------------- |
| 401    | Missing or invalid token          |
| 403    | The route requires the admin role |
| 404    | User not found                    |
