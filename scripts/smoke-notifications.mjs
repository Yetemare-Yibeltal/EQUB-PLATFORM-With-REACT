import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(
  new URL("../backend/package.json", import.meta.url),
);
const { io: connectSocket } = require("socket.io-client");

const base = process.env.API_URL || "http://localhost:5000/api";
const socketUrl = process.env.SOCKET_URL || new URL(base).origin;
const password = "Secret123";
const backendDir = fileURLToPath(new URL("../backend/", import.meta.url));
const jobScript = fileURLToPath(new URL("./run-job.mjs", import.meta.url));

const sockets = [];

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

const runJob = (name) =>
  spawnSync(process.execPath, [jobScript, name], {
    cwd: backendDir,
    encoding: "utf8",
  });

const openSocket = (token) =>
  new Promise((resolve, reject) => {
    const socket = connectSocket(socketUrl, {
      auth: { token },
      transports: ["websocket"],
      reconnection: false,
      timeout: 5000,
    });

    socket.events = [];
    socket.onAny((event, payload) => socket.events.push({ event, payload }));
    sockets.push(socket);

    socket.once("connect", () => resolve(socket));
    socket.once("connect_error", (error) => {
      socket.close();
      reject(error);
    });
  });

const waitForEvent = async (socket, predicate, timeoutMs = 5000) => {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const found = socket.events.find(predicate);
    if (found) return found;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  return null;
};

const emitAck = (socket, event, payload) =>
  new Promise((resolve) => {
    socket.timeout(5000).emit(event, payload, (error, response) => {
      resolve(error ? { ok: false, message: "timeout" } : response);
    });
  });

const isNotification = (type) => (entry) =>
  entry.event === "notification:new" &&
  entry.payload?.notification?.type === type;

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

const notificationsOf = async (user, query = "") => {
  const response = await call("GET", `/notifications?limit=100${query}`, {
    token: user.token,
  });
  return response.data.notifications ?? [];
};

const countType = async (users, type) => {
  let total = 0;

  for (const user of users) {
    total += (await notificationsOf(user, `&type=${type}`)).length;
  }

  return total;
};

const recordOf = (list, userId) =>
  list.find((entry) => entry.user.id === userId);

const run = async () => {
  const organizer = await registerUser("Organizer");
  const memberOne = await registerUser("MemberOne");
  const memberTwo = await registerUser("MemberTwo");
  const outsider = await registerUser("Outsider");
  const members = [organizer, memberOne, memberTwo];

  const invalidSocket = await openSocket("invalid-token").then(
    () => "connected",
    () => "rejected",
  );
  check("invalid token socket rejected", invalidSocket, "rejected");

  const missingSocket = await openSocket().then(
    () => "connected",
    () => "rejected",
  );
  check("missing token socket rejected", missingSocket, "rejected");

  organizer.socket = await openSocket(organizer.token);
  memberOne.socket = await openSocket(memberOne.token);
  outsider.socket = await openSocket(outsider.token);

  const initial = await waitForEvent(
    organizer.socket,
    (entry) => entry.event === "notification:unread-count",
  );
  check("initial unread count pushed", initial?.payload?.unreadCount, 0);

  const unreadAck = await emitAck(organizer.socket, "notifications:get-unread");
  check("unread count by acknowledgement", unreadAck.ok, true);

  const badMarkRead = await emitAck(
    organizer.socket,
    "notifications:mark-read",
    {
      notificationId: "nope",
    },
  );
  check("invalid notification id rejected over socket", badMarkRead.ok, false);

  const unauthenticated = await call("GET", "/notifications");
  check("notifications require authentication", unauthenticated.status, 401);

  const startDate = new Date(Date.now() + 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const created = await call("POST", "/groups", {
    token: organizer.token,
    body: {
      name: "Notification Equb",
      contributionAmount: 50000,
      frequency: "monthly",
      maxMembers: 3,
      startDate,
      latePenaltyAmount: 5000,
      gracePeriodDays: 2,
      requireApproval: true,
    },
  });
  check("create group", created.status, 201);

  const groupId = created.data.group?.id;
  const inviteCode = created.data.group?.inviteCode;

  if (!groupId || !inviteCode) {
    throw new Error("Group creation did not return an id and invite code");
  }

  const joinOne = await call("POST", "/groups/join", {
    token: memberOne.token,
    body: { inviteCode },
  });
  check(
    "member one request pending",
    joinOne.data.membership?.status,
    "pending",
  );

  const requestEvent = await waitForEvent(
    organizer.socket,
    isNotification("membership_request"),
  );
  check(
    "organizer receives join request over socket",
    Boolean(requestEvent),
    true,
  );

  const pendingOne = await call(
    "GET",
    `/groups/${groupId}/members?status=pending`,
    {
      token: organizer.token,
    },
  );
  const requestOne = recordOf(pendingOne.data.members, memberOne.id);

  const approveOne = await call(
    "POST",
    `/groups/${groupId}/members/${requestOne.id}/approve`,
    {
      token: organizer.token,
    },
  );
  check("organizer approves member one", approveOne.status, 200);

  const approvedEvent = await waitForEvent(
    memberOne.socket,
    isNotification("membership_approved"),
  );
  check("member receives approval over socket", Boolean(approvedEvent), true);

  const joinTwo = await call("POST", "/groups/join", {
    token: memberTwo.token,
    body: { inviteCode },
  });
  check(
    "member two request pending",
    joinTwo.data.membership?.status,
    "pending",
  );

  const pendingTwo = await call(
    "GET",
    `/groups/${groupId}/members?status=pending`,
    {
      token: organizer.token,
    },
  );
  const requestTwo = recordOf(pendingTwo.data.members, memberTwo.id);

  const approveTwo = await call(
    "POST",
    `/groups/${groupId}/members/${requestTwo.id}/approve`,
    {
      token: organizer.token,
    },
  );
  check("organizer approves member two", approveTwo.status, 200);

  check(
    "organizer has two join requests",
    await countType([organizer], "membership_request"),
    2,
  );
  check(
    "member two has approval notification",
    await countType([memberTwo], "membership_approved"),
    1,
  );

  const subscribe = await emitAck(memberOne.socket, "group:subscribe", {
    groupId,
  });
  check("member subscribes to group room", subscribe.ok, true);

  const outsiderSubscribe = await emitAck(outsider.socket, "group:subscribe", {
    groupId,
  });
  check("outsider cannot subscribe to group room", outsiderSubscribe.ok, false);

  const badSubscribe = await emitAck(memberOne.socket, "group:subscribe", {
    groupId: "nope",
  });
  check("invalid group id rejected for subscription", badSubscribe.ok, false);

  const started = await call("POST", `/groups/${groupId}/start`, {
    token: organizer.token,
  });
  check("organizer starts group", started.status, 200);

  const startedEvent = await waitForEvent(
    memberOne.socket,
    isNotification("group_started"),
  );
  check(
    "member receives group started over socket",
    Boolean(startedEvent),
    true,
  );
  check(
    "every member notified of start",
    await countType(members, "group_started"),
    3,
  );

  const firstRun = runJob("contribution-reminders");
  if (firstRun.status !== 0) console.error(firstRun.stderr || firstRun.stdout);
  check("reminder job exits cleanly", firstRun.status, 0);
  check(
    "member has a contribution reminder",
    await countType([memberOne], "contribution_reminder"),
    1,
  );

  const secondRun = runJob("contribution-reminders");
  check("reminder job rerun exits cleanly", secondRun.status, 0);
  check(
    "rerun sends no duplicate reminder",
    await countType([memberOne], "contribution_reminder"),
    1,
  );

  const contributions = await call("GET", `/groups/${groupId}/contributions`, {
    token: organizer.token,
  });
  const contributionOf = (userId) =>
    recordOf(contributions.data.contributions, userId);

  memberOne.socket.events.length = 0;

  const payOne = await call(
    "POST",
    `/groups/${groupId}/contributions/${contributionOf(memberOne.id).id}/pay`,
    { token: organizer.token, body: { paymentMethod: "cash" } },
  );
  check("organizer records member one payment", payOne.status, 200);

  const receivedEvent = await waitForEvent(
    memberOne.socket,
    isNotification("contribution_received"),
  );
  check(
    "member receives payment confirmation over socket",
    Boolean(receivedEvent),
    true,
  );

  const updatedEvent = await waitForEvent(
    memberOne.socket,
    (entry) => entry.event === "contribution:updated",
  );
  check("group room receives contribution update", Boolean(updatedEvent), true);

  const unreadBefore = await call("GET", "/notifications/unread-count", {
    token: memberOne.token,
  });
  check(
    "member has unread notifications",
    unreadBefore.data.unreadCount > 0,
    true,
  );

  const unreadList = await notificationsOf(memberOne, "&unread=true");
  check(
    "unread filter returns only unread",
    unreadList.every((entry) => entry.readAt === null),
    true,
  );

  const target = unreadList[0];

  const outsiderRead = await call("POST", `/notifications/${target.id}/read`, {
    token: outsider.token,
  });
  check("other user cannot mark notification read", outsiderRead.status, 404);

  const read = await call("POST", `/notifications/${target.id}/read`, {
    token: memberOne.token,
  });
  check("member marks notification read", read.status, 200);
  check(
    "unread count decreases",
    read.data.unreadCount,
    unreadBefore.data.unreadCount - 1,
  );

  const readAgain = await call("POST", `/notifications/${target.id}/read`, {
    token: memberOne.token,
  });
  check("marking read twice is accepted", readAgain.status, 200);

  const badId = await call("POST", "/notifications/nope/read", {
    token: memberOne.token,
  });
  check("invalid notification id rejected", badId.status, 400);

  const removed = await call("DELETE", `/notifications/${target.id}`, {
    token: memberOne.token,
  });
  check("member deletes notification", removed.status, 200);

  const removedAgain = await call("DELETE", `/notifications/${target.id}`, {
    token: memberOne.token,
  });
  check("deleted notification is gone", removedAgain.status, 404);

  memberOne.socket.events.length = 0;

  const readAll = await call("POST", "/notifications/read-all", {
    token: memberOne.token,
  });
  check("member marks all read", readAll.status, 200);

  const countEvent = await waitForEvent(
    memberOne.socket,
    (entry) =>
      entry.event === "notification:unread-count" &&
      entry.payload?.unreadCount === 0,
  );
  check("unread count pushed after read all", Boolean(countEvent), true);

  const unreadAfter = await call("GET", "/notifications/unread-count", {
    token: memberOne.token,
  });
  check("no unread notifications remain", unreadAfter.data.unreadCount, 0);

  const payTwo = await call(
    "POST",
    `/groups/${groupId}/contributions/${contributionOf(memberTwo.id).id}/pay`,
    { token: organizer.token, body: { paymentMethod: "cash" } },
  );
  check("organizer records member two payment", payTwo.status, 200);

  const payOrganizer = await call(
    "POST",
    `/groups/${groupId}/contributions/${contributionOf(organizer.id).id}/pay`,
    {
      token: organizer.token,
      body: { paymentMethod: "telebirr", reference: "T-1" },
    },
  );
  check("organizer records own payment", payOrganizer.status, 200);

  const collectedEvent = await waitForEvent(
    organizer.socket,
    isNotification("cycle_collected"),
  );
  check(
    "organizer notified that the cycle is collected",
    Boolean(collectedEvent),
    true,
  );

  const cycleEvent = await waitForEvent(
    memberOne.socket,
    (entry) =>
      entry.event === "cycle:updated" && entry.payload?.status === "collected",
  );
  check(
    "group room receives collected cycle update",
    Boolean(cycleEvent),
    true,
  );

  const cycleId = collectedEvent.payload.notification.cycle;

  memberOne.socket.events.length = 0;

  const draw = await call("POST", `/groups/${groupId}/draws`, {
    token: organizer.token,
    body: { cycleId },
  });
  check("organizer performs draw", draw.status, 201);

  const drawEvent = await waitForEvent(
    memberOne.socket,
    (entry) => entry.event === "draw:completed",
  );
  check("group room receives draw result", Boolean(drawEvent), true);
  check(
    "draw event names the winner",
    drawEvent?.payload?.winnerUserId,
    draw.data.draw?.winnerUser?.id,
  );

  check("exactly one winner notified", await countType(members, "draw_won"), 1);
  check(
    "other members notified of the draw",
    await countType(members, "draw_completed"),
    2,
  );

  const payout = await call(
    "POST",
    `/groups/${groupId}/payouts/${draw.data.payout.id}/pay`,
    {
      token: organizer.token,
      body: { paymentMethod: "bank_transfer", reference: "P-1" },
    },
  );
  check("organizer records payout", payout.status, 200);

  check(
    "recipient notified of payout",
    await countType(members, "payout_paid"),
    1,
  );
  check(
    "every member notified of the next cycle",
    await countType(members, "contribution_due"),
    3,
  );

  const payoutEvent = await waitForEvent(
    memberOne.socket,
    (entry) => entry.event === "payout:paid",
  );
  check("group room receives payout update", Boolean(payoutEvent), true);

  const drawRun = runJob("draw-reminders");
  check("draw reminder job exits cleanly", drawRun.status, 0);

  const payoutRun = runJob("payout-reminders");
  check("payout reminder job exits cleanly", payoutRun.status, 0);

  const cleanupRun = runJob("notification-cleanup");
  check("cleanup job exits cleanly", cleanupRun.status, 0);

  const unknownRun = runJob("unknown-job");
  check("unknown job rejected", unknownRun.status, 1);

  const openGroup = await call("POST", "/groups", {
    token: organizer.token,
    body: {
      name: "Membership Equb",
      contributionAmount: 20000,
      frequency: "weekly",
      maxMembers: 4,
      startDate,
    },
  });
  check("create open group", openGroup.status, 201);

  const openId = openGroup.data.group?.id;
  const openCode = openGroup.data.group?.inviteCode;

  await call("POST", "/groups/join", {
    token: memberOne.token,
    body: { inviteCode: openCode },
  });
  await call("POST", "/groups/join", {
    token: memberTwo.token,
    body: { inviteCode: openCode },
  });
  await call("POST", "/groups/join", {
    token: outsider.token,
    body: { inviteCode: openCode },
  });

  check(
    "organizer notified of each new member",
    await countType([organizer], "member_joined"),
    3,
  );

  const leave = await call("POST", `/groups/${openId}/leave`, {
    token: outsider.token,
  });
  check("member leaves group", leave.status, 200);
  check(
    "organizer notified that a member left",
    await countType([organizer], "member_left"),
    1,
  );

  const listed = await call("GET", `/groups/${openId}/members`, {
    token: organizer.token,
  });
  const memberTwoRecord = recordOf(listed.data.members, memberTwo.id);

  const remove = await call(
    "DELETE",
    `/groups/${openId}/members/${memberTwoRecord.id}`,
    {
      token: organizer.token,
    },
  );
  check("organizer removes member two", remove.status, 200);
  check(
    "removed member notified",
    await countType([memberTwo], "member_removed"),
    1,
  );

  const cancel = await call("POST", `/groups/${openId}/cancel`, {
    token: organizer.token,
    body: { reason: "Smoke test finished" },
  });
  check("organizer cancels open group", cancel.status, 200);
  check(
    "remaining member notified of cancellation",
    await countType([memberOne], "group_cancelled"),
    1,
  );
  check(
    "removed member not notified of cancellation",
    await countType([memberTwo], "group_cancelled"),
    0,
  );
};

try {
  await run();
} catch (error) {
  failures += 1;
  console.error(`Smoke test aborted: ${error.message}`);
}

sockets.forEach((socket) => socket.close());

console.log(
  failures === 0 ? "\nAll checks passed" : `\n${failures} check(s) failed`,
);
process.exit(failures === 0 ? 0 : 1);
