import InsightClient from "./insight-client";

export default async function Page({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    await params;
    return <InsightClient />;
}