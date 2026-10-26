import "server-only";

import { connectDb } from "@/lib/db/connect";
import { isDuplicateKeyError } from "@/lib/db/errors";
import { RateLimitModel } from "@/lib/db/models/rate-limit";

type RateLimitResult = {
  allowed: boolean;
  retryAfterMs: number;
};

// Fixed window, one atomic upsert per call (docs/security.md).
export async function rateLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStart = Math.floor(now / windowMs) * windowMs;
  const windowKey = `${key}:${windowStart}`;
  const expiresAt = new Date(windowStart + windowMs);

  await connectDb();

  const increment = () =>
    RateLimitModel.findOneAndUpdate(
      { key: windowKey },
      { $inc: { count: 1 }, $setOnInsert: { expiresAt } },
      { upsert: true, returnDocument: "after", lean: true },
    );

  let doc;
  try {
    doc = await increment();
  } catch (err) {
    // Two concurrent upserts can race on the unique key. The loser retries and updates.
    if (!isDuplicateKeyError(err, "key")) throw err;
    doc = await increment();
  }

  const count = doc?.count ?? 1;
  return { allowed: count <= limit, retryAfterMs: windowStart + windowMs - now };
}

// The hosting platform sets x-forwarded-for. Its first entry is the client.
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip")?.trim() || "unknown";
}
