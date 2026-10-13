import crypto from "node:crypto";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export const INVITE_CODE_LENGTH = 8;

const generateInviteCode = (length = INVITE_CODE_LENGTH) => {
  let code = "";

  for (let index = 0; index < length; index += 1) {
    code += ALPHABET[crypto.randomInt(ALPHABET.length)];
  }

  return code;
};

export const normalizeInviteCode = (value) =>
  String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]/g, "");

export default generateInviteCode;
