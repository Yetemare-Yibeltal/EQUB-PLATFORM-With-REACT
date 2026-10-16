import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";
import {
  PASSWORD,
  api,
  as,
  cookieFrom,
  randomPhone,
  registerUser,
  startDatabase,
  stopDatabase,
} from "../helpers.js";

beforeAll(startDatabase);
afterAll(stopDatabase);

describe("registration", () => {
  test("creates an account and sets a refresh cookie", async () => {
    const phone = randomPhone();
    const response = await api()
      .post("/api/auth/register")
      .send({ fullName: "Abebe Kebede", phone, password: PASSWORD });

    expect(response.status).toBe(201);
    expect(response.body.data.accessToken).toEqual(expect.any(String));
    expect(response.body.data.user.phone).toBe(`+251${phone.slice(1)}`);
    expect(response.body.data.user.passwordHash).toBeUndefined();
    expect(cookieFrom(response)).not.toBeNull();
    expect(response.headers["set-cookie"].join(";")).toContain("HttpOnly");
  });

  test("rejects a duplicate phone number", async () => {
    const user = await registerUser("Duplicate");
    const response = await api()
      .post("/api/auth/register")
      .send({
        fullName: "Another Person",
        phone: user.phone,
        password: PASSWORD,
      });

    expect(response.status).toBe(409);
  });

  test("rejects a weak password", async () => {
    const response = await api()
      .post("/api/auth/register")
      .send({
        fullName: "Weak Password",
        phone: randomPhone(),
        password: "short",
      });

    expect(response.status).toBe(400);
    expect(response.body.errors[0].field).toBe("password");
  });

  test("rejects an invalid phone number", async () => {
    const response = await api()
      .post("/api/auth/register")
      .send({ fullName: "Bad Phone", phone: "12345", password: PASSWORD });

    expect(response.status).toBe(400);
  });
});

describe("login", () => {
  test("logs in with the phone number", async () => {
    const user = await registerUser("Login");
    const response = await api()
      .post("/api/auth/login")
      .send({ identifier: user.phone, password: PASSWORD });

    expect(response.status).toBe(200);
    expect(response.body.data.user.id).toBe(user.id);
  });

  test("rejects a wrong password with a generic message", async () => {
    const user = await registerUser("Wrong");
    const response = await api()
      .post("/api/auth/login")
      .send({ identifier: user.phone, password: "Wrong123" });

    expect(response.status).toBe(401);
  });

  test("gives the same response for an unknown account", async () => {
    const response = await api()
      .post("/api/auth/login")
      .send({ identifier: randomPhone(), password: PASSWORD });

    expect(response.status).toBe(401);
  });

  test("locks the account after five failed attempts", async () => {
    const user = await registerUser("Locked");

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const failed = await api()
        .post("/api/auth/login")
        .send({ identifier: user.phone, password: "Wrong123" });

      expect(failed.status).toBe(401);
    }

    const locked = await api()
      .post("/api/auth/login")
      .send({ identifier: user.phone, password: PASSWORD });

    expect(locked.status).toBe(429);
  });
});

describe("profile access", () => {
  test("requires a token", async () => {
    expect((await api().get("/api/users/me")).status).toBe(401);
    expect(
      (await api().get("/api/users/me").set("Authorization", "Bearer invalid"))
        .status,
    ).toBe(401);
  });

  test("returns the profile for a valid token", async () => {
    const user = await registerUser("Profile");
    const response = await as(user).get("/api/users/me");

    expect(response.status).toBe(200);
    expect(response.body.data.user.id).toBe(user.id);
  });

  test("keeps the user list admin only", async () => {
    const user = await registerUser("Plain");

    expect((await as(user).get("/api/users")).status).toBe(403);
  });

  test("updates the profile", async () => {
    const user = await registerUser("Editor");
    const response = await as(user).patch("/api/users/me", {
      fullName: "Edited Name",
      email: "Edited@Example.com",
    });

    expect(response.status).toBe(200);
    expect(response.body.data.user.fullName).toBe("Edited Name");
    expect(response.body.data.user.email).toBe("edited@example.com");
  });
});

describe("refresh tokens", () => {
  test("rotates the token and revokes everything when an old one is replayed", async () => {
    const user = await registerUser("Rotation");

    const first = await api()
      .post("/api/auth/refresh")
      .set("Cookie", user.cookie)
      .send({});
    expect(first.status).toBe(200);

    const newCookie = cookieFrom(first);
    expect(newCookie).not.toBeNull();
    expect(newCookie).not.toBe(user.cookie);

    const replay = await api()
      .post("/api/auth/refresh")
      .set("Cookie", user.cookie)
      .send({});
    expect(replay.status).toBe(401);

    const revoked = await api()
      .post("/api/auth/refresh")
      .set("Cookie", newCookie)
      .send({});
    expect(revoked.status).toBe(401);
  });

  test("rejects a request without a token", async () => {
    expect((await api().post("/api/auth/refresh").send({})).status).toBe(401);
  });

  test("logs out and invalidates the token", async () => {
    const user = await registerUser("Logout");

    expect(
      (await api().post("/api/auth/logout").set("Cookie", user.cookie).send({}))
        .status,
    ).toBe(200);
    expect(
      (
        await api()
          .post("/api/auth/refresh")
          .set("Cookie", user.cookie)
          .send({})
      ).status,
    ).toBe(401);
  });

  test("logs out of every device", async () => {
    const user = await registerUser("Everywhere");

    expect((await as(user).post("/api/auth/logout-all")).status).toBe(200);
    expect(
      (
        await api()
          .post("/api/auth/refresh")
          .set("Cookie", user.cookie)
          .send({})
      ).status,
    ).toBe(401);
  });
});

describe("passwords", () => {
  test("changes the password", async () => {
    const user = await registerUser("Changer");
    const changed = await as(user).post("/api/auth/change-password", {
      currentPassword: PASSWORD,
      newPassword: "NewSecret456",
    });

    expect(changed.status).toBe(200);

    const oldLogin = await api()
      .post("/api/auth/login")
      .send({ identifier: user.phone, password: PASSWORD });
    const newLogin = await api()
      .post("/api/auth/login")
      .send({ identifier: user.phone, password: "NewSecret456" });

    expect(oldLogin.status).toBe(401);
    expect(newLogin.status).toBe(200);
  });

  test("rejects a wrong current password", async () => {
    const user = await registerUser("Careless");
    const response = await as(user).post("/api/auth/change-password", {
      currentPassword: "Wrong123",
      newPassword: "NewSecret456",
    });

    expect(response.status).toBe(400);
  });

  test("rejects reusing the current password", async () => {
    const user = await registerUser("Reuser");
    const response = await as(user).post("/api/auth/change-password", {
      currentPassword: PASSWORD,
      newPassword: PASSWORD,
    });

    expect(response.status).toBe(400);
  });

  test("resets a forgotten password once", async () => {
    const user = await registerUser("Forgetful");

    const forgot = await api()
      .post("/api/auth/forgot-password")
      .send({ identifier: user.phone });
    expect(forgot.status).toBe(200);

    const token = forgot.body.data.resetToken;
    expect(token).toMatch(/^[a-f0-9]{64}$/);

    const reset = await api()
      .post("/api/auth/reset-password")
      .send({ token, newPassword: "Reset12345" });
    expect(reset.status).toBe(200);

    const login = await api()
      .post("/api/auth/login")
      .send({ identifier: user.phone, password: "Reset12345" });
    expect(login.status).toBe(200);

    const reuse = await api()
      .post("/api/auth/reset-password")
      .send({ token, newPassword: "Another12345" });
    expect(reuse.status).toBe(400);
  });

  test("does not reveal whether an account exists", async () => {
    const response = await api()
      .post("/api/auth/forgot-password")
      .send({ identifier: randomPhone() });

    expect(response.status).toBe(200);
    expect(response.body.data).toBeUndefined();
  });
});
