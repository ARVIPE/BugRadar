"use client";

import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { useTranslations } from "next-intl";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

type Stage = "verifying" | "ready" | "saving" | "success" | "error";

export default function ResetPasswordClient() {
  const t = useTranslations("ResetPassword");

  const [stage, setStage] = useState<Stage>("verifying");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [showPass1, setShowPass1] = useState(false);
  const [showPass2, setShowPass2] = useState(false);

  // Consistent with Supabase's password reset flow
  useEffect(() => {
    (async () => {
      try {
        setErrorMsg(null);

        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;

          url.searchParams.delete("code");
          window.history.replaceState({}, "", url.toString());

          setStage("ready");
          return;
        }

        const hash = window.location.hash.startsWith("#")
          ? window.location.hash.substring(1)
          : window.location.hash;

        if (hash.includes("access_token")) {
          const params = new URLSearchParams(hash);
          const access_token = params.get("access_token");
          const refresh_token = params.get("refresh_token");

          if (!access_token || !refresh_token) {
            throw new Error(t("noTokens"));
          }

          const { error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          if (error) throw error;

          window.history.replaceState({}, "", window.location.pathname);

          setStage("ready");
          return;
        }

        throw new Error(t("invalidLink"));
      } catch (e: unknown) {
        setErrorMsg((e as Error)?.message ?? t("validateError"));
        setStage("error");
      }
    })();
  }, [t]);

  const disabled = useMemo(() => {
    if (stage === "saving" || stage === "verifying") return true;
    if (!password || !password2) return true;
    if (password !== password2) return true;
    if (password.length < 8) return true;
    return false;
  }, [stage, password, password2]);

  const onSubmit = async () => {
    try {
      setStage("saving");
      setErrorMsg(null);

      if (password !== password2) throw new Error(t("passwordMismatch"));
      if (password.length < 8) throw new Error(t("minLength"));

      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      setStage("success");
    } catch (e: unknown) {
      setErrorMsg((e as Error)?.message ?? t("updateError"));
      setStage("ready");
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen py-10 px-4 md:px-10 bg-skin-bg text-skin-title">
        <div className="max-w-lg mx-auto space-y-8">
          <section className="bg-skin-panel border border-border rounded-lg p-6 space-y-4 shadow-elev-1">
            <h1 className="text-xl font-semibold text-skin-title">
              {t("title")}
            </h1>
            <p className="text-sm text-skin-subtitle">
              {t("subtitle")}
            </p>

            {stage === "verifying" && (
              <div className="text-sm text-skin-subtitle">
                {t("verifying")}
              </div>
            )}

            {stage === "error" && (
              <div className="text-sm text-red-500">
                {errorMsg ?? t("validateError")}
              </div>
            )}

            {(stage === "ready" || stage === "saving") && (
              <div className="space-y-4">
                {/* password 1 */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-skin-title">
                    {t("newPassword")}
                  </label>
                  <div className="relative">
                    <input
                      type={showPass1 ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="bg-[var(--color-input)] text-skin-title
                                 border border-border px-3 py-2 rounded w-full pr-10
                                 focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-[var(--ring)]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass1((s) => !s)}
                      className="absolute top-1/2 right-3 -translate-y-1/2 text-skin-subtitle hover:text-skin-title"
                      aria-label={showPass1 ? t("hidePassword") : t("showPassword")}
                    >
                      {showPass1 ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <p className="text-xs text-skin-subtitle">
                    {t("passwordHint")}
                  </p>
                </div>

                {/* password 2 */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-skin-title">
                    {t("repeatPassword")}
                  </label>
                  <div className="relative">
                    <input
                      type={showPass2 ? "text" : "password"}
                      value={password2}
                      onChange={(e) => setPassword2(e.target.value)}
                      placeholder="••••••••"
                      className="bg-[var(--color-input)] text-skin-title
                                 border border-border px-3 py-2 rounded w-full pr-10
                                 focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-[var(--ring)]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass2((s) => !s)}
                      className="absolute top-1/2 right-3 -translate-y-1/2 text-skin-subtitle hover:text-skin-title"
                      aria-label={showPass2 ? t("hidePassword") : t("showPassword")}
                    >
                      {showPass2 ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {errorMsg && (
                  <div className="text-sm text-red-500">
                    {errorMsg}
                  </div>
                )}

                <Button
                  onClick={onSubmit}
                  disabled={disabled}
                  className="min-w-[160px]"
                >
                  {stage === "saving" ? t("saving") : t("updateButton")}
                </Button>
              </div>
            )}

            {stage === "success" && (
              <div className="space-y-3">
                <div className="text-sm text-green-600">
                  {t("success")}
                </div>
                <p className="text-sm text-skin-subtitle">
                  {t("successDesc")}
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
      <Footer />
    </>
  );
}
