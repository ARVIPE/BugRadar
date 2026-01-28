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
import { Textarea } from "@/components/ui/textarea";
import { useProject } from "@/hooks/useProject";
import { Loader2, AlertTriangle, CheckCircle } from "lucide-react";

// Public client Supabase instance (for email reset)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

export default function SettingsClient() {
  const { data: session } = useSession();
  const { projectId } = useProject(); 
  const t = useTranslations("Settings");
  const locale = useLocale();

  const sessionEmail = session?.user?.email ?? "";

  // State for emails
  const [notificationEmail, setNotificationEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [loadingEmail, setLoadingEmail] = useState(true);

  //State for endpoints
  const [endpoints, setEndpoints] = useState<string>("");
  const [isLoadingEndpoints, setIsLoadingEndpoints] = useState(true);
  const [isSavingEndpoints, setIsSavingEndpoints] = useState(false);

  // Unified state for messages 
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load current email
  useEffect(() => {
    (async () => {
      try {
        if (!sessionEmail) return;
        setLoadingEmail(true);
        const notify = await getNotifyEmailFor(sessionEmail);
        setNotificationEmail(notify);
      } finally {
        setLoadingEmail(false);
      }
    })();
  }, [sessionEmail]);

  useEffect(() => {
    if (!projectId) {
      setIsLoadingEndpoints(false);
      return;
    }

    const fetchProjectSettings = async () => {
      setIsLoadingEndpoints(true);
      setError(null);
      try {
        const res = await fetch(`/api/projects/${projectId}`);
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "No se pudo cargar la configuración");
        }
        const data: { monitored_endpoints: string[] | null } = await res.json();
        setEndpoints((data.monitored_endpoints || []).join("\n"));
      } catch (err: unknown) {
        setError((err as Error).message);
      } finally {
        setIsLoadingEndpoints(false);
      }
    };

    fetchProjectSettings();
  }, [projectId]);

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  // Save new notification email
  const handleUpdateNotifyEmail = async () => {
    clearMessages();
    const next = newEmail.trim();
    if (!next) return;
    if (!sessionEmail) {
      setError(t("noSession"));
      return;
    }

    try {
      await setNotifyEmailFor(sessionEmail, next);
      setNotificationEmail(next);
      setNewEmail("");
      setSuccess(t("savedNotifyEmail"));
    } catch (e: unknown) {
      setError(t("saveError") + " " + ((e as Error)?.message ?? t("unknownError")));
    }
  };

  // Send reset link
  const handleSendResetLink = async () => {
    clearMessages();
    const target = notificationEmail || sessionEmail;
    if (!target) {
      setError(t("noEmailAvailable"));
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(target, {
      redirectTo: `${
        process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
      }/${locale}/reset-password`,
    });
    if (error) {
      setError(t("resetError") + " " + error.message);
      return;
    }
    setSuccess(t("resetSent")); 
  };

  // Save endpoints
  const handleSaveEndpoints = async () => {
    if (!projectId) return;
    clearMessages();
    setIsSavingEndpoints(true);

    const endpointsArray = endpoints
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

      // validate ALL non-empty lines
      const invalid = endpointsArray.filter(
        (line) =>
          !/^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s+\/[^\s]*$/i.test(line)
      );

      if (invalid.length > 0) {
        setError(
          `Algunas líneas no tienen formato válido (ej: "GET /api/health"):\n${invalid.join(
            "\n"
          )}`
        );
        setIsSavingEndpoints(false);
        return;
      }

    try {
      const res = await fetch(`/api/projects/${projectId}`, { 
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monitored_endpoints: endpointsArray }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "No se pudo guardar");
      }
      setSuccess(t("saveEndpointsSuccess")); 
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setIsSavingEndpoints(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen py-10 px-4 md:px-10 bg-skin-bg text-skin-title">
        <div className="max-w-5xl mx-auto space-y-8">
          
          {/* Global Alerts Container */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/50 text-destructive p-3 rounded-md flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}
          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-600 p-3 rounded-md flex items-center gap-3">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{success}</p>
            </div>
          )}

          {/* Notifications */}
          <section className="bg-skin-panel border border-border rounded-lg shadow-elev-1">
            <div className="p-6 space-y-4">
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
                    value={loadingEmail ? t("loading") : notificationEmail}
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
                      className="min-w-[130px] bg-amber-400 text-slate-900 hover:bg-amber-500 focus:ring-2 focus:ring-amber-600"
                    >
                      {t("save")}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Endpoints section */}
          <section className="bg-skin-panel border border-border rounded-lg shadow-elev-1">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-skin-title mb-2">
                {t("latencyMonitoringTitle")}
              </h2>
              <p className="text-skin-subtitle text-sm mb-4">
                {t("latencyMonitoringSubtitle")}
                <code className="ml-1 font-mono text-xs">METHOD /ruta/literal</code>
              </p>

              {isLoadingEndpoints ? (
                <div className="flex justify-center items-center h-[150px]">
                  <Loader2 className="w-6 h-6 animate-spin text-skin-subtitle" />
                </div>
              ) : (
                <Textarea
                  placeholder={
                    "GET /api/health\nPOST /api/login\nGET /api/products/123"
                  }
                  value={endpoints}
                  onChange={(e) => setEndpoints(e.target.value)}
                  className="font-mono text-sm min-h-[150px] bg-skin-input"
                  disabled={!projectId}
                />
              )}
            </div>

            <div className="bg-skin-bg/50 border-t border-border px-6 py-4 flex justify-between items-center">
              <p className="text-sm text-skin-subtitle">
                {t("agentUpdateNotice")}
              </p>
              <Button
                onClick={handleSaveEndpoints}
                className="bg-amber-400 text-slate-900 hover:bg-amber-500 focus:ring-2 focus:ring-amber-600"
                disabled={isSavingEndpoints || isLoadingEndpoints || !projectId}
              >
                {isSavingEndpoints ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  t("saveChanges")
                )}
              </Button>
            </div>
          </section>

          {/* Security / profile */}
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
                <Button onClick={handleSendResetLink} className="bg-amber-400 text-slate-900 hover:bg-amber-500 focus:ring-2 focus:ring-amber-600">
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