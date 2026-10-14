const base = process.env.API_URL || "http://localhost:5000/api";
const password = "Secret123";
const GROUP_SIZE = 3;
const CONTRIBUTION = 50000;
const POT = CONTRIBUTION * GROUP_SIZE;

const randomPhone = () =>
  `09${Math.floor(10000000 + Math.random() * 89999999)}`;

const call = async (method, path, { body, token } = {}) => {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${base}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await response.json().catch(() => ({}));

  return { status: response.status, json, data: json.data ?? {} };
};

let failures = 0;

const check = (name, actual, expected) => {
  const passed = actual === expected;
  if (!passed) failures += 1;
  console.log(
    `${passed ? "PASS" : "FAIL"}  ${name} (expected ${expected}, got ${actual})`,
  );
};

const registerUser = async (label) => {
  const response = await call("POST", "/auth/register", {
    body: { fullName: `Smoke ${label}`, phone: randomPhone(), password },
  });

  if (response.status !== 201) {
    throw new Error(`Registration failed for ${label}: ${response.status}`);
  }

  return { token: response.data.accessToken, id: response.data.user.id };
};

const run = async () => {
  const organizer = await registerUser("Organizer");
  const memberOne = await registerUser("MemberOne");
  const memberTwo = await registerUser("MemberTwo");
  const outsider = await registerUser("Outsider");

  const memberIds = [organizer.id, memberOne.id, memberTwo.id];
  const startDate = new Date(Date.now() + 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const created = await call("POST", "/groups", {
    token: organizer.token,
    body: {
      name: "Draw Equb",
      contributionAmount: CONTRIBUTION,
      frequency: "monthly",
      maxMembers: GROUP_SIZE,
      startDate,
      latePenaltyAmount: 5000,
      gracePeriodDays: 2,
    },
  });
  check("create group", created.status, 201);

  const groupId = created.data.group?.id;
  const inviteCode = created.data.group?.inviteCode;

  if (!groupId || !inviteCode) {
    throw new Error("Group creation did not return an id and invite code");
  }

  await call("POST", "/groups/join", {
    token: memberOne.token,
    body: { inviteCode },
  });
  await call("POST", "/groups/join", {
    token: memberTwo.token,
    body: { inviteCode },
  });

  const started = await call("POST", `/groups/${groupId}/start`, {
    token: organizer.token,
  });
  check("start group", started.status, 200);

  const cyclesResponse = await call("GET", `/groups/${groupId}/cycles`, {
    token: organizer.token,
  });
  const cycleIds = cyclesResponse.data.cycles.map((entry) => entry.id);
  check("one cycle per member", cycleIds.length, GROUP_SIZE);

  const collect = async (cycleId) => {
    const list = await call(
      "GET",
      `/groups/${groupId}/contributions?cycleId=${cycleId}`,
      {
        token: organizer.token,
      },
    );

    for (const entry of list.data.contributions) {
      const paid = await call(
        "POST",
        `/groups/${groupId}/contributions/${entry.id}/pay`,
        {
          token: organizer.token,
          body: { paymentMethod: "cash" },
        },
      );

      if (paid.status !== 200) {
        throw new Error(`Recording contribution failed: ${paid.status}`);
      }
    }
  };

  const winners = [];

  const completeCycle = async (
    index,
    { alreadyCollected = false, beforePay } = {},
  ) => {
    const cycleId = cycleIds[index];
    const number = index + 1;
    const eligible = GROUP_SIZE - index;

    if (!alreadyCollected) await collect(cycleId);

    const draw = await call("POST", `/groups/${groupId}/draws`, {
      token: organizer.token,
      body: { cycleId },
    });
    check(`cycle ${number} draw performed`, draw.status, 201);
    check(
      `cycle ${number} eligible participants`,
      draw.data.draw?.participants?.length,
      eligible,
    );
    check(`cycle ${number} draw verifies`, draw.data.draw?.verified, true);
    check(`cycle ${number} draw method`, draw.data.draw?.method, "random_draw");
    check(`cycle ${number} payout amount`, draw.data.payout?.amount, POT);
    check(
      `cycle ${number} payout pending`,
      draw.data.payout?.status,
      "pending",
    );
    check(
      `cycle ${number} recipient assigned`,
      typeof draw.data.cycle?.recipient,
      "string",
    );

    const winnerId = draw.data.draw?.winnerUser?.id;
    check(
      `cycle ${number} winner is a group member`,
      memberIds.includes(winnerId),
      true,
    );
    check(
      `cycle ${number} winner not paid before`,
      winners.includes(winnerId),
      false,
    );
    winners.push(winnerId);

    const payoutId = draw.data.payout?.id;
    const drawId = draw.data.draw?.id;

    const repeat = await call("POST", `/groups/${groupId}/draws`, {
      token: organizer.token,
      body: { cycleId },
    });
    check(`cycle ${number} second draw rejected`, repeat.status, 409);

    if (beforePay) await beforePay({ drawId, payoutId });

    const pay = await call(
      "POST",
      `/groups/${groupId}/payouts/${payoutId}/pay`,
      {
        token: organizer.token,
        body: { paymentMethod: "bank_transfer", reference: `P-${number}` },
      },
    );
    check(`cycle ${number} payout recorded`, pay.status, 200);
    check(`cycle ${number} payout paid`, pay.data.payout?.status, "paid");
    check(
      `cycle ${number} cycle completed`,
      pay.data.cycle?.status,
      "completed",
    );

    return pay.data;
  };

  const earlyDraw = await call("POST", `/groups/${groupId}/draws`, {
    token: organizer.token,
    body: { cycleId: cycleIds[0] },
  });
  check("draw before cycle collected rejected", earlyDraw.status, 409);

  await collect(cycleIds[0]);

  const missingCycle = await call("POST", `/groups/${groupId}/draws`, {
    token: organizer.token,
    body: {},
  });
  check("draw without cycle rejected", missingCycle.status, 400);

  const memberDraw = await call("POST", `/groups/${groupId}/draws`, {
    token: memberOne.token,
    body: { cycleId: cycleIds[0] },
  });
  check("member cannot perform draw", memberDraw.status, 403);

  const outsiderDraw = await call("POST", `/groups/${groupId}/draws`, {
    token: outsider.token,
    body: { cycleId: cycleIds[0] },
  });
  check("outsider cannot perform draw", outsiderDraw.status, 404);

  const upcomingDraw = await call("POST", `/groups/${groupId}/draws`, {
    token: organizer.token,
    body: { cycleId: cycleIds[1] },
  });
  check("draw for upcoming cycle rejected", upcomingDraw.status, 409);

  const first = await completeCycle(0, {
    alreadyCollected: true,
    beforePay: async ({ drawId, payoutId }) => {
      const draws = await call("GET", `/groups/${groupId}/draws`, {
        token: memberOne.token,
      });
      check("member lists draws", draws.status, 200);
      check("one draw listed", draws.data.draws?.length, 1);

      const outsiderDraws = await call("GET", `/groups/${groupId}/draws`, {
        token: outsider.token,
      });
      check("outsider cannot list draws", outsiderDraws.status, 404);

      const detail = await call("GET", `/groups/${groupId}/draws/${drawId}`, {
        token: memberTwo.token,
      });
      check("member reads draw detail", detail.status, 200);
      check("draw detail verifies", detail.data.draw?.verified, true);
      check("draw seed recorded", typeof detail.data.draw?.seed, "string");

      const payouts = await call("GET", `/groups/${groupId}/payouts`, {
        token: memberOne.token,
      });
      check("member lists payouts", payouts.status, 200);
      check("one payout listed", payouts.data.payouts?.length, 1);

      const payoutDetail = await call(
        "GET",
        `/groups/${groupId}/payouts/${payoutId}`,
        {
          token: memberOne.token,
        },
      );
      check("member reads payout detail", payoutDetail.status, 200);

      const outsiderPayouts = await call("GET", `/groups/${groupId}/payouts`, {
        token: outsider.token,
      });
      check("outsider cannot list payouts", outsiderPayouts.status, 404);

      const memberPay = await call(
        "POST",
        `/groups/${groupId}/payouts/${payoutId}/pay`,
        {
          token: memberOne.token,
          body: { paymentMethod: "cash" },
        },
      );
      check("member cannot record payout", memberPay.status, 403);

      const gatewayMethod = await call(
        "POST",
        `/groups/${groupId}/payouts/${payoutId}/pay`,
        {
          token: organizer.token,
          body: { paymentMethod: "chapa" },
        },
      );
      check("gateway method rejected for payout", gatewayMethod.status, 400);

      const nextYear = new Date(
        Date.now() + 365 * 24 * 60 * 60 * 1000,
      ).toISOString();
      const futurePay = await call(
        "POST",
        `/groups/${groupId}/payouts/${payoutId}/pay`,
        {
          token: organizer.token,
          body: { paymentMethod: "cash", paidAt: nextYear },
        },
      );
      check("future payout time rejected", futurePay.status, 400);

      const pendingMine = await call("GET", "/payouts/mine?status=pending", {
        token: organizer.token,
      });
      check("pending payouts filter accepted", pendingMine.status, 200);
    },
  });

  const payAgain = await call(
    "POST",
    `/groups/${groupId}/payouts/${first.payout.id}/pay`,
    { token: organizer.token, body: { paymentMethod: "cash" } },
  );
  check("payout recorded twice rejected", payAgain.status, 409);

  check("next cycle activated", first.nextCycle?.status, "collecting");
  check("group stays active", first.groupStatus, "active");

  const afterFirst = await call("GET", `/groups/${groupId}/cycles`, {
    token: memberOne.token,
  });
  check(
    "cycle statuses after first payout",
    afterFirst.data.cycles?.map((entry) => entry.status).join(","),
    "completed,collecting,upcoming",
  );

  const nextContributions = await call(
    "GET",
    `/groups/${groupId}/contributions?cycleId=${cycleIds[1]}`,
    { token: memberOne.token },
  );
  check(
    "next cycle contributions created",
    nextContributions.data.contributions?.length,
    GROUP_SIZE,
  );
  check(
    "next cycle contributions pending",
    nextContributions.data.contributions?.every(
      (entry) => entry.status === "pending",
    ),
    true,
  );

  const second = await completeCycle(1);
  check("third cycle activated", second.nextCycle?.status, "collecting");
  check("group still active after second payout", second.groupStatus, "active");

  const third = await completeCycle(2);
  check("no cycle after the last payout", third.nextCycle, null);
  check("group completed after last payout", third.groupStatus, "completed");

  check(
    "every member received exactly once",
    new Set(winners).size,
    GROUP_SIZE,
  );

  const groupView = await call("GET", `/groups/${groupId}`, {
    token: organizer.token,
  });
  check("group status completed", groupView.data.group?.status, "completed");

  const lateDraw = await call("POST", `/groups/${groupId}/draws`, {
    token: organizer.token,
    body: { cycleId: cycleIds[2] },
  });
  check("draw after completion rejected", lateDraw.status, 409);

  const summary = await call("GET", `/groups/${groupId}/transactions/summary`, {
    token: memberOne.token,
  });
  check("summary total in", summary.data.summary?.totalIn, POT * GROUP_SIZE);
  check("summary total out", summary.data.summary?.totalOut, POT * GROUP_SIZE);
  check("summary balance", summary.data.summary?.balance, 0);

  const payoutLedger = await call(
    "GET",
    `/groups/${groupId}/transactions?type=payout`,
    {
      token: memberOne.token,
    },
  );
  check(
    "payout ledger entries",
    payoutLedger.data.transactions?.length,
    GROUP_SIZE,
  );
  check(
    "payout ledger direction",
    payoutLedger.data.transactions?.every((entry) => entry.direction === "out"),
    true,
  );

  const allDraws = await call("GET", `/groups/${groupId}/draws`, {
    token: organizer.token,
  });
  check("three draws recorded", allDraws.data.draws?.length, GROUP_SIZE);
  check(
    "all draws verify",
    allDraws.data.draws?.every((entry) => entry.verified === true),
    true,
  );

  const allPayouts = await call(
    "GET",
    `/groups/${groupId}/payouts?status=paid`,
    {
      token: organizer.token,
    },
  );
  check("three payouts paid", allPayouts.data.payouts?.length, GROUP_SIZE);

  const winnerToken = [organizer, memberOne, memberTwo].find(
    (entry) => entry.id === winners[0],
  ).token;
  const mine = await call("GET", "/payouts/mine", { token: winnerToken });
  check("winner lists own payouts", mine.status, 200);
  check("winner has one payout", mine.data.payouts?.length, 1);
  check("winner payout amount", mine.data.payouts?.[0]?.amount, POT);
};

try {
  await run();
} catch (error) {
  failures += 1;
  console.error(`Smoke test aborted: ${error.message}`);
}

console.log(
  failures === 0 ? "\nAll checks passed" : `\n${failures} check(s) failed`,
);
process.exit(failures === 0 ? 0 : 1);
