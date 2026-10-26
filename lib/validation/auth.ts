import { z } from "zod";

const emailSchema = z
  .string({ error: "Enter your email" })
  .trim()
  .toLowerCase()
  .max(254, "Use 254 characters or fewer")
  .pipe(z.email("Enter a valid email address"));

export const signInSchema = z.object({
  email: emailSchema,
  // The upper bound stops oversized inputs from making hashing expensive.
  password: z
    .string({ error: "Enter your password" })
    .min(1, "Enter your password")
    .max(1024, "Password is too long"),
});

export type SignInInput = z.infer<typeof signInSchema>;

export const signUpSchema = z
  .object({
    email: emailSchema,
    password: z
      .string({ error: "Create a password" })
      .min(8, "Use at least 8 characters")
      .max(128, "Use 128 characters or fewer")
      .regex(/[A-Za-z]/, "Include at least one letter")
      .regex(/\d/, "Include at least one number"),
    confirmPassword: z.string({ error: "Confirm your password" }).min(1, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type SignUpInput = z.infer<typeof signUpSchema>;
