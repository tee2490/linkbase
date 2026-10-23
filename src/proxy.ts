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

// Signed-in users have no reason to see these, so they go straight into the app.
const GUEST_ONLY_PATHS = [/^\/sign-in$/, /^\/sign-up$/];

const ONBOARDING_PATH = "/onboarding";
const HOME_PATH = "/dashboard";
// Set by Next.js on every Server Action request.
const SERVER_ACTION_HEADER = "next-action";

export default auth((req) => {
  const { pathname, search, origin } = req.nextUrl;
  const user = req.auth?.user;

  if (user && GUEST_ONLY_PATHS.some((re) => re.test(pathname))) {
    return Response.redirect(new URL(user.onboarded ? HOME_PATH : ONBOARDING_PATH, origin));
  }
  if (PUBLIC_PATHS.some((re) => re.test(pathname))) return;

  if (!user) {
    const signIn = new URL("/sign-in", origin);
    signIn.searchParams.set("callbackUrl", pathname + search);
    return Response.redirect(signIn);
  }

  // Until a handle is claimed, every signed-in route leads to onboarding, and
  // once it is, onboarding leads to the dashboard (see docs/auth.md "Onboarding gate").
  // Page loads only: a redirected Server Action POST gets HTML back and crashes the
  // client, and each action checks the database itself (claimHandle redirects).
  if (req.headers.has(SERVER_ACTION_HEADER)) return;
  if (!user.onboarded && pathname !== ONBOARDING_PATH) {
    return Response.redirect(new URL(ONBOARDING_PATH, origin));
  }
  if (user.onboarded && pathname === ONBOARDING_PATH) {
    return Response.redirect(new URL(HOME_PATH, origin));
  }
});

export const config = {
  // Skip static files and image optimization
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|svg|webp|ico)$).*)"],
};
