"use client";

import Image from "next/image";
import { Cog, Menu, X, User, LogOut, Globe, ChevronDown } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";

const LOCALES = [
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
] as const;

export default function Navbar() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useState("theme-dark");
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const langMenuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("Navbar");

  const currentLocaleData =
    LOCALES.find((l) => l.code === locale) ?? LOCALES[0];

  const applyTheme = (t: string) => {
    document.documentElement.className = t;
  };

  useEffect(() => {
    const initial = "theme-dark";
    setTheme(initial);
    applyTheme(initial);
  }, []);

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

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setIsProfileMenuOpen(false);
      }
      if (
        langMenuRef.current &&
        !langMenuRef.current.contains(event.target as Node)
      ) {
        setIsLangMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const withLocale = (path: string) => `/${locale}${path}`;

  const linkClass = (href: string) =>
    pathname && pathname.startsWith(href)
      ? "text-[var(--yellow)]"
      : "text-skin-title hover:text-skin-subtitle transition-colors";

  const handleSwitchLocale = (newLocale: string) => {
    const segments = pathname.split("/");
    segments[1] = newLocale;
    const newPath = segments.join("/") || "/";
    setIsLangMenuOpen(false);
    window.location.href = newPath;
  };

  const handleLogout = () => {
    const callbackUrl = `${window.location.origin}/${locale}`;
    signOut({ callbackUrl });
  };

  return (
    <nav className="bg-skin-panel p-4 shadow-sm border-b border-border">
      <div className="mx-auto flex items-center justify-between">
        {/* left */}
        <div className="flex items-center space-x-2">
          <a
            href={withLocale("/dashboard")}
            className="flex items-center space-x-2"
          >
            <Image
              src="/bugradar-logo.png"
              alt="BugRadar Logo"
              width={28}
              height={28}
            />
            <span className="text-skin-title font-semibold text-lg">
              BugRadar
            </span>
          </a>
          <ul className="hidden md:flex ml-5 items-center space-x-6 text-sm font-medium">
            <li>
              <a
                href={withLocale("/dashboard")}
                className={linkClass(withLocale("/dashboard"))}
              >
                {t("dashboard")}
              </a>
            </li>
            <li>
              <a
                href={withLocale("/stats")}
                className={linkClass(withLocale("/stats"))}
              >
                {t("stats")}
              </a>
            </li>
            <li>
              <a
                href={withLocale("/insight")}
                className={linkClass(withLocale("/insight"))}
              >
                {t("insight")}
              </a>
            </li>
            <li>
              <a
                href={withLocale("/settings")}
                className={linkClass(withLocale("/settings"))}
              >
                {t("settings")}
              </a>
            </li>
            <li>
              <a
                href={withLocale("/projects")}
                className={linkClass(withLocale("/projects"))}
              >
                {t("projects")}
              </a>
            </li>
          </ul>
        </div>

        {/* right */}
        <div className="flex items-center space-x-4">
          {/* ── Language dropdown (desktop) ── */}
          <div className="relative hidden md:block" ref={langMenuRef}>
            <button
              onClick={() => setIsLangMenuOpen((v) => !v)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border text-xs font-medium text-skin-title hover:bg-skin-bg transition-colors"
            >
              <Globe size={13} />
              <span>
                {currentLocaleData.flag} {currentLocaleData.code.toUpperCase()}
              </span>
              <ChevronDown
                size={12}
                className={`transition-transform duration-200 ${isLangMenuOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isLangMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-40 bg-skin-panel border border-border rounded-md shadow-lg z-50 overflow-hidden">
                {LOCALES.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => handleSwitchLocale(l.code)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors ${
                      locale === l.code
                        ? "bg-skin-bg text-[var(--yellow)] font-semibold"
                        : "text-skin-title hover:bg-skin-bg"
                    }`}
                  >
                    <span className="text-base leading-none">{l.flag}</span>
                    <span>{l.label}</span>
                    {locale === l.code && (
                      <span className="ml-auto text-[10px] text-[var(--yellow)]">
                        ✓
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <a
            href={withLocale("/settings")}
            className="text-skin-subtitle hover:text-[var(--primary)]"
            aria-label="Settings"
          >
            <Cog size={20} />
          </a>

          {/* profile */}
          <div className="relative" ref={profileMenuRef}>
            <button onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}>
              <Image
                src={session?.user?.image || "/A1.jpg"}
                alt="User Avatar"
                width={32}
                height={32}
                className="rounded-full border border-border cursor-pointer bg-gray-500"
              />
            </button>

            {isProfileMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-skin-panel border border-border rounded-md shadow-lg z-10">
                <ul className="py-1">
                  <li>
                    <a
                      href={withLocale("/settings")}
                      className="flex items-center px-4 py-2 text-sm text-skin-title hover:bg-skin-bg"
                    >
                      <User size={14} className="mr-2" />
                      {t("changePhoto")}
                    </a>
                  </li>
                  <li>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full text-left px-4 py-2 text-sm text-skin-title hover:bg-skin-bg"
                    >
                      <LogOut size={14} className="mr-2" />
                      {t("logout")}
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* mobile hamburger */}
          <button
            className="md:hidden text-skin-subtitle hover:text-skin-title"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* mobile menu */}
      {isOpen && (
        <div className="md:hidden mt-3 space-y-3 px-2 pb-2">
          <a
            href={withLocale("/dashboard")}
            className={`block font-medium ${linkClass(withLocale("/dashboard"))}`}
          >
            {t("dashboard")}
          </a>
          <a
            href={withLocale("/stats")}
            className={`block ${linkClass(withLocale("/stats"))}`}
          >
            {t("stats")}
          </a>
          <a
            href={withLocale("/insight")}
            className={`block ${linkClass(withLocale("/insight"))}`}
          >
            {t("insight")}
          </a>
          <a
            href={withLocale("/settings")}
            className={`block ${linkClass(withLocale("/settings"))}`}
          >
            {t("settings")}
          </a>
          <a
            href={withLocale("/projects")}
            className={`block ${linkClass(withLocale("/projects"))}`}
          >
            {t("projects")}
          </a>

          {/* ── Language selector (mobile) ── */}
          <div className="pt-2 border-t border-border">
            <p className="text-xs text-skin-subtitle mb-2 flex items-center gap-1">
              <Globe size={12} /> Idioma / Language
            </p>
            <div className="grid grid-cols-2 gap-1">
              {LOCALES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => {
                    handleSwitchLocale(l.code);
                    setIsOpen(false);
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm border transition-colors ${
                    locale === l.code
                      ? "border-[var(--yellow)] text-[var(--yellow)] font-semibold bg-skin-bg"
                      : "border-border text-skin-title hover:bg-skin-bg"
                  }`}
                >
                  <span>{l.flag}</span>
                  <span>{l.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
