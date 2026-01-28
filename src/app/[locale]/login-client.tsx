"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";

export default function LoginClient() {
  const t = useTranslations("Login");
  const locale = useLocale(); 
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
  }, [theme]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("theme", theme);
    }
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (
        e.key === "theme" &&
        (e.newValue === "theme-light" || e.newValue === "theme-dark")
      ) {
        setTheme(e.newValue);
        applyTheme(e.newValue);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setIsLoading(false);

    if (result?.ok) {
      router.push(`/${locale}/dashboard`);
    } else {
      setError(t("errorInvalid"));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-skin-bg transition-colors">
      {/* 
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 p-2 rounded-full text-black transition-transform transform hover:scale-110"
        aria-label="Toggle theme"
      >
        {theme === "theme-dark" ? (
          <Sun size={20} style={{ color: "yellow" }} />
        ) : (
          <Moon size={20} style={{ color: "black" }} />
        )}
      </button>
      */}

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

          <form className="space-y-4" onSubmit={handleSignIn}>
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
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
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
                className="mt-1 w-full bg-skin-input text-skin-title border border-gray-600 focus:border-yellow-500 focus:ring-yellow-500"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
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
              {isLoading ? t("signinLoading") : t("signin")}
            </Button>

            <p className="mt-4 text-sm text-skin-subtitle text-center">
              {t("noAccount")}{" "}
              <a
                href={`/${locale}/signup`}
                className="text-yellow-400 hover:underline"
              >
                {t("signup")}
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
