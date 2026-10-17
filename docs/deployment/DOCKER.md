# Docker

The repository ships a `docker-compose.yml` at the root, a `backend/Dockerfile`, and a `frontend/Dockerfile` that builds the SPA and serves it with nginx using `frontend/nginx.conf`.

Docker support has been written but not yet run end to end on the development machine. Treat the first run as a verification step.

## Requirements

- Docker Engine and the Compose plugin

## Configure

```
cp .env.example .env
```

Fill in the values in `.env`. The compose file reads them. At minimum:

- two different JWT secrets of at least 32 characters
- the MongoDB credentials the compose file expects
- `CLIENT_URL`, the public origin of the site
- Chapa keys if online payments are enabled

Never commit `.env`.

## Build and run

```
docker compose build
docker compose up -d
docker compose ps
docker compose logs -f
```

Stop and remove containers:

```
docker compose down
```

Remove the database volume as well. This deletes data:

```
docker compose down -v
```

## Replica set

The API needs a MongoDB replica set for transactions. The compose file runs MongoDB as a single node replica set. If the API logs a transaction error on first start, confirm the replica set was initiated:

```
docker compose logs mongo
```

## nginx

The frontend container:

- serves the built SPA and returns `index.html` for client-side routes
- proxies `/api` and `/socket.io` to the API container, including the WebSocket upgrade
- sets caching headers for hashed assets

## Common checks

| Check                | Command                            |
| -------------------- | ---------------------------------- |
| API health           | `curl http://localhost/api/health` |
| Container status     | `docker compose ps`                |
| API logs             | `docker compose logs backend`      |
| Shell in a container | `docker compose exec backend sh`   |

If a path above does not exist in your version of the files, read the service names in `docker-compose.yml` and adjust the commands.

## Images

Build with a fixed tag for deployments:

```
docker build -t equb-backend:1.0.0 backend
docker build -t equb-frontend:1.0.0 frontend
```

The deploy workflow in `.github/workflows/deploy.yml` builds and pushes images; set the repository secrets it names before enabling it.
