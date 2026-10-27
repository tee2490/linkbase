import { describe, expect, it } from "vitest";
import { z } from "zod";

import { claimHandleSchema, handleFormatSchema, handleSchema, isReservedHandle } from "./handle";

function messages(result: { error?: z.ZodError }): string[] {
  return result.error ? result.error.issues.map((issue) => issue.message) : [];
}

describe("handleFormatSchema", () => {
  it("accepts lowercase letters, numbers, hyphens and underscores", () => {
    const result = handleFormatSchema.safeParse("maya-runs_2026");
    expect(result.success).toBe(true);
    expect(result.data).toBe("maya-runs_2026");
  });

  it("trims and lowercases the handle", () => {
    const result = handleFormatSchema.safeParse("  Maya_Runs ");
    expect(result.success).toBe(true);
    expect(result.data).toBe("maya_runs");
  });

  it("accepts exactly 3 characters", () => {
    expect(handleFormatSchema.safeParse("abc").success).toBe(true);
  });

  it("accepts exactly 30 characters", () => {
    expect(handleFormatSchema.safeParse("a".repeat(30)).success).toBe(true);
  });

  it("rejects 2 characters", () => {
    const result = handleFormatSchema.safeParse("ab");
    expect(messages(result)).toEqual(["Use at least 3 characters"]);
  });

  it("rejects 31 characters", () => {
    const result = handleFormatSchema.safeParse("a".repeat(31));
    expect(messages(result)).toEqual(["Use 30 characters or fewer"]);
  });

  it("counts length after trimming", () => {
    const result = handleFormatSchema.safeParse("  ab  ");
    expect(messages(result)).toEqual(["Use at least 3 characters"]);
  });

  it.each(["my.name", "maya runs", "maya!", "maya@home", "mäya", "../admin"])(
    "rejects disallowed characters in %j",
    (input) => {
      const result = handleFormatSchema.safeParse(input);
      expect(messages(result)).toContain("Use only lowercase letters, numbers, hyphens and underscores");
    },
  );

  it("asks for a username when the value isn't a string", () => {
    const result = handleFormatSchema.safeParse(42);
    expect(messages(result)).toEqual(["Pick a username"]);
  });

  it("asks for a username when the value is missing", () => {
    const result = handleFormatSchema.safeParse(undefined);
    expect(messages(result)).toEqual(["Pick a username"]);
  });

  it("doesn't reject reserved names on format alone", () => {
    expect(handleFormatSchema.safeParse("admin").success).toBe(true);
  });
});

describe("handleSchema", () => {
  it("accepts a valid, unreserved handle", () => {
    const result = handleSchema.safeParse("mayaruns");
    expect(result.success).toBe(true);
    expect(result.data).toBe("mayaruns");
  });

  it("reports a reserved name as taken", () => {
    const result = handleSchema.safeParse("admin");
    expect(messages(result)).toEqual(["That username is taken"]);
  });

  it("catches a reserved name after trimming and lowercasing", () => {
    const result = handleSchema.safeParse("  LinkBase ");
    expect(messages(result)).toEqual(["That username is taken"]);
  });

  it("still applies the format rules", () => {
    const result = handleSchema.safeParse("ab");
    expect(messages(result)).toEqual(["Use at least 3 characters"]);
  });
});

describe("claimHandleSchema", () => {
  it("accepts form data with a valid handle and normalizes it", () => {
    const result = claimHandleSchema.safeParse({ handle: " Maya-Runs " });
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ handle: "maya-runs" });
  });

  it("drops fields that aren't in the schema", () => {
    const result = claimHandleSchema.safeParse({
      handle: "mayaruns",
      userId: "64b7f0c2a1b2c3d4e5f60718",
    });
    expect(result.data).toEqual({ handle: "mayaruns" });
  });

  it("puts errors on the handle field", () => {
    const result = claimHandleSchema.safeParse({ handle: "my.name" });
    expect(result.success).toBe(false);
    expect(result.error ? z.flattenError(result.error).fieldErrors.handle : undefined).toEqual([
      "Use only lowercase letters, numbers, hyphens and underscores",
    ]);
  });

  it("asks for a username when the field is missing", () => {
    const result = claimHandleSchema.safeParse({});
    expect(result.error ? z.flattenError(result.error).fieldErrors.handle : undefined).toEqual([
      "Pick a username",
    ]);
  });
});

describe("isReservedHandle", () => {
  it.each(["admin", "linkbase", "support", "help", "settings", "api", "dashboard", "onboarding", "sign-in", "sign-up", "user"])(
    "reserves %j",
    (handle) => {
      expect(isReservedHandle(handle)).toBe(true);
    },
  );

  it("doesn't reserve ordinary handles", () => {
    expect(isReservedHandle("mayaruns")).toBe(false);
  });

  it("matches exact names only", () => {
    expect(isReservedHandle("admin1")).toBe(false);
    expect(isReservedHandle("the-admin")).toBe(false);
  });
});
