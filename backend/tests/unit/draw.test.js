import { describe, expect, test } from "@jest/globals";
import {
  generateSeed,
  selectIndex,
  verifySelection,
} from "../../src/utils/draw.js";

const participantIds = ["aaa", "bbb", "ccc", "ddd"];
const cycleId = "cycle-1";

describe("draw selection", () => {
  test("generates a 64 character hexadecimal seed", () => {
    expect(generateSeed()).toMatch(/^[a-f0-9]{64}$/);
    expect(generateSeed()).not.toBe(generateSeed());
  });

  test("is deterministic for the same inputs", () => {
    const seed = generateSeed();
    const first = selectIndex({
      method: "random_draw",
      seed,
      cycleId,
      participantIds,
    });
    const second = selectIndex({
      method: "random_draw",
      seed,
      cycleId,
      participantIds,
    });

    expect(first).toBe(second);
  });

  test("always returns an index inside the participant list", () => {
    for (let run = 0; run < 100; run += 1) {
      const index = selectIndex({
        method: "random_draw",
        seed: generateSeed(),
        cycleId,
        participantIds,
      });

      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(participantIds.length);
    }
  });

  test("can select every participant across many seeds", () => {
    const seen = new Set();

    for (let run = 0; run < 300; run += 1) {
      seen.add(
        selectIndex({
          method: "random_draw",
          seed: generateSeed(),
          cycleId,
          participantIds: ["a", "b", "c"],
        }),
      );
    }

    expect(seen.size).toBe(3);
  });

  test("picks the only participant", () => {
    expect(
      selectIndex({
        method: "random_draw",
        seed: "x",
        cycleId,
        participantIds: ["solo"],
      }),
    ).toBe(0);
  });

  test("fixed order always picks the first participant", () => {
    expect(
      selectIndex({
        method: "fixed_order",
        seed: null,
        cycleId,
        participantIds,
      }),
    ).toBe(0);
  });

  test("rejects an empty participant list", () => {
    expect(() =>
      selectIndex({
        method: "random_draw",
        seed: "x",
        cycleId,
        participantIds: [],
      }),
    ).toThrow();
  });

  test("verifies the genuine winner", () => {
    const seed = generateSeed();
    const index = selectIndex({
      method: "random_draw",
      seed,
      cycleId,
      participantIds,
    });

    expect(
      verifySelection({
        method: "random_draw",
        seed,
        cycleId,
        participantIds,
        winnerId: participantIds[index],
      }),
    ).toBe(true);
  });

  test("rejects a different winner", () => {
    const seed = generateSeed();
    const index = selectIndex({
      method: "random_draw",
      seed,
      cycleId,
      participantIds,
    });
    const other = participantIds[(index + 1) % participantIds.length];

    expect(
      verifySelection({
        method: "random_draw",
        seed,
        cycleId,
        participantIds,
        winnerId: other,
      }),
    ).toBe(false);
  });

  test("rejects a random draw without a seed", () => {
    expect(
      verifySelection({
        method: "random_draw",
        seed: null,
        cycleId,
        participantIds,
        winnerId: participantIds[0],
      }),
    ).toBe(false);
  });

  test("rejects an empty participant list", () => {
    expect(
      verifySelection({
        method: "random_draw",
        seed: "x",
        cycleId,
        participantIds: [],
        winnerId: "aaa",
      }),
    ).toBe(false);
  });

  test("verifies a fixed order winner", () => {
    expect(
      verifySelection({
        method: "fixed_order",
        seed: null,
        cycleId,
        participantIds,
        winnerId: participantIds[0],
      }),
    ).toBe(true);
  });
});
