"use client"

import Image from "next/image"
import { Cog, Menu, X, User, LogOut, Globe } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { useLocale, useTranslations } from "next-intl"

export default function Navbar() {
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const [theme, setTheme] = useState("theme-dark")
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const locale = useLocale()
  const t = useTranslations("Navbar")

  const nextLocale = locale === "en" ? "es" : "en"

  const applyTheme = (t: string) => {
    document.documentElement.className = t
  }

  useEffect(() => {
    const initial = "theme-dark"
    setTheme(initial)
    applyTheme(initial)
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("theme", theme)
    }
    applyTheme(theme)
  }, [theme])

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "theme" && (e.newValue === "theme-light" || e.newValue === "theme-dark")) {
        setTheme(e.newValue)
        applyTheme(e.newValue)
      }
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [profileMenuRef])

  const withLocale = (path: string) => `/${locale}${path}`

  const linkClass = (href: string) =>
    pathname && pathname.startsWith(href)
      ? "text-[var(--yellow)]"
      : "text-skin-title hover:text-skin-subtitle transition-colors"

  const handleChangeLocale = () => {
    const segments = pathname.split("/")
    segments[1] = nextLocale
    const newPath = segments.join("/") || "/"
    window.location.href = newPath
  }

  const handleLogout = () => {
    signOut({ callbackUrl: `/${locale}` })
  }

  return (
    <nav className="bg-skin-panel p-4 shadow-sm border-b border-border">
      <div className="mx-auto flex items-center justify-between">
        {/* left */}
        <div className="flex items-center space-x-2">
          <a href={withLocale("/dashboard")} className="flex items-center space-x-2">
            <Image src="/bugradar-logo.png" alt="BugRadar Logo" width={28} height={28} />
            <span className="text-skin-title font-semibold text-lg">BugRadar</span>
          </a>
          <ul className="hidden md:flex ml-5 items-center space-x-6 text-sm font-medium">
            <li>
              <a href={withLocale("/dashboard")} className={linkClass(withLocale("/dashboard"))}>
                {t("dashboard")}
              </a>
            </li>
            <li>
              <a href={withLocale("/stats")} className={linkClass(withLocale("/stats"))}>
                {t("stats")}
              </a>
            </li>
            <li>
              <a href={withLocale("/insight")} className={linkClass(withLocale("/insight"))}>
                {t("insight")}
              </a>
            </li>
            <li>
              <a href={withLocale("/settings")} className={linkClass(withLocale("/settings"))}>
                {t("settings")}
              </a>
            </li>
            <li>
              <a href={withLocale("/projects")} className={linkClass(withLocale("/projects"))}>
                {t("projects")}
              </a>
            </li>
          </ul>
        </div>

        {/* right */}
        <div className="flex items-center space-x-4">
          {/* language */}
          <button
            onClick={handleChangeLocale}
            className="hidden md:flex items-center gap-1 px-2 py-1 rounded-md border border-border text-xs text-skin-title hover:bg-skin-bg transition-colors"
          >
            <Globe size={14} />
            {locale === "en" ? "EN" : "ES"}
          </button>

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

          {/* mobile */}
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
        <div className="md:hidden mt-3 space-y-3 px-2">
          <a href={withLocale("/dashboard")} className={`block font-medium ${linkClass(withLocale("/dashboard"))}`}>
            {t("dashboard")}
          </a>
          <a href={withLocale("/stats")} className={`block ${linkClass(withLocale("/stats"))}`}>
            {t("stats")}
          </a>
          <a href={withLocale("/insight")} className={`block ${linkClass(withLocale("/insight"))}`}>
            {t("insight")}
          </a>
          <a href={withLocale("/settings")} className={`block ${linkClass(withLocale("/settings"))}`}>
            {t("settings")}
          </a>
          <a href={withLocale("/projects")} className={`block ${linkClass(withLocale("/projects"))}`}>
            {t("projects")}
          </a>
          <button
            onClick={handleChangeLocale}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-border text-xs text-skin-title hover:bg-skin-bg transition-colors"
          >
            <Globe size={14} />
            {locale === "en" ? "EN" : "ES"}
          </button>
        </div>
      )}
    </nav>
  )
}
