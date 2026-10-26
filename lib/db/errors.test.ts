import { describe, expect, it } from "vitest";

import { isDuplicateKeyError } from "./errors";

describe("isDuplicateKeyError", () => {
  it("matches a duplicate key on the given field", () => {
    expect(isDuplicateKeyError({ code: 11000, keyPattern: { email: 1 } }, "email")).toBe(true);
  });

  it("matches a MongoServerError-like Error object", () => {
    const err = Object.assign(new Error("E11000 duplicate key error"), {
      code: 11000,
      keyPattern: { handle: 1 },
    });
    expect(isDuplicateKeyError(err, "handle")).toBe(true);
  });

  it("doesn't match a duplicate key on a different field", () => {
    expect(isDuplicateKeyError({ code: 11000, keyPattern: { email: 1 } }, "handle")).toBe(false);
  });

  it("matches when the error doesn't say which key collided", () => {
    expect(isDuplicateKeyError({ code: 11000 }, "email")).toBe(true);
  });

  it("doesn't match other error codes", () => {
    expect(isDuplicateKeyError({ code: 11001, keyPattern: { email: 1 } }, "email")).toBe(false);
    expect(isDuplicateKeyError({ code: "11000", keyPattern: { email: 1 } }, "email")).toBe(false);
  });

  it("doesn't match values that aren't Mongo errors", () => {
    expect(isDuplicateKeyError(null, "email")).toBe(false);
    expect(isDuplicateKeyError(undefined, "email")).toBe(false);
    expect(isDuplicateKeyError("E11000", "email")).toBe(false);
    expect(isDuplicateKeyError(new Error("Database connection failed"), "email")).toBe(false);
  });
});
