import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";

const PROTECTED_ROUTES = [
  "/dashboard",
  "/interview",
  "/onboarding",
  "/api/sessions",
  "/api/me",
];

const AUTH_ROUTES = ["/login", "/signup"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  // Exclude Vapi webhooks from authentication checks. Vapi calls the
  // custom-llm endpoint at .../turn/chat/completions (it appends the OpenAI
  // path to the configured URL) and sometimes adds a trailing slash.
  const cleanPath = pathname.replace(/\/$/, "");
  const isTurnWebhook =
    cleanPath === "/api/sessions/turn" ||
    (cleanPath.startsWith("/api/sessions/") &&
      (cleanPath.endsWith("/turn") || cleanPath.endsWith("/turn/chat/completions")));
  if (isTurnWebhook) {
    return NextResponse.next();
  }

  if (!isProtected && !isAuthRoute) {
    return NextResponse.next();
  }

  const user = await getCurrentUserFromRequest(req);

  if (isProtected && !user) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
