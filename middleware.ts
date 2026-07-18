import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "carpooling-super-secret-key-12345"
);

export async function middleware(request: NextRequest) {
  const session = request.cookies.get("session")?.value;

  // Protect /offer-ride path
  if (request.nextUrl.pathname.startsWith("/offer-ride")) {
    if (!session) {
      return NextResponse.redirect(new URL("/auth/signin", request.url));
    }

    try {
      await jwtVerify(session, SECRET);
      return NextResponse.next();
    } catch (error) {
      return NextResponse.redirect(new URL("/auth/signin", request.url));
    }
  }

  // Redirect authenticated users away from auth pages
  if (request.nextUrl.pathname.startsWith("/auth")) {
    if (session) {
      try {
        await jwtVerify(session, SECRET);
        return NextResponse.redirect(new URL("/", request.url));
      } catch (error) {
        // Token is invalid, continue to auth pages
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/offer-ride/:path*", "/auth/:path*"],
};
