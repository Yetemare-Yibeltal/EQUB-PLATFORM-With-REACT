import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";
import {
  as,
  createEqub,
  recordAll,
  registerUser,
  startDatabase,
  stopDatabase,
} from "../helpers.js";

beforeAll(startDatabase);
afterAll(stopDatabase);

const POT = 150000;

const drawFor = (equb, cycleId) =>
  as(equb.organizer).post(`/api/groups/${equb.groupId}/draws`, { cycleId });

const payOut = (
  equb,
  payoutId,
  body = { paymentMethod: "bank_transfer", reference: "P-1" },
) =>
  as(equb.organizer).post(
    `/api/groups/${equb.groupId}/payouts/${payoutId}/pay`,
    body,
  );

describe("draw rules", () => {
  test("cannot run before the cycle is fully collected", async () => {
    const equb = await createEqub({ size: 3 });

    expect((await drawFor(equb, equb.cycleIds[0])).status).toBe(409);
  });

  test("cannot run for a cycle that has not opened", async () => {
    const equb = await createEqub({ size: 3 });

    await recordAll({ ...equb, cycleId: equb.cycleIds[0] });

    expect((await drawFor(equb, equb.cycleIds[1])).status).toBe(409);
  });

  test("is limited to the organizer and needs a cycle id", async () => {
    const equb = await createEqub({ size: 3 });
    const outsider = await registerUser("Outsider");

    await recordAll({ ...equb, cycleId: equb.cycleIds[0] });

    const byMember = await as(equb.members[0]).post(
      `/api/groups/${equb.groupId}/draws`,
      {
        cycleId: equb.cycleIds[0],
      },
    );
    const byOutsider = await as(outsider).post(
      `/api/groups/${equb.groupId}/draws`,
      {
        cycleId: equb.cycleIds[0],
      },
    );
    const withoutCycle = await as(equb.organizer).post(
      `/api/groups/${equb.groupId}/draws`,
      {},
    );

    expect(byMember.status).toBe(403);
    expect(byOutsider.status).toBe(404);
    expect(withoutCycle.status).toBe(400);
  });

  test("refuses a cycle where every contribution was waived", async () => {
    const equb = await createEqub({ size: 3 });
    const list = await as(equb.organizer).get(
      `/api/groups/${equb.groupId}/contributions?cycleId=${equb.cycleIds[0]}`,
    );

    for (const contribution of list.body.data.contributions) {
      await as(equb.organizer).post(
        `/api/groups/${equb.groupId}/contributions/${contribution.id}/waive`,
        { reason: "Nobody can pay this month" },
      );
    }

    expect((await drawFor(equb, equb.cycleIds[0])).status).toBe(409);
  });
});

describe("a complete equb with a random draw", () => {
  test("pays every member exactly once and completes the group", async () => {
    const equb = await createEqub({ size: 3 });
    const winners = [];

    for (let index = 0; index < equb.cycleIds.length; index += 1) {
      const cycleId = equb.cycleIds[index];

      await recordAll({ ...equb, cycleId });

      const draw = await drawFor(equb, cycleId);

      expect(draw.status).toBe(201);
      expect(draw.body.data.draw.method).toBe("random_draw");
      expect(draw.body.data.draw.verified).toBe(true);
      expect(draw.body.data.draw.seed).toMatch(/^[a-f0-9]{64}$/);
      expect(draw.body.data.draw.participants).toHaveLength(3 - index);
      expect(draw.body.data.payout.amount).toBe(POT);
      expect(draw.body.data.payout.status).toBe("pending");

      const winnerId = draw.body.data.draw.winnerUser.id;

      expect(equb.everyone.map((user) => user.id)).toContain(winnerId);
      expect(winners).not.toContain(winnerId);
      winners.push(winnerId);

      expect((await drawFor(equb, cycleId)).status).toBe(409);

      const payoutId = draw.body.data.payout.id;

      if (index === 0) {
        const byMember = await as(equb.members[0]).post(
          `/api/groups/${equb.groupId}/payouts/${payoutId}/pay`,
          { paymentMethod: "cash" },
        );
        const gatewayMethod = await payOut(equb, payoutId, {
          paymentMethod: "chapa",
        });

        expect(byMember.status).toBe(403);
        expect(gatewayMethod.status).toBe(400);
      }

      const paid = await payOut(equb, payoutId);

      expect(paid.status).toBe(200);
      expect(paid.body.data.payout.status).toBe("paid");
      expect(paid.body.data.cycle.status).toBe("completed");

      if (index < equb.cycleIds.length - 1) {
        expect(paid.body.data.nextCycle.status).toBe("collecting");
        expect(paid.body.data.groupStatus).toBe("active");
      } else {
        expect(paid.body.data.nextCycle).toBeNull();
        expect(paid.body.data.groupStatus).toBe("completed");
      }

      expect((await payOut(equb, payoutId)).status).toBe(409);
    }

    expect(new Set(winners).size).toBe(3);

    const group = await as(equb.organizer).get(`/api/groups/${equb.groupId}`);

    expect(group.body.data.group.status).toBe("completed");

    const summary = await as(equb.members[0]).get(
      `/api/groups/${equb.groupId}/transactions/summary`,
    );

    expect(summary.body.data.summary.totalIn).toBe(POT * 3);
    expect(summary.body.data.summary.totalOut).toBe(POT * 3);
    expect(summary.body.data.summary.balance).toBe(0);

    const payoutLedger = await as(equb.organizer).get(
      `/api/groups/${equb.groupId}/transactions?type=payout`,
    );

    expect(payoutLedger.body.data.transactions).toHaveLength(3);

    const draws = await as(equb.members[1]).get(
      `/api/groups/${equb.groupId}/draws`,
    );

    expect(draws.body.data.draws).toHaveLength(3);
    expect(
      draws.body.data.draws.every((entry) => entry.verified === true),
    ).toBe(true);

    const audit = await as(equb.organizer).get(
      `/api/groups/${equb.groupId}/audit-logs`,
    );

    expect(audit.body.data.auditLogs).toHaveLength(6);

    expect((await drawFor(equb, equb.cycleIds[2])).status).toBe(409);
  });

  test("includes waived contributions as a smaller pot", async () => {
    const equb = await createEqub({ size: 3 });
    const list = await as(equb.organizer).get(
      `/api/groups/${equb.groupId}/contributions?cycleId=${equb.cycleIds[0]}`,
    );

    await as(equb.organizer).post(
      `/api/groups/${equb.groupId}/contributions/${list.body.data.contributions[0].id}/waive`,
      { reason: "Hardship approved by the group" },
    );

    for (const contribution of list.body.data.contributions.slice(1)) {
      await as(equb.organizer).post(
        `/api/groups/${equb.groupId}/contributions/${contribution.id}/pay`,
        { paymentMethod: "cash" },
      );
    }

    const draw = await drawFor(equb, equb.cycleIds[0]);

    expect(draw.status).toBe(201);
    expect(draw.body.data.payout.amount).toBe(100000);
  });
});

describe("a fixed order equb", () => {
  test("pays members in the order they joined", async () => {
    const equb = await createEqub({
      size: 3,
      overrides: { payoutOrderMethod: "fixed_order" },
    });
    const expected = [equb.organizer.id, equb.members[0].id];

    for (let index = 0; index < expected.length; index += 1) {
      const cycleId = equb.cycleIds[index];

      await recordAll({ ...equb, cycleId });

      const draw = await drawFor(equb, cycleId);

      expect(draw.status).toBe(201);
      expect(draw.body.data.draw.method).toBe("fixed_order");
      expect(draw.body.data.draw.seed).toBeNull();
      expect(draw.body.data.draw.verified).toBe(true);
      expect(draw.body.data.draw.winnerUser.id).toBe(expected[index]);

      expect((await payOut(equb, draw.body.data.payout.id)).status).toBe(200);
    }
  });
});
