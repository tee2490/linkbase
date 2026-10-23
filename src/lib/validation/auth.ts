import { z } from "zod";

// bcrypt only uses the first 72 bytes of a password, so longer ones are rejected
// instead of being silently truncated.
const MAX_PASSWORD_BYTES = 72;

function fitsBcrypt(value: string) {
  return new TextEncoder().encode(value).length <= MAX_PASSWORD_BYTES;
}

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Enter a valid email address").max(254, "Enter a shorter email address"));

export const signInSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(1, "Enter your password")
    .refine(fitsBcrypt, "Email or password is incorrect"),
});

export const signUpSchema = z
  .object({
    email: emailSchema,
    password: z
      .string()
      .min(8, "Use at least 8 characters")
      .refine(fitsBcrypt, "Use a shorter password (72 bytes at most)"),
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: "Passwords don't match",
    path: ["confirmPassword"],
    // Still check the match when only the email is invalid, so all errors show at once.
    when: ({ issues }) =>
      issues.every((issue) => issue.path?.[0] !== "password" && issue.path?.[0] !== "confirmPassword"),
  });

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;

export const DEFAULT_REDIRECT = "/dashboard";

// Only same-site relative paths. "//evil.com" and "/\evil.com" are protocol-relative
// URLs that browsers send off-site, so they're rejected too.
export function safeCallbackUrl(value: unknown) {
  if (typeof value !== "string") return DEFAULT_REDIRECT;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return DEFAULT_REDIRECT;
  }
  return value;
}
