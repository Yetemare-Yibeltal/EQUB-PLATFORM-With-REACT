import crypto from "node:crypto";
import mongoose from "mongoose";
import request from "supertest";
import app from "../src/app.js";
import { connectDB, disconnectDB } from "../src/config/db.js";

export const PASSWORD = "Secret123";

const MEMBER_NAMES = ["Alpha", "Beta", "Gamma", "Delta", "Epsilon", "Zeta"];
const DAY_MS = 24 * 60 * 60 * 1000;

export const api = () => request(app);

export const as = (user) => ({
  get: (path) => api().get(path).set("Authorization", `Bearer ${user.token}`),
  post: (path, body = {}) =>
    api().post(path).set("Authorization", `Bearer ${user.token}`).send(body),
  patch: (path, body = {}) =>
    api().patch(path).set("Authorization", `Bearer ${user.token}`).send(body),
  delete: (path) =>
    api().delete(path).set("Authorization", `Bearer ${user.token}`),
});

const assertTestDatabase = () => {
  if (!mongoose.connection.name.endsWith("_test")) {
    throw new Error(
      `Refusing to run tests against database "${mongoose.connection.name}"`,
    );
  }
};

export const startDatabase = async () => {
  await connectDB();
  assertTestDatabase();
  await Promise.all(
    Object.values(mongoose.models).map((model) => model.init()),
  );

  const collections = await mongoose.connection.db.collections();
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
};

export const stopDatabase = async () => {
  if (mongoose.connection.readyState === 1) {
    assertTestDatabase();
    await mongoose.connection.dropDatabase();
  }

  await disconnectDB();
};

export const cookieFrom = (response) =>
  (response.headers["set-cookie"] ?? [])
    .map((entry) => entry.split(";")[0])
    .find(
      (entry) =>
        entry.startsWith("refreshToken=") &&
        entry.length > "refreshToken=".length,
    ) ?? null;

export const randomPhone = () => `09${crypto.randomInt(10000000, 100000000)}`;

export const tomorrow = () =>
  new Date(Date.now() + DAY_MS).toISOString().slice(0, 10);

export const registerUser = async (label = "User") => {
  const phone = randomPhone();
  const response = await api()
    .post("/api/auth/register")
    .send({ fullName: `Test ${label}`, phone, password: PASSWORD });

  if (response.status !== 201) {
    throw new Error(
      `Registration failed: ${response.status} ${JSON.stringify(response.body)}`,
    );
  }

  return {
    id: response.body.data.user.id,
    phone,
    token: response.body.data.accessToken,
    cookie: cookieFrom(response),
  };
};

export const createEqub = async ({
  size = 3,
  start = true,
  overrides = {},
} = {}) => {
  const organizer = await registerUser("Organizer");

  const created = await as(organizer).post("/api/groups", {
    name: "Test Equb",
    contributionAmount: 50000,
    frequency: "monthly",
    maxMembers: size,
    startDate: tomorrow(),
    latePenaltyAmount: 5000,
    gracePeriodDays: 2,
    ...overrides,
  });

  if (created.status !== 201) {
    throw new Error(
      `Group creation failed: ${created.status} ${JSON.stringify(created.body)}`,
    );
  }

  const group = created.body.data.group;
  const members = [];

  for (let index = 1; index < size; index += 1) {
    const member = await registerUser(`Member ${MEMBER_NAMES[index - 1]}`);
    const joined = await as(member).post("/api/groups/join", {
      inviteCode: group.inviteCode,
    });

    if (joined.status !== 201) {
      throw new Error(
        `Join failed: ${joined.status} ${JSON.stringify(joined.body)}`,
      );
    }

    members.push(member);
  }

  let cycleIds = [];

  if (start) {
    const started = await as(organizer).post(`/api/groups/${group.id}/start`);

    if (started.status !== 200) {
      throw new Error(
        `Start failed: ${started.status} ${JSON.stringify(started.body)}`,
      );
    }

    const cycles = await as(organizer).get(`/api/groups/${group.id}/cycles`);
    cycleIds = cycles.body.data.cycles.map((cycle) => cycle.id);
  }

  return {
    organizer,
    members,
    everyone: [organizer, ...members],
    group,
    groupId: group.id,
    inviteCode: group.inviteCode,
    cycleIds,
  };
};

export const contributionsOf = async (user, groupId, cycleId) => {
  const response = await as(user).get(
    `/api/groups/${groupId}/contributions?cycleId=${cycleId}&limit=100`,
  );

  return response.body.data.contributions;
};

export const recordAll = async ({
  organizer,
  groupId,
  cycleId,
  method = "cash",
}) => {
  const contributions = await contributionsOf(organizer, groupId, cycleId);

  for (const contribution of contributions) {
    const response = await as(organizer).post(
      `/api/groups/${groupId}/contributions/${contribution.id}/pay`,
      { paymentMethod: method },
    );

    if (response.status !== 200) {
      throw new Error(
        `Recording failed: ${response.status} ${JSON.stringify(response.body)}`,
      );
    }
  }
};
