# Notifications API

Prefix: `/api/notifications`. All routes need an access token and only ever return the caller's own notifications.

| Method | Path                    | Purpose                          |
| ------ | ----------------------- | -------------------------------- |
| GET    | `/`                     | List notifications, newest first |
| GET    | `/unread-count`         | Number of unread notifications   |
| POST   | `/:notificationId/read` | Mark one notification as read    |
| POST   | `/read-all`             | Mark all notifications as read   |
| DELETE | `/:notificationId`      | Delete one notification          |

## Model

| Field              | Meaning                                                            |
| ------------------ | ------------------------------------------------------------------ |
| `type`             | Event type, for example contribution due, draw result, payout paid |
| `title`, `message` | Text shown to the user                                             |
| `data`             | Ids needed to link to the related group, cycle or payment          |
| `readAt`           | Set when read                                                      |
| `dedupeKey`        | Prevents the same event from notifying twice                       |

## Delivery

- Notifications are stored first, then pushed through Socket.IO to the user's room as soon as they are created.
- Events are created after the business transaction commits. A failure to notify never undoes the action that caused it.
- Reminder jobs create notifications for due contributions, ready draws and unpaid payouts. The `dedupeKey` ensures each reminder is sent once per occasion.

## Socket events

The client connects to `/socket.io` with the access token. The server emits a notification event to the user's room for each new notification, and draw events to the group's room.
