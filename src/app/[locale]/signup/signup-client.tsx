"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

export default function SignupClient() {
  const locale = useLocale();
  const t = useTranslations("Signup"); 
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [theme, setTheme] = useState("theme-dark");

  const applyTheme = (t: string) => {
    document.documentElement.className = t;
  };

  useEffect(() => {
    const stored =
      typeof window !== "undefined" ? localStorage.getItem("theme") : null;
    const initial =
      stored === "theme-light" || stored === "theme-dark" ? stored : theme;
    setTheme(initial);
    applyTheme(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError(t("errorMismatch"));
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Algo salió mal.");
      }

      // éxito → vuelve al login del mismo idioma
      router.push(`/${locale}`);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-skin-bg">
      <div className="flex flex-col shadow-2xl rounded-2xl overflow-hidden border border-gray-700 max-w-xl w-full bg-skin-panel relative">
        <div className="w-full p-8 flex flex-col justify-center">
          <div className="flex flex-col items-center mb-6">
            <Image
              src={
                password
                  ? "/bugradar-logo-eyesClosed.png"
                  : "/bugradar-logo.png"
              }
              alt="BugRadar Logo"
              width={100}
              height={100}
              className="rounded-full"
            />
            <h1 className="text-2xl font-bold mt-4 text-skin-title">
              {t("title")}
            </h1>
            <p className="text-sm text-skin-subtitle">{t("subtitle")}</p>
          </div>

          <form className="space-y-4" onSubmit={handleSignup}>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-skin-subtitle"
              >
                {t("email")}
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full bg-skin-input text-skin-title border border-gray-600 focus:border-yellow-500 focus:ring-yellow-500"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-skin-subtitle"
              >
                {t("password")}
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full bg-skin-input text-skin-title border border-gray-600 focus:border-yellow-500 focus:ring-yellow-500"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-skin-subtitle"
              >
                {t("confirmPassword")}
              </label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 w-full bg-skin-input text-skin-title border border-gray-600 focus:border-yellow-500 focus:ring-yellow-500"
              />
            </div>

            {error && (
              <div className="flex items-center space-x-2 text-sm text-red-500 bg-red-500/10 p-3 rounded-md">
                <AlertCircle className="h-5 w-5" />
                <p>{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full mt-4 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold transition-colors duration-300 disabled:bg-yellow-400/50 disabled:cursor-not-allowed"
            >
              {isLoading ? t("submitting") : t("submit")}
            </Button>

            <p className="mt-4 text-sm text-skin-subtitle text-center">
              {t("haveAccount")}{" "}
              <a
                href={`/${locale}`}
                className="text-yellow-400 hover:underline"
              >
                {t("goLogin")}
              </a>
            </p>
          </form>

          <p className="mt-8 text-xs text-skin-subtitle text-center italic">
            {t("quote")}
          </p>
        </div>
      </div>
    </div>
  );
}
