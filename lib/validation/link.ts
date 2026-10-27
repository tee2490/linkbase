import { isValidObjectId } from "mongoose";
import { z } from "zod";

export const LINK_TITLE_MAX_LENGTH = 100;
export const LINK_URL_MAX_LENGTH = 2048;

export const objectIdSchema = z.string({ error: "Invalid id" }).refine(isValidObjectId, "Invalid id");

export const linkInputSchema = z.object({
  title: z
    .string({ error: "Add a title" })
    .trim()
    .min(1, "Add a title")
    .max(LINK_TITLE_MAX_LENGTH, `Keep it under ${LINK_TITLE_MAX_LENGTH} characters`),
  url: z
    .string({ error: "Enter a valid http(s) URL" })
    .trim()
    .max(LINK_URL_MAX_LENGTH, "Keep the URL under 2,048 characters")
    // Never z.url(): it accepts javascript: and data: (docs/security.md).
    .pipe(z.httpUrl("Enter a valid http(s) URL")),
});

export type LinkInput = z.infer<typeof linkInputSchema>;

// Edit uses the same rules as add, so every field stays required.
export const updateLinkSchema = linkInputSchema.extend({ linkId: objectIdSchema });

export type UpdateLinkInput = z.infer<typeof updateLinkSchema>;

export const deleteLinkSchema = z.object({ linkId: objectIdSchema });

export type DeleteLinkInput = z.infer<typeof deleteLinkSchema>;
