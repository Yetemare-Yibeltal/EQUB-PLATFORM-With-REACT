const base = process.env.API_URL || "http://localhost:5000/api";
const password = "Secret123";
const unknownRef = "eqb-00000000000000000000000000000000";

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

const report = (name, passed, detail) => {
  if (!passed) failures += 1;
  console.log(`${passed ? "PASS" : "FAIL"}  ${name} (${detail})`);
};

const check = (name, actual, expected) =>
  report(name, actual === expected, `expected ${expected}, got ${actual}`);

const checkIn = (name, actual, allowed) =>
  report(
    name,
    allowed.includes(actual),
    `expected one of ${allowed.join("/")}, got ${actual}`,
  );

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
      name: "Payment Equb",
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

  const contributions = await call("GET", `/groups/${groupId}/contributions`, {
    token: organizer.token,
  });
  check("list contributions", contributions.status, 200);

  const byUser = (userId) =>
    contributions.data.contributions.find((entry) => entry.user.id === userId);

  const organizerContribution = byUser(organizer.id);
  const memberOneContribution = byUser(memberOne.id);
  const memberTwoContribution = byUser(memberTwo.id);

  const emptyLedger = await call("GET", `/groups/${groupId}/transactions`, {
    token: memberOne.token,
  });
  check("ledger starts empty", emptyLedger.data.transactions?.length, 0);

  const invalidCheckout = await call("POST", "/payments/checkout", {
    token: memberOne.token,
    body: { groupId },
  });
  check("checkout without contribution rejected", invalidCheckout.status, 400);

  const outsiderCheckout = await call("POST", "/payments/checkout", {
    token: outsider.token,
    body: { groupId, contributionId: memberOneContribution.id },
  });
  check("outsider cannot start checkout", outsiderCheckout.status, 404);

  const foreignCheckout = await call("POST", "/payments/checkout", {
    token: memberTwo.token,
    body: { groupId, contributionId: memberOneContribution.id },
  });
  check("member cannot pay another contribution", foreignCheckout.status, 403);

  const ownCheckout = await call("POST", "/payments/checkout", {
    token: memberTwo.token,
    body: { groupId, contributionId: memberTwoContribution.id },
  });
  checkIn(
    "own checkout created or gateway unconfigured",
    ownCheckout.status,
    [201, 503],
  );

  if (ownCheckout.status === 201) {
    check(
      "checkout returns pending payment",
      ownCheckout.data.payment?.status,
      "pending",
    );
    check("checkout amount", ownCheckout.data.payment?.amount, 50000);
    check(
      "checkout url present",
      typeof ownCheckout.data.payment?.checkoutUrl,
      "string",
    );

    const repeat = await call("POST", "/payments/checkout", {
      token: memberTwo.token,
      body: { groupId, contributionId: memberTwoContribution.id },
    });
    check(
      "repeat checkout reuses payment",
      repeat.data.payment?.txRef,
      ownCheckout.data.payment?.txRef,
    );

    const txRef = ownCheckout.data.payment?.txRef;

    const ownLookup = await call("GET", `/payments/ref/${txRef}`, {
      token: memberTwo.token,
    });
    check("owner reads payment", ownLookup.status, 200);

    const organizerLookup = await call("GET", `/payments/ref/${txRef}`, {
      token: organizer.token,
    });
    check("organizer reads member payment", organizerLookup.status, 200);

    const otherLookup = await call("GET", `/payments/ref/${txRef}`, {
      token: memberOne.token,
    });
    check("other member cannot read payment", otherLookup.status, 404);
  }

  const mine = await call("GET", "/payments/mine", { token: memberTwo.token });
  check("list own payments", mine.status, 200);
  check("own payments is an array", Array.isArray(mine.data.payments), true);

  const adminList = await call("GET", "/payments", { token: memberOne.token });
  check("payment list is admin only", adminList.status, 403);

  const unknownLookup = await call("GET", `/payments/ref/${unknownRef}`, {
    token: memberOne.token,
  });
  check("unknown payment reference", unknownLookup.status, 404);

  const unknownVerify = await call(
    "POST",
    `/payments/ref/${unknownRef}/verify`,
    {
      token: memberOne.token,
    },
  );
  check("verify unknown payment", unknownVerify.status, 404);

  const badRef = await call("GET", "/payments/ref/x", {
    token: memberOne.token,
  });
  check("malformed payment reference rejected", badRef.status, 400);

  const webhook = await call("POST", "/payments/webhook", {
    body: { tx_ref: unknownRef },
  });
  checkIn(
    "webhook acknowledges or rejects unsigned call",
    webhook.status,
    [200, 401],
  );

  const callback = await call(
    "GET",
    `/payments/callback?trx_ref=${unknownRef}&status=success`,
  );
  check("callback for unknown reference acknowledged", callback.status, 200);

  const recorded = await call(
    "POST",
    `/groups/${groupId}/contributions/${memberOneContribution.id}/pay`,
    {
      token: organizer.token,
      body: { paymentMethod: "cash", reference: "R-1" },
    },
  );
  check("organizer records cash payment", recorded.status, 200);

  const gatewayManual = await call(
    "POST",
    `/groups/${groupId}/contributions/${organizerContribution.id}/pay`,
    { token: organizer.token, body: { paymentMethod: "chapa" } },
  );
  check(
    "manual recording cannot claim gateway method",
    gatewayManual.status,
    400,
  );

  const resolvedCheckout = await call("POST", "/payments/checkout", {
    token: memberOne.token,
    body: { groupId, contributionId: memberOneContribution.id },
  });
  check(
    "checkout on resolved contribution rejected",
    resolvedCheckout.status,
    409,
  );

  const ledger = await call("GET", `/groups/${groupId}/transactions`, {
    token: memberTwo.token,
  });
  check("member reads group ledger", ledger.status, 200);
  check("one ledger entry", ledger.data.transactions?.length, 1);
  check(
    "ledger entry type",
    ledger.data.transactions?.[0]?.type,
    "contribution",
  );
  check(
    "ledger entry direction",
    ledger.data.transactions?.[0]?.direction,
    "in",
  );
  check("ledger entry amount", ledger.data.transactions?.[0]?.amount, 50000);
  check("ledger entry method", ledger.data.transactions?.[0]?.method, "cash");
  check(
    "ledger entry payer",
    ledger.data.transactions?.[0]?.user?.id,
    memberOne.id,
  );

  const summary = await call("GET", `/groups/${groupId}/transactions/summary`, {
    token: memberTwo.token,
  });
  check("group summary", summary.status, 200);
  check("summary total in", summary.data.summary?.totalIn, 50000);
  check("summary total out", summary.data.summary?.totalOut, 0);
  check("summary balance", summary.data.summary?.balance, 50000);
  check("summary entry count", summary.data.summary?.entryCount, 1);

  const waived = await call(
    "POST",
    `/groups/${groupId}/contributions/${memberTwoContribution.id}/waive`,
    {
      token: organizer.token,
      body: { reason: "Hardship approved by the group" },
    },
  );
  check("organizer waives contribution", waived.status, 200);

  const afterWaive = await call("GET", `/groups/${groupId}/transactions`, {
    token: organizer.token,
  });
  check(
    "waiver creates no ledger entry",
    afterWaive.data.transactions?.length,
    1,
  );

  const outsiderLedger = await call("GET", `/groups/${groupId}/transactions`, {
    token: outsider.token,
  });
  check("outsider cannot read ledger", outsiderLedger.status, 404);

  const outsiderSummary = await call(
    "GET",
    `/groups/${groupId}/transactions/summary`,
    {
      token: outsider.token,
    },
  );
  check("outsider cannot read summary", outsiderSummary.status, 404);

  const memberOneMine = await call("GET", "/transactions/mine", {
    token: memberOne.token,
  });
  check("member lists own transactions", memberOneMine.status, 200);
  check(
    "member one has one transaction",
    memberOneMine.data.transactions?.length,
    1,
  );

  const memberTwoMine = await call("GET", "/transactions/mine", {
    token: memberTwo.token,
  });
  check(
    "member two has no transactions",
    memberTwoMine.data.transactions?.length,
    0,
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
