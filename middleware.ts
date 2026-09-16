import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_AUTH_ROUTES = ["/login", "/register", "/verify-otp", "/auth/callback"];
const AUTH_ENTRY_ROUTES = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const token = request.cookies.get("access_token")?.value;
  const pathname = request.nextUrl.pathname;
  const isPublicAuthRoute = PUBLIC_AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
  const isOnboardingRoute = pathname.startsWith("/onboarding");
  const isAuthEntryRoute = AUTH_ENTRY_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (!token && !isPublicAuthRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (token && isAuthEntryRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  if (!token && isOnboardingRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|otf|eot)).*)",
  ],
};
