import { describe, expect, it } from "vitest";

import { safeCallbackUrl } from "./callback-url";

describe("safeCallbackUrl", () => {
  it("keeps a same-origin path with its query string", () => {
    expect(safeCallbackUrl("/dashboard?tab=links")).toBe("/dashboard?tab=links");
  });

  it("keeps the root path", () => {
    expect(safeCallbackUrl("/")).toBe("/");
  });

  it("falls back to /dashboard when there's no value", () => {
    expect(safeCallbackUrl(undefined)).toBe("/dashboard");
    expect(safeCallbackUrl(null)).toBe("/dashboard");
    expect(safeCallbackUrl("")).toBe("/dashboard");
  });

  it("falls back to /dashboard for values that aren't strings", () => {
    expect(safeCallbackUrl(42)).toBe("/dashboard");
    expect(safeCallbackUrl(["/dashboard"])).toBe("/dashboard");
    expect(safeCallbackUrl({ url: "/dashboard" })).toBe("/dashboard");
  });

  it("rejects absolute URLs to other sites", () => {
    expect(safeCallbackUrl("https://evil.example")).toBe("/dashboard");
    expect(safeCallbackUrl("http://evil.example/dashboard")).toBe("/dashboard");
  });

  it("rejects protocol-relative URLs", () => {
    expect(safeCallbackUrl("//evil.example")).toBe("/dashboard");
    expect(safeCallbackUrl("//evil.example/dashboard")).toBe("/dashboard");
  });

  it("rejects a backslash after the leading slash, which browsers treat as another host", () => {
    expect(safeCallbackUrl("/\\evil.example")).toBe("/dashboard");
  });

  it("rejects relative paths and other schemes", () => {
    expect(safeCallbackUrl("dashboard")).toBe("/dashboard");
    expect(safeCallbackUrl("javascript:alert(1)")).toBe("/dashboard");
  });
});
