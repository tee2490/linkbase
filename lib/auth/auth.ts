import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { authConfig } from "@/lib/auth/auth.config";
import { getDummyPasswordHash, verifyPassword } from "@/lib/auth/password";
import { connectDb } from "@/lib/db/connect";
import { UserModel } from "@/lib/db/models/user";
import { getClientIp, rateLimit } from "@/lib/rate-limit/rate-limit";
import { signInSchema } from "@/lib/validation/auth";

export const SIGN_IN_RATE_LIMITED = "rate_limited";

const SIGN_IN_LIMIT = 10;
const SIGN_IN_WINDOW_MS = 15 * 60 * 1000;

class SignInRateLimited extends CredentialsSignin {
  code = SIGN_IN_RATE_LIMITED;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      // Covers both our sign-in action and direct POSTs to /api/auth/callback/credentials.
      async authorize(credentials, request) {
        const { allowed } = await rateLimit(
          `sign-in:${getClientIp(request.headers)}`,
          SIGN_IN_LIMIT,
          SIGN_IN_WINDOW_MS,
        );
        if (!allowed) throw new SignInRateLimited();

        const parsed = signInSchema.safeParse(credentials);
        if (!parsed.success) return null;

        await connectDb();
        const user = await UserModel.findOne({ email: parsed.data.email })
          .select("+passwordHash")
          .lean();

        const valid = await verifyPassword(
          parsed.data.password,
          user?.passwordHash ?? (await getDummyPasswordHash()),
        );
        if (!user || !valid) return null;

        return { id: user._id.toString() };
      },
    }),
  ],
});
