import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const rateLimitSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    count: { type: Number, required: true, min: 0 },
    // MongoDB's TTL monitor deletes the document once this time passes.
    expiresAt: { type: Date, required: true, expires: 0 },
  },
  { strict: true },
);

export type RateLimit = InferSchemaType<typeof rateLimitSchema>;
export const RateLimitModel: Model<RateLimit> =
  models.RateLimit ?? model("RateLimit", rateLimitSchema);
