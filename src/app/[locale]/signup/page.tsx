// src/app/[locale]/signup/page.tsx
import SignupClient from "./signup-client";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  // Next quiere que esperes los params en rutas dinámicas
  await params;
  return <SignupClient />;
}
