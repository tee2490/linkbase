import type { NextAuthConfig } from "next-auth";

// Shared by proxy.ts and auth.ts. No database imports here, so the proxy stays light.
export const authConfig = {
  pages: { signIn: "/sign-in" },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    // Only the user id goes into the session (docs/auth.md). Auth.js sets token.sub to it.
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
} satisfies NextAuthConfig;
