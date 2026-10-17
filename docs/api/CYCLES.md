# Cycles API

Prefix: `/api/groups/:groupId/cycles`. All routes need an access token and group membership.

| Method | Path        | Purpose                                     |
| ------ | ----------- | ------------------------------------------- |
| GET    | `/`         | List the cycles of the group in order       |
| GET    | `/current`  | Read the cycle that is currently collecting |
| GET    | `/:cycleId` | Read one cycle                              |

## Model

A group has exactly one cycle per member. Starting the group creates all cycles at once.

| Field       | Meaning                                                |
| ----------- | ------------------------------------------------------ |
| `number`    | Position of the cycle, starting at 1                   |
| `status`    | `upcoming`, `collecting`, `collected`, `drawn`, `paid` |
| `potAmount` | Total expected contributions in santim                 |
| `dueDate`   | When contributions for the cycle are due               |
| `recipient` | The member who receives the pot, set after the draw    |

Example after starting a group of three:

```json
["collecting", "upcoming", "upcoming"]
```

## Status flow

```
upcoming → collecting → collected → drawn → paid
```

- `collecting`: contributions are being recorded or paid.
- `collected`: every contribution is paid or waived.
- `drawn`: a recipient was selected.
- `paid`: the payout was marked paid; the next cycle opens, or the group completes after the last one.

## Errors

| Status | Reason                                                  |
| ------ | ------------------------------------------------------- |
| 404    | Group or cycle not found, or the caller is not a member |
