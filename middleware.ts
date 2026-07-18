import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedPaths = ["/offer-ride", "/find-ride", "/employee", "/admin"];

export function middleware(request: NextRequest) {
  const session = request.cookies.get("session_user_id")?.value;
  const { pathname } = request.nextUrl;

  // Protect routes that require auth
  if (protectedPaths.some((p) => pathname.startsWith(p))) {
    if (!session) {
      return NextResponse.redirect(new URL("/auth/signin", request.url));
    }
    return NextResponse.next();
  }

  // Redirect authenticated users away from auth pages
  if (pathname.startsWith("/auth")) {
    if (session) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/offer-ride/:path*", 
    "/find-ride/:path*", 
    "/employee/:path*", 
    "/admin/:path*", 
    "/auth/:path*"
  ],
};
