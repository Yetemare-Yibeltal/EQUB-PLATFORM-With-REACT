import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";
import {
  as,
  createEqub,
  registerUser,
  startDatabase,
  stopDatabase,
  tomorrow,
} from "../helpers.js";

beforeAll(startDatabase);
afterAll(stopDatabase);

describe("creating a group", () => {
  test("makes the creator the organizer and first member", async () => {
const { organizer, inviteCode } = await createEqub({
  size: 2,
  start: false,
  overrides: { maxMembers: 3 },
});    const response = await as(organizer).post("/api/groups", {
      name: "Family Equb",
      contributionAmount: 100000,
      frequency: "weekly",
      maxMembers: 4,
      startDate: tomorrow(),
    });

    expect(response.status).toBe(201);
    expect(response.body.data.group.memberCount).toBe(1);
    expect(response.body.data.group.status).toBe("open");
    expect(response.body.data.group.inviteCode).toMatch(/^[A-Z0-9]{8}$/);
    expect(response.body.data.group.membership.role).toBe("organizer");
  });

  test("rejects invalid input", async () => {
    const organizer = await registerUser("Invalid");
    const response = await as(organizer).post("/api/groups", {
      name: "Ab",
      contributionAmount: 10,
      frequency: "daily",
      maxMembers: 1,
      startDate: "2000-01-01",
    });

    expect(response.status).toBe(400);
  });

  test("rejects a late penalty above the contribution", async () => {
    const organizer = await registerUser("Penalty");
    const response = await as(organizer).post("/api/groups", {
      name: "Penalty Equb",
      contributionAmount: 10000,
      frequency: "monthly",
      maxMembers: 3,
      startDate: tomorrow(),
      latePenaltyAmount: 20000,
    });

    expect(response.status).toBe(400);
  });

  test("requires authentication", async () => {
    const { api } = await import("../helpers.js");

    expect((await api().post("/api/groups").send({})).status).toBe(401);
  });
});

describe("joining a group", () => {
  test("previews a group by invite code", async () => {
    const { organizer, inviteCode } = await createEqub({
      size: 2,
      start: false,
    });
    const visitor = await registerUser("Visitor");
    const response = await as(visitor).get(`/api/groups/preview/${inviteCode}`);

    expect(response.status).toBe(200);
    expect(response.body.data.group.canJoin).toBe(true);
    expect(response.body.data.group.inviteCode).toBeUndefined();
    expect(organizer.id).toBeDefined();
  });

  test("rejects an unknown invite code", async () => {
    const visitor = await registerUser("Lost");

    expect((await as(visitor).get("/api/groups/preview/ZZZZZZZZ")).status).toBe(
      404,
    );
    expect(
      (await as(visitor).post("/api/groups/join", { inviteCode: "ZZZZZZZZ" }))
        .status,
    ).toBe(404);
  });

  test("rejects joining twice", async () => {
    const { members, inviteCode } = await createEqub({ size: 3, start: false });

    expect(
      (await as(members[0]).post("/api/groups/join", { inviteCode })).status,
    ).toBe(409);
  });

  test("rejects joining a full group", async () => {
    const { inviteCode } = await createEqub({ size: 2, start: false });
    const late = await registerUser("Late");

    expect(
      (await as(late).post("/api/groups/join", { inviteCode })).status,
    ).toBe(409);
  });

  test("hides the group from people who are not members", async () => {
    const { groupId } = await createEqub({ size: 2, start: false });
    const outsider = await registerUser("Outsider");

    expect((await as(outsider).get(`/api/groups/${groupId}`)).status).toBe(404);
  });

  test("shows the invite code only to the organizer", async () => {
    const { organizer, members, groupId, inviteCode } = await createEqub({
      size: 2,
      start: false,
    });

    const asOrganizer = await as(organizer).get(`/api/groups/${groupId}`);
    const asMember = await as(members[0]).get(`/api/groups/${groupId}`);

    expect(asOrganizer.body.data.group.inviteCode).toBe(inviteCode);
    expect(asMember.status).toBe(200);
    expect(asMember.body.data.group.inviteCode).toBeUndefined();
  });
});

describe("approval flow", () => {
  test("holds requests until the organizer approves", async () => {
    const { organizer, groupId, inviteCode } = await createEqub({
      size: 2,
      start: false,
      overrides: { requireApproval: true, maxMembers: 3 },
    }).catch(async () => {
      throw new Error("Approval group could not be prepared");
    });
    const applicant = await registerUser("Applicant");

    const joined = await as(applicant).post("/api/groups/join", { inviteCode });
    expect(joined.status).toBe(201);
    expect(joined.body.data.membership.status).toBe("pending");

    expect((await as(applicant).get(`/api/groups/${groupId}`)).status).toBe(
      403,
    );

    const pending = await as(organizer).get(
      `/api/groups/${groupId}/members?status=pending`,
    );
    const request = pending.body.data.members.find(
      (member) => member.user.id === applicant.id,
    );
    expect(request).toBeDefined();

    const approved = await as(organizer).post(
      `/api/groups/${groupId}/members/${request.id}/approve`,
    );
    expect(approved.status).toBe(200);

    expect((await as(applicant).get(`/api/groups/${groupId}`)).status).toBe(
      200,
    );
  });

  test("can reject a request", async () => {
    const { organizer, groupId, inviteCode } = await createEqub({
      size: 2,
      start: false,
      overrides: { requireApproval: true, maxMembers: 3 },
    });
    const applicant = await registerUser("Rejected");

    await as(applicant).post("/api/groups/join", { inviteCode });

    const pending = await as(organizer).get(
      `/api/groups/${groupId}/members?status=pending`,
    );
    const request = pending.body.data.members.find(
      (member) => member.user.id === applicant.id,
    );

    const rejected = await as(organizer).post(
      `/api/groups/${groupId}/members/${request.id}/reject`,
    );

    expect(rejected.status).toBe(200);
    expect(rejected.body.data.member.status).toBe("rejected");
  });
});

describe("managing a group", () => {
  test("lets only the organizer edit it", async () => {
    const { organizer, members, groupId } = await createEqub({
      size: 2,
      start: false,
    });

    expect(
      (
        await as(members[0]).patch(`/api/groups/${groupId}`, {
          name: "Hijacked",
        })
      ).status,
    ).toBe(403);

    const renamed = await as(organizer).patch(`/api/groups/${groupId}`, {
      name: "Renamed Equb",
    });
    expect(renamed.status).toBe(200);
    expect(renamed.body.data.group.name).toBe("Renamed Equb");
  });

  test("locks money fields once others have joined", async () => {
    const { organizer, groupId } = await createEqub({ size: 2, start: false });

    const response = await as(organizer).patch(`/api/groups/${groupId}`, {
      contributionAmount: 60000,
    });

    expect(response.status).toBe(409);
  });

  test("prevents shrinking below the current member count", async () => {
    const { organizer, groupId } = await createEqub({ size: 3, start: false });

    expect(
      (await as(organizer).patch(`/api/groups/${groupId}`, { maxMembers: 2 }))
        .status,
    ).toBe(400);
  });

  test("replaces the invite code", async () => {
    const { organizer, groupId, inviteCode } = await createEqub({
      size: 2,
      start: false,
    });
    const regenerated = await as(organizer).post(
      `/api/groups/${groupId}/invite-code/regenerate`,
    );

    expect(regenerated.status).toBe(200);
    expect(regenerated.body.data.inviteCode).not.toBe(inviteCode);

    const visitor = await registerUser("Stale");
    expect(
      (await as(visitor).get(`/api/groups/preview/${inviteCode}`)).status,
    ).toBe(404);
  });

  test("lets a member leave and rejoin, but not a removed member", async () => {
    const { organizer, members, groupId, inviteCode } = await createEqub({
      size: 4,
      start: false,
    });
    const [leaver, removed] = members;

    expect((await as(leaver).post(`/api/groups/${groupId}/leave`)).status).toBe(
      200,
    );

    const afterLeave = await as(organizer).get(`/api/groups/${groupId}`);
    expect(afterLeave.body.data.group.memberCount).toBe(3);

    expect(
      (await as(leaver).post("/api/groups/join", { inviteCode })).status,
    ).toBe(201);

    const listed = await as(organizer).get(`/api/groups/${groupId}/members`);
    const target = listed.body.data.members.find(
      (member) => member.user.id === removed.id,
    );

    expect(
      (
        await as(organizer).delete(
          `/api/groups/${groupId}/members/${target.id}`,
        )
      ).status,
    ).toBe(200);
    expect(
      (await as(removed).post("/api/groups/join", { inviteCode })).status,
    ).toBe(403);
  });

  test("stops the organizer from leaving", async () => {
    const { organizer, groupId } = await createEqub({ size: 2, start: false });

    expect(
      (await as(organizer).post(`/api/groups/${groupId}/leave`)).status,
    ).toBe(400);
  });

  test("hides phone numbers from regular members", async () => {
    const { organizer, members, groupId } = await createEqub({
      size: 3,
      start: false,
    });

    const forOrganizer = await as(organizer).get(
      `/api/groups/${groupId}/members`,
    );
    const forMember = await as(members[0]).get(
      `/api/groups/${groupId}/members`,
    );

    expect(typeof forOrganizer.body.data.members[0].user.phone).toBe("string");
    expect(forMember.body.data.members[0].user.phone).toBeUndefined();
  });

  test("cancels an open group and blocks later joins", async () => {
    const { organizer, groupId, inviteCode } = await createEqub({
      size: 3,
      start: false,
    });
    const cancelled = await as(organizer).post(
      `/api/groups/${groupId}/cancel`,
      {
        reason: "Plans changed",
      },
    );

    expect(cancelled.status).toBe(200);
    expect(cancelled.body.data.group.status).toBe("cancelled");

    const late = await registerUser("TooLate");
    expect(
      (await as(late).post("/api/groups/join", { inviteCode })).status,
    ).toBe(409);
  });
});

describe("starting a group", () => {
  test("needs at least two members", async () => {
    const organizer = await registerUser("Lonely");
    const created = await as(organizer).post("/api/groups", {
      name: "Solo Equb",
      contributionAmount: 50000,
      frequency: "monthly",
      maxMembers: 3,
      startDate: tomorrow(),
    });

    const start = await as(organizer).post(
      `/api/groups/${created.body.data.group.id}/start`,
    );

    expect(start.status).toBe(400);
  });

  test("is limited to the organizer", async () => {
    const { members, groupId } = await createEqub({ size: 3, start: false });
    const outsider = await registerUser("Stranger");

    expect(
      (await as(members[0]).post(`/api/groups/${groupId}/start`)).status,
    ).toBe(403);
    expect(
      (await as(outsider).post(`/api/groups/${groupId}/start`)).status,
    ).toBe(404);
  });

  test("creates one cycle per member and opens the first", async () => {
    const { organizer, groupId } = await createEqub({ size: 3, start: false });
    const started = await as(organizer).post(`/api/groups/${groupId}/start`);

    expect(started.status).toBe(200);
    expect(started.body.data.group.status).toBe("active");
    expect(started.body.data.group.maxMembers).toBe(3);
    expect(started.body.data.currentCycle.number).toBe(1);
    expect(started.body.data.currentCycle.status).toBe("collecting");
    expect(started.body.data.currentCycle.potAmount).toBe(150000);

    const cycles = await as(organizer).get(`/api/groups/${groupId}/cycles`);

    expect(cycles.body.data.cycles.map((cycle) => cycle.status)).toEqual([
      "collecting",
      "upcoming",
      "upcoming",
    ]);

    const contributions = await as(organizer).get(
      `/api/groups/${groupId}/contributions?cycleId=${started.body.data.currentCycle.id}`,
    );

    expect(contributions.body.data.contributions).toHaveLength(3);
  });

  test("cannot be started twice or joined afterwards", async () => {
    const { organizer, groupId, inviteCode } = await createEqub({ size: 3 });

    expect(
      (await as(organizer).post(`/api/groups/${groupId}/start`)).status,
    ).toBe(409);

    const late = await registerUser("Afterwards");
    expect(
      (await as(late).post("/api/groups/join", { inviteCode })).status,
    ).toBe(409);
  });
});
