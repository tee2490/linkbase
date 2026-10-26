import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    passwordHash: { type: String, required: true, select: false },
    // Chosen after sign-up. Sparse, so any number of users can have no handle yet.
    handle: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
  },
  { strict: true, timestamps: true },
);

export type User = InferSchemaType<typeof userSchema>;
export const UserModel = (models.User as Model<User> | undefined) ?? model<User>("User", userSchema);
