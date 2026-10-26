import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const rateLimitSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    count: { type: Number, required: true, default: 0 },
    // TTL index: MongoDB deletes each window once it has expired.
    expiresAt: { type: Date, required: true, expires: 0 },
  },
  { strict: true, timestamps: true, collection: "rate_limits" },
);

export type RateLimit = InferSchemaType<typeof rateLimitSchema>;
export const RateLimitModel =
  (models.RateLimit as Model<RateLimit> | undefined) ?? model<RateLimit>("RateLimit", rateLimitSchema);
