// src/app/[locale]/dashboard/page.tsx
import DashboardClient from "./dashboard-client";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await params;
  return <DashboardClient />;
}
