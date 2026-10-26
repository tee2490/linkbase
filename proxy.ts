import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import { authConfig } from "@/lib/auth/auth.config";

const { auth } = NextAuth(authConfig);

// Protected by default: only these paths are reachable without a session (docs/auth.md).
const publicPaths = [
  /^\/$/,
  /^\/sign-in$/,
  /^\/sign-up$/,
  /^\/user\/[^/]+$/,
  /^\/api\/auth\//,
  /^\/api\/webhooks\//,
];

const authPages = new Set(["/sign-in", "/sign-up"]);
const sessionCookies = ["authjs.session-token", "__Secure-authjs.session-token"];

export const proxy = auth((req) => {
  const { pathname, search, origin, searchParams } = req.nextUrl;

  // A session whose user no longer exists. Clear it instead of bouncing back to /dashboard,
  // which would loop between /dashboard and /sign-in.
  if (pathname === "/sign-in" && searchParams.get("session") === "expired") {
    const response = NextResponse.next();
    for (const name of sessionCookies) response.cookies.delete(name);
    return response;
  }

  if (req.auth && authPages.has(pathname)) {
    return Response.redirect(new URL("/dashboard", origin));
  }

  const isPublic = publicPaths.some((path) => path.test(pathname));
  if (!req.auth && !isPublic) {
    const signInUrl = new URL("/sign-in", origin);
    signInUrl.searchParams.set("callbackUrl", `${pathname}${search}`);
    return Response.redirect(signInUrl);
  }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
