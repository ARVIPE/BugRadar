// [Updated file: src/middleware.ts]
import { withAuth, NextRequestWithAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(request: NextRequestWithAuth) {
    const { pathname } = request.nextUrl;
    const { token } = request.nextauth;

    // If logged in and trying to access root or signup, redirect to projects
    if (token && (pathname === "/" || pathname === "/signup")) {
      return NextResponse.redirect(new URL("/projects", request.url));
    }

    // New Rule: If trying to access dashboard, check for a project cookie/header
    // For simplicity, we'll just redirect to /projects if they hit dashboard directly.
    // The /projects page will be responsible for setting the selection.
    if (token && pathname.startsWith("/dashboard")) {
      // A real app would check localStorage, but middleware can't.
      // So we'll let the dashboard page itself handle the redirect
      // if it finds no project is selected. This is simpler.
    }
  },
  {
    pages: {
      signIn: "/", 
    },
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  // Update matcher to protect the new /projects route as well
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|signup).*)",
    "/dashboard/:path*",
    "/settings/:path*",
    "/projects/:path*", // Protect this new page
  ],
};