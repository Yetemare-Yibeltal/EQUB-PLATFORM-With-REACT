const base = process.env.API_URL || "http://localhost:5000/api";
const phone = `09${Math.floor(10000000 + Math.random() * 89999999)}`;
const password = "Secret123";

const call = async (method, path, { body, token, cookie } = {}) => {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (cookie) headers.Cookie = cookie;

  const response = await fetch(`${base}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await response.json().catch(() => ({}));
  const refreshCookie = response.headers
    .getSetCookie()
    .map((entry) => entry.split(";")[0])
    .find(
      (entry) =>
        entry.startsWith("refreshToken=") &&
        entry.length > "refreshToken=".length,
    );

  return { status: response.status, json, refreshCookie };
};

let failures = 0;

const check = (name, actual, expected) => {
  const passed = actual === expected;
  if (!passed) failures += 1;
  console.log(
    `${passed ? "PASS" : "FAIL"}  ${name} (expected ${expected}, got ${actual})`,
  );
};

const run = async () => {
  const health = await call("GET", "/health");
  check("health", health.status, 200);

  const register = await call("POST", "/auth/register", {
    body: { fullName: "Smoke Tester", phone, password },
  });
  check("register", register.status, 201);

  const duplicate = await call("POST", "/auth/register", {
    body: { fullName: "Smoke Tester", phone, password },
  });
  check("duplicate register rejected", duplicate.status, 409);

  const wrong = await call("POST", "/auth/login", {
    body: { identifier: phone, password: "Wrong123" },
  });
  check("wrong password rejected", wrong.status, 401);

  const login = await call("POST", "/auth/login", {
    body: { identifier: phone, password },
  });
  check("login", login.status, 200);

  const token = login.json.data?.accessToken;
  const firstCookie = login.refreshCookie;

  const me = await call("GET", "/users/me", { token });
  check("profile", me.status, 200);

  const noToken = await call("GET", "/users/me");
  check("profile without token rejected", noToken.status, 401);

  const forbidden = await call("GET", "/users", { token });
  check("user list forbidden for normal user", forbidden.status, 403);

  const refreshed = await call("POST", "/auth/refresh", {
    cookie: firstCookie,
  });
  check("refresh", refreshed.status, 200);

  const replay = await call("POST", "/auth/refresh", { cookie: firstCookie });
  check("refresh token replay rejected", replay.status, 401);

  const revoked = await call("POST", "/auth/refresh", {
    cookie: refreshed.refreshCookie,
  });
  check("sessions revoked after replay", revoked.status, 401);
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
