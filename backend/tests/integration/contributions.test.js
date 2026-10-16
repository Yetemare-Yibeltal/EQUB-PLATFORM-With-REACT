import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";
import Contribution from "../../src/models/Contribution.js";
import {
  as,
  contributionsOf,
  createEqub,
  startDatabase,
  stopDatabase,
} from "../helpers.js";

beforeAll(startDatabase);
afterAll(stopDatabase);

const DAY_MS = 24 * 60 * 60 * 1000;

const ownContribution = (contributions, user) =>
  contributions.find((contribution) => contribution.user.id === user.id);

describe("recording contributions", () => {
  test("records an on-time payment without a penalty", async () => {
    const { organizer, members, groupId, cycleIds } = await createEqub({
      size: 3,
    });
    const contribution = ownContribution(
      await contributionsOf(organizer, groupId, cycleIds[0]),
      members[0],
    );

    const response = await as(organizer).post(
      `/api/groups/${groupId}/contributions/${contribution.id}/pay`,
      { paymentMethod: "telebirr", reference: "T-1" },
    );

    expect(response.status).toBe(200);
    expect(response.body.data.contribution.status).toBe("paid");
    expect(response.body.data.contribution.isLate).toBe(false);
    expect(response.body.data.contribution.amountPaid).toBe(50000);
  });

  test("adds the late penalty once the grace period has passed", async () => {
    const { organizer, members, groupId, cycleIds } = await createEqub({
      size: 3,
    });
    const contribution = ownContribution(
      await contributionsOf(organizer, groupId, cycleIds[0]),
      members[1],
    );

    await Contribution.updateOne(
      { _id: contribution.id },
      {
        $set: {
          dueDate: new Date(Date.now() - 5 * DAY_MS),
          lateAfter: new Date(Date.now() - DAY_MS),
        },
      },
    );

    const overdue = await as(organizer).get(
      `/api/groups/${groupId}/contributions?cycleId=${cycleIds[0]}&overdue=true`,
    );

    expect(overdue.body.data.contributions).toHaveLength(1);
    expect(overdue.body.data.contributions[0].isOverdue).toBe(true);
    expect(overdue.body.data.contributions[0].amountOutstanding).toBe(55000);

    const response = await as(organizer).post(
      `/api/groups/${groupId}/contributions/${contribution.id}/pay`,
      { paymentMethod: "cash" },
    );

    expect(response.status).toBe(200);
    expect(response.body.data.contribution.isLate).toBe(true);
    expect(response.body.data.contribution.amountPaid).toBe(55000);

    const ledger = await as(organizer).get(
      `/api/groups/${groupId}/transactions`,
    );
    const entry = ledger.body.data.transactions[0];

    expect(entry.amount).toBe(55000);
    expect(entry.penaltyAmount).toBe(5000);

    const cycle = await as(organizer).get(
      `/api/groups/${groupId}/cycles/${cycleIds[0]}`,
    );

    expect(cycle.body.data.cycle.collectedAmount).toBe(55000);
  });

  test("moves the cycle to collected when every contribution is resolved", async () => {
    const { organizer, members, groupId, cycleIds } = await createEqub({
      size: 3,
    });
    const contributions = await contributionsOf(
      organizer,
      groupId,
      cycleIds[0],
    );

    const paidOwn = await as(organizer).post(
      `/api/groups/${groupId}/contributions/${ownContribution(contributions, organizer).id}/pay`,
      { paymentMethod: "cash" },
    );
    const paidMember = await as(organizer).post(
      `/api/groups/${groupId}/contributions/${ownContribution(contributions, members[0]).id}/pay`,
      { paymentMethod: "bank_transfer" },
    );
    const waived = await as(organizer).post(
      `/api/groups/${groupId}/contributions/${ownContribution(contributions, members[1]).id}/waive`,
      { reason: "Hardship approved by the group" },
    );

    expect([paidOwn.status, paidMember.status, waived.status]).toEqual([
      200, 200, 200,
    ]);

    const cycle = await as(organizer).get(
      `/api/groups/${groupId}/cycles/${cycleIds[0]}`,
    );

    expect(cycle.body.data.cycle.status).toBe("collected");
    expect(cycle.body.data.cycle.resolvedCount).toBe(3);
    expect(cycle.body.data.cycle.collectedAmount).toBe(100000);
    expect(cycle.body.data.cycle.pendingCount).toBe(0);

    const ledger = await as(organizer).get(
      `/api/groups/${groupId}/transactions`,
    );

    expect(ledger.body.data.transactions).toHaveLength(2);
  });

  test("refuses to resolve a contribution twice", async () => {
    const { organizer, members, groupId, cycleIds } = await createEqub({
      size: 3,
    });
    const contribution = ownContribution(
      await contributionsOf(organizer, groupId, cycleIds[0]),
      members[0],
    );
    const url = `/api/groups/${groupId}/contributions/${contribution.id}`;

    expect(
      (await as(organizer).post(`${url}/pay`, { paymentMethod: "cash" }))
        .status,
    ).toBe(200);
    expect(
      (await as(organizer).post(`${url}/pay`, { paymentMethod: "cash" }))
        .status,
    ).toBe(409);
    expect(
      (await as(organizer).post(`${url}/waive`, { reason: "Too late now" }))
        .status,
    ).toBe(409);
  });

  test("validates the request", async () => {
    const { organizer, members, groupId, cycleIds } = await createEqub({
      size: 3,
    });
    const contribution = ownContribution(
      await contributionsOf(organizer, groupId, cycleIds[0]),
      members[0],
    );
    const url = `/api/groups/${groupId}/contributions/${contribution.id}`;
    const nextYear = new Date(Date.now() + 365 * DAY_MS).toISOString();

    expect(
      (await as(organizer).post(`${url}/pay`, { paymentMethod: "barter" }))
        .status,
    ).toBe(400);
    expect(
      (await as(organizer).post(`${url}/pay`, { paymentMethod: "chapa" }))
        .status,
    ).toBe(400);
    expect(
      (
        await as(organizer).post(`${url}/pay`, {
          paymentMethod: "cash",
          paidAt: nextYear,
        })
      ).status,
    ).toBe(400);
    expect((await as(organizer).post(`${url}/waive`, {})).status).toBe(400);
  });

  test("limits recording and waiving to the organizer", async () => {
    const { members, groupId, cycleIds, organizer } = await createEqub({
      size: 3,
    });
    const contribution = ownContribution(
      await contributionsOf(organizer, groupId, cycleIds[0]),
      members[0],
    );
    const url = `/api/groups/${groupId}/contributions/${contribution.id}`;

    expect(
      (await as(members[0]).post(`${url}/pay`, { paymentMethod: "cash" }))
        .status,
    ).toBe(403);
    expect(
      (await as(members[0]).post(`${url}/waive`, { reason: "Because" })).status,
    ).toBe(403);
  });

  test("lets members read the ledger but hides it from outsiders", async () => {
    const { organizer, members, groupId, cycleIds } = await createEqub({
      size: 3,
    });
    const { registerUser } = await import("../helpers.js");
    const outsider = await registerUser("Outsider");
    const contribution = ownContribution(
      await contributionsOf(organizer, groupId, cycleIds[0]),
      members[0],
    );

    await as(organizer).post(
      `/api/groups/${groupId}/contributions/${contribution.id}/pay`,
      {
        paymentMethod: "cash",
      },
    );

    const summary = await as(members[1]).get(
      `/api/groups/${groupId}/transactions/summary`,
    );

    expect(summary.status).toBe(200);
    expect(summary.body.data.summary.totalIn).toBe(50000);
    expect(summary.body.data.summary.balance).toBe(50000);

    expect(
      (await as(outsider).get(`/api/groups/${groupId}/transactions`)).status,
    ).toBe(404);
    expect(
      (await as(outsider).get(`/api/groups/${groupId}/contributions`)).status,
    ).toBe(404);
  });

  test("lists a member their own contributions across groups", async () => {
    const { members } = await createEqub({ size: 3 });
    const mine = await as(members[0]).get("/api/contributions/mine");

    expect(mine.status).toBe(200);
    expect(mine.body.data.contributions).toHaveLength(1);
    expect(mine.body.data.contributions[0].status).toBe("pending");
  });
});
