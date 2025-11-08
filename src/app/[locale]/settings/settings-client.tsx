// app/settings/page.tsx
"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import AvatarUpload from "@/components/avatar-upload";
import { useSession } from "next-auth/react";
import { createClient } from "@supabase/supabase-js";
import { getNotifyEmailFor, setNotifyEmailFor } from "./actions";
import { useLocale, useTranslations } from "next-intl";

// Public client Supabase instance (para el reset por email)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

export default function SettingsClient() {
  const { data: session } = useSession();
  const sessionEmail = session?.user?.email ?? "";

  const t = useTranslations("Settings");
  const locale = useLocale();

  const [notificationEmail, setNotificationEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [loading, setLoading] = useState(true);

  // Cargar email actual
  useEffect(() => {
    (async () => {
      try {
        if (!sessionEmail) return;
        const notify = await getNotifyEmailFor(sessionEmail);
        setNotificationEmail(notify);
      } finally {
        setLoading(false);
      }
    })();
  }, [sessionEmail]);

  // Guardar nuevo email de notificaciones
  const handleUpdateNotifyEmail = async () => {
    const next = newEmail.trim();
    if (!next) return;
    if (!sessionEmail) {
      alert(t("noSession"));
      return;
    }

    try {
      await setNotifyEmailFor(sessionEmail, next);
      setNotificationEmail(next);
      setNewEmail("");
      alert(t("savedNotifyEmail"));
    } catch (e: any) {
      alert(t("saveError") + " " + (e?.message ?? t("unknownError")));
    }
  };

  // Enviar enlace de reset
  const handleSendResetLink = async () => {
    const target = notificationEmail || sessionEmail;
    if (!target) {
      alert(t("noEmailAvailable"));
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(target, {
      // si tienes dominios por locale puedes interpolar aquí
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/${locale}/reset-password`,
    });
    if (error) {
      alert(t("resetError") + " " + error.message);
      return;
    }
    alert(t("resetSent"));
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen py-10 px-4 md:px-10 bg-skin-bg text-skin-title">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Notificaciones */}
          <section className="bg-skin-panel border border-border rounded-lg p-6 space-y-4 shadow-elev-1">
            <h2 className="text-lg font-semibold text-skin-title">
              {t("notifyTitle")}
            </h2>
            <p className="text-sm text-skin-subtitle">
              {t("notifySubtitle")}
            </p>

            <div className="space-y-4 text-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <span className="mb-1 sm:mb-0 font-medium text-skin-title">
                  {t("currentEmail")}
                </span>
                <input
                  value={loading ? t("loading") : notificationEmail}
                  disabled
                  className="bg-[var(--color-input)] text-skin-subtitle border border-border px-3 py-2 rounded w-full sm:w-64"
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <span className="mb-1 sm:mb-0 text-skin-title">
                  {t("changeNotifyEmail")}
                </span>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <input
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder={t("newEmailPlaceholder")}
                    className="bg-[var(--color-input)] text-skin-title placeholder:text-skin-subtitle border border-border px-3 py-2 rounded w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-[var(--ring)]"
                  />
                  <Button
                    onClick={handleUpdateNotifyEmail}
                    className="min-w-[130px]"
                  >
                    {t("save")}
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* Seguridad / perfil */}
          <section className="bg-skin-panel border border-border rounded-lg p-6 space-y-4 shadow-elev-1">
            <h2 className="text-lg font-semibold text-skin-title">
              {t("securityTitle")}
            </h2>
            <p className="text-sm text-skin-subtitle">
              {t("securitySubtitle")}
            </p>

            <div className="space-y-6">
              <AvatarUpload />
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={handleSendResetLink}>
                  {t("sendResetLink")}
                </Button>
              </div>
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </>
  );
}
