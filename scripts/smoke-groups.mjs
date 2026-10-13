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
  const late = await registerUser("Late");

  const startDate = new Date(Date.now() + 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const invalid = await call("POST", "/groups", {
    token: organizer.token,
    body: {
      name: "Ab",
      contributionAmount: 10,
      frequency: "daily",
      maxMembers: 1,
      startDate: "2000-01-01",
    },
  });
  check("invalid group rejected", invalid.status, 400);

  const created = await call("POST", "/groups", {
    token: organizer.token,
    body: {
      name: "Smoke Equb",
      description: "Smoke test group",
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
  let inviteCode = created.data.group?.inviteCode;

  if (!groupId || !inviteCode) {
    throw new Error("Group creation did not return an id and invite code");
  }

  check(
    "creator is organizer",
    created.data.group.membership?.role,
    "organizer",
  );
  check("creator counted as member", created.data.group.memberCount, 1);

  const preview = await call("GET", `/groups/preview/${inviteCode}`, {
    token: memberOne.token,
  });
  check("preview by invite code", preview.status, 200);
  check("preview shows join allowed", preview.data.group?.canJoin, true);

  const badPreview = await call("GET", "/groups/preview/ZZZZZZZZ", {
    token: memberOne.token,
  });
  check("unknown invite code rejected", badPreview.status, 404);

  const joinOne = await call("POST", "/groups/join", {
    token: memberOne.token,
    body: { inviteCode },
  });
  check("member one joins", joinOne.status, 201);

  const joinAgain = await call("POST", "/groups/join", {
    token: memberOne.token,
    body: { inviteCode },
  });
  check("duplicate join rejected", joinAgain.status, 409);

  const outsiderView = await call("GET", `/groups/${groupId}`, {
    token: late.token,
  });
  check("non-member cannot view group", outsiderView.status, 404);

  const memberView = await call("GET", `/groups/${groupId}`, {
    token: memberOne.token,
  });
  check("member views group", memberView.status, 200);
  check(
    "invite code hidden from member",
    memberView.data.group?.inviteCode,
    undefined,
  );

  const organizerView = await call("GET", `/groups/${groupId}`, {
    token: organizer.token,
  });
  check(
    "invite code visible to organizer",
    organizerView.data.group?.inviteCode,
    inviteCode,
  );

  const memberEdit = await call("PATCH", `/groups/${groupId}`, {
    token: memberOne.token,
    body: { name: "Hijacked" },
  });
  check("member cannot edit group", memberEdit.status, 403);

  const lockedEdit = await call("PATCH", `/groups/${groupId}`, {
    token: organizer.token,
    body: { contributionAmount: 60000 },
  });
  check("locked field rejected after join", lockedEdit.status, 409);

  const nameEdit = await call("PATCH", `/groups/${groupId}`, {
    token: organizer.token,
    body: { name: "Smoke Equb Renamed" },
  });
  check("organizer edits name", nameEdit.status, 200);

  const shrink = await call("PATCH", `/groups/${groupId}`, {
    token: organizer.token,
    body: { maxMembers: 2 },
  });
  check("shrink to current size", shrink.status, 200);

  const fullJoin = await call("POST", "/groups/join", {
    token: memberTwo.token,
    body: { inviteCode },
  });
  check("join full group rejected", fullJoin.status, 409);

  const grow = await call("PATCH", `/groups/${groupId}`, {
    token: organizer.token,
    body: { maxMembers: 3 },
  });
  check("grow capacity", grow.status, 200);

  const joinTwo = await call("POST", "/groups/join", {
    token: memberTwo.token,
    body: { inviteCode },
  });
  check("member two joins", joinTwo.status, 201);

  const lateJoin = await call("POST", "/groups/join", {
    token: late.token,
    body: { inviteCode },
  });
  check("join after capacity reached rejected", lateJoin.status, 409);

  const organizerList = await call("GET", `/groups/${groupId}/members`, {
    token: organizer.token,
  });
  check("organizer lists members", organizerList.status, 200);
  check("three active members", organizerList.data.members?.length, 3);
  check(
    "organizer sees phone numbers",
    typeof organizerList.data.members?.[0]?.user?.phone,
    "string",
  );

  const memberList = await call("GET", `/groups/${groupId}/members`, {
    token: memberOne.token,
  });
  check("member lists members", memberList.status, 200);
  check(
    "member cannot see phone numbers",
    memberList.data.members?.[0]?.user?.phone,
    undefined,
  );

  const leave = await call("POST", `/groups/${groupId}/leave`, {
    token: memberOne.token,
  });
  check("member leaves", leave.status, 200);

  const afterLeave = await call("GET", `/groups/${groupId}`, {
    token: organizer.token,
  });
  check("member count after leave", afterLeave.data.group?.memberCount, 2);

  const organizerLeave = await call("POST", `/groups/${groupId}/leave`, {
    token: organizer.token,
  });
  check("organizer cannot leave", organizerLeave.status, 400);

  const memberTwoRecord = organizerList.data.members.find(
    (entry) => entry.user.id === memberTwo.id,
  );
  const remove = await call(
    "DELETE",
    `/groups/${groupId}/members/${memberTwoRecord.id}`,
    {
      token: organizer.token,
    },
  );
  check("organizer removes member", remove.status, 200);

  const rejoinRemoved = await call("POST", "/groups/join", {
    token: memberTwo.token,
    body: { inviteCode },
  });
  check("removed member cannot rejoin", rejoinRemoved.status, 403);

  const rejoinLeft = await call("POST", "/groups/join", {
    token: memberOne.token,
    body: { inviteCode },
  });
  check("member who left can rejoin", rejoinLeft.status, 201);

  const myGroups = await call("GET", "/groups", { token: memberOne.token });
  check("member lists own groups", myGroups.status, 200);
  check(
    "own group present",
    myGroups.data.groups?.some((entry) => entry.id === groupId),
    true,
  );

  const regenerated = await call(
    "POST",
    `/groups/${groupId}/invite-code/regenerate`,
    {
      token: organizer.token,
    },
  );
  check("regenerate invite code", regenerated.status, 200);
  check(
    "invite code changed",
    regenerated.data.inviteCode !== inviteCode,
    true,
  );

  const oldPreview = await call("GET", `/groups/preview/${inviteCode}`, {
    token: late.token,
  });
  check("old invite code invalid", oldPreview.status, 404);

  inviteCode = regenerated.data.inviteCode;

  const cancel = await call("POST", `/groups/${groupId}/cancel`, {
    token: organizer.token,
    body: { reason: "Smoke test finished" },
  });
  check("organizer cancels group", cancel.status, 200);
  check("group status cancelled", cancel.data.group?.status, "cancelled");

  const joinCancelled = await call("POST", "/groups/join", {
    token: late.token,
    body: { inviteCode },
  });
  check("cannot join cancelled group", joinCancelled.status, 409);

  const approvalGroup = await call("POST", "/groups", {
    token: organizer.token,
    body: {
      name: "Approval Equb",
      contributionAmount: 20000,
      frequency: "weekly",
      maxMembers: 2,
      startDate,
      requireApproval: true,
    },
  });
  check("create approval group", approvalGroup.status, 201);

  const approvalId = approvalGroup.data.group?.id;
  const approvalCode = approvalGroup.data.group?.inviteCode;

  const pendingLate = await call("POST", "/groups/join", {
    token: late.token,
    body: { inviteCode: approvalCode },
  });
  check("join request created", pendingLate.status, 201);
  check("request is pending", pendingLate.data.membership?.status, "pending");

  const pendingOne = await call("POST", "/groups/join", {
    token: memberOne.token,
    body: { inviteCode: approvalCode },
  });
  check("second join request created", pendingOne.status, 201);

  const pendingView = await call("GET", `/groups/${approvalId}`, {
    token: late.token,
  });
  check("pending member cannot view group", pendingView.status, 403);

  const pendingList = await call(
    "GET",
    `/groups/${approvalId}/members?status=pending`,
    {
      token: organizer.token,
    },
  );
  check(
    "organizer lists pending requests",
    pendingList.data.members?.length,
    2,
  );

  const lateRecord = pendingList.data.members.find(
    (entry) => entry.user.id === late.id,
  );
  const oneRecord = pendingList.data.members.find(
    (entry) => entry.user.id === memberOne.id,
  );

  const approve = await call(
    "POST",
    `/groups/${approvalId}/members/${lateRecord.id}/approve`,
    {
      token: organizer.token,
    },
  );
  check("organizer approves request", approve.status, 200);

  const approveFull = await call(
    "POST",
    `/groups/${approvalId}/members/${oneRecord.id}/approve`,
    {
      token: organizer.token,
    },
  );
  check("approval blocked when group full", approveFull.status, 409);

  const reject = await call(
    "POST",
    `/groups/${approvalId}/members/${oneRecord.id}/reject`,
    {
      token: organizer.token,
    },
  );
  check("organizer rejects request", reject.status, 200);

  const finalView = await call("GET", `/groups/${approvalId}`, {
    token: organizer.token,
  });
  check("approved member counted", finalView.data.group?.memberCount, 2);
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
