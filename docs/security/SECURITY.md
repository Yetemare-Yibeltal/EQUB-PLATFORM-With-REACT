# Security Practices

Operational security guidance for developers and operators. The design is described in [../architecture/SECURITY.md](../architecture/SECURITY.md).

## Secrets

- Generate each JWT secret with at least 48 random bytes:

```
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

- Store the output on a single line. Terminal wrapping can truncate a copied secret and the API will refuse to start if it is shorter than 32 characters.
- Use different values for `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`.
- Never commit `.env` files. Never paste connection strings, passwords or tokens into chats, tickets or logs.
- Rotate a credential immediately if it was exposed, including database passwords and Chapa keys.

## Database

- Use a dedicated database user with the least privileges needed.
- Restrict network access to the database to the API host.
- Keep tests on a database whose name ends in `_test`. The test helpers refuse any other name.
- Take regular backups and test restoring them.

## Accounts

- Passwords require a minimum strength enforced by the validators.
- Five failed logins lock an account for a cooling-off period.
- Admin accounts should be few, named, and protected with strong unique passwords.

## Payments

- Configure the Chapa webhook secret and keep the webhook URL on HTTPS.
- Never mark a payment as paid from a browser redirect. Settlement happens only after the verify API or a valid signed webhook.
- Review payments flagged for review in the admin area promptly. Flags mean an amount mismatch or a payment for an already recorded contribution.

## Operations checklist

- [ ] `NODE_ENV=production`
- [ ] TLS terminates at the proxy and HSTS is active
- [ ] `CLIENT_URL` is the exact production origin
- [ ] Strong, unique JWT secrets set
- [ ] Database not reachable from the public internet
- [ ] Chapa live keys and webhook secret set
- [ ] Log files and backups are access controlled
- [ ] Dependencies audited with `npm audit` and updated on a schedule

## Dependency hygiene

Run an audit regularly and review advisories before applying forced upgrades.

```
npm --prefix backend audit
npm --prefix frontend audit
```

## Reporting a vulnerability

Report suspected vulnerabilities privately to the project maintainers. Do not open a public issue with exploit details.
