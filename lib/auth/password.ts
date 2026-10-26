import "server-only";
import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from "node:crypto";

const KEY_LENGTH = 64;
const SALT_BYTES = 16;
const PARAMS = { N: 32768, r: 8, p: 1 } as const;
// N=2^15, r=8 needs 32 MiB, which is exactly Node's default maxmem, so raise it.
const MAX_MEM = 64 * 1024 * 1024;

function deriveKey(password: string, salt: Buffer, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, KEY_LENGTH, { ...options, maxmem: MAX_MEM }, (err, key) => {
      if (err) reject(err);
      else resolve(key);
    });
  });
}

// Stored as scrypt$N$r$p$salt$hash (base64), so parameters can be raised later.
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const key = await deriveKey(password, salt, PARAMS);
  return ["scrypt", PARAMS.N, PARAMS.r, PARAMS.p, salt.toString("base64"), key.toString("base64")].join("$");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, n, r, p, saltB64, hashB64] = stored.split("$");
  if (scheme !== "scrypt" || !saltB64 || !hashB64) return false;

  const options = { N: Number(n), r: Number(r), p: Number(p) };
  if (![options.N, options.r, options.p].every((value) => Number.isInteger(value) && value > 0)) {
    return false;
  }

  const expected = Buffer.from(hashB64, "base64");
  const actual = await deriveKey(password, Buffer.from(saltB64, "base64"), options);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

// Compared against when the email is unknown, so a miss takes as long as a wrong password.
let dummyHash: Promise<string> | undefined;

export function getDummyPasswordHash(): Promise<string> {
  dummyHash ??= hashPassword(randomBytes(32).toString("hex"));
  return dummyHash;
}
