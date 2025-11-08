// src/app/[locale]/detail/[id]/page.tsx
import DetailClient from "./detail-client";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  return <DetailClient id={id} />;
}
