import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";
import createIntlMiddleware from "next-intl/middleware";

const locales = ["en", "es"] as const;
const defaultLocale = "es";

// --- next-intl ---
const intlMiddleware = createIntlMiddleware({
  locales: Array.from(locales),
  defaultLocale,
});

// --- redirect raíz "/" → "/es" ---
function baseRedirect(request: Request) {
  const url = new URL(request.url);
  if (url.pathname === "/") {
    return NextResponse.redirect(new URL(`/${defaultLocale}`, request.url));
  }
  return null;
}

// --- auth + i18n combinado ---
const authMiddleware = withAuth(
  function middleware(request) {
    const { pathname } = request.nextUrl;

    // 1. no interceptar API
    if (pathname.startsWith("/api")) {
      return NextResponse.next();
    }

    // 2. next-intl
    const intlResponse = intlMiddleware(request);
    if (intlResponse) return intlResponse;

    // 3. auth
    const token = request.nextauth.token;

    const segments = pathname.split("/");
    const currentLocale = segments[1];
    const locale =
      locales.includes(currentLocale as (typeof locales)[number])
        ? currentLocale
        : defaultLocale;

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

// --- export default ---
// 👇 acepta los dos parámetros esperados por la firma tipada
export default function middleware(request: any, event: any) {
  const rootRedirect = baseRedirect(request);
  if (rootRedirect) return rootRedirect;

  // 👇 Pasamos ambos args
  return authMiddleware(request, event);
}

export const config = {
  matcher: ["/((?!_next|.*\\..*|api).*)"],
};
