import { NextResponse, type NextRequest } from "next/server";
import { withAuth } from "next-auth/middleware";
import createIntlMiddleware from "next-intl/middleware";

const locales = ["en", "es"] as const;
const defaultLocale = "es";

// --- next-intl ---
const intlMiddleware = createIntlMiddleware({
  locales: Array.from(locales),
  defaultLocale,
});

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

        if (
          pathname === "/es" ||
          pathname === "/en" ||
          pathname.startsWith("/es/signup") ||
          pathname.startsWith("/en/signup")
        ) {
          return true;
        }

        return !!token;
      },
    },
  }
);

export const config = {
  matcher: ["/((?!_next|.*\\..*|api).*)"],
};
