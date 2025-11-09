import ResetPasswordClient from "./resetpassword-client";

export default async function Page({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    await params;
    return <ResetPasswordClient />;
}