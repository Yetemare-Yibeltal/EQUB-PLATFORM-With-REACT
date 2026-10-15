import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(
  new URL("../backend/package.json", import.meta.url),
);
require("dotenv").config({
  path: fileURLToPath(new URL("../backend/.env", import.meta.url)),
});

const base = process.env.API_URL || "http://localhost:5000/api";
const password = "Secret123";
const missingId = "0".repeat(24);

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
  const phone = randomPhone();
  const response = await call("POST", "/auth/register", {
    body: { fullName: `Smoke ${label}`, phone, password },
  });

  if (response.status !== 201) {
    throw new Error(`Registration failed for ${label}: ${response.status}`);
  }

  return { token: response.data.accessToken, id: response.data.user.id, phone };
};

const loginAdmin = async () => {
  const identifier = process.env.ADMIN_PHONE;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!identifier || !adminPassword) {
    throw new Error(
      "ADMIN_PHONE and ADMIN_PASSWORD must be set in backend/.env",
    );
  }

  const response = await call("POST", "/auth/login", {
    body: { identifier, password: adminPassword },
  });

  if (response.status !== 200) {
    throw new Error(
      `Administrator login failed (${response.status}). Run npm --prefix backend run seed:admin and check backend/.env`,
    );
  }

  return { token: response.data.accessToken, id: response.data.user.id };
};

const run = async () => {
  const admin = await loginAdmin();
  const organizer = await registerUser("Organizer");
  const memberOne = await registerUser("MemberOne");
  const memberTwo = await registerUser("MemberTwo");
  const outsider = await registerUser("Outsider");

  const noToken = await call("GET", "/admin/overview");
  check("admin overview requires authentication", noToken.status, 401);

  const userOverview = await call("GET", "/admin/overview", {
    token: organizer.token,
  });
  check("normal user cannot read admin overview", userOverview.status, 403);

  const overview = await call("GET", "/admin/overview", { token: admin.token });
  check("admin reads overview", overview.status, 200);
  check(
    "overview counts users",
    overview.data.overview?.users?.total >= 5,
    true,
  );
  check(
    "overview counts administrators",
    overview.data.overview?.users?.admins >= 1,
    true,
  );
  check(
    "overview reports ledger balance",
    typeof overview.data.overview?.money?.balance,
    "number",
  );
  check(
    "overview reports attention items",
    typeof overview.data.overview?.attention?.paymentsNeedingReview,
    "number",
  );

  const startDate = new Date(Date.now() + 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const created = await call("POST", "/groups", {
    token: organizer.token,
    body: {
      name: "Admin Smoke Equb",
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

  const cycleId = started.data.currentCycle?.id;

  const contributions = await call(
    "GET",
    `/groups/${groupId}/contributions?cycleId=${cycleId}`,
    {
      token: organizer.token,
    },
  );
  const contributionOf = (userId) =>
    contributions.data.contributions.find((entry) => entry.user.id === userId);

  const payOrganizer = await call(
    "POST",
    `/groups/${groupId}/contributions/${contributionOf(organizer.id).id}/pay`,
    { token: organizer.token, body: { paymentMethod: "cash" } },
  );
  check("record organizer contribution", payOrganizer.status, 200);

  const payOne = await call(
    "POST",
    `/groups/${groupId}/contributions/${contributionOf(memberOne.id).id}/pay`,
    {
      token: organizer.token,
      body: { paymentMethod: "telebirr", reference: "T-1" },
    },
  );
  check("record member one contribution", payOne.status, 200);

  const waiveTwo = await call(
    "POST",
    `/groups/${groupId}/contributions/${contributionOf(memberTwo.id).id}/waive`,
    {
      token: organizer.token,
      body: { reason: "Hardship approved by the group" },
    },
  );
  check("waive member two contribution", waiveTwo.status, 200);

  const draw = await call("POST", `/groups/${groupId}/draws`, {
    token: organizer.token,
    body: { cycleId },
  });
  check("perform draw", draw.status, 201);

  const payout = await call(
    "POST",
    `/groups/${groupId}/payouts/${draw.data.payout?.id}/pay`,
    {
      token: organizer.token,
      body: { paymentMethod: "bank_transfer", reference: "P-1" },
    },
  );
  check("record payout", payout.status, 200);

  const statement = await call("GET", `/groups/${groupId}/reports/statement`, {
    token: memberOne.token,
  });
  const report = statement.data.statement;
  check("member reads group statement", statement.status, 200);
  check("statement hides invite code", report?.group?.inviteCode, undefined);
  check("statement total in", report?.totals?.totalIn, 100000);
  check("statement total out", report?.totals?.totalOut, 100000);
  check("statement balance", report?.totals?.balance, 0);
  check("statement paid contributions", report?.totals?.contributionsPaid, 2);
  check(
    "statement waived contributions",
    report?.totals?.contributionsWaived,
    1,
  );
  check(
    "statement pending contributions",
    report?.totals?.contributionsPending,
    3,
  );
  check(
    "statement overdue contributions",
    report?.totals?.contributionsOverdue,
    0,
  );
  check("statement late payments", report?.totals?.latePayments, 0);
  check("statement cycle count", report?.cycles?.length, 3);
  check("first cycle completed", report?.cycles?.[0]?.status, "completed");
  check(
    "first cycle collected amount",
    report?.cycles?.[0]?.collectedAmount,
    100000,
  );
  check("first cycle payout paid", report?.cycles?.[0]?.payout?.status, "paid");
  check(
    "first cycle payout amount",
    report?.cycles?.[0]?.payout?.amount,
    100000,
  );
  check(
    "first cycle recipient named",
    typeof report?.cycles?.[0]?.payout?.recipient?.fullName,
    "string",
  );
  check("later cycles have no payout", report?.cycles?.[1]?.payout, null);

  const outsiderStatement = await call(
    "GET",
    `/groups/${groupId}/reports/statement`,
    {
      token: outsider.token,
    },
  );
  check("outsider cannot read statement", outsiderStatement.status, 404);

  const adminStatement = await call(
    "GET",
    `/groups/${groupId}/reports/statement`,
    {
      token: admin.token,
    },
  );
  check("admin reads statement", adminStatement.status, 200);

  const reliability = await call(
    "GET",
    `/groups/${groupId}/reports/reliability`,
    {
      token: organizer.token,
    },
  );
  const reliabilityOf = (userId) =>
    reliability.data.reliability?.members?.find(
      (entry) => entry.user.id === userId,
    );
  check("organizer reads reliability", reliability.status, 200);
  check(
    "reliability lists every member",
    reliability.data.reliability?.members?.length,
    3,
  );
  check("on-time member rate", reliabilityOf(memberOne.id)?.onTimeRate, 100);
  check("on-time member paid count", reliabilityOf(memberOne.id)?.paid, 1);
  check(
    "next cycle contribution pending",
    reliabilityOf(memberOne.id)?.pending,
    1,
  );
  check(
    "next cycle outstanding amount",
    reliabilityOf(memberOne.id)?.outstanding,
    50000,
  );
  check(
    "waived member has no rate",
    reliabilityOf(memberTwo.id)?.onTimeRate,
    null,
  );
  check("waived member waived count", reliabilityOf(memberTwo.id)?.waived, 1);
  check(
    "summary on-time rate",
    reliability.data.reliability?.summary?.onTimeRate,
    100,
  );

  const memberReliability = await call(
    "GET",
    `/groups/${groupId}/reports/reliability`,
    {
      token: memberOne.token,
    },
  );
  check("member cannot read reliability", memberReliability.status, 403);

  const outsiderReliability = await call(
    "GET",
    `/groups/${groupId}/reports/reliability`,
    {
      token: outsider.token,
    },
  );
  check("outsider cannot read reliability", outsiderReliability.status, 404);

  const adminReliability = await call(
    "GET",
    `/groups/${groupId}/reports/reliability`,
    {
      token: admin.token,
    },
  );
  check("admin reads reliability", adminReliability.status, 200);

  const mine = await call("GET", "/reports/me", { token: memberOne.token });
  check("member reads personal statement", mine.status, 200);
  check("personal active groups", mine.data.statement?.activeGroups, 1);
  check(
    "personal paid contributions",
    mine.data.statement?.contributions?.paid,
    1,
  );
  check(
    "personal outstanding amount",
    mine.data.statement?.contributions?.outstanding,
    50000,
  );
  check(
    "personal total contributed",
    mine.data.statement?.ledger?.totalContributed,
    50000,
  );
  check(
    "personal total received is a number",
    typeof mine.data.statement?.ledger?.totalReceived,
    "number",
  );

  const mineUnauthenticated = await call("GET", "/reports/me");
  check(
    "personal statement requires authentication",
    mineUnauthenticated.status,
    401,
  );

  const groupAudit = await call("GET", `/groups/${groupId}/audit-logs`, {
    token: organizer.token,
  });
  check("organizer reads group audit trail", groupAudit.status, 200);
  check("draw and payout audited", groupAudit.data.auditLogs?.length, 2);
  check(
    "audit entry names the actor",
    typeof groupAudit.data.auditLogs?.[0]?.actor?.fullName,
    "string",
  );

  const memberAudit = await call("GET", `/groups/${groupId}/audit-logs`, {
    token: memberOne.token,
  });
  check("member cannot read group audit trail", memberAudit.status, 403);

  const outsiderAudit = await call("GET", `/groups/${groupId}/audit-logs`, {
    token: outsider.token,
  });
  check("outsider cannot read group audit trail", outsiderAudit.status, 404);

  const adminGroupAudit = await call("GET", `/groups/${groupId}/audit-logs`, {
    token: admin.token,
  });
  check("admin reads group audit trail", adminGroupAudit.status, 200);

  const auditUnauthorized = await call("GET", "/admin/audit-logs", {
    token: organizer.token,
  });
  check("audit logs are admin only", auditUnauthorized.status, 403);

  const auditByGroup = await call(
    "GET",
    `/admin/audit-logs?groupId=${groupId}`,
    {
      token: admin.token,
    },
  );
  check(
    "admin filters audit logs by group",
    auditByGroup.data.auditLogs?.length,
    2,
  );

  const auditByAction = await call(
    "GET",
    `/admin/audit-logs?groupId=${groupId}&action=draw.performed`,
    { token: admin.token },
  );
  check(
    "admin filters audit logs by action",
    auditByAction.data.auditLogs?.length,
    1,
  );

  const auditPaged = await call(
    "GET",
    `/admin/audit-logs?groupId=${groupId}&limit=1`,
    {
      token: admin.token,
    },
  );
  check("audit logs are paginated", auditPaged.data.auditLogs?.length, 1);
  check(
    "audit pagination total",
    auditPaged.meta?.total ?? auditPaged.json.meta?.total,
    2,
  );

  const yesterday = encodeURIComponent(
    new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  );
  const tomorrow = encodeURIComponent(
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  );

  const auditSince = await call(
    "GET",
    `/admin/audit-logs?groupId=${groupId}&from=${yesterday}`,
    {
      token: admin.token,
    },
  );
  check("audit filter from yesterday", auditSince.data.auditLogs?.length, 2);

  const auditFuture = await call(
    "GET",
    `/admin/audit-logs?groupId=${groupId}&from=${tomorrow}`,
    {
      token: admin.token,
    },
  );
  check("audit filter from tomorrow", auditFuture.data.auditLogs?.length, 0);

  const auditInvalid = await call("GET", "/admin/audit-logs?action=bogus", {
    token: admin.token,
  });
  check("invalid audit action rejected", auditInvalid.status, 400);

  const groupList = await call("GET", "/admin/groups?search=Admin%20Smoke", {
    token: admin.token,
  });
  check("admin lists groups", groupList.status, 200);
  check(
    "admin group list includes the group",
    groupList.data.groups?.some((entry) => entry.id === groupId),
    true,
  );
  check(
    "admin group list hides invite codes",
    groupList.data.groups?.every((entry) => entry.inviteCode === undefined),
    true,
  );

  const activeList = await call("GET", "/admin/groups?status=active", {
    token: admin.token,
  });
  check("admin filters groups by status", activeList.status, 200);

  const groupListUnauthorized = await call("GET", "/admin/groups", {
    token: organizer.token,
  });
  check("group list is admin only", groupListUnauthorized.status, 403);

  const selfSuspend = await call("PATCH", `/users/${admin.id}/status`, {
    token: admin.token,
    body: { status: "suspended" },
  });
  check("admin cannot suspend own account", selfSuspend.status, 400);

  const suspend = await call("PATCH", `/users/${memberTwo.id}/status`, {
    token: admin.token,
    body: { status: "suspended" },
  });
  check("admin suspends a user", suspend.status, 200);

  const suspendedLogin = await call("POST", "/auth/login", {
    body: { identifier: memberTwo.phone, password },
  });
  check("suspended user cannot log in", suspendedLogin.status, 403);

  const suspendedAccess = await call("GET", "/users/me", {
    token: memberTwo.token,
  });
  check("suspended user token is rejected", suspendedAccess.status, 403);

  const reactivate = await call("PATCH", `/users/${memberTwo.id}/status`, {
    token: admin.token,
    body: { status: "active" },
  });
  check("admin reactivates the user", reactivate.status, 200);

  const reactivatedLogin = await call("POST", "/auth/login", {
    body: { identifier: memberTwo.phone, password },
  });
  check("reactivated user can log in", reactivatedLogin.status, 200);

  const statusAudit = await call(
    "GET",
    `/admin/audit-logs?action=user.status_changed&entityId=${memberTwo.id}`,
    { token: admin.token },
  );
  check("status changes audited", statusAudit.data.auditLogs?.length, 2);
  check(
    "latest status change recorded",
    statusAudit.data.auditLogs?.[0]?.metadata?.to,
    "active",
  );
  check(
    "earlier status change recorded",
    statusAudit.data.auditLogs?.[1]?.metadata?.to,
    "suspended",
  );

  const reviewUnauthorized = await call(
    "POST",
    `/admin/payments/${missingId}/resolve-review`,
    {
      token: organizer.token,
      body: { note: "Checked with Chapa" },
    },
  );
  check("payment review is admin only", reviewUnauthorized.status, 403);

  const reviewNoNote = await call(
    "POST",
    `/admin/payments/${missingId}/resolve-review`,
    {
      token: admin.token,
      body: {},
    },
  );
  check("payment review requires a note", reviewNoNote.status, 400);

  const reviewMissing = await call(
    "POST",
    `/admin/payments/${missingId}/resolve-review`,
    {
      token: admin.token,
      body: { note: "Checked with Chapa" },
    },
  );
  check("unknown payment review rejected", reviewMissing.status, 404);

  const jobList = await call("GET", "/admin/jobs", { token: admin.token });
  check("admin lists jobs", jobList.status, 200);
  check("four jobs registered", jobList.data.jobs?.length, 4);
  check(
    "reminder job registered",
    jobList.data.jobs?.some((entry) => entry.name === "contribution-reminders"),
    true,
  );
  check(
    "jobs expose schedules",
    jobList.data.jobs?.every((entry) => typeof entry.schedule === "string"),
    true,
  );

  const jobUnauthorized = await call("GET", "/admin/jobs", {
    token: organizer.token,
  });
  check("job list is admin only", jobUnauthorized.status, 403);

  const runUnauthorized = await call(
    "POST",
    "/admin/jobs/notification-cleanup/run",
    {
      token: organizer.token,
    },
  );
  check("job run is admin only", runUnauthorized.status, 403);

  const jobRun = await call("POST", "/admin/jobs/notification-cleanup/run", {
    token: admin.token,
  });
  check("admin runs a job", jobRun.status, 200);
  check("job summary returned", typeof jobRun.data.summary?.deleted, "number");

  const jobUnknown = await call("POST", "/admin/jobs/unknown-job/run", {
    token: admin.token,
  });
  check("unknown job rejected", jobUnknown.status, 404);

  const jobInvalid = await call("POST", "/admin/jobs/Bad_Name/run", {
    token: admin.token,
  });
  check("invalid job name rejected", jobInvalid.status, 400);

  const jobAudit = await call(
    "GET",
    `/admin/audit-logs?action=job.run&actorId=${admin.id}&entityType=Job`,
    { token: admin.token },
  );
  check("job runs audited", jobAudit.data.auditLogs?.length >= 1, true);
  check(
    "job audit names the job",
    jobAudit.data.auditLogs?.[0]?.metadata?.name,
    "notification-cleanup",
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
