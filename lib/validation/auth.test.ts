import { describe, expect, it } from "vitest";
import { z } from "zod";

import { signInSchema, signUpSchema } from "./auth";

function fieldErrors(result: { error?: z.ZodError }): Record<string, string[] | undefined> {
  return result.error ? z.flattenError(result.error).fieldErrors : {};
}

describe("signUpSchema", () => {
  it("accepts a valid sign-up and normalizes the email", () => {
    const result = signUpSchema.safeParse({
      email: "  Maya@Example.COM ",
      password: "trail2026",
      confirmPassword: "trail2026",
    });
    expect(result.success).toBe(true);
    expect(result.data?.email).toBe("maya@example.com");
  });

  it("drops fields that aren't in the schema", () => {
    const result = signUpSchema.safeParse({
      email: "maya@example.com",
      password: "trail2026",
      confirmPassword: "trail2026",
      userId: "64b7f0c2a1b2c3d4e5f60718",
      handle: "maya",
    });
    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      email: "maya@example.com",
      password: "trail2026",
      confirmPassword: "trail2026",
    });
  });

  it("asks for an email when it's missing", () => {
    const result = signUpSchema.safeParse({ password: "trail2026", confirmPassword: "trail2026" });
    expect(fieldErrors(result).email).toEqual(["Enter your email"]);
  });

  it("rejects an invalid email", () => {
    const result = signUpSchema.safeParse({
      email: "maya@",
      password: "trail2026",
      confirmPassword: "trail2026",
    });
    expect(fieldErrors(result).email).toEqual(["Enter a valid email address"]);
  });

  it("rejects an email longer than 254 characters", () => {
    const result = signUpSchema.safeParse({
      email: `${"a".repeat(243)}@example.com`,
      password: "trail2026",
      confirmPassword: "trail2026",
    });
    expect(fieldErrors(result).email).toEqual(["Use 254 characters or fewer"]);
  });

  it("accepts a password of exactly 8 characters", () => {
    const result = signUpSchema.safeParse({
      email: "maya@example.com",
      password: "abcdefg1",
      confirmPassword: "abcdefg1",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a password shorter than 8 characters", () => {
    const result = signUpSchema.safeParse({
      email: "maya@example.com",
      password: "abcde1",
      confirmPassword: "abcde1",
    });
    expect(fieldErrors(result).password).toEqual(["Use at least 8 characters"]);
  });

  it("accepts a 128-character password and rejects a 129-character one", () => {
    const ok = `${"a".repeat(127)}1`;
    const tooLong = `${"a".repeat(128)}1`;
    expect(
      signUpSchema.safeParse({ email: "maya@example.com", password: ok, confirmPassword: ok }).success,
    ).toBe(true);

    const result = signUpSchema.safeParse({
      email: "maya@example.com",
      password: tooLong,
      confirmPassword: tooLong,
    });
    expect(fieldErrors(result).password).toEqual(["Use 128 characters or fewer"]);
  });

  it("requires at least one letter", () => {
    const result = signUpSchema.safeParse({
      email: "maya@example.com",
      password: "12345678",
      confirmPassword: "12345678",
    });
    expect(fieldErrors(result).password).toEqual(["Include at least one letter"]);
  });

  it("requires at least one number", () => {
    const result = signUpSchema.safeParse({
      email: "maya@example.com",
      password: "trailrunner",
      confirmPassword: "trailrunner",
    });
    expect(fieldErrors(result).password).toEqual(["Include at least one number"]);
  });

  it("puts a mismatch error on confirmPassword", () => {
    const result = signUpSchema.safeParse({
      email: "maya@example.com",
      password: "trail2026",
      confirmPassword: "trail2027",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path)).toEqual([["confirmPassword"]]);
    expect(fieldErrors(result).confirmPassword).toEqual(["Passwords don't match"]);
  });

  it("asks to confirm the password when the confirmation is empty", () => {
    const result = signUpSchema.safeParse({
      email: "maya@example.com",
      password: "trail2026",
      confirmPassword: "",
    });
    expect(fieldErrors(result).confirmPassword?.[0]).toBe("Confirm your password");
  });
});

describe("signInSchema", () => {
  it("accepts an email and password and normalizes the email", () => {
    const result = signInSchema.safeParse({ email: " Maya@Example.com", password: "trail2026" });
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ email: "maya@example.com", password: "trail2026" });
  });

  it("doesn't apply the sign-up password rules", () => {
    const result = signInSchema.safeParse({ email: "maya@example.com", password: "a" });
    expect(result.success).toBe(true);
  });

  it("asks for a password when it's empty or missing", () => {
    const empty = signInSchema.safeParse({ email: "maya@example.com", password: "" });
    const missing = signInSchema.safeParse({ email: "maya@example.com" });
    expect(fieldErrors(empty).password).toEqual(["Enter your password"]);
    expect(fieldErrors(missing).password).toEqual(["Enter your password"]);
  });

  it("caps the password at 1024 characters", () => {
    const atLimit = signInSchema.safeParse({ email: "maya@example.com", password: "a".repeat(1024) });
    const overLimit = signInSchema.safeParse({ email: "maya@example.com", password: "a".repeat(1025) });
    expect(atLimit.success).toBe(true);
    expect(fieldErrors(overLimit).password).toEqual(["Password is too long"]);
  });

  it("rejects an invalid email", () => {
    const result = signInSchema.safeParse({ email: "not-an-email", password: "trail2026" });
    expect(fieldErrors(result).email).toEqual(["Enter a valid email address"]);
  });
});
