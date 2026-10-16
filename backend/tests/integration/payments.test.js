import crypto from "node:crypto";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  jest,
  test,
} from "@jest/globals";
import {
  api,
  as,
  contributionsOf,
  createEqub,
  startDatabase,
  stopDatabase,
} from "../helpers.js";

const realFetch = globalThis.fetch;

let equb;

beforeAll(async () => {
  await startDatabase();
  equb = await createEqub({ size: 5 });
});

afterAll(stopDatabase);

afterEach(() => {
  globalThis.fetch = realFetch;
});

const reply = (body, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
});

const verification = (state, amount = "500.00") => ({
  status: "success",
  data: {
    status: state,
    amount,
    currency: "ETB",
    reference: "CH-REF-1",
    method: "telebirr",
  },
});

const mockGateway = (verify) => {
  const handler = jest.fn(async (url) => {
    const target = String(url);

    if (target.includes("/transaction/initialize")) {
      return reply({
        status: "success",
        data: { checkout_url: "https://checkout.chapa.test/pay/abc" },
      });
    }

    if (target.includes("/transaction/verify/")) {
      return reply(verify());
    }

    throw new Error(`Unexpected request to ${target}`);
  });

  globalThis.fetch = handler;

  return handler;
};

const verifyCalls = (handler) =>
  handler.mock.calls.filter(([url]) =>
    String(url).includes("/transaction/verify/"),
  ).length;

const contributionOf = async (user) => {
  const contributions = await contributionsOf(
    equb.organizer,
    equb.groupId,
    equb.cycleIds[0],
  );

  return contributions.find((contribution) => contribution.user.id === user.id);
};

const startCheckout = async (user) => {
  const contribution = await contributionOf(user);
  const response = await as(user).post("/api/payments/checkout", {
    groupId: equb.groupId,
    contributionId: contribution.id,
  });

  return { contribution, response, payment: response.body.data?.payment };
};

const verify = (user, txRef) =>
  as(user).post(`/api/payments/ref/${txRef}/verify`);

describe("checkout", () => {
  test("creates a pending payment with the exact amount", async () => {
    mockGateway(() => verification("pending"));

    const { response, payment } = await startCheckout(equb.members[3]);

    expect(response.status).toBe(201);
    expect(payment.status).toBe("pending");
    expect(payment.amount).toBe(50000);
    expect(payment.isLate).toBe(false);
    expect(payment.checkoutUrl).toBe("https://checkout.chapa.test/pay/abc");
    expect(payment.txRef).toMatch(/^eqb-[a-f0-9]{32}$/);
  });

  test("reuses an open checkout instead of creating a second one", async () => {
    mockGateway(() => verification("pending"));

    const first = await startCheckout(equb.members[3]);
    const second = await startCheckout(equb.members[3]);

    expect(second.payment.txRef).toBe(first.payment.txRef);
  });

  test("refuses to pay somebody else’s contribution", async () => {
    mockGateway(() => verification("pending"));

    const contribution = await contributionOf(equb.members[0]);
    const response = await as(equb.members[1]).post("/api/payments/checkout", {
      groupId: equb.groupId,
      contributionId: contribution.id,
    });

    expect(response.status).toBe(403);
  });

  test("reports a gateway outage without creating a usable payment", async () => {
    globalThis.fetch = jest.fn(async () => {
      throw new Error("network down");
    });

    const { response } = await startCheckout(equb.members[2]);

    expect(response.status).toBe(502);
  });
});

describe("settlement", () => {
  test("marks the contribution paid and writes one ledger entry", async () => {
    const handler = mockGateway(() => verification("success"));
    const { contribution, payment } = await startCheckout(equb.members[0]);

    const verified = await verify(equb.members[0], payment.txRef);

    expect(verified.status).toBe(200);
    expect(verified.body.data.payment.status).toBe("success");
    expect(verified.body.data.payment.requiresReview).toBe(false);

    const contributions = await contributionsOf(
      equb.organizer,
      equb.groupId,
      equb.cycleIds[0],
    );
    const updated = contributions.find((entry) => entry.id === contribution.id);

    expect(updated.status).toBe("paid");
    expect(updated.paymentMethod).toBe("chapa");
    expect(updated.amountPaid).toBe(50000);

    const ledger = await as(equb.organizer).get(
      `/api/groups/${equb.groupId}/transactions`,
    );
    const entries = ledger.body.data.transactions.filter(
      (entry) => entry.reference === payment.txRef,
    );

    expect(entries).toHaveLength(1);
    expect(entries[0].method).toBe("chapa");
    expect(entries[0].amount).toBe(50000);

    const callsBefore = verifyCalls(handler);
    const again = await verify(equb.members[0], payment.txRef);

    expect(again.status).toBe(200);
    expect(again.body.data.payment.status).toBe("success");
    expect(verifyCalls(handler)).toBe(callsBefore);

    const ledgerAfter = await as(equb.organizer).get(
      `/api/groups/${equb.groupId}/transactions`,
    );

    expect(
      ledgerAfter.body.data.transactions.filter(
        (entry) => entry.reference === payment.txRef,
      ),
    ).toHaveLength(1);
  });

  test("flags an amount mismatch for review and leaves the contribution pending", async () => {
    mockGateway(() => verification("success", "100.00"));
    const { contribution, payment } = await startCheckout(equb.members[1]);

    const verified = await verify(equb.members[1], payment.txRef);

    expect(verified.status).toBe(200);
    expect(verified.body.data.payment.status).toBe("failed");
    expect(verified.body.data.payment.requiresReview).toBe(true);
    expect(verified.body.data.payment.reviewNote).toContain("expected 50000");

    const contributions = await contributionsOf(
      equb.organizer,
      equb.groupId,
      equb.cycleIds[0],
    );

    expect(
      contributions.find((entry) => entry.id === contribution.id).status,
    ).toBe("pending");
  });

  test("records a failed payment and lets a later success settle it", async () => {
    let state = "failed";
    mockGateway(() => verification(state));
    const { contribution, payment } = await startCheckout(equb.members[2]);

    const failed = await verify(equb.members[2], payment.txRef);

    expect(failed.body.data.payment.status).toBe("failed");
    expect(failed.body.data.payment.requiresReview).toBe(false);

    state = "success";

    const settled = await verify(equb.members[2], payment.txRef);

    expect(settled.body.data.payment.status).toBe("success");

    const contributions = await contributionsOf(
      equb.organizer,
      equb.groupId,
      equb.cycleIds[0],
    );

    expect(
      contributions.find((entry) => entry.id === contribution.id).status,
    ).toBe("paid");
  });

  test("flags a payment that arrives after the contribution was already recorded", async () => {
    mockGateway(() => verification("success"));
    const { contribution, payment } = await startCheckout(equb.members[3]);

    const recorded = await as(equb.organizer).post(
      `/api/groups/${equb.groupId}/contributions/${contribution.id}/pay`,
      { paymentMethod: "cash" },
    );
    expect(recorded.status).toBe(200);

    const verified = await verify(equb.members[3], payment.txRef);

    expect(verified.body.data.payment.status).toBe("success");
    expect(verified.body.data.payment.requiresReview).toBe(true);
    expect(verified.body.data.payment.reviewNote).toContain("not applied");

    const ledger = await as(equb.organizer).get(
      `/api/groups/${equb.groupId}/transactions`,
    );
    const forContribution = ledger.body.data.transactions.filter(
      (entry) =>
        entry.reference !== payment.txRef &&
        entry.user.id === equb.members[3].id,
    );

    expect(forContribution).toHaveLength(1);
    expect(forContribution[0].method).toBe("cash");
  });

  test("refuses to checkout a contribution that is already resolved", async () => {
    mockGateway(() => verification("pending"));

    const { response } = await startCheckout(equb.members[3]);

    expect(response.status).toBe(409);
  });
});

describe("gateway notifications", () => {
  const signed = (payload, secret = "whsec_test") => {
    const raw = JSON.stringify(payload);

    return {
      raw,
      signature: crypto.createHmac("sha256", secret).update(raw).digest("hex"),
    };
  };

  const sendWebhook = ({ raw, signature }) =>
    api()
      .post("/api/payments/webhook")
      .set("Content-Type", "application/json")
      .set("x-chapa-signature", signature)
      .send(raw);

  test("rejects a webhook with a bad signature and changes nothing", async () => {
    mockGateway(() => verification("success"));
    const { payment } = await startCheckout(equb.organizer);

    const forged = signed(
      { tx_ref: payment.txRef, status: "success" },
      "wrong-secret",
    );
    const response = await sendWebhook(forged);

    expect(response.status).toBe(401);

    const current = await as(equb.organizer).get(
      `/api/payments/ref/${payment.txRef}`,
    );

    expect(current.body.data.payment.status).toBe("pending");
  });

  test("settles the payment after a correctly signed webhook", async () => {
    mockGateway(() => verification("success"));
    const { payment } = await startCheckout(equb.organizer);

    const response = await sendWebhook(
      signed({ tx_ref: payment.txRef, status: "success" }),
    );

    expect(response.status).toBe(200);

    const current = await as(equb.organizer).get(
      `/api/payments/ref/${payment.txRef}`,
    );

    expect(current.body.data.payment.status).toBe("success");
  });

  test("acknowledges a callback for an unknown reference", async () => {
    mockGateway(() => verification("success"));

    const response = await api().get(
      "/api/payments/callback?trx_ref=eqb-00000000000000000000000000000000&status=success",
    );

    expect(response.status).toBe(200);
  });
});

describe("payment access", () => {
  test("lets only the payer, organizer, or admin read a payment", async () => {
    mockGateway(() => verification("pending"));
    const { registerUser } = await import("../helpers.js");
    const outsider = await registerUser("Outsider");

    const payments = await as(equb.members[3]).get("/api/payments/mine");
    const txRef = payments.body.data.payments[0].txRef;

    expect(
      (await as(equb.members[3]).get(`/api/payments/ref/${txRef}`)).status,
    ).toBe(200);
    expect(
      (await as(equb.organizer).get(`/api/payments/ref/${txRef}`)).status,
    ).toBe(200);
    expect(
      (await as(equb.members[0]).get(`/api/payments/ref/${txRef}`)).status,
    ).toBe(404);
    expect((await as(outsider).get(`/api/payments/ref/${txRef}`)).status).toBe(
      404,
    );
  });

  test("keeps the full payment list admin only", async () => {
    expect((await as(equb.organizer).get("/api/payments")).status).toBe(403);
  });

  test("rejects a malformed reference", async () => {
    expect((await as(equb.organizer).get("/api/payments/ref/x")).status).toBe(
      400,
    );
  });
});
