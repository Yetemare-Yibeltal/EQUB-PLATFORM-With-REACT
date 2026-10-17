# Auth API

Prefix: `/api/auth`

| Method | Path               | Auth           | Purpose                                               |
| ------ | ------------------ | -------------- | ----------------------------------------------------- |
| POST   | `/register`        | none           | Create an account                                     |
| POST   | `/login`           | none           | Log in with phone or email and password               |
| POST   | `/refresh`         | refresh cookie | Rotate the refresh token and issue a new access token |
| POST   | `/logout`          | refresh cookie | Revoke the current refresh token                      |
| POST   | `/logout-all`      | access token   | Revoke every refresh token of the user                |
| POST   | `/change-password` | access token   | Change the password                                   |
| POST   | `/forgot-password` | none           | Start a password reset                                |
| POST   | `/reset-password`  | none           | Finish a password reset                               |

Authentication routes use the strict rate limit.

## Register

`POST /api/auth/register`

```json
{
  "fullName": "Abebe Kebede",
  "phone": "0911223344",
  "email": "abebe@example.com",
  "password": "Secret123"
}
```

`email` is optional. Response `201`: the user and an access token, with the refresh token set as an httpOnly cookie.

| Status | Reason                                |
| ------ | ------------------------------------- |
| 400    | Invalid phone number or weak password |
| 409    | Phone number is already registered    |

## Login

`POST /api/auth/login`

```json
{
  "identifier": "0911223344",
  "password": "Secret123"
}
```

`identifier` is the phone number or the email address. Response `200` has the same shape as register.

| Status | Reason                                                                             |
| ------ | ---------------------------------------------------------------------------------- |
| 401    | Wrong credentials. The message is identical for an unknown account                 |
| 429    | Too many requests, or the account is temporarily locked after five failed attempts |

## Refresh

`POST /api/auth/refresh` with the refresh cookie.

- A valid token is revoked and replaced by a new one; the response carries a new access token.
- Replaying an already used token revokes every session of that user.
- Without a cookie the response is `401` with `Refresh token is required`.

## Logout

`POST /api/auth/logout` revokes the cookie's token and clears the cookie.
`POST /api/auth/logout-all` revokes every token for the user.

## Change password

`POST /api/auth/change-password`

```json
{
  "currentPassword": "Secret123",
  "newPassword": "NewSecret456"
}
```

| Status | Reason                                                                      |
| ------ | --------------------------------------------------------------------------- |
| 400    | Wrong current password, weak new password, or reuse of the current password |

## Forgot and reset password

`POST /api/auth/forgot-password`

```json
{ "identifier": "0911223344" }
```

The response is the same whether or not the account exists.

`POST /api/auth/reset-password`

```json
{
  "token": "<64 character hex reset token>",
  "newPassword": "NewSecret456"
}
```

A reset token works once.

## Example

```
curl -i -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -c cookies.txt -d '{"identifier":"0911223344","password":"Secret123"}'
curl http://localhost:5000/api/users/me -H "Authorization: Bearer <accessToken>"
curl -i -X POST http://localhost:5000/api/auth/refresh -b cookies.txt -c cookies.txt
```
