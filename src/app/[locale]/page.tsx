// src/app/[locale]/page.tsx
import LoginClient from "./login-client";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  // this is the only thing Next forces me to do here
  await params;
  return <LoginClient />;
}
