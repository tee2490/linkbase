import { describe, expect, it } from "vitest";

import { getDummyPasswordHash, hashPassword, verifyPassword } from "./password";

describe("hashPassword", () => {
  it("stores the scheme, parameters, salt and hash", async () => {
    const stored = await hashPassword("trail2026");
    const parts = stored.split("$");
    expect(parts).toHaveLength(6);
    expect(parts.slice(0, 4)).toEqual(["scrypt", "32768", "8", "1"]);
    expect(Buffer.from(parts[4] ?? "", "base64")).toHaveLength(16);
    expect(Buffer.from(parts[5] ?? "", "base64")).toHaveLength(64);
  });

  it("never stores the password itself", async () => {
    const stored = await hashPassword("trail2026");
    expect(stored).not.toContain("trail2026");
  });

  it("uses a new salt every time", async () => {
    const [first, second] = await Promise.all([hashPassword("trail2026"), hashPassword("trail2026")]);
    expect(first).not.toBe(second);
  });
});

describe("verifyPassword", () => {
  it("accepts the password the hash was made from", async () => {
    const stored = await hashPassword("trail2026");
    expect(await verifyPassword("trail2026", stored)).toBe(true);
  });

  it("rejects a different password", async () => {
    const stored = await hashPassword("trail2026");
    expect(await verifyPassword("trail2027", stored)).toBe(false);
    expect(await verifyPassword("Trail2026", stored)).toBe(false);
    expect(await verifyPassword("", stored)).toBe(false);
  });

  it("rejects a hash that belongs to another password", async () => {
    const stored = await hashPassword("trail2026");
    const other = await hashPassword("coach2026");
    const parts = stored.split("$");
    const tampered = [...parts.slice(0, 5), other.split("$")[5]].join("$");
    expect(await verifyPassword("trail2026", tampered)).toBe(false);
  });

  it("rejects stored values in another format", async () => {
    expect(await verifyPassword("trail2026", "")).toBe(false);
    expect(await verifyPassword("trail2026", "trail2026")).toBe(false);
    expect(await verifyPassword("trail2026", "$2b$10$abcdefghijklmnopqrstuv")).toBe(false);
    expect(await verifyPassword("trail2026", "scrypt$32768$8$1$c2FsdA==")).toBe(false);
  });

  it("rejects stored values with invalid parameters", async () => {
    const stored = await hashPassword("trail2026");
    const [, , r, p, salt, hash] = stored.split("$");
    expect(await verifyPassword("trail2026", ["scrypt", "abc", r, p, salt, hash].join("$"))).toBe(false);
    expect(await verifyPassword("trail2026", ["scrypt", "0", r, p, salt, hash].join("$"))).toBe(false);
    expect(await verifyPassword("trail2026", ["scrypt", "-32768", r, p, salt, hash].join("$"))).toBe(false);
  });
});

describe("getDummyPasswordHash", () => {
  it("returns a well-formed hash that no ordinary password matches", async () => {
    const dummy = await getDummyPasswordHash();
    expect(dummy.startsWith("scrypt$32768$8$1$")).toBe(true);
    expect(await verifyPassword("trail2026", dummy)).toBe(false);
    expect(await verifyPassword("", dummy)).toBe(false);
  });
});
