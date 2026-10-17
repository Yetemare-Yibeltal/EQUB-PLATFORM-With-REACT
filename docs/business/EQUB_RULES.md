# Equb Rules

An equb is a rotating savings group. Every member contributes a fixed amount each cycle, and in each cycle one member receives the whole pot. When every member has received the pot once, the equb is complete.

## Roles

| Role      | Can do                                                                                                                       |
| --------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Organizer | Create and edit the group, approve or remove members, start or cancel, record or waive contributions, run draws, pay payouts |
| Member    | Join, view the group, contribute, pay online, receive a payout, leave before the start                                       |
| Admin     | Platform level oversight; resolve flagged payments, manage users, read audit logs                                            |

The creator of a group is its organizer and its first member. The organizer cannot leave the group.

## Group setup

- `contributionAmount` is the amount each member pays per cycle, in santim.
- `frequency` is `weekly` or `monthly`.
- `maxMembers` is at least 2.
- `startDate` must be in the future when the group is created.
- `latePenaltyAmount` is optional and cannot exceed `contributionAmount`.
- `requireApproval` makes new joins wait for the organizer.
- The payout order is random by default, or fixed to the order members joined.

## Joining

- Members join with an 8-character invite code.
- A group accepts joins only while it is open and not full.
- A member cannot join twice.
- With approval required, the request stays pending and the applicant cannot see the group until approved.
- A member who left may rejoin while the group is open. A removed member cannot rejoin.
- The organizer can replace the invite code at any time, and the old code stops working.

## Editing

- Name and other non-financial fields can be edited by the organizer while the group is open.
- Money fields are locked as soon as anyone besides the organizer has joined.
- `maxMembers` cannot be reduced below the current member count.

## Starting

- At least two members are required.
- Starting creates one cycle per member, and the first cycle opens for collection.
- `maxMembers` becomes the actual member count.
- A started group cannot be started again and accepts no new members.

## Pot

The pot of a cycle is `contributionAmount × members`, reduced by any waived contributions. Late penalties are collected from the late payer and are recorded in the ledger as penalties.

## Completion and cancellation

- A group becomes `completed` after the last cycle is paid out.
- An open group can be cancelled by its organizer with a reason. A cancelled group accepts no joins.
- Every member receives exactly one payout across a completed equb.

## Fairness and transparency

- Draw inputs and the seed are stored and can be recomputed by anyone in the group.
- Every contribution, payment and payout creates a ledger entry that cannot be edited.
- Sensitive actions are recorded in the audit log.
- Phone numbers are visible only to the organizer, and the invite code only to the organizer.
