import { describe, expect, it } from "vitest";

import { handleSchema } from "@/lib/validation/handle";

import { handleSuggestionCandidates } from "./suggest-handles";

describe("handleSuggestionCandidates", () => {
  it("returns the variants in order for a short handle", () => {
    expect(handleSuggestionCandidates("maya")).toEqual([
      "mayahq",
      "themaya",
      "maya_official",
      "maya-links",
      "maya1",
    ]);
  });

  it("only returns valid usernames", () => {
    const candidates = handleSuggestionCandidates("trail-runner_2026");
    expect(candidates.length).toBeGreaterThan(0);
    for (const candidate of candidates) {
      expect(handleSchema.safeParse(candidate).success).toBe(true);
    }
  });

  it("never suggests the handle itself", () => {
    expect(handleSuggestionCandidates("maya")).not.toContain("maya");
  });

  it("drops variants that would go over 30 characters", () => {
    const handle = "a".repeat(27);
    expect(handleSuggestionCandidates(handle)).toEqual([`${handle}hq`, `the${handle}`, `${handle}1`]);
  });

  it("returns nothing for a 30-character handle", () => {
    expect(handleSuggestionCandidates("a".repeat(30))).toEqual([]);
  });

  it("returns nothing for input that can't form a valid username", () => {
    expect(handleSuggestionCandidates("my.name")).toEqual([]);
  });
});
