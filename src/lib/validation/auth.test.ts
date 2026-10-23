import { describe, expect, it } from "vitest";
import { z } from "zod";

import { DEFAULT_REDIRECT, safeCallbackUrl, signInSchema, signUpSchema } from "./auth";

// The field errors exactly as the forms receive them from the Server Actions.
function fieldErrorsOf<T>(result: z.ZodSafeParseResult<T>): Partial<Record<string, string[]>> {
  return result.success ? {} : z.flattenError(result.error).fieldErrors;
}

// 64 + 1 + 189 = 254 characters, the longest address the schema accepts.
function emailOfLength254() {
  return `${"a".repeat(64)}@${"b".repeat(63)}.${"c".repeat(63)}.${"d".repeat(57)}.com`;
}

describe("signInSchema", () => {
  it("accepts an email and password, normalizing the email", () => {
    const result = signInSchema.safeParse({
      email: "  Jane@Example.COM ",
      password: "correct-horse-9",
    });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ email: "jane@example.com", password: "correct-horse-9" });
  });

  it("keeps the password exactly as typed", () => {
    const result = signInSchema.safeParse({ email: "jane@example.com", password: "  Pass word  " });

    expect(result.data?.password).toBe("  Pass word  ");
  });

  it.each(["jane@", "jane", "@example.com", ""])("rejects the email %j", (email) => {
    const result = signInSchema.safeParse({ email, password: "correct-horse-9" });

    expect(fieldErrorsOf(result).email).toEqual(["Enter a valid email address"]);
  });

  it("asks for a password when it's empty", () => {
    const result = signInSchema.safeParse({ email: "jane@example.com", password: "" });

    expect(fieldErrorsOf(result).password).toContain("Enter your password");
  });

  it("rejects a password over 72 bytes with the generic sign-in message", () => {
    const result = signInSchema.safeParse({ email: "jane@example.com", password: "a".repeat(73) });

    expect(fieldErrorsOf(result).password).toEqual(["Email or password is incorrect"]);
  });
});

describe("signUpSchema", () => {
  it("accepts matching passwords and normalizes the email", () => {
    const result = signUpSchema.safeParse({
      email: "  Jane@Example.com ",
      password: "correct-horse-9",
      confirmPassword: "correct-horse-9",
    });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      email: "jane@example.com",
      password: "correct-horse-9",
      confirmPassword: "correct-horse-9",
    });
  });

  it("rejects an invalid email", () => {
    const result = signUpSchema.safeParse({
      email: "jane@",
      password: "correct-horse-9",
      confirmPassword: "correct-horse-9",
    });

    expect(fieldErrorsOf(result)).toEqual({ email: ["Enter a valid email address"] });
  });

  it("accepts a 254-character email", () => {
    const email = emailOfLength254();
    const result = signUpSchema.safeParse({
      email,
      password: "correct-horse-9",
      confirmPassword: "correct-horse-9",
    });

    expect(email).toHaveLength(254);
    expect(result.success).toBe(true);
  });

  it("rejects an email over 254 characters", () => {
    const result = signUpSchema.safeParse({
      email: `a${emailOfLength254()}`,
      password: "correct-horse-9",
      confirmPassword: "correct-horse-9",
    });

    expect(fieldErrorsOf(result).email).toContain("Enter a shorter email address");
  });

  it.each([
    { password: "1234567", valid: false },
    { password: "12345678", valid: true },
  ])("password of $password.length characters is valid: $valid", ({ password, valid }) => {
    const result = signUpSchema.safeParse({
      email: "jane@example.com",
      password,
      confirmPassword: password,
    });

    expect(result.success).toBe(valid);
    if (!valid) expect(fieldErrorsOf(result).password).toEqual(["Use at least 8 characters"]);
  });

  it("accepts a password of exactly 72 bytes", () => {
    const password = "a".repeat(72);
    const result = signUpSchema.safeParse({
      email: "jane@example.com",
      password,
      confirmPassword: password,
    });

    expect(result.success).toBe(true);
  });

  it("counts bytes, not characters, for the 72-byte limit", () => {
    // 37 characters, but "é" is 2 bytes in UTF-8, so 74 bytes.
    const password = "é".repeat(37);
    const result = signUpSchema.safeParse({
      email: "jane@example.com",
      password,
      confirmPassword: password,
    });

    expect(fieldErrorsOf(result).password).toEqual(["Use a shorter password (72 bytes at most)"]);
  });

  it("reports mismatched passwords on confirmPassword", () => {
    const result = signUpSchema.safeParse({
      email: "jane@example.com",
      password: "correct-horse-9",
      confirmPassword: "correct-horse-8",
    });

    expect(fieldErrorsOf(result)).toEqual({ confirmPassword: ["Passwords don't match"] });
  });

  it("asks to confirm the password when it's empty", () => {
    const result = signUpSchema.safeParse({
      email: "jane@example.com",
      password: "correct-horse-9",
      confirmPassword: "",
    });

    expect(fieldErrorsOf(result)).toEqual({ confirmPassword: ["Confirm your password"] });
  });

  it("shows the email error and the mismatch together", () => {
    const result = signUpSchema.safeParse({
      email: "jane@",
      password: "correct-horse-9",
      confirmPassword: "correct-horse-8",
    });

    expect(fieldErrorsOf(result)).toEqual({
      email: ["Enter a valid email address"],
      confirmPassword: ["Passwords don't match"],
    });
  });

  it("skips the mismatch check while the password itself is invalid", () => {
    const result = signUpSchema.safeParse({
      email: "jane@example.com",
      password: "short",
      confirmPassword: "different",
    });

    expect(fieldErrorsOf(result)).toEqual({ password: ["Use at least 8 characters"] });
  });
});

describe("safeCallbackUrl", () => {
  it.each(["/dashboard", "/add-links", "/user/jane?tab=links#top", "/"])(
    "keeps the same-site path %s",
    (value) => {
      expect(safeCallbackUrl(value)).toBe(value);
    },
  );

  it.each([
    "https://evil.com",
    "http://localhost:3000/dashboard",
    "//evil.com",
    "/\\evil.com",
    "javascript:alert(1)",
    "dashboard",
    "",
  ])("falls back to /dashboard for %j", (value) => {
    expect(safeCallbackUrl(value)).toBe(DEFAULT_REDIRECT);
  });

  it.each([undefined, null, 42, ["/dashboard"], { url: "/dashboard" }])(
    "falls back to /dashboard for the non-string %j",
    (value) => {
      expect(safeCallbackUrl(value)).toBe(DEFAULT_REDIRECT);
    },
  );

  it("uses /dashboard as the default redirect", () => {
    expect(DEFAULT_REDIRECT).toBe("/dashboard");
  });
});
