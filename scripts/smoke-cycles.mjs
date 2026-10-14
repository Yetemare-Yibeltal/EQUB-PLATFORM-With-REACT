const base = process.env.API_URL || "http://localhost:5000/api";
const password = "Secret123";

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

  const startDate = new Date(Date.now() + 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const created = await call("POST", "/groups", {
    token: organizer.token,
    body: {
      name: "Cycle Equb",
      contributionAmount: 50000,
      frequency: "monthly",
      maxMembers: 3,
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

  const tooEarly = await call("POST", `/groups/${groupId}/start`, {
    token: organizer.token,
  });
  check("start with one member rejected", tooEarly.status, 400);

  const joinOne = await call("POST", "/groups/join", {
    token: memberOne.token,
    body: { inviteCode },
  });
  check("member one joins", joinOne.status, 201);

  const joinTwo = await call("POST", "/groups/join", {
    token: memberTwo.token,
    body: { inviteCode },
  });
  check("member two joins", joinTwo.status, 201);

  const memberStart = await call("POST", `/groups/${groupId}/start`, {
    token: memberOne.token,
  });
  check("member cannot start group", memberStart.status, 403);

  const outsiderStart = await call("POST", `/groups/${groupId}/start`, {
    token: outsider.token,
  });
  check("outsider cannot start group", outsiderStart.status, 404);

  const started = await call("POST", `/groups/${groupId}/start`, {
    token: organizer.token,
  });
  check("organizer starts group", started.status, 200);
  check("group is active", started.data.group?.status, "active");
  check("capacity fixed to member count", started.data.group?.maxMembers, 3);
  check(
    "first cycle collecting",
    started.data.currentCycle?.status,
    "collecting",
  );
  check("first cycle number", started.data.currentCycle?.number, 1);
  check("pot amount", started.data.currentCycle?.potAmount, 150000);
  check("expected contributions", started.data.currentCycle?.expectedCount, 3);

  const cycleId = started.data.currentCycle?.id;

  if (!cycleId) {
    throw new Error("Group start did not return the current cycle");
  }

  const startedAgain = await call("POST", `/groups/${groupId}/start`, {
    token: organizer.token,
  });
  check("start twice rejected", startedAgain.status, 409);

  const joinAfterStart = await call("POST", "/groups/join", {
    token: outsider.token,
    body: { inviteCode },
  });
  check("join after start rejected", joinAfterStart.status, 409);

  const cycles = await call("GET", `/groups/${groupId}/cycles`, {
    token: memberOne.token,
  });
  check("member lists cycles", cycles.status, 200);
  check("one cycle per member", cycles.data.cycles?.length, 3);
  check(
    "cycles ordered",
    cycles.data.cycles?.map((entry) => entry.number).join(","),
    "1,2,3",
  );
  check(
    "only first cycle collecting",
    cycles.data.cycles?.map((entry) => entry.status).join(","),
    "collecting,upcoming,upcoming",
  );
  check(
    "first due date is start date",
    cycles.data.cycles?.[0]?.dueDate?.slice(0, 10),
    startDate,
  );

  const monthStep =
    (new Date(cycles.data.cycles[1].dueDate).getUTCMonth() -
      new Date(cycles.data.cycles[0].dueDate).getUTCMonth() +
      12) %
    12;
  check("monthly cycles one month apart", monthStep, 1);

  const outsiderCycles = await call("GET", `/groups/${groupId}/cycles`, {
    token: outsider.token,
  });
  check("outsider cannot list cycles", outsiderCycles.status, 404);

  const current = await call("GET", `/groups/${groupId}/cycles/current`, {
    token: memberOne.token,
  });
  check("current cycle", current.status, 200);
  check("current cycle number", current.data.cycle?.number, 1);

  const contributions = await call(
    "GET",
    `/groups/${groupId}/contributions?cycleId=${cycleId}`,
    {
      token: memberOne.token,
    },
  );
  check("member lists contributions", contributions.status, 200);
  check(
    "three contributions generated",
    contributions.data.contributions?.length,
    3,
  );
  check(
    "all contributions pending",
    contributions.data.contributions?.every(
      (entry) => entry.status === "pending",
    ),
    true,
  );
  check(
    "contribution amounts match group",
    contributions.data.contributions?.every((entry) => entry.amount === 50000),
    true,
  );
  check(
    "none overdue yet",
    contributions.data.contributions?.every(
      (entry) => entry.isOverdue === false,
    ),
    true,
  );

  const outsiderContributions = await call(
    "GET",
    `/groups/${groupId}/contributions`,
    {
      token: outsider.token,
    },
  );
  check(
    "outsider cannot list contributions",
    outsiderContributions.status,
    404,
  );

  const mine = await call("GET", "/contributions/mine", {
    token: memberOne.token,
  });
  check("member lists own contributions", mine.status, 200);
  check("one own contribution", mine.data.contributions?.length, 1);
  check(
    "own contribution pending",
    mine.data.contributions?.[0]?.status,
    "pending",
  );

  const minePaid = await call("GET", "/contributions/mine?status=paid", {
    token: memberOne.token,
  });
  check("no paid contributions yet", minePaid.data.contributions?.length, 0);

  const byUser = (userId) =>
    contributions.data.contributions.find((entry) => entry.user.id === userId);

  const memberOneContribution = byUser(memberOne.id);
  const memberTwoContribution = byUser(memberTwo.id);
  const organizerContribution = byUser(organizer.id);

  const memberPay = await call(
    "POST",
    `/groups/${groupId}/contributions/${memberOneContribution.id}/pay`,
    { token: memberOne.token, body: { paymentMethod: "cash" } },
  );
  check("member cannot record payment", memberPay.status, 403);

  const invalidMethod = await call(
    "POST",
    `/groups/${groupId}/contributions/${memberOneContribution.id}/pay`,
    { token: organizer.token, body: { paymentMethod: "barter" } },
  );
  check("invalid payment method rejected", invalidMethod.status, 400);

  const nextYear = new Date(
    Date.now() + 365 * 24 * 60 * 60 * 1000,
  ).toISOString();
  const futurePayment = await call(
    "POST",
    `/groups/${groupId}/contributions/${memberOneContribution.id}/pay`,
    {
      token: organizer.token,
      body: { paymentMethod: "cash", paidAt: nextYear },
    },
  );
  check("future payment time rejected", futurePayment.status, 400);

  const pay = await call(
    "POST",
    `/groups/${groupId}/contributions/${memberOneContribution.id}/pay`,
    {
      token: organizer.token,
      body: { paymentMethod: "cash", reference: "R-1" },
    },
  );
  check("organizer records payment", pay.status, 200);
  check("contribution paid", pay.data.contribution?.status, "paid");
  check("payment on time", pay.data.contribution?.isLate, false);
  check("amount paid", pay.data.contribution?.amountPaid, 50000);

  const payAgain = await call(
    "POST",
    `/groups/${groupId}/contributions/${memberOneContribution.id}/pay`,
    { token: organizer.token, body: { paymentMethod: "cash" } },
  );
  check("duplicate payment rejected", payAgain.status, 409);

  const waiveWithoutReason = await call(
    "POST",
    `/groups/${groupId}/contributions/${memberTwoContribution.id}/waive`,
    { token: organizer.token, body: {} },
  );
  check("waive without reason rejected", waiveWithoutReason.status, 400);

  const waive = await call(
    "POST",
    `/groups/${groupId}/contributions/${memberTwoContribution.id}/waive`,
    {
      token: organizer.token,
      body: { reason: "Hardship approved by the group" },
    },
  );
  check("organizer waives contribution", waive.status, 200);
  check("contribution waived", waive.data.contribution?.status, "waived");

  const detail = await call("GET", `/groups/${groupId}/cycles/${cycleId}`, {
    token: memberOne.token,
  });
  check("cycle detail", detail.status, 200);
  check("two contributions resolved", detail.data.cycle?.resolvedCount, 2);
  check("collected amount so far", detail.data.cycle?.collectedAmount, 50000);
  check("cycle still collecting", detail.data.cycle?.status, "collecting");
  check("one contribution pending", detail.data.cycle?.pendingCount, 1);

  const payOrganizer = await call(
    "POST",
    `/groups/${groupId}/contributions/${organizerContribution.id}/pay`,
    {
      token: organizer.token,
      body: { paymentMethod: "telebirr", reference: "T-1" },
    },
  );
  check("organizer records own payment", payOrganizer.status, 200);

  const detailAfter = await call(
    "GET",
    `/groups/${groupId}/cycles/${cycleId}`,
    {
      token: organizer.token,
    },
  );
  check(
    "cycle collected after last contribution",
    detailAfter.data.cycle?.status,
    "collected",
  );
  check("no contributions pending", detailAfter.data.cycle?.pendingCount, 0);
  check(
    "collected amount total",
    detailAfter.data.cycle?.collectedAmount,
    100000,
  );
  check("progress complete", detailAfter.data.cycle?.progressPercent, 100);

  const overdue = await call(
    "GET",
    `/groups/${groupId}/contributions?overdue=true`,
    {
      token: organizer.token,
    },
  );
  check("overdue filter accepted", overdue.status, 200);
  check("no overdue contributions", overdue.data.contributions?.length, 0);

  const minePaidAfter = await call("GET", "/contributions/mine?status=paid", {
    token: memberOne.token,
  });
  check(
    "paid contribution listed for member",
    minePaidAfter.data.contributions?.length,
    1,
  );

  const currentAfter = await call("GET", `/groups/${groupId}/cycles/current`, {
    token: memberOne.token,
  });
  check(
    "current cycle awaits payout",
    currentAfter.data.cycle?.status,
    "collected",
  );
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
