import SettingsClient from "./settings-client";

export default async function Page({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    await params;
    return <SettingsClient />;
}