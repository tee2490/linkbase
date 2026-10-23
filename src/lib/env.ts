import "server-only";

import { z } from "zod";

// A scheme check rather than z.url(): multi-host replica set URIs
// (mongodb://a:27017,b:27017/db) are valid for MongoDB but not for the URL parser.
const envSchema = z.object({
  MONGODB_URI: z
    .string()
    .regex(/^mongodb(\+srv)?:\/\//, "must start with mongodb:// or mongodb+srv://"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // prettifyError lists the failing keys and messages, never the values.
  throw new Error(`Invalid environment variables:\n${z.prettifyError(parsed.error)}`);
}

export const env = parsed.data;
