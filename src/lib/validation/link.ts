import { z } from "zod";

export const LINK_TITLE_MAX_LENGTH = 100;
export const LINK_URL_MAX_LENGTH = 2048;

const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

export const linkInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Enter a title")
    .max(LINK_TITLE_MAX_LENGTH, `Keep it under ${LINK_TITLE_MAX_LENGTH} characters`),
  // http(s) only, so javascript:, data: and other runnable schemes never get saved.
  url: z
    .string()
    .trim()
    .min(1, "Enter a URL")
    .max(LINK_URL_MAX_LENGTH, "That URL is too long")
    .pipe(z.url({ protocol: /^https?$/, error: "Enter a valid http(s) URL" })),
});

export const linkIdSchema = z.string().regex(OBJECT_ID_PATTERN, "Link not found");

export const updateLinkSchema = linkInputSchema.extend({ linkId: linkIdSchema });

export type LinkInput = z.infer<typeof linkInputSchema>;
export type UpdateLinkInput = z.infer<typeof updateLinkSchema>;
