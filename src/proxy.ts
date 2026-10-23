import { auth } from "@/lib/auth/config";

// Every route not listed here requires a session (see docs/routing.md "Protection").
const PUBLIC_PATHS = [
  /^\/$/,
  /^\/user\/[^/]+$/,
  /^\/sign-in$/,
  /^\/sign-up$/,
  /^\/api\/auth\//,
  /^\/api\/webhooks\//, // no session; handlers verify signatures
];

// Signed-in users have no reason to see these, so they go straight to the dashboard.
const GUEST_ONLY_PATHS = [/^\/sign-in$/, /^\/sign-up$/];

export default auth((req) => {
  const { pathname, search } = req.nextUrl;

  if (req.auth && GUEST_ONLY_PATHS.some((re) => re.test(pathname))) {
    return Response.redirect(new URL("/dashboard", req.nextUrl.origin));
  }
  if (PUBLIC_PATHS.some((re) => re.test(pathname))) return;

  if (!req.auth) {
    const signIn = new URL("/sign-in", req.nextUrl.origin);
    signIn.searchParams.set("callbackUrl", pathname + search);
    return Response.redirect(signIn);
  }
});

export const config = {
  // Skip static files and image optimization
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|svg|webp|ico)$).*)"],
};
