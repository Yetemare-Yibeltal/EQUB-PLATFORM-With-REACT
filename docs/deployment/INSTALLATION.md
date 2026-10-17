# Installation

Local development setup without Docker.

## Requirements

- Node.js 20 or newer
- npm
- MongoDB 6 or newer, running as a replica set (transactions require it)
- Git

## 1. Clone and install

```
git clone https://github.com/Yetemare-Yibeltal/EQUB-PLATFORM-With-REACT.git
cd EQUB-PLATFORM-With-REACT
npm --prefix backend install
npm --prefix frontend install
```

## 2. Start a local MongoDB replica set

Create a data folder and start `mongod` with a replica set name.

```
mongod --dbpath ./database/data --port 27018 --replSet rs0 --bind_ip 127.0.0.1
```

In another terminal, initiate the set once:

```
mongosh --port 27018 --eval "rs.initiate({_id:'rs0',members:[{_id:0,host:'127.0.0.1:27018'}]})"
```

Confirm it is primary:

```
mongosh --port 27018 --eval "rs.status().ok"
```

A hosted cluster such as MongoDB Atlas also works and is already a replica set.

## 3. Configure the backend

```
cp backend/.env.example backend/.env
```

Set at least:

```
MONGODB_URI=mongodb://localhost:27018/equb?directConnection=true
JWT_ACCESS_SECRET=<48 random bytes as hex>
JWT_REFRESH_SECRET=<a different 48 random bytes as hex>
JWT_REFRESH_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

Generate each secret:

```
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Paste the value as one unbroken line. Add Chapa test keys if you want to try online payments.

## 4. Run

Backend:

```
npm --prefix backend run dev
```

Frontend, in another terminal:

```
npm --prefix frontend run dev
```

Open `http://localhost:5173`. The Vite dev server proxies `/api` and `/socket.io` to the backend on port 5000.

## 5. Verify

```
npm --prefix backend run test:unit
npm --prefix backend run test:integration
npm --prefix frontend run lint
npm --prefix frontend run build
```

Integration tests need a database whose name ends in `_test`:

```
export TEST_MONGODB_URI="mongodb://localhost:27018/equb_test?directConnection=true"
```

## Troubleshooting

| Symptom                                                        | Cause and fix                                                                                  |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `Invalid environment configuration` at start                   | A variable is missing or malformed. Read the listed names; secrets need at least 32 characters |
| `Transaction numbers are only allowed on a replica set member` | MongoDB is not running as a replica set. Start it with `--replSet` and run `rs.initiate`       |
| `querySrv ENOTFOUND`                                           | DNS cannot resolve the Atlas host. Check the network, or use the local replica set             |
| 500 with `expiresIn`                                           | `JWT_REFRESH_EXPIRES_IN` is not a valid duration such as `7d`                                  |
| Tests refuse to run                                            | The test database name does not end in `_test`                                                 |
| Running a command from the wrong folder                        | Run commands from the repository root using `--prefix`                                         |
