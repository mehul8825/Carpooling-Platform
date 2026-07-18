import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "carpooling-super-secret-key-12345"
);

const protectedPaths = ["/offer-ride", "/find-ride"];

export async function middleware(request: NextRequest) {
  const session = request.cookies.get("session")?.value;
  const { pathname } = request.nextUrl;

  // Protect routes that require auth
  if (protectedPaths.some((p) => pathname.startsWith(p))) {
    if (!session) {
      return NextResponse.redirect(new URL("/auth/signin", request.url));
    }
    try {
      await jwtVerify(session, SECRET);
      return NextResponse.next();
    } catch {
      return NextResponse.redirect(new URL("/auth/signin", request.url));
    }
  }

  // Redirect authenticated users away from auth pages
  if (pathname.startsWith("/auth")) {
    if (session) {
      try {
        await jwtVerify(session, SECRET);
        return NextResponse.redirect(new URL("/", request.url));
      } catch {
        // Token is invalid, allow access to auth pages
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/offer-ride/:path*", "/find-ride/:path*", "/auth/:path*"],
};
