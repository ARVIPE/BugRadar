import StatsClient from "./stats-client";

export default async function Page({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    await params;
    return <StatsClient />;
}