import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

import { HANDLE_MAX_LENGTH, HANDLE_MIN_LENGTH, HANDLE_PATTERN } from "@/lib/validation/handle";

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    passwordHash: { type: String, required: true, select: false },
    // Chosen after sign-up. Sparse, so any number of users can have no handle yet: leave it
    // unset, never null. The unique index is also the /user/[handle] lookup index.
    handle: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      minlength: HANDLE_MIN_LENGTH,
      maxlength: HANDLE_MAX_LENGTH,
      match: HANDLE_PATTERN,
    },
  },
  { strict: true, timestamps: true },
);

export type User = InferSchemaType<typeof userSchema>;
export const UserModel = (models.User as Model<User> | undefined) ?? model<User>("User", userSchema);
