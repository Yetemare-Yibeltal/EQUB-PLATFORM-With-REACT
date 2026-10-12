import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import config from "../config/env.js";

const ISSUER = "equb-platform";
const ALGORITHM = "HS256";

export const signAccessToken = (user) =>
  jwt.sign({ role: user.role }, config.jwt.accessSecret, {
    algorithm: ALGORITHM,
    issuer: ISSUER,
    subject: String(user._id),
    expiresIn: config.jwt.accessExpiresIn,
  });

export const signRefreshToken = (user) => {
  const token = jwt.sign({}, config.jwt.refreshSecret, {
    algorithm: ALGORITHM,
    issuer: ISSUER,
    subject: String(user._id),
    jwtid: crypto.randomUUID(),
    expiresIn: config.jwt.refreshExpiresIn,
  });

  const { exp } = jwt.decode(token);

  return { token, expiresAt: new Date(exp * 1000) };
};

export const verifyAccessToken = (token) =>
  jwt.verify(token, config.jwt.accessSecret, {
    algorithms: [ALGORITHM],
    issuer: ISSUER,
  });

export const verifyRefreshToken = (token) =>
  jwt.verify(token, config.jwt.refreshSecret, {
    algorithms: [ALGORITHM],
    issuer: ISSUER,
  });

export const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

export const generateRandomToken = (bytes = 32) =>
  crypto.randomBytes(bytes).toString("hex");
