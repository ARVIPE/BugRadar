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

// redirect raíz "/" → "/es"
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

    // 1. redirect raíz
    const rootRedirect = baseRedirect(request);
    if (rootRedirect) return rootRedirect;

    // 2. no interceptar API
    if (pathname.startsWith("/api")) {
      return NextResponse.next();
    }

    // 3. i18n
    const intlResponse = intlMiddleware(request);
    if (intlResponse) return intlResponse;

    // 4. lógica extra de auth
    const token = request.nextauth.token;

    const segments = pathname.split("/");
    const currentLocale = segments[1];
    const locale =
      locales.includes(currentLocale as (typeof locales)[number])
        ? currentLocale
        : defaultLocale;

    // si está logueado y está en /{locale} o /{locale}/signup → redirige a /{locale}/projects
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
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/((?!_next|.*\\..*|api).*)"],
};
