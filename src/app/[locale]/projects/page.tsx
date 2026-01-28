// src/app/[locale]/projects/page.tsx
import ProjectsClient from "./projects-client";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await params;
  return <ProjectsClient />;
}
