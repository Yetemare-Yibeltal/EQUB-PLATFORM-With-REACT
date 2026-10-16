import mongoose from "mongoose";
import { describe, expect, test } from "@jest/globals";
import Group from "../../src/models/Group.js";
import generateInviteCode, {
  normalizeInviteCode,
} from "../../src/utils/generateInviteCode.js";

const validGroup = () => ({
  name: "Neighbors Equb",
  contributionAmount: 50000,
  frequency: "monthly",
  maxMembers: 5,
  startDate: new Date("2026-12-01"),
  inviteCode: "ABCD2345",
  createdBy: new mongoose.Types.ObjectId(),
});

describe("invite codes", () => {
  test("generates eight characters from the unambiguous alphabet", () => {
    expect(generateInviteCode()).toMatch(
      /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$/,
    );
  });

  test("honors a custom length", () => {
    expect(generateInviteCode(12)).toHaveLength(12);
  });

  test("generates distinct codes", () => {
    const codes = new Set(
      Array.from({ length: 1000 }, () => generateInviteCode()),
    );

    expect(codes.size).toBe(1000);
  });

  test("normalizes user input", () => {
    expect(normalizeInviteCode(" ab-cd 23 ")).toBe("ABCD23");
    expect(normalizeInviteCode(null)).toBe("");
    expect(normalizeInviteCode(undefined)).toBe("");
  });
});

describe("group model", () => {
  test("accepts a valid group", () => {
    expect(new Group(validGroup()).validateSync()).toBeUndefined();
  });

  test("applies defaults", () => {
    const group = new Group(validGroup());

    expect(group.status).toBe("open");
    expect(group.memberCount).toBe(0);
    expect(group.requireApproval).toBe(false);
    expect(group.latePenaltyAmount).toBe(0);
    expect(group.gracePeriodDays).toBe(0);
    expect(group.payoutOrderMethod).toBe("random_draw");
  });

  test("reports every invalid field", () => {
    const error = new Group({
      name: "ab",
      contributionAmount: 50,
      frequency: "daily",
      maxMembers: 1,
    }).validateSync();

    expect(Object.keys(error.errors)).toEqual(
      expect.arrayContaining([
        "name",
        "contributionAmount",
        "frequency",
        "maxMembers",
        "startDate",
        "inviteCode",
        "createdBy",
      ]),
    );
  });

  test("rejects fractional money", () => {
    const error = new Group({
      ...validGroup(),
      contributionAmount: 100.5,
    }).validateSync();

    expect(error.errors.contributionAmount).toBeDefined();
  });

  test("rejects more than one hundred members", () => {
    const error = new Group({
      ...validGroup(),
      maxMembers: 101,
    }).validateSync();

    expect(error.errors.maxMembers).toBeDefined();
  });

  test("computes the pot from the member count", () => {
    const group = new Group({ ...validGroup(), memberCount: 4 });

    expect(group.potAmount).toBe(200000);
  });

  test("computes remaining spots and fullness", () => {
    const open = new Group({ ...validGroup(), memberCount: 3 });
    const full = new Group({ ...validGroup(), memberCount: 5 });

    expect(open.spotsLeft).toBe(2);
    expect(open.isFull).toBe(false);
    expect(full.spotsLeft).toBe(0);
    expect(full.isFull).toBe(true);
  });

  test("keeps the id in JSON output", () => {
    const group = new Group(validGroup());
    const json = group.toJSON();

    expect(json.id).toBe(String(group._id));
    expect(json._id).toBeUndefined();
    expect(json.potAmount).toBe(0);
  });
});
