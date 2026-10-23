import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

import { HANDLE_MAX_LENGTH, HANDLE_MIN_LENGTH, HANDLE_PATTERN } from "@/lib/validation/handle";

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    // Never returned unless a query asks for it with .select("+passwordHash").
    passwordHash: { type: String, required: true, select: false },
    displayName: { type: String, required: true, trim: true, maxlength: 50 },
    // Claimed during onboarding, so new users don't have one yet.
    handle: {
      type: String,
      lowercase: true,
      trim: true,
      minlength: HANDLE_MIN_LENGTH,
      maxlength: HANDLE_MAX_LENGTH,
      match: HANDLE_PATTERN,
    },
  },
  { strict: true, timestamps: true },
);

// Serves /user/[handle] lookups. Unique only among users that have a handle, so
// users who haven't finished onboarding don't collide.
userSchema.index(
  { handle: 1 },
  { unique: true, partialFilterExpression: { handle: { $type: "string" } } },
);

export type User = InferSchemaType<typeof userSchema>;
export const UserModel: Model<User> = models.User ?? model("User", userSchema);
