import { NextResponse, type NextRequest } from "next/server";
import { withAuth } from "next-auth/middleware";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const { locales, defaultLocale } = routing;

// --- next-intl ---
const intlMiddleware = createIntlMiddleware(routing);

// redirect root "/" → "/es"
function baseRedirect(request: NextRequest) {
  const url = new URL(request.url);
  if (url.pathname === "/") {
    return NextResponse.redirect(new URL(`/${defaultLocale}`, request.url));
  }
  return null;
}

export default withAuth(
  function middleware(request) {
    const { pathname } = request.nextUrl;

    // redirect root
    const rootRedirect = baseRedirect(request);
    if (rootRedirect) return rootRedirect;

    // don't intercept API
    if (pathname.startsWith("/api")) {
      return NextResponse.next();
    }

    // i18n
    const intlResponse = intlMiddleware(request);
    if (intlResponse) return intlResponse;

    // extra auth logic
    const token = request.nextauth.token;

    const segments = pathname.split("/");
    const currentLocale = segments[1];
    const locale = locales.includes(currentLocale as (typeof locales)[number])
      ? currentLocale
      : defaultLocale;

    // if logged in and at /{locale} or /{locale}/signup → redirect to /{locale}/projects
    if (
      token &&
      (pathname === `/${locale}` || pathname === `/${locale}/signup`)
    ) {
      return NextResponse.redirect(new URL(`/${locale}/projects`, request.url));
    }

    return NextResponse.next();
  },
  {
    pages: {
      signIn: `/${defaultLocale}`,
    },
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;

        // Allow public access to login and signup pages for all locales
        const isPublic = locales.some(
          (loc) =>
            pathname === `/${loc}` || pathname.startsWith(`/${loc}/signup`),
        );

        if (isPublic) return true;
        return !!token;
      },
    },
  },
);

export const config = {
  matcher: ["/((?!_next|.*\\..*|api).*)"],
};
