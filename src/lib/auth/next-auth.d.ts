import "next-auth";

declare module "next-auth" {
  // The session carries only the user's id (see docs/auth.md "Session contents").
  interface Session {
    user: { id: string };
  }
}
