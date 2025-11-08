// src/app/[locale]/signup/page.tsx
import SignupClient from "./signup-client";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await params;
  return <SignupClient />;
}
