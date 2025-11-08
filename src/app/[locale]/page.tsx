// src/app/[locale]/page.tsx
import LoginClient from "./login-client";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  // esto es lo único que Next te obliga a hacer aquí
  await params;
  return <LoginClient />;
}
