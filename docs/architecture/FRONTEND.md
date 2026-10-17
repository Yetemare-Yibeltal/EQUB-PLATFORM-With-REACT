# Frontend Architecture

## Structure

```
frontend/src/
  components/   common, layout, auth, group, member, cycle, contribution,
                payment, draw, payout, notification, dashboard, admin
  constants/    routes, roles, statuses, payment methods
  context/      auth, socket and theme providers
  hooks/        data hooks per resource, useAsyncData, useGroup
  pages/        route-level screens
  services/     axios client and one service per API resource
  store/        zustand stores
  styles/       index.css and features.css
  utils/        formatting, validation, error and storage helpers
  router.jsx    route table
```

## Data flow

- `services/api.js` is the single axios instance. It attaches the access token, and on a 401 it calls the refresh endpoint once, then retries the request.
- Service modules wrap endpoints and return unwrapped `data`.
- Hooks call services and expose state to components.
- `useAsyncData(loader, reloadKey)` runs a loader, returns `{ data, loading, error, reload }`, and reruns when `reloadKey` changes. The loader is kept in a ref, so an inline function does not cause loops.

## Authentication

- The access token lives in memory only, never in `localStorage`.
- The refresh token is an httpOnly cookie scoped to `/api/auth`.
- On page load the app calls refresh to restore the session.
- `ProtectedRoute` guards private routes and admin routes by role.

## Group workspace

`GroupShell` loads a group once and renders its tabs through a nested route outlet. Child pages read the shared group through `useGroup()`, which wraps `useOutletContext`.

```jsx
import { useGroup } from '../../hooks/useGroup'

const { group, reload } = useGroup()
```

## Real-time

`SocketContext` connects after login and updates the notification store. `NotificationBell` shows the unread count and the latest messages.

## Money and dates

- Amounts arrive as integer santim and are formatted by `formatCurrency`.
- Dates are formatted by `formatDate` for the Africa/Addis_Ababa time zone.

## Development

The Vite dev server proxies `/api` and `/socket.io` to the backend, so the browser sees one origin.

```
npm run dev:frontend
npm --prefix frontend run lint
npm --prefix frontend run build
```

## Production

The Docker image builds the SPA and serves it with nginx. nginx falls back to `index.html` for client-side routes and proxies `/api` and `/socket.io` to the API.
