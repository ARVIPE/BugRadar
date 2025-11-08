// src/middleware.ts
import { NextResponse } from "next/server";
import { withAuth, NextRequestWithAuth } from "next-auth/middleware";
import createIntlMiddleware from "next-intl/middleware";

const locales = ["en", "es"] as const;
const defaultLocale = "es";

// 1. middleware de i18n
const intlMiddleware = createIntlMiddleware({
  locales: Array.from(locales),
  defaultLocale,
});

// 2. export default con auth + nuestra lógica
export default withAuth(
  function middleware(request: NextRequestWithAuth) {
    // --- PRIMERO: i18n ---
    // Esto puede devolver una Response (por ejemplo, redirigir / → /es)
    const intlResponse = intlMiddleware(request);
    if (intlResponse) {
      // OJO: si i18n ya devolvió algo, lo respetamos
      return intlResponse;
    }

    // --- DESPUÉS: tu lógica de auth ---
    const { pathname } = request.nextUrl;
    const { token } = request.nextauth;

    // Sacamos el locale de la URL: /es/... → "es"
    const segments = pathname.split("/");
    const currentLocale = segments[1]; // "" | "es" | "en" | ...
    const locale =
      locales.includes(currentLocale as (typeof locales)[number])
        ? currentLocale
        : defaultLocale;

    // Si está logueado e intenta entrar al root del locale o al signup de ese locale
    // /es  o  /es/signup
    if (token && (pathname === `/${locale}` || pathname === `/${locale}/signup`)) {
      return NextResponse.redirect(new URL(`/${locale}/projects`, request.url));
    }

    // Si está logueado y va al dashboard sin más, tú ya tenías la nota
    // aquí podrías hacer más lógica si quisieras
    if (token && pathname.startsWith(`/${locale}/dashboard`)) {
      // dejamos pasar y que el dashboard decida
    }

    return NextResponse.next();
  },
  {
    // Config de next-auth
    pages: {
      // el login “público” sigue siendo /
      // pero recuerda: i18n lo va a mandar a /es
      signIn: "/", 
    },
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

// 3. matcher
export const config = {
  /*
    Explicación rápida:
    - /((?!_next|.*\\..*).*)  → casi todo
    - pero como usamos locales, realmente nuestras rutas van a ser /es/... o /en/...
    - si tienes APIs públicas o signup sin locale, ajústalo
  */
  matcher: [
    "/((?!_next|.*\\..*).*)",
  ],
};
