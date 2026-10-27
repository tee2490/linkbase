import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

import { LINK_TITLE_MAX_LENGTH, LINK_URL_MAX_LENGTH } from "@/lib/validation/link";

const linkSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: LINK_TITLE_MAX_LENGTH },
    url: { type: String, required: true, trim: true, maxlength: LINK_URL_MAX_LENGTH },
  },
  { strict: true, timestamps: true },
);

export type Link = InferSchemaType<typeof linkSchema>;
export const LinkModel = (models.Link as Model<Link> | undefined) ?? model<Link>("Link", linkSchema);
