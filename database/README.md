# Database

MongoDB with Mongoose. The application defines its collections and indexes in `backend/src/models`; this folder holds operational material.

```
database/
  migrations/   one-off data migrations, run manually and in order
  seeders/      development and demo data
  backups/      local backup output, not committed
```

## Requirements

MongoDB must run as a replica set, because services use multi-document transactions.

## Documentation

- [Schema](../docs/database/SCHEMA.md)
- [Relationships](../docs/database/RELATIONSHIPS.md)
- [Indexes](../docs/database/INDEXES.md)

## Databases

| Name        | Use                                                                          |
| ----------- | ---------------------------------------------------------------------------- |
| `equb`      | Development and production data                                              |
| `equb_test` | Integration tests. Test helpers refuse any name that does not end in `_test` |

## Backup and restore

```
mongodump --uri "<connection string>" --out database/backups/<date>
mongorestore --uri "<connection string>" database/backups/<date>
```

Never commit backup files. They contain personal data.

## Migrations

Write a migration as a standalone script that is safe to run twice, takes the connection string from the environment, and logs what it changed. Record each migration that ran in the release notes.
