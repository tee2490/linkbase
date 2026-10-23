import bcrypt from "bcryptjs";
import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { connectToDatabase } from "@/lib/db/connect";
import { UserModel } from "@/lib/db/models/user";
import { env } from "@/lib/env";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { signInSchema } from "@/lib/validation/auth";

const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;
const SIGN_IN_LIMIT = 5;
const SIGN_IN_WINDOW_SECONDS = 15 * 60;

// Compared against when no user matches, so an unknown email takes as long as a
// wrong password and response times don't reveal which emails have accounts.
const DUMMY_PASSWORD_HASH = "$2b$12$2ohlKN9SaDyGjLTS5CLDDuGF0pieLwLNhHFCl7mUBLFPwGdnp69/y";

export class RateLimitedError extends CredentialsSignin {
  code = "rate_limited";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: env.AUTH_SECRET,
  session: { strategy: "jwt", maxAge: SESSION_MAX_AGE_SECONDS },
  pages: { signIn: "/sign-in" },
  providers: [
    Credentials({
      credentials: {
        email: { type: "email" },
        password: { type: "password" },
      },
      // Runs for the sign-in form and for direct POSTs to /api/auth/callback/credentials,
      // so the rate limit lives here rather than only in the Server Action.
      async authorize(credentials, request) {
        const parsed = signInSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const ip = getClientIp(request.headers);
        const { allowed } = await checkRateLimit(
          `sign-in:${ip}:${email}`,
          SIGN_IN_LIMIT,
          SIGN_IN_WINDOW_SECONDS,
        );
        if (!allowed) throw new RateLimitedError();

        await connectToDatabase();
        const user = await UserModel.findOne({ email }).select("+passwordHash").lean();
        const matches = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);
        if (!user || !matches) return null;

        return { id: user._id.toString() };
      },
    }),
  ],
  callbacks: {
    // Keep only the user id in the token; name and email are read from the database.
    jwt({ token }) {
      return { sub: token.sub };
    },
    session({ session, token }) {
      return { expires: session.expires, user: { id: token.sub ?? "" } };
    },
  },
});
