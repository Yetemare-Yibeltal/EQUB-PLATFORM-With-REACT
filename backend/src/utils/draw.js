import crypto from "node:crypto";
import { PAYOUT_ORDER_METHODS } from "../constants/payoutOrderMethods.js";

export const generateSeed = () => crypto.randomBytes(32).toString("hex");

const digest = (seed, cycleId, participantIds) =>
  crypto
    .createHash("sha256")
    .update(`${seed}:${cycleId}:${participantIds.join(",")}`)
    .digest("hex");

export const selectIndex = ({ method, seed, cycleId, participantIds }) => {
  if (participantIds.length === 0) {
    throw new Error("A draw needs at least one participant");
  }

  if (method === PAYOUT_ORDER_METHODS.FIXED_ORDER) {
    return 0;
  }

  const value = BigInt(`0x${digest(seed, cycleId, participantIds)}`);

  return Number(value % BigInt(participantIds.length));
};

export const verifySelection = ({
  method,
  seed,
  cycleId,
  participantIds,
  winnerId,
}) => {
  if (participantIds.length === 0) return false;
  if (method === PAYOUT_ORDER_METHODS.RANDOM_DRAW && !seed) return false;

  const index = selectIndex({ method, seed, cycleId, participantIds });

  return participantIds[index] === winnerId;
};
