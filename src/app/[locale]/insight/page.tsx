import InsightClient from "./insight-client";

export default async function Page({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    // Next 15 quiere que esperes los params en rutas dinámicas
    await params;
    return <InsightClient />;
}