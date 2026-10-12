import bcrypt from "bcryptjs";
import config from "../config/env.js";

export const hashPassword = (plainPassword) =>
  bcrypt.hash(plainPassword, config.security.bcryptSaltRounds);

export const comparePassword = (plainPassword, passwordHash) =>
  bcrypt.compare(plainPassword, passwordHash);
