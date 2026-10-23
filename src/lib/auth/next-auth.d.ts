import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  // The session carries only the user's id and whether they've claimed a handle
  // (see docs/auth.md "Session contents").
  interface Session {
    user: { id: string; onboarded: boolean };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    onboarded?: boolean;
  }
}
