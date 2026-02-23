"use client";

import { Twitter, Github, Linkedin, Globe } from "lucide-react";
import { useLocale } from "next-intl";

const LOCALES = [
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
] as const;

export default function Footer() {
  const locale = useLocale();

  const currentLocale = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];

  return (
    <footer className="bg-skin-panel py-6 border-t border-border">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-skin-subtitle text-sm">
        {/* Current language badge — read only, switching is done from navbar */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 bg-skin-bg text-skin-title rounded-md text-xs font-medium border border-border"
          title="Idioma activo / Active language"
        >
          <Globe size={13} />
          <span className="text-base leading-none">{currentLocale.flag}</span>
          <span>{currentLocale.label}</span>
        </div>

        {/* Copyright */}
        <div className="text-center">
          © 2025 <span className="text-skin-title font-medium">BugRadar</span>.
        </div>

        {/* Socials */}
        <div className="flex items-center gap-4">
          <a
            href="#"
            className="hover:text-skin-title transition-colors"
            aria-label="Twitter"
          >
            <Twitter size={16} />
          </a>
          <a
            href="#"
            className="hover:text-skin-title transition-colors"
            aria-label="GitHub"
          >
            <Github size={16} />
          </a>
          <a
            href="#"
            className="hover:text-skin-title transition-colors"
            aria-label="LinkedIn"
          >
            <Linkedin size={16} />
          </a>
        </div>
      </div>
    </footer>
  );
}
