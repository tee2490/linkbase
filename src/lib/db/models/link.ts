import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

import { LINK_TITLE_MAX_LENGTH, LINK_URL_MAX_LENGTH } from "@/lib/validation/link";

const linkSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true, maxlength: LINK_TITLE_MAX_LENGTH },
    url: {
      type: String,
      required: true,
      trim: true,
      maxlength: LINK_URL_MAX_LENGTH,
      match: /^https?:\/\//i,
    },
    // Lowest first. New links take 0 and push the rest down.
    position: { type: Number, required: true, min: 0 },
    // No toggle yet; the public profile will show only visible links.
    visible: { type: Boolean, required: true, default: true },
  },
  { strict: true, timestamps: true },
);

// Serves every scoped read, which filters on userId and sorts by position.
linkSchema.index({ userId: 1, position: 1 });

export type Link = InferSchemaType<typeof linkSchema>;
export const LinkModel: Model<Link> = models.Link ?? model("Link", linkSchema);
