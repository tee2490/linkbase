import "server-only";

import { headers } from "next/headers";

import { connectToDatabase } from "@/lib/db/connect";
import { RateLimitModel } from "@/lib/db/models/rate-limit";

const DUPLICATE_KEY = 11000;

type RateLimitResult = { allowed: boolean };

// Fixed-window counter in MongoDB, shared by every server instance (see docs/security.md).
// One pipeline update increments the count, or starts a new window when the old one
// has expired, so concurrent requests can't both slip under the limit.
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  await connectToDatabase();
  const now = new Date();
  const windowEnd = new Date(now.getTime() + windowSeconds * 1000);
  const isActive = { $gt: ["$expiresAt", now] };

  const increment = () =>
    RateLimitModel.findOneAndUpdate(
      { key },
      [
        {
          $set: {
            count: { $cond: [isActive, { $add: ["$count", 1] }, 1] },
            expiresAt: { $cond: [isActive, "$expiresAt", windowEnd] },
          },
        },
      ],
      { upsert: true, returnDocument: "after", updatePipeline: true },
    ).lean();

  let entry;
  try {
    entry = await increment();
  } catch (error) {
    // Two first requests for a new key can race on the upsert. The loser retries
    // and finds the document the winner created.
    if (isMongoError(error) && error.code === DUPLICATE_KEY) {
      entry = await increment();
    } else {
      throw new Error(`Rate limit check failed for ${key.split(":")[0]}`, { cause: error });
    }
  }

  return { allowed: (entry?.count ?? 0) <= limit };
}

function isMongoError(error: unknown): error is { code: number } {
  return typeof error === "object" && error !== null && "code" in error;
}

// Trusts x-forwarded-for, which is only safe behind a proxy that sets it
// (Vercel or a reverse proxy). The first entry is the original client.
export function getClientIp(source: Headers) {
  const forwarded = source.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || source.get("x-real-ip") || "unknown";
}

export async function getRequestIp() {
  return getClientIp(await headers());
}
