import { describe, expect, it } from "vitest";
import { z } from "zod";

import {
  HANDLE_MAX_LENGTH,
  HANDLE_MIN_LENGTH,
  RESERVED_HANDLES,
  claimHandleSchema,
  handleCandidates,
  handleSchema,
} from "./handle";

const TOO_SHORT = "Use at least 3 characters";
const TOO_LONG = "Use 30 characters or fewer";
const BAD_CHARACTERS = "Use only lowercase letters, numbers, hyphens and underscores";
const RESERVED = "That username isn't available";

// Every message the input shows for a value, in the order Zod reports them.
function messagesOf(value: unknown) {
  const result = handleSchema.safeParse(value);
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

describe("handleSchema", () => {
  it.each(["nia", "niabrooks", "nia-brooks", "nia_brooks", "nia_brooks-1", "123", "a-_"])(
    "accepts %j",
    (handle) => {
      const result = handleSchema.safeParse(handle);

      expect(result.success).toBe(true);
      expect(result.data).toBe(handle);
    },
  );

  it("trims and lowercases before validating", () => {
    const result = handleSchema.safeParse("  NiaBrooks ");

    expect(result.success).toBe(true);
    expect(result.data).toBe("niabrooks");
  });

  it("accepts exactly the minimum length", () => {
    expect(handleSchema.safeParse("a".repeat(HANDLE_MIN_LENGTH)).success).toBe(true);
  });

  it("rejects one character under the minimum length", () => {
    expect(messagesOf("a".repeat(HANDLE_MIN_LENGTH - 1))).toEqual([TOO_SHORT]);
  });

  it("measures the length after trimming", () => {
    expect(messagesOf("  ab  ")).toEqual([TOO_SHORT]);
  });

  it("accepts exactly the maximum length", () => {
    expect(handleSchema.safeParse("a".repeat(HANDLE_MAX_LENGTH)).success).toBe(true);
  });

  it("rejects one character over the maximum length", () => {
    expect(messagesOf("a".repeat(HANDLE_MAX_LENGTH + 1))).toEqual([TOO_LONG]);
  });

  it("reports the length problem first for an empty value", () => {
    expect(messagesOf("")[0]).toBe(TOO_SHORT);
  });

  it.each(["nia.brooks", "nia brooks", "nía", "nia!", "nia/brooks", "nia@x", "<script>"])(
    "rejects %j for its characters",
    (handle) => {
      expect(messagesOf(handle)).toContain(BAD_CHARACTERS);
    },
  );

  it("reports every problem at once", () => {
    expect(messagesOf("a!")).toEqual([TOO_SHORT, BAD_CHARACTERS]);
  });

  it.each([...RESERVED_HANDLES])("rejects the reserved name %j", (handle) => {
    expect(messagesOf(handle)).toEqual([RESERVED]);
  });

  it("matches reserved names after normalizing", () => {
    expect(messagesOf(" Admin ")).toEqual([RESERVED]);
  });

  it("allows names that only contain a reserved word", () => {
    expect(handleSchema.safeParse("admin-nia").success).toBe(true);
  });

  it.each([undefined, null, 42, ["nia"]])("rejects the non-string %j", (value) => {
    expect(handleSchema.safeParse(value).success).toBe(false);
  });
});

describe("claimHandleSchema", () => {
  it("returns only the normalized handle", () => {
    const result = claimHandleSchema.safeParse({ handle: " Nia_Brooks ", userId: "someone-else" });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ handle: "nia_brooks" });
  });

  it("puts errors on the handle field, as the form reads them", () => {
    const result = claimHandleSchema.safeParse({ handle: "ab" });

    expect(result.success).toBe(false);
    expect(result.error && z.flattenError(result.error).fieldErrors).toEqual({
      handle: [TOO_SHORT],
    });
  });

  it("rejects a missing handle on the handle field", () => {
    const result = claimHandleSchema.safeParse({});

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["handle"]);
  });
});

describe("handleCandidates", () => {
  it("builds joined, separated, single-word and numbered candidates, best first", () => {
    expect(handleCandidates("Nia Brooks")).toEqual([
      "niabrooks",
      "nia-brooks",
      "nia_brooks",
      "nia",
      "brooks",
      ...Array.from({ length: 12 }, (_, i) => `niabrooks${i + 1}`),
    ]);
  });

  it("splits an email-style display name on punctuation", () => {
    expect(handleCandidates("jane.doe").slice(0, 5)).toEqual([
      "janedoe",
      "jane-doe",
      "jane_doe",
      "jane",
      "doe",
    ]);
  });

  it("strips accents instead of dropping the letters", () => {
    expect(handleCandidates("José Núñez")[0]).toBe("josenunez");
  });

  it("returns no duplicates", () => {
    const candidates = handleCandidates("nia nia");

    expect(new Set(candidates).size).toBe(candidates.length);
    expect(candidates.filter((candidate) => candidate === "nia")).toHaveLength(1);
  });

  it("falls back to a generic base when the name is too short", () => {
    expect(handleCandidates("Al")).toEqual([
      "linker",
      ...Array.from({ length: 12 }, (_, i) => `linker${i + 1}`),
    ]);
  });

  it.each(["", "   ", "!!!", "中文"])("falls back to a generic base for %j", (source) => {
    expect(handleCandidates(source)[0]).toBe("linker");
  });

  it("drops reserved names but keeps numbered variants of them", () => {
    const candidates = handleCandidates("Admin");

    expect(candidates).not.toContain("admin");
    expect(candidates[0]).toBe("admin1");
  });

  it("drops a reserved single word from a longer name", () => {
    const candidates = handleCandidates("Help Desk");

    expect(candidates).not.toContain("help");
    expect(candidates.slice(0, 4)).toEqual(["helpdesk", "help-desk", "help_desk", "desk"]);
  });

  it("keeps long names within the maximum length, numbered ones included", () => {
    const candidates = handleCandidates("a".repeat(40));

    expect(candidates[0]).toBe("a".repeat(HANDLE_MAX_LENGTH));
    expect(candidates).toContain(`${"a".repeat(HANDLE_MAX_LENGTH - 2)}12`);
    for (const candidate of candidates) {
      expect(candidate.length).toBeLessThanOrEqual(HANDLE_MAX_LENGTH);
    }
  });

  it.each(["Nia Brooks", "Al", "", "Admin", "José Núñez", "x".repeat(50), "<script>alert(1)</script>"])(
    "only returns handles that pass handleSchema for %j",
    (source) => {
      for (const candidate of handleCandidates(source)) {
        expect(handleSchema.safeParse(candidate).success).toBe(true);
      }
    },
  );
});
